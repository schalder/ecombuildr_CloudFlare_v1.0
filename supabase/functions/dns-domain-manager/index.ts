// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainRequest {
  action: 'verify' | 'check_ssl' | 'pre_verify' | 'add_domain'
  domain: string
  storeId: string
  isDnsVerified?: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { action, domain, storeId, isDnsVerified }: DomainRequest = await req.json()

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('owner_id', user.id)
      .single()

    if (storeError || !store) {
      throw new Error('Store not found or access denied')
    }

    console.log(`Processing ${action} for domain: ${domain}`)

    let result: any = {}

    switch (action) {
      case 'pre_verify':
        // Pre-verification: Check DNS only without updating database
        let preVerifyDnsConfigured = false
        let preVerifyCnameTarget = ''
        
        try {
          // Check A records first (Vercel primary method)
          const aResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=A`)
          if (aResponse.ok) {
            const aData = await aResponse.json()
            const aRecords = aData.Answer?.filter((record: any) => record.type === 1) || []
            
            // Check if A records point to Vercel IPs
            const vercelIPs = ['76.76.19.61', '76.76.21.61'] // Vercel IPs
            for (const record of aRecords) {
              if (vercelIPs.includes(record.data)) {
                preVerifyDnsConfigured = true
                preVerifyCnameTarget = record.data
                break
              }
            }
            console.log(`Pre-verification A record check for ${domain}: ${aRecords.length} records found`)
          }
          
          // If no A record, check CNAME records
          if (!preVerifyDnsConfigured) {
            const cnameResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=CNAME`)
            if (cnameResponse.ok) {
              const cnameData = await cnameResponse.json()
              const cnameRecords = cnameData.Answer?.filter((record: any) => record.type === 5) || []
              
              for (const record of cnameRecords) {
                preVerifyCnameTarget = record.data.replace(/\.$/, '') // Remove trailing dot
                if (preVerifyCnameTarget.includes('vercel-dns.com') || preVerifyCnameTarget.includes('vercel.app')) {
                  preVerifyDnsConfigured = true
                  break
                }
              }
              console.log(`Pre-verification CNAME check for ${domain}: ${cnameRecords.length} records found, target: ${preVerifyCnameTarget}`)
            }
          }
        } catch (error) {
          console.error('Pre-verification DNS check failed:', error)
        }

        result = {
          success: true,
          status: {
            dnsConfigured: preVerifyDnsConfigured,
            cnameTarget: preVerifyCnameTarget || null,
            requiresVercel: !preVerifyDnsConfigured,
            errorMessage: !preVerifyDnsConfigured ? 'DNS must point to Vercel (A record: 76.76.19.61 or CNAME: cname.vercel-dns.com)' : null
          }
        }
        console.log(`Domain ${domain} pre-verification result:`, result.status)
        break

      case 'verify':
        // Check DNS configuration using multiple methods
        let dnsConfigured = false
        let cnameTarget = ''
        
        try {
          // Check A records first (Vercel primary method)
          const aResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=A`)
          if (aResponse.ok) {
            const aData = await aResponse.json()
            const aRecords = aData.Answer?.filter((record: any) => record.type === 1) || []
            
            // Check if A records point to Vercel IPs
            const vercelIPs = ['76.76.19.61', '76.76.21.61'] // Vercel IPs
            for (const record of aRecords) {
              if (vercelIPs.includes(record.data)) {
                dnsConfigured = true
                cnameTarget = record.data
                break
              }
            }
            console.log(`A record check for ${domain}: ${aRecords.length} records found`)
          }
          
          // If no A record, check CNAME records
          if (!dnsConfigured) {
            const cnameResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=CNAME`)
            if (cnameResponse.ok) {
              const cnameData = await cnameResponse.json()
              const cnameRecords = cnameData.Answer?.filter((record: any) => record.type === 5) || []
              
              for (const record of cnameRecords) {
                cnameTarget = record.data.replace(/\.$/, '') // Remove trailing dot
                if (cnameTarget.includes('vercel-dns.com') || cnameTarget.includes('vercel.app')) {
                  dnsConfigured = true
                  break
                }
              }
              console.log(`CNAME check for ${domain}: ${cnameRecords.length} records found, target: ${cnameTarget}`)
            }
          }
        } catch (error) {
          console.error('DNS check failed:', error)
        }

        // Check if domain is accessible via HTTPS (Vercel handles SSL automatically)
        let sslStatus = 'automatic' // Vercel handles SSL automatically
        let isAccessible = false
        
        try {
          const httpsResponse = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })
          isAccessible = httpsResponse.ok
          console.log(`HTTPS check for ${domain}: ${httpsResponse.status} - ${isAccessible ? 'accessible' : 'not accessible'}`)
        } catch (error) {
          console.log(`HTTPS check failed for ${domain}:`, error.message)
          // Try HTTP to see if domain responds at all
          try {
            const httpResponse = await fetch(`http://${domain}`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            })
            if (httpResponse.ok) {
              sslStatus = 'provisioning' // Domain works but SSL provisioning
            }
          } catch (httpError) {
            console.log(`HTTP check also failed for ${domain}`)
          }
        }

        // Update database with verification results
        const isVerified = dnsConfigured && isAccessible
        
        const { error: updateError } = await supabase
          .from('custom_domains')
          .update({
            dns_configured: dnsConfigured,
            ssl_status: sslStatus,
            is_verified: isVerified,
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('domain', domain)
          .eq('store_id', storeId)

        if (updateError) {
          console.error('Failed to update domain status:', updateError)
        }

        result = {
          success: true,
          status: {
            dnsConfigured,
            sslStatus,
            isVerified,
            isAccessible,
            cnameTarget: cnameTarget || null,
            message: isVerified ? 'Domain verified and ready!' : 'DNS configured, waiting for SSL certificate',
            errorMessage: !dnsConfigured ? 'DNS must point to Vercel (A record: 76.76.19.61 or CNAME: cname.vercel-dns.com)' : null
          }
        }
        console.log(`Domain ${domain} verification result:`, result.status)
        break

      case 'check_ssl':
        // Simple SSL/accessibility check
        let accessibilityCheck = false
        let currentSslStatus = 'pending'
        
        try {
          const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          })
          accessibilityCheck = response.ok
          currentSslStatus = accessibilityCheck ? 'issued' : 'provisioning'
        } catch (error) {
          console.log(`SSL check failed for ${domain}:`, error.message)
        }

        // Update only SSL status in database
        const { error: sslUpdateError } = await supabase
          .from('custom_domains')
          .update({
            ssl_status: currentSslStatus,
            is_verified: accessibilityCheck,
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('domain', domain)
          .eq('store_id', storeId)

        if (sslUpdateError) {
          console.error('Failed to update SSL status:', sslUpdateError)
        }

        result = {
          success: true,
          sslStatus: currentSslStatus,
          isAccessible: accessibilityCheck
        }
        break

      case 'add_domain':
        // Add domain to database
        const verificationToken = crypto.randomUUID()
        
        // Check if domain already exists
        const { data: existingDomain } = await supabase
          .from('custom_domains')
          .select('id')
          .eq('domain', domain)
          .single()
        
        if (existingDomain) {
          throw new Error('Domain already exists')
        }
        
        // Insert new domain
        const { data: newDomain, error: insertError } = await supabase
          .from('custom_domains')
          .insert({
            store_id: storeId,
            domain: domain,
            dns_configured: isDnsVerified || false,
            is_verified: false,
            ssl_status: 'automatic', // Vercel handles SSL automatically
            verification_token: verificationToken,
            verification_attempts: 0
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('Failed to insert domain:', insertError)
          throw new Error('Failed to add domain')
        }
        
        result = {
          success: true,
          domain: newDomain,
          verificationToken
        }
        console.log(`Domain ${domain} added successfully with ID: ${newDomain.id}`)
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('DNS domain manager error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
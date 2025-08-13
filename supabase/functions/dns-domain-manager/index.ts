import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainRequest {
  action: 'verify' | 'check_ssl' | 'pre_verify'
  domain: string
  storeId: string
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

    const { action, domain, storeId }: DomainRequest = await req.json()

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
          // Check CNAME records
          const cnameResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=CNAME`)
          if (cnameResponse.ok) {
            const cnameData = await cnameResponse.json()
            const cnameRecords = cnameData.Answer?.filter((record: any) => record.type === 5) || []
            
            for (const record of cnameRecords) {
              preVerifyCnameTarget = record.data.replace(/\.$/, '') // Remove trailing dot
              if (preVerifyCnameTarget.includes('ecombuildr.com')) {
                preVerifyDnsConfigured = true
                break
              }
            }
            console.log(`Pre-verification CNAME check for ${domain}: ${cnameRecords.length} records found, target: ${preVerifyCnameTarget}`)
          }
        } catch (error) {
          console.error('Pre-verification DNS check failed:', error)
        }

        result = {
          success: true,
          status: {
            dnsConfigured: preVerifyDnsConfigured,
            cnameTarget: preVerifyCnameTarget || null,
            requiresEcomBuildr: !preVerifyDnsConfigured,
            errorMessage: !preVerifyDnsConfigured ? 'CNAME record must point to ecombuildr.com' : null
          }
        }
        console.log(`Domain ${domain} pre-verification result:`, result.status)
        break

      case 'verify':
        // Check DNS configuration using multiple methods
        let dnsConfigured = false
        let cnameTarget = ''
        
        try {
          // Check CNAME records
          const cnameResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=CNAME`)
          if (cnameResponse.ok) {
            const cnameData = await cnameResponse.json()
            const cnameRecords = cnameData.Answer?.filter((record: any) => record.type === 5) || []
            
            for (const record of cnameRecords) {
              cnameTarget = record.data.replace(/\.$/, '') // Remove trailing dot
              if (cnameTarget.includes('ecombuildr.com') || 
                  cnameTarget.includes('netlify.app') || 
                  cnameTarget.includes('netlify.com')) {
                dnsConfigured = true
                break
              }
            }
            console.log(`CNAME check for ${domain}: ${cnameRecords.length} records found, target: ${cnameTarget}`)
          }
          
          // If no CNAME, check A records pointing to common hosting IPs
          if (!dnsConfigured) {
            const aResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=A`)
            if (aResponse.ok) {
              const aData = await aResponse.json()
              const aRecords = aData.Answer?.filter((record: any) => record.type === 1) || []
              
              // Check if A records point to Netlify or other common hosting IPs
              const hostingIPs = ['75.2.60.5', '99.83.190.102', '185.158.133.1']
              for (const record of aRecords) {
                if (hostingIPs.includes(record.data)) {
                  dnsConfigured = true
                  cnameTarget = record.data
                  break
                }
              }
              console.log(`A record check for ${domain}: ${aRecords.length} records found`)
            }
          }
        } catch (error) {
          console.error('DNS check failed:', error)
        }

        // Check if domain is accessible via HTTPS
        let sslStatus = 'pending'
        let isAccessible = false
        
        try {
          const httpsResponse = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })
          isAccessible = httpsResponse.ok
          sslStatus = isAccessible ? 'issued' : 'provisioning'
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
              sslStatus = 'provisioning' // Domain works but SSL not ready
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
            cnameTarget: cnameTarget || null
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
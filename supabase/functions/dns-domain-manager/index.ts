// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainRequest {
  action: 'verify' | 'check_ssl' | 'pre_verify' | 'add_domain' | 'get_vercel_cname' | 'add_to_vercel' | 'test_vercel_connection'
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
            const vercelIPs = ['76.76.19.61', '76.76.21.61', '216.198.79.193'] // Current Vercel IPs
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
            errorMessage: !preVerifyDnsConfigured ? 'DNS must point to Vercel (A record: 76.76.19.61 or CNAME: vercel-dns.com)' : null
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
            const vercelIPs = ['76.76.19.61', '76.76.21.61', '216.198.79.193'] // Current Vercel IPs
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
            errorMessage: !dnsConfigured ? 'DNS must point to Vercel (A record: 76.76.19.61 or CNAME: vercel-dns.com)' : null
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
        // Add domain to Vercel project first, then to database
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
        
        let vercelCnameTarget = null
        
        try {
          const vercelToken = Deno.env.get('VERCEL_TOKEN')
          const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID')
          
          console.log(`Environment check - VERCEL_TOKEN exists: ${!!vercelToken}`)
          console.log(`Environment check - VERCEL_PROJECT_ID exists: ${!!vercelProjectId}`)
          console.log(`VERCEL_PROJECT_ID value: ${vercelProjectId}`)
          
          if (!vercelToken || !vercelProjectId) {
            throw new Error('Vercel configuration missing - VERCEL_TOKEN or VERCEL_PROJECT_ID not set')
          }

          console.log(`Adding domain ${domain} to Vercel project ${vercelProjectId}`)

          // Add domain to Vercel project using direct API call
          const vercelResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: domain
            })
          })

          console.log(`Vercel API response status: ${vercelResponse.status}`)
          console.log(`Vercel API response headers:`, Object.fromEntries(vercelResponse.headers.entries()))

          if (!vercelResponse.ok) {
            const errorText = await vercelResponse.text()
            console.error('Vercel API error:', errorText)
            throw new Error(`Vercel API error: ${vercelResponse.status} - ${errorText}`)
          }

          const vercelData = await vercelResponse.json()
          console.log(`Domain ${domain} added to Vercel successfully:`, vercelData)

          // Get domain info to get the specific CNAME target
          const domainInfoResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains/${domain}`, {
            headers: {
              'Authorization': `Bearer ${vercelToken}`
            }
          })

          console.log(`Domain info response status: ${domainInfoResponse.status}`)

          if (domainInfoResponse.ok) {
            const domainInfo = await domainInfoResponse.json()
            vercelCnameTarget = domainInfo.cnameTarget
            console.log(`Vercel CNAME target for ${domain}:`, vercelCnameTarget)
          } else {
            console.error(`Failed to get domain info for ${domain}: ${domainInfoResponse.status}`)
            throw new Error(`Failed to get Vercel CNAME target for ${domain}`)
          }
        } catch (vercelError) {
          console.error('Failed to add domain to Vercel:', vercelError)
          throw new Error(`Failed to add domain to Vercel: ${vercelError.message}`)
        }
        
        // Insert new domain to database
        const { data: newDomain, error: insertError } = await supabase
          .from('custom_domains')
          .insert({
            store_id: storeId,
            domain: domain,
            dns_configured: false, // Will be true after user configures DNS
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
          verificationToken,
          vercelCnameTarget,
          instructions: {
            type: 'CNAME',
            name: domain.split('.')[0], // Extract subdomain
            value: vercelCnameTarget,
            description: `Add a CNAME record for ${domain} that points to ${vercelCnameTarget}`
          }
        }
        console.log(`Domain ${domain} added successfully with ID: ${newDomain.id}`)
        break

      case 'add_to_vercel':
        // Add domain to Vercel project and get specific CNAME target
        try {
          const vercelToken = Deno.env.get('VERCEL_TOKEN')
          const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID')
          
          if (!vercelToken || !vercelProjectId) {
            throw new Error('Vercel configuration missing - VERCEL_TOKEN or VERCEL_PROJECT_ID not set')
          }

          console.log(`Adding domain ${domain} to Vercel project ${vercelProjectId}`)

          // Add domain to Vercel project using direct API call
          const vercelResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: domain
            })
          })

          if (!vercelResponse.ok) {
            const errorText = await vercelResponse.text()
            console.error('Vercel API error:', errorText)
            throw new Error(`Vercel API error: ${vercelResponse.status} - ${errorText}`)
          }

          const vercelData = await vercelResponse.json()
          console.log(`Domain ${domain} added to Vercel successfully:`, vercelData)

          // Get domain info to get the specific CNAME target
          const domainInfoResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains/${domain}`, {
            headers: {
              'Authorization': `Bearer ${vercelToken}`
            }
          })

          let cnameTarget = 'cname.vercel-dns.com'
          if (domainInfoResponse.ok) {
            const domainInfo = await domainInfoResponse.json()
            cnameTarget = domainInfo.cnameTarget || 'cname.vercel-dns.com'
            console.log(`Vercel CNAME target for ${domain}:`, cnameTarget)
          }

          result = {
            success: true,
            vercelResponse: vercelData,
            cnameTarget,
            instructions: {
              type: 'CNAME',
              name: domain.split('.')[0], // Extract subdomain
              value: cnameTarget,
              description: `Add a CNAME record for ${domain} that points to ${cnameTarget}`
            }
          }
        } catch (vercelError) {
          console.error('Failed to add domain to Vercel:', vercelError)
          throw new Error(`Failed to add domain to Vercel: ${vercelError.message}`)
        }
        break

      case 'get_vercel_cname':
        // Get the specific CNAME target from Vercel for a domain
        try {
          const vercelToken = Deno.env.get('VERCEL_TOKEN')
          const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID')
          
          if (!vercelToken || !vercelProjectId) {
            throw new Error('Vercel configuration missing - VERCEL_TOKEN or VERCEL_PROJECT_ID not set')
          }

          // Get domain info to get the specific CNAME target
          const domainInfoResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains/${domain}`, {
            headers: {
              'Authorization': `Bearer ${vercelToken}`
            }
          })

          let cnameTarget = 'cname.vercel-dns.com'
          if (domainInfoResponse.ok) {
            const domainInfo = await domainInfoResponse.json()
            cnameTarget = domainInfo.cnameTarget || 'cname.vercel-dns.com'
            console.log(`Vercel CNAME target for ${domain}:`, cnameTarget)
          }

          result = {
            success: true,
            cnameTarget,
            instructions: {
              type: 'CNAME',
              name: domain.split('.')[0], // Extract subdomain
              value: cnameTarget,
              description: `Add a CNAME record for ${domain} that points to ${cnameTarget}`
            }
          }
        } catch (vercelError) {
          console.error('Failed to get Vercel CNAME:', vercelError)
          throw new Error(`Failed to get Vercel CNAME: ${vercelError.message}`)
        }
        break

      case 'test_vercel_connection':
        // Test Vercel API connection without adding domain
        try {
          const vercelToken = Deno.env.get('VERCEL_TOKEN')
          const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID')
          
          console.log(`Testing Vercel connection - VERCEL_TOKEN exists: ${!!vercelToken}`)
          console.log(`Testing Vercel connection - VERCEL_PROJECT_ID exists: ${!!vercelProjectId}`)
          console.log(`VERCEL_PROJECT_ID value: ${vercelProjectId}`)
          
          if (!vercelToken || !vercelProjectId) {
            throw new Error('Vercel configuration missing - VERCEL_TOKEN or VERCEL_PROJECT_ID not set')
          }

          // Test by getting project info
          const projectResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}`, {
            headers: {
              'Authorization': `Bearer ${vercelToken}`
            }
          })

          console.log(`Vercel project API response status: ${projectResponse.status}`)

          if (!projectResponse.ok) {
            const errorText = await projectResponse.text()
            console.error('Vercel project API error:', errorText)
            throw new Error(`Vercel project API error: ${projectResponse.status} - ${errorText}`)
          }

          const projectData = await projectResponse.json()
          console.log(`Vercel project info:`, projectData)

          result = {
            success: true,
            message: 'Vercel connection successful',
            projectData: {
              id: projectData.id,
              name: projectData.name,
              domains: projectData.domains || []
            }
          }
        } catch (vercelError) {
          console.error('Vercel connection test failed:', vercelError)
          result = {
            success: false,
            error: vercelError.message,
            message: 'Vercel connection failed'
          }
        }
        break

      default:
        result = {
          success: false,
          error: 'Invalid action',
          message: 'Action not supported'
        }
        break
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
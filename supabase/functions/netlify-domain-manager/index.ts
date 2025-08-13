import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NetlifyDomainRequest {
  action: 'add' | 'remove' | 'status'
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

    const { action, domain, storeId }: NetlifyDomainRequest = await req.json()

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

    const netlifyToken = Deno.env.get('NETLIFY_ACCESS_TOKEN')
    const netlifySiteId = Deno.env.get('NETLIFY_SITE_ID')

    if (!netlifyToken || !netlifySiteId) {
      throw new Error('Netlify configuration missing')
    }

    const netlifyHeaders = {
      'Authorization': `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
    }

    let result: any = {}

    switch (action) {
      case 'add':
        console.log(`Adding domain ${domain} to Netlify`)
        
        // Add domain to Netlify
        const addResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains`,
          {
            method: 'POST',
            headers: netlifyHeaders,
            body: JSON.stringify({ name: domain }),
          }
        )

        if (!addResponse.ok) {
          const error = await addResponse.text()
          console.error('Netlify add domain error:', error)
          throw new Error(`Failed to add domain to Netlify: ${error}`)
        }

        const domainData = await addResponse.json()
        console.log('Domain added to Netlify:', domainData)

        // Update database with Netlify status
        const { error: updateError } = await supabase
          .from('custom_domains')
          .update({
            ssl_status: 'provisioning',
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('domain', domain)
          .eq('store_id', storeId)

        if (updateError) {
          console.error('Failed to update domain status:', updateError)
        }

        result = { success: true, netlifyData: domainData }
        break

      case 'remove':
        console.log(`Removing domain ${domain} from Netlify`)
        
        const removeResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains/${domain}`,
          {
            method: 'DELETE',
            headers: netlifyHeaders,
          }
        )

        if (!removeResponse.ok && removeResponse.status !== 404) {
          const error = await removeResponse.text()
          console.error('Netlify remove domain error:', error)
          // Don't throw error for 404 - domain might already be removed
        }

        result = { success: true }
        break

      case 'status':
        console.log(`Checking status for domain ${domain}`)
        
        // Check domain status in Netlify
        const statusResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains/${domain}`,
          {
            method: 'GET',
            headers: netlifyHeaders,
          }
        )

        let netlifyStatus = 'not_found'
        let sslStatus = 'pending'

        if (statusResponse.ok) {
          const domainStatus = await statusResponse.json()
          netlifyStatus = 'registered'
          sslStatus = domainStatus.ssl?.state || 'pending'
          
          console.log('Domain status from Netlify:', domainStatus)
        }

        // Check DNS configuration
        let dnsConfigured = false
        try {
          const dnsResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=CNAME`)
          if (dnsResponse.ok) {
            const dnsData = await dnsResponse.json()
            const cnameRecords = dnsData.Answer?.filter((record: any) => record.type === 5) || []
            dnsConfigured = cnameRecords.some((record: any) => 
              record.data.includes('ecombuildr.com') || record.data.includes('netlify.app')
            )
          }
        } catch (error) {
          console.error('DNS check failed:', error)
        }

        // Update database
        const { error: statusUpdateError } = await supabase
          .from('custom_domains')
          .update({
            dns_configured: dnsConfigured,
            ssl_status: sslStatus,
            is_verified: netlifyStatus === 'registered' && dnsConfigured && sslStatus === 'issued',
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('domain', domain)
          .eq('store_id', storeId)

        if (statusUpdateError) {
          console.error('Failed to update domain status:', statusUpdateError)
        }

        result = {
          success: true,
          status: {
            netlifyStatus,
            sslStatus,
            dnsConfigured,
            isVerified: netlifyStatus === 'registered' && dnsConfigured && sslStatus === 'issued'
          }
        }
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Netlify domain manager error:', error)
    
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
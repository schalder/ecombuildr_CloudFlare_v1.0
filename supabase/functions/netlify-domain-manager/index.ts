// @ts-nocheck
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

    if (!netlifyToken) {
      console.error('NETLIFY_ACCESS_TOKEN is not configured')
      throw new Error('Netlify access token is missing. Please configure NETLIFY_ACCESS_TOKEN in Edge Function secrets.')
    }
    
    if (!netlifySiteId) {
      console.error('NETLIFY_SITE_ID is not configured')  
      throw new Error('Netlify site ID is missing. Please configure NETLIFY_SITE_ID in Edge Function secrets.')
    }

    console.log(`Using Netlify site ID: ${netlifySiteId}`)

    const netlifyHeaders = {
      'Authorization': `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
    }

    let result: any = {}

    switch (action) {
      case 'add':
        console.log(`Adding domain ${domain} to Netlify site: ${netlifySiteId}`)
        
        // First, verify the site exists by checking site info
        const siteCheckResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${netlifyToken}`,
            },
          }
        )

        if (!siteCheckResponse.ok) {
          const siteError = await siteCheckResponse.text()
          console.error(`Site check failed (${siteCheckResponse.status}):`, siteError)
          throw new Error(`Netlify site not found (${siteCheckResponse.status}): ${siteError}. Please verify your NETLIFY_SITE_ID is correct.`)
        }

        const siteInfo = await siteCheckResponse.json()
        console.log(`Site verified: ${siteInfo.name} (${siteInfo.url})`)

        // Get current site configuration to retrieve existing domain aliases
        const getCurrentSiteResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${netlifyToken}` },
          }
        )

        if (!getCurrentSiteResponse.ok) {
          const error = await getCurrentSiteResponse.text()
          console.error(`Failed to get current site config (${getCurrentSiteResponse.status}):`, error)
          throw new Error(`Failed to get current site configuration: ${error}`)
        }

        const currentSiteData = await getCurrentSiteResponse.json()
        const existingAliases = currentSiteData.domain_aliases || []
        
        // Check if domain is already in aliases
        if (existingAliases.includes(domain)) {
          console.log(`Domain ${domain} already exists as alias`)
        } else {
          // Add domain as alias to Netlify site
          const updatedAliases = [...existingAliases, domain]
          console.log(`Adding domain ${domain} to aliases. Current aliases:`, existingAliases)
          
          const updateSiteResponse = await fetch(
            `https://api.netlify.com/api/v1/sites/${netlifySiteId}`,
            {
              method: 'PATCH',
              headers: netlifyHeaders,
              body: JSON.stringify({ 
                domain_aliases: updatedAliases
              }),
            }
          )

          const responseText = await updateSiteResponse.text()
          console.log(`Netlify update site response status: ${updateSiteResponse.status}`)
          console.log(`Netlify update site response: ${responseText}`)

          if (!updateSiteResponse.ok) {
            console.error('Netlify update site error:', responseText)
            // Update database with error status
            await supabase
              .from('custom_domains')
              .update({
                ssl_status: 'error',
                last_checked_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('domain', domain)
              .eq('store_id', storeId)
              
            throw new Error(`Failed to add custom domain to Netlify (${updateSiteResponse.status}): ${responseText}`)
          }

          let siteData = {}
          try {
            siteData = JSON.parse(responseText)
          } catch (e) {
            console.error('Failed to parse Netlify response as JSON:', e)
          }
          console.log('Site updated with domain alias:', siteData)
        }

        // Update database with success status
        const { error: updateError } = await supabase
          .from('custom_domains')
          .update({
            ssl_status: 'provisioning',
            dns_configured: false,
            is_verified: false,
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('domain', domain)
          .eq('store_id', storeId)

        if (updateError) {
          console.error('Failed to update domain status:', updateError)
        }

        result = { success: true, netlifyData: currentSiteData }
        break

      case 'remove':
        console.log(`Removing domain ${domain} from Netlify aliases`)
        
        // Get current site configuration to retrieve existing domain aliases
        const getCurrentSiteForRemoveResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${netlifySiteId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${netlifyToken}` },
          }
        )

        if (!getCurrentSiteForRemoveResponse.ok) {
          const error = await getCurrentSiteForRemoveResponse.text()
          console.error(`Failed to get current site config for removal (${getCurrentSiteForRemoveResponse.status}):`, error)
          // Don't throw error - continue with database cleanup
        } else {
          const currentSiteDataForRemove = await getCurrentSiteForRemoveResponse.json()
          const existingAliasesForRemove = currentSiteDataForRemove.domain_aliases || []
          
          // Check if domain exists in aliases and remove it
          if (existingAliasesForRemove.includes(domain)) {
            const updatedAliasesForRemove = existingAliasesForRemove.filter((alias: string) => alias !== domain)
            console.log(`Removing domain ${domain} from aliases. Updated aliases:`, updatedAliasesForRemove)
            
            const removeSiteResponse = await fetch(
              `https://api.netlify.com/api/v1/sites/${netlifySiteId}`,
              {
                method: 'PATCH',
                headers: netlifyHeaders,
                body: JSON.stringify({ 
                  domain_aliases: updatedAliasesForRemove
                }),
              }
            )

            if (!removeSiteResponse.ok) {
              const error = await removeSiteResponse.text()
              console.error('Netlify remove domain alias error:', error)
              // Don't throw error - domain might already be removed
            } else {
              console.log('Domain successfully removed from Netlify aliases')
            }
          } else {
            console.log(`Domain ${domain} not found in aliases, might already be removed`)
          }
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

        console.log(`Domain status check response: ${statusResponse.status}`)
        
        if (statusResponse.ok) {
          const domainStatus = await statusResponse.json()
          netlifyStatus = 'registered'
          sslStatus = domainStatus.ssl?.state || 'pending'
          
          console.log('Domain status from Netlify:', domainStatus)
        } else {
          const errorText = await statusResponse.text()
          console.log(`Domain not found in Netlify (${statusResponse.status}): ${errorText}`)
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

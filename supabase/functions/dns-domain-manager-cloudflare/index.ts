// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainRequest {
  action: 'verify' | 'pre_verify' | 'add_domain' | 'remove_domain' | 'check_cloudflare_status'
  domain: string
  storeId: string
}

interface CloudflareDomainResponse {
  id: string
  name: string
  status: 'pending_validation' | 'active' | 'pending_deployment' | 'initializing'
  verification_errors?: string[]
  created_on: string
  validation_data?: {
    status: string
    method: string
  }
}

// Helper: Add domain to Cloudflare Pages
async function addDomainToCloudflarePages(domain: string): Promise<CloudflareDomainResponse> {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const projectName = Deno.env.get('CLOUDFLARE_PROJECT_NAME')
  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
  
  if (!accountId || !projectName || !apiToken) {
    throw new Error('Missing Cloudflare configuration')
  }
  
  console.log(`[Cloudflare API] Adding domain ${domain} to project ${projectName}`)
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: domain })
    }
  )
  
  const result = await response.json()
  
  if (!response.ok) {
    console.error('[Cloudflare API] Error:', result)
    throw new Error(result.errors?.[0]?.message || 'Failed to add domain to Cloudflare Pages')
  }
  
  console.log(`[Cloudflare API] Domain added successfully:`, result.result)
  return result.result
}

// Helper: Get domain status from Cloudflare Pages
async function getCloudflarePagesDomainStatus(domain: string): Promise<CloudflareDomainResponse | null> {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const projectName = Deno.env.get('CLOUDFLARE_PROJECT_NAME')
  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
  
  if (!accountId || !projectName || !apiToken) {
    return null
  }
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
    {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  if (!response.ok) {
    return null
  }
  
  const result = await response.json()
  return result.result
}

// Helper: Remove domain from Cloudflare Pages
async function removeDomainFromCloudflarePages(domain: string): Promise<boolean> {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const projectName = Deno.env.get('CLOUDFLARE_PROJECT_NAME')
  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
  
  if (!accountId || !projectName || !apiToken) {
    return false
  }
  
  console.log(`[Cloudflare API] Removing domain ${domain} from project ${projectName}`)
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  if (!response.ok) {
    console.error(`[Cloudflare API] Failed to remove domain: ${response.status}`)
    return false
  }
  
  console.log(`[Cloudflare API] Domain removed successfully`)
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

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

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('owner_id', user.id)
      .single()

    if (storeError || !store) {
      throw new Error('Store not found or access denied')
    }

    console.log(`[Cloudflare] Processing ${action} for domain: ${domain}`)

    let result: any = {}

    switch (action) {
      case 'add_domain':
        const verificationToken = crypto.randomUUID()
        
        const { data: existingDomain } = await supabase
          .from('custom_domains')
          .select('*')
          .eq('domain', domain)
          .eq('store_id', storeId)
          .maybeSingle()
        
        if (existingDomain) {
          console.log(`[Cloudflare] Domain ${domain} already exists in database`)
          
          // Check Cloudflare Pages status
          const cfStatus = await getCloudflarePagesDomainStatus(domain)
          
          result = {
            success: true,
            domain: existingDomain,
            verificationToken: existingDomain.verification_token,
            cloudflareTarget: 'ecombuildr.pages.dev',
            cloudflareStatus: cfStatus?.status || 'unknown',
            instructions: {
              type: 'CNAME',
              name: 'www',
              value: 'ecombuildr.pages.dev',
              apexInstructions: 'For apex (@), use CNAME flattening or A records',
              description: 'Add CNAME: www → ecombuildr.pages.dev'
            }
          }
          break
        }
        
        // Step 1: Add domain to database
        const { data: newDomain, error: insertError } = await supabase
          .from('custom_domains')
          .insert({
            store_id: storeId,
            domain: domain,
            dns_configured: false,
            is_verified: false,
            ssl_status: 'pending',
            verification_token: verificationToken
          })
          .select()
          .single()
        
        if (insertError) {
          throw new Error(`Failed to add domain: ${insertError.message}`)
        }
        
        console.log(`[Cloudflare] Domain added to database: ${newDomain.id}`)
        
        // Step 2: Add domain to Cloudflare Pages
        let cfDomain: CloudflareDomainResponse | null = null
        let cloudflareError: string | null = null
        
        try {
          cfDomain = await addDomainToCloudflarePages(domain)
          console.log(`[Cloudflare API] Domain status: ${cfDomain.status}`)
          
          // Update database with Cloudflare status
          await supabase
            .from('custom_domains')
            .update({
              ssl_status: cfDomain.status === 'active' ? 'active' : 'pending'
            })
            .eq('id', newDomain.id)
            
        } catch (error) {
          console.error('[Cloudflare API] Failed to add domain:', error)
          cloudflareError = error.message
          
          // Don't fail the entire operation - user can still configure DNS manually
        }
        
        result = {
          success: true,
          domain: newDomain,
          verificationToken,
          cloudflareTarget: 'ecombuildr.pages.dev',
          cloudflareStatus: cfDomain?.status || 'not_added',
          cloudflareError,
          instructions: {
            type: 'CNAME',
            name: 'www',
            value: 'ecombuildr.pages.dev',
            apexInstructions: 'For apex (@), use CNAME flattening or A records',
            description: 'Add CNAME record pointing to ecombuildr.pages.dev'
          }
        }
        
        console.log(`[Cloudflare] Domain setup complete: ${newDomain.id}`)
        break

      case 'pre_verify':
      case 'verify':
        let dnsConfigured = false
        let cnameTarget = ''
        let errorMessage = ''
        
        try {
          const cnameResponse = await fetch(
            `https://dns.google.com/resolve?name=${domain}&type=CNAME`
          )
          
          if (cnameResponse.ok) {
            const cnameData = await cnameResponse.json()
            const cnameRecords = cnameData.Answer?.filter(
              (record: any) => record.type === 5
            ) || []
            
            for (const record of cnameRecords) {
              cnameTarget = record.data.replace(/\.$/, '')
              console.log(`[Cloudflare] CNAME: ${cnameTarget}`)
              
              if (cnameTarget.includes('ecombuildr.pages.dev') || 
                  cnameTarget.includes('.pages.dev')) {
                dnsConfigured = true
                break
              }
            }
          }
          
          if (!dnsConfigured) {
            const aResponse = await fetch(
              `https://dns.google.com/resolve?name=${domain}&type=A`
            )
            
            if (aResponse.ok) {
              const aData = await aResponse.json()
              const aRecords = aData.Answer?.filter(
                (record: any) => record.type === 1
              ) || []
              
              if (aRecords.length > 0) {
                console.log(`[Cloudflare] A records found`)
                dnsConfigured = true
                cnameTarget = aRecords[0].data
              }
            }
          }
          
          if (!dnsConfigured) {
            errorMessage = 'DNS not configured. Add CNAME → ecombuildr.pages.dev'
          }
        } catch (error) {
          console.error('[Cloudflare] DNS check failed:', error)
          errorMessage = 'DNS lookup failed'
        }
        
        // Additionally check Cloudflare Pages domain status
        let cfStatus: CloudflareDomainResponse | null = null
        
        try {
          cfStatus = await getCloudflarePagesDomainStatus(domain)
          console.log(`[Cloudflare API] Domain status: ${cfStatus?.status || 'not_found'}`)
        } catch (error) {
          console.error('[Cloudflare API] Failed to get domain status:', error)
        }
        
        if (action === 'verify' && dnsConfigured) {
          await supabase
            .from('custom_domains')
            .update({
              dns_configured: true,
              is_verified: cfStatus?.status === 'active',
              ssl_status: cfStatus?.status || 'pending',
              last_checked_at: new Date().toISOString()
            })
            .eq('domain', domain)
            .eq('store_id', storeId)
        }
        
        result = {
          success: true,
          status: {
            dnsConfigured,
            cnameTarget,
            errorMessage,
            isAccessible: dnsConfigured && cfStatus?.status === 'active',
            cloudflareStatus: cfStatus?.status || 'unknown',
            verificationErrors: cfStatus?.verification_errors || []
          }
        }
        break

      case 'remove_domain':
        // Step 1: Remove from Cloudflare Pages
        let cfRemoved = false
        
        try {
          cfRemoved = await removeDomainFromCloudflarePages(domain)
        } catch (error) {
          console.error('[Cloudflare API] Failed to remove domain:', error)
        }
        
        // Step 2: Remove from database
        const { error: deleteError } = await supabase
          .from('custom_domains')
          .delete()
          .eq('domain', domain)
          .eq('store_id', storeId)
        
        if (deleteError) {
          throw new Error(`Failed to remove: ${deleteError.message}`)
        }
        
        result = { 
          success: true, 
          message: `Domain ${domain} removed`,
          cloudflareRemoved: cfRemoved
        }
        break

      case 'check_cloudflare_status':
        const cfDomainStatus = await getCloudflarePagesDomainStatus(domain)
        
        if (!cfDomainStatus) {
          result = {
            success: false,
            error: 'Domain not found in Cloudflare Pages'
          }
        } else {
          // Update database with latest status
          await supabase
            .from('custom_domains')
            .update({
              is_verified: cfDomainStatus.status === 'active',
              ssl_status: cfDomainStatus.status,
              last_checked_at: new Date().toISOString()
            })
            .eq('domain', domain)
            .eq('store_id', storeId)
          
          result = {
            success: true,
            status: cfDomainStatus.status,
            verificationErrors: cfDomainStatus.verification_errors || [],
            validationData: cfDomainStatus.validation_data
          }
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('[Cloudflare] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

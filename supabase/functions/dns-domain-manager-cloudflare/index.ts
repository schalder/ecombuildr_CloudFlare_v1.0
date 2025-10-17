// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainRequest {
  action: 'verify' | 'pre_verify' | 'add_domain' | 'remove_domain'
  domain: string
  storeId: string
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
          console.log(`[Cloudflare] Domain ${domain} already exists`)
          result = {
            success: true,
            domain: existingDomain,
            verificationToken: existingDomain.verification_token,
            cloudflareTarget: 'ecombuildr.pages.dev',
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
        
        result = {
          success: true,
          domain: newDomain,
          verificationToken,
          cloudflareTarget: 'ecombuildr.pages.dev',
          instructions: {
            type: 'CNAME',
            name: 'www',
            value: 'ecombuildr.pages.dev',
            apexInstructions: 'For apex (@), use CNAME flattening or A records',
            description: 'Add CNAME record pointing to ecombuildr.pages.dev'
          }
        }
        console.log(`[Cloudflare] Domain added: ${newDomain.id}`)
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
        
        if (action === 'verify' && dnsConfigured) {
          await supabase
            .from('custom_domains')
            .update({
              dns_configured: true,
              is_verified: true,
              ssl_status: 'active',
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
            isAccessible: dnsConfigured
          }
        }
        break

      case 'remove_domain':
        const { error: deleteError } = await supabase
          .from('custom_domains')
          .delete()
          .eq('domain', domain)
          .eq('store_id', storeId)
        
        if (deleteError) {
          throw new Error(`Failed to remove: ${deleteError.message}`)
        }
        
        result = { success: true, message: `Domain ${domain} removed` }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

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

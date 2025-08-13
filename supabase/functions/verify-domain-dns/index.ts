import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DNSVerificationRequest {
  domain: string;
  storeId: string;
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

    const { domain, storeId }: DNSVerificationRequest = await req.json()

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

    console.log(`Verifying DNS for domain: ${domain}`)

    let dnsConfigured = false
    let cnameTarget = ''
    let errorMessage = ''

    try {
      // Check CNAME records using Google DNS resolver
      const cnameResponse = await fetch(`https://dns.google.com/resolve?name=${domain}&type=CNAME`)
      if (cnameResponse.ok) {
        const cnameData = await cnameResponse.json()
        const cnameRecords = cnameData.Answer?.filter((record: any) => record.type === 5) || []
        
        console.log(`CNAME records for ${domain}:`, cnameRecords)

        for (const record of cnameRecords) {
          cnameTarget = record.data.replace(/\.$/, '') // Remove trailing dot
          if (cnameTarget === 'ecombuildr.com') {
            dnsConfigured = true
            console.log(`Valid CNAME found: ${domain} -> ${cnameTarget}`)
            break
          }
        }

        if (!dnsConfigured && cnameRecords.length > 0) {
          errorMessage = `CNAME points to ${cnameTarget}, but should point to ecombuildr.com`
        } else if (!dnsConfigured) {
          errorMessage = `No CNAME record found. Please add CNAME record: ${domain} -> ecombuildr.com`
        }
      } else {
        errorMessage = 'DNS lookup failed. Please try again in a few minutes.'
      }
    } catch (error) {
      console.error('DNS verification failed:', error)
      errorMessage = 'DNS verification failed. Please check your DNS configuration and try again.'
    }

    // Update verification attempts
    const { error: updateError } = await supabase
      .from('custom_domains')
      .update({
        verification_attempts: supabase.sql`verification_attempts + 1`,
        updated_at: new Date().toISOString(),
        ...(dnsConfigured && { dns_verified_at: new Date().toISOString() })
      })
      .eq('domain', domain)
      .eq('store_id', storeId)

    if (updateError) {
      console.error('Failed to update verification attempts:', updateError)
    }

    const result = {
      success: true,
      dnsConfigured,
      cnameTarget: cnameTarget || null,
      errorMessage: errorMessage || null,
      instructions: {
        type: 'CNAME',
        name: domain,
        value: 'ecombuildr.com',
        description: `Add a CNAME record for ${domain} that points to ecombuildr.com`
      }
    }

    console.log(`DNS verification result for ${domain}:`, result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('DNS verification error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'DNS verification failed',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
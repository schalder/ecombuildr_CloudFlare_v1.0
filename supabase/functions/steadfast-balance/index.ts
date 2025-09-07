import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get store_id from user's stores
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!stores) {
      return new Response(
        JSON.stringify({ error: 'No store found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Steadfast shipping account for this store
    const { data: shippingAccount } = await supabase
      .from('store_shipping_accounts')
      .select('api_key, secret_key')
      .eq('store_id', stores.id)
      .eq('provider', 'steadfast')
      .eq('is_active', true)
      .single()

    if (!shippingAccount) {
      return new Response(
        JSON.stringify({ 
          current_balance: 0,
          error: 'No Steadfast account configured' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call Steadfast API to get balance
    const steadfastResponse = await fetch('https://portal.steadfast.com.bd/api/v1/get_balance', {
      method: 'GET',
      headers: {
        'Api-Key': shippingAccount.api_key,
        'Secret-Key': shippingAccount.secret_key,
        'Content-Type': 'application/json',
      },
    })

    if (!steadfastResponse.ok) {
      console.error('Steadfast API error:', await steadfastResponse.text())
      return new Response(
        JSON.stringify({ 
          current_balance: 0,
          error: 'Failed to fetch balance from Steadfast' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const balanceData = await steadfastResponse.json()
    
    return new Response(
      JSON.stringify(balanceData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error fetching Steadfast balance:', error)
    return new Response(
      JSON.stringify({ 
        current_balance: 0,
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
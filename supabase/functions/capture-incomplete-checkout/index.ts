import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse and validate request body
    const {
      session_id,
      store_id,
      website_id,
      funnel_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_area,
      shipping_country,
      shipping_state,
      shipping_postal_code,
      cart_items,
      subtotal,
      shipping_cost,
      total,
      payment_method,
      custom_fields,
      page_url,
      referrer,
      utm_source,
      utm_campaign,
      utm_medium,
      attribution_source,
      attribution_medium,
      attribution_campaign,
      attribution_data,
      step, // e.g., "started_checkout", "contact_entered"
    } = await req.json();

    // Validation: Require session_id and store_id
    if (!session_id || !store_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: session_id and store_id are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validation: Ensure store exists and is active
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, is_active')
      .eq('id', store_id)
      .single();

    if (storeError || !store || !store.is_active) {
      console.error('[capture-incomplete-checkout] Invalid or inactive store:', storeError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive store' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare checkout data (only include fields that have values)
    const checkoutData: any = {
      store_id,
      session_id,
      last_updated_at: new Date().toISOString(),
    };

    // Optional fields - only include if provided
    if (website_id) checkoutData.website_id = website_id;
    if (funnel_id) checkoutData.funnel_id = funnel_id;
    if (customer_name) checkoutData.customer_name = customer_name;
    if (customer_email) checkoutData.customer_email = customer_email;
    if (customer_phone) checkoutData.customer_phone = customer_phone;
    if (shipping_address) checkoutData.shipping_address = shipping_address;
    if (shipping_city) checkoutData.shipping_city = shipping_city;
    if (shipping_area) checkoutData.shipping_area = shipping_area;
    if (shipping_country) checkoutData.shipping_country = shipping_country;
    if (shipping_state) checkoutData.shipping_state = shipping_state;
    if (shipping_postal_code) checkoutData.shipping_postal_code = shipping_postal_code;
    if (cart_items) checkoutData.cart_items = cart_items;
    if (subtotal !== undefined) checkoutData.subtotal = subtotal;
    if (shipping_cost !== undefined) checkoutData.shipping_cost = shipping_cost;
    if (total !== undefined) checkoutData.total = total;
    if (payment_method) checkoutData.payment_method = payment_method;
    if (custom_fields) checkoutData.custom_fields = custom_fields;
    if (page_url) checkoutData.page_url = page_url;
    if (referrer) checkoutData.referrer = referrer;
    if (utm_source) checkoutData.utm_source = utm_source;
    if (utm_campaign) checkoutData.utm_campaign = utm_campaign;
    if (utm_medium) checkoutData.utm_medium = utm_medium;
    if (attribution_source) checkoutData.attribution_source = attribution_source;
    if (attribution_medium) checkoutData.attribution_medium = attribution_medium;
    if (attribution_campaign) checkoutData.attribution_campaign = attribution_campaign;
    if (attribution_data) checkoutData.attribution_data = attribution_data;

    // Upsert based on session_id (deduplication)
    // First, check if a record with this session_id exists
    const { data: existing } = await supabaseAdmin
      .from('incomplete_checkouts')
      .select('id')
      .eq('session_id', session_id)
      .single();

    let data, error;
    
    if (existing?.id) {
      // Update existing record
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('incomplete_checkouts')
        .update(checkoutData)
        .eq('id', existing.id)
        .select()
        .single();
      data = updated;
      error = updateError;
    } else {
      // Insert new record
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('incomplete_checkouts')
        .insert(checkoutData)
        .select()
        .single();
      data = inserted;
      error = insertError;
    }

    if (error) {
      console.error('[capture-incomplete-checkout] Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save incomplete checkout',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log successful capture (for debugging)
    console.log('[capture-incomplete-checkout] Successfully captured:', {
      id: data?.id,
      session_id,
      store_id,
      step,
      has_customer_data: !!(customer_name || customer_phone),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data?.id,
        session_id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[capture-incomplete-checkout] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

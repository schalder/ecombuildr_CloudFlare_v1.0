// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FOMOOrder {
  id: string;
  customer_name: string;
  customer_city: string;
  customer_area: string;
  customer_address: string;
  created_at: string;
  product_name: string;
  product_image: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Parse body safely
    let websiteId: string | null = null;
    let limit: number = 10;
    try {
      const body = await req.json();
      websiteId = body?.websiteId ?? null;
      limit = typeof body?.limit === 'number' ? body.limit : 10;
      console.log('FOMO: function invoked', { websiteId, limit });
    } catch (_e) {
      console.warn('FOMO: invalid JSON body');
    }
    if (!websiteId) {
      return new Response(
        JSON.stringify({ error: 'Website ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get website to find store_id
    const { data: website, error: websiteError } = await supabaseClient
      .from('websites')
      .select('store_id')
      .eq('id', websiteId)
      .single();

    console.log('FOMO: website resolved', { store_id: website?.store_id });
    if (websiteError || !website) {
      return new Response(
        JSON.stringify({ error: 'Website not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent orders with product details
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        customer_name,
        shipping_city,
        shipping_area,
        shipping_address,
        created_at,
        order_items (
          product_name,
          products (
            images
          )
        )
      `)
      .eq('store_id', website.store_id)
      .in('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log('FOMO: orders fetched', { count: orders?.length ?? 0 });
    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform orders for FOMO display
    const fomoData: FOMOOrder[] = [];
    
    for (const order of orders || []) {
      // Get location with fallback priority: city → area → address
      let location = '';
      if (order.shipping_city && order.shipping_city.trim()) {
        location = order.shipping_city.trim();
      } else if (order.shipping_area && order.shipping_area.trim()) {
        location = order.shipping_area.trim();
      } else if (order.shipping_address && order.shipping_address.trim()) {
        // Extract first part of address as location
        const addressParts = order.shipping_address.trim().split(',');
        location = addressParts[0].trim();
      }

      // Process each order item (since orders can have multiple products)
      for (const item of order.order_items || []) {
        // Get product image
        let productImage = '';
        if (item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0) {
          productImage = item.products.images[0];
        }

        fomoData.push({
          id: order.id,
          customer_name: order.customer_name?.trim() || 'Someone',
          customer_city: location || '',
          customer_area: '',
          customer_address: '',
          created_at: order.created_at,
          product_name: item.product_name || 'Product',
          product_image: productImage
        });
      }
    }

    return new Response(
      JSON.stringify({ data: fomoData }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
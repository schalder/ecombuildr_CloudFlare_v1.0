import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, limit = 6, websiteId } = await req.json();
    if (!storeId) {
      return new Response(JSON.stringify({ error: "storeId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // 1) Get delivered orders for this store from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', storeId)
      .eq('status', 'delivered')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (ordersErr) throw ordersErr;
    const orderIds = (orders || []).map((o: any) => o.id);

    if (orderIds.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Get order items for these orders
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .in('order_id', orderIds);

    if (itemsErr) throw itemsErr;

    // 3) Aggregate by product_id
    const counts = new Map<string, number>();
    for (const it of items || []) {
      if (!it.product_id) continue;
      counts.set(it.product_id, (counts.get(it.product_id) || 0) + (it.quantity || 0));
    }

    // 4) Sort and take top N
    const topIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (topIds.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 5) Fetch product details, optionally filtered by website visibility
    let productQuery = supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images')
      .in('id', topIds)
      .eq('is_active', true);

    // If websiteId is provided, only include products visible on this website
    if (websiteId) {
      const { data: visibleProductIds, error: visErr } = await supabase
        .from('product_website_visibility')
        .select('product_id')
        .eq('website_id', websiteId);

      if (visErr) throw visErr;
      
      const visibleIds = (visibleProductIds || []).map((v: any) => v.product_id);
      const filteredTopIds = topIds.filter(id => visibleIds.includes(id));
      
      // If no products are visible on this website, return empty array
      if (filteredTopIds.length === 0) {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      productQuery = productQuery.in('id', filteredTopIds);
    }

    const { data: products, error: prodErr } = await productQuery.order('name');

    if (prodErr) throw prodErr;

    return new Response(JSON.stringify(products || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error('top-sellers error', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

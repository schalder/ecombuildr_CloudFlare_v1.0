// Supabase Edge Function: get-order-public
// Public function to fetch order details with access token validation
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, storeId, token } = await req.json().catch(() => ({}));
    
    if (!orderId || !storeId || !token) {
      return new Response(JSON.stringify({ error: "Missing required parameters: orderId, storeId, token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch order with access token validation
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, access_token")
      .eq("id", orderId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (orderError) {
      console.error("get-order-public: orderError", orderError);
      return new Response(JSON.stringify({ error: "Order fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate access token against the access_token column
    if (!order.access_token || order.access_token !== token) {
      return new Response(JSON.stringify({ error: "Invalid access token" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_name, product_sku, price, quantity, total, variation")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("get-order-public: itemsError", itemsError);
      return new Response(JSON.stringify({ error: "Items fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Return safe subset of order data (no PII exposed in logs)
    const safeOrder = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address,
      shipping_city: order.shipping_city,
      shipping_area: order.shipping_area,
      payment_method: order.payment_method,
      status: order.status,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      discount_amount: order.discount_amount,
      discount_code: order.discount_code,
      total: order.total,
      created_at: order.created_at,
      notes: order.notes,
    };

    // Get download links for digital products
    const { data: downloadLinks } = await supabase
      .from('order_download_links')
      .select('*')
      .eq('order_id', orderId);

    return new Response(JSON.stringify({ 
      order: safeOrder, 
      items: items || [],
      downloadLinks: downloadLinks || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("get-order-public: unexpected", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
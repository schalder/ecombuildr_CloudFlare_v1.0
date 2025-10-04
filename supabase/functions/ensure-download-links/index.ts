import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
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

    // Fetch order and ensure it exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, store_id, custom_fields")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("ensure-download-links: orderError", orderError);
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

    // Ensure access token exists (matches get-order-public usage: order_access_token)
    let customFields: Record<string, any> = order.custom_fields || {};
    if (!customFields.order_access_token) {
      const token = crypto.randomUUID().replace(/-/g, "");
      customFields = { ...customFields, order_access_token: token };
      const { error: updateErr } = await supabase
        .from("orders")
        .update({ custom_fields: customFields })
        .eq("id", orderId);
      if (updateErr) {
        console.error("ensure-download-links: update token error", updateErr);
      }
    }

    // Load order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("ensure-download-links: itemsError", itemsError);
      return new Response(JSON.stringify({ error: "Items fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const productIds = Array.from(new Set((orderItems || []).map((i: any) => i.product_id))).filter(Boolean);
    if (productIds.length === 0) {
      // Nothing to do
      const { data: links } = await supabase
        .from("order_download_links")
        .select("*")
        .eq("order_id", orderId);
      return new Response(JSON.stringify({ downloadLinks: links || [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Load products with digital_files and product_type
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, digital_files, product_type")
      .in("id", productIds);

    if (productsError) {
      console.error("ensure-download-links: productsError", productsError);
      return new Response(JSON.stringify({ error: "Products fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Existing links to avoid duplicates
    const { data: existing } = await supabase
      .from("order_download_links")
      .select("digital_file_path")
      .eq("order_id", orderId);
    const existingPaths = new Set((existing || []).map((r: any) => r.digital_file_path));

    // Build inserts - only for digital products
    const rows: any[] = [];
    for (const p of products || []) {
      // Only process digital products
      if (p.product_type !== 'digital') continue;
      
      const files: any[] = Array.isArray(p.digital_files) ? p.digital_files : [];
      for (const f of files) {
        const path = f?.url || f?.path || f?.file || f?.file_path;
        if (!path) continue;
        if (existingPaths.has(path)) continue;
        const maxDownloads = Number(f?.max_downloads ?? 5) || 5;
        const days = Number(f?.expires_in_days ?? 30) || 30;
        rows.push({
          order_id: orderId,
          digital_file_path: path,
          max_downloads: maxDownloads,
          expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    if (rows.length > 0) {
      const { error: insertErr } = await supabase.from("order_download_links").insert(rows);
      if (insertErr) {
        console.error("ensure-download-links: insertErr", insertErr);
        return new Response(JSON.stringify({ error: "Failed to create download links" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Return all links
    const { data: allLinks, error: linksError } = await supabase
      .from("order_download_links")
      .select("*")
      .eq("order_id", orderId);

    if (linksError) {
      console.error("ensure-download-links: linksError", linksError);
      return new Response(JSON.stringify({ error: "Links fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ downloadLinks: allLinks || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("ensure-download-links: unexpected", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

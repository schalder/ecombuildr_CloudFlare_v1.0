import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, token, stepId, action } = await req.json();

    if (!orderId || !token || !stepId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify order exists and token matches
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("id, store_id, total, status")
      .eq("id", orderId)
      .eq("idempotency_key", token)
      .maybeSingle();

    if (orderError || !order) {
      console.error("Order verification failed:", orderError);
      return new Response(
        JSON.stringify({ error: "Invalid order or token" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // Get funnel step details
    const { data: step, error: stepError } = await supabaseService
      .from("funnel_steps")
      .select(`
        id, 
        step_type, 
        on_accept_step_id, 
        on_decline_step_id, 
        offer_product_id, 
        offer_price, 
        offer_quantity,
        funnel_id
      `)
      .eq("id", stepId)
      .maybeSingle();

    if (stepError || !step) {
      console.error("Step verification failed:", stepError);
      return new Response(
        JSON.stringify({ error: "Invalid step" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    let nextStepId = null;
    let nextStepSlug = null;

    if (action === "accept" && step.offer_product_id) {
      // Add product to order
      const { data: product, error: productError } = await supabaseService
        .from("products")
        .select("id, name, sku, store_id")
        .eq("id", step.offer_product_id)
        .eq("store_id", order.store_id)
        .maybeSingle();

      if (productError || !product) {
        console.error("Product verification failed:", productError);
        return new Response(
          JSON.stringify({ error: "Invalid product offer" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404 
          }
        );
      }

      const offerPrice = step.offer_price || 0;
      const offerQuantity = step.offer_quantity || 1;
      const totalItemPrice = offerPrice * offerQuantity;

      // Add order item
      const { error: orderItemError } = await supabaseService
        .from("order_items")
        .insert({
          order_id: orderId,
          product_id: step.offer_product_id,
          product_name: product.name,
          product_sku: product.sku,
          price: offerPrice,
          quantity: offerQuantity,
          total: totalItemPrice
        });

      if (orderItemError) {
        console.error("Failed to add order item:", orderItemError);
        return new Response(
          JSON.stringify({ error: "Failed to add product to order" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      // Update order total
      const { error: updateError } = await supabaseService
        .from("orders")
        .update({ 
          total: order.total + totalItemPrice,
          subtotal: order.total + totalItemPrice
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order total:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update order" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      nextStepId = step.on_accept_step_id;
    } else if (action === "decline") {
      nextStepId = step.on_decline_step_id;
    }

    // Get next step slug if we have a next step
    if (nextStepId) {
      const { data: nextStep, error: nextStepError } = await supabaseService
        .from("funnel_steps")
        .select("slug")
        .eq("id", nextStepId)
        .maybeSingle();

      if (!nextStepError && nextStep) {
        nextStepSlug = nextStep.slug;
      }
    }

    // Get funnel slug for redirect URL construction
    const { data: funnel, error: funnelError } = await supabaseService
      .from("funnels")
      .select("slug")
      .eq("id", step.funnel_id)
      .maybeSingle();

    if (funnelError || !funnel) {
      console.error("Funnel verification failed:", funnelError);
      return new Response(
        JSON.stringify({ error: "Invalid funnel" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    console.log(`Funnel offer processed: ${action} for order ${orderId}, next step: ${nextStepSlug}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        nextStepSlug,
        funnelSlug: funnel.slug,
        action: action
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Funnel offer error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
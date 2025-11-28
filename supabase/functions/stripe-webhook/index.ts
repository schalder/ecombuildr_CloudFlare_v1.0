// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Get webhook secret from environment
    const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = Stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Stripe webhook event received:', event.type, event.id);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;

      if (!orderId) {
        console.error('Payment intent missing order_id in metadata');
        return new Response(
          JSON.stringify({ received: true, error: 'Missing order_id' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, store_id, status, custom_fields')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderId);
        return new Response(
          JSON.stringify({ received: true, error: 'Order not found' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Determine order status based on product types
      let orderStatus = 'processing'; // Default for physical products
      
      // Get order items to check product types
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', orderId);

      if (!itemsError && orderItems && orderItems.length > 0) {
        const productIds = orderItems.map(item => item.product_id).filter(Boolean);
        
        if (productIds.length > 0) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, product_type')
            .in('id', productIds);

          if (!productsError && products && products.length > 0) {
            let hasDigitalProducts = false;
            let hasPhysicalProducts = false;
            
            for (const product of products) {
              if (product.product_type === 'digital') {
                hasDigitalProducts = true;
              } else {
                hasPhysicalProducts = true;
              }
            }
            
            // If all products are digital, set to 'delivered' (instant delivery)
            if (hasDigitalProducts && !hasPhysicalProducts) {
              orderStatus = 'delivered';
              console.log('Stripe webhook: Order status set to delivered (digital products only)');
            } else {
              orderStatus = 'processing';
              console.log('Stripe webhook: Order status set to processing (physical products, payment collected)');
            }
          }
        }
      }

      // Update order status and store payment intent ID
      const updatedCustomFields = {
        ...(order.custom_fields || {}),
        stripe: {
          ...(order.custom_fields?.stripe || {}),
          payment_intent_id: paymentIntent.id,
          payment_status: 'succeeded',
          webhook_received_at: new Date().toISOString(),
        },
      };

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          custom_fields: updatedCustomFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      console.log('Order updated successfully:', { orderId, orderStatus });

    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, custom_fields')
          .eq('id', orderId)
          .single();

        if (order) {
          const updatedCustomFields = {
            ...(order.custom_fields || {}),
            stripe: {
              ...(order.custom_fields?.stripe || {}),
              payment_intent_id: paymentIntent.id,
              payment_status: 'failed',
              webhook_received_at: new Date().toISOString(),
            },
          };

          await supabase
            .from('orders')
            .update({
              status: 'payment_failed',
              custom_fields: updatedCustomFields,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      }

    } else if (event.type === 'payment_intent.canceled') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, custom_fields')
          .eq('id', orderId)
          .single();

        if (order) {
          const updatedCustomFields = {
            ...(order.custom_fields || {}),
            stripe: {
              ...(order.custom_fields?.stripe || {}),
              payment_intent_id: paymentIntent.id,
              payment_status: 'canceled',
              webhook_received_at: new Date().toISOString(),
            },
          };

          await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              custom_fields: updatedCustomFields,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      }
    }

    // Return success response to Stripe
    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Webhook processing failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


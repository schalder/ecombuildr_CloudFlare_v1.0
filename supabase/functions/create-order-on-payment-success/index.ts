// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrderRequest {
  orderData: any;
  itemsData: any[];
  storeId: string;
  paymentVerified: boolean;
  paymentDetails?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderData, itemsData, storeId, paymentVerified, paymentDetails }: CreateOrderRequest = await req.json();
    
    console.log('Create order on payment success:', { 
      storeId, 
      paymentVerified,
      hasOrderData: !!orderData,
      itemsCount: itemsData?.length 
    });

    if (!paymentVerified) {
      throw new Error('Payment not verified');
    }

    if (!orderData || !itemsData || !storeId) {
      throw new Error('Missing required order data');
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate order number if not provided
    if (!orderData.order_number) {
      orderData.order_number = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    // Generate order access token
    const orderAccessToken = crypto.randomUUID();
    orderData.custom_fields = {
      ...(orderData.custom_fields || {}),
      order_access_token: orderAccessToken,
      ...(paymentDetails && { payment_details: paymentDetails })
    };

    // Set status to confirmed for successful payments
    orderData.status = 'confirmed';

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id, order_number')
      .single();

    if (orderError) {
      console.error('Order insertion error:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('Order created:', { orderId: order.id, orderNumber: order.order_number });

    // Insert order items
    const itemsWithOrderId = itemsData.map(item => ({
      ...item,
      order_id: order.id,
      total: (item.price || 0) * (item.quantity || 1),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      // Don't throw error here, order is already created
    }

    // Try to send order notification email (best effort)
    try {
      await supabase.functions.invoke('send-order-email', {
        body: {
          orderId: order.id,
          storeId: storeId,
          orderNumber: order.order_number,
        }
      });
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
      // Don't throw, email is not critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          access_token: orderAccessToken,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Create order on payment success error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create order' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

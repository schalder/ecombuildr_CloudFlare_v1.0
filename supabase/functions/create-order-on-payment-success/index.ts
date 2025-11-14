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
      itemsCount: itemsData?.length,
      sampleOrderData: orderData ? {
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        total: orderData.total,
        payment_method: orderData.payment_method
      } : null,
      sampleItemData: itemsData?.[0] ? {
        product_id: itemsData[0].product_id,
        product_name: itemsData[0].product_name,
        price: itemsData[0].price,
        quantity: itemsData[0].quantity
      } : null
    });

    if (!paymentVerified) {
      throw new Error('Payment not verified');
    }

    if (!orderData || !itemsData || !storeId) {
      throw new Error('Missing required order data');
    }

    // Validate items data structure
    if (!Array.isArray(itemsData) || itemsData.length === 0) {
      throw new Error('Invalid items data: must be non-empty array');
    }

    // Validate required fields in items
    for (const item of itemsData) {
      if (!item.product_id || !item.product_name || !item.price || !item.quantity) {
        console.error('Invalid item data:', item);
        throw new Error('Items must have product_id, product_name, price, and quantity');
      }
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ✅ Check for existing order if idempotency key is provided (prevent duplicates)
    if (orderData.idempotency_key) {
      const { data: existingOrder, error: existingError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId)
        .eq('idempotency_key', orderData.idempotency_key)
        .single();

      if (!existingError && existingOrder) {
        console.log('create-order-on-payment-success: returning existing order for idempotency key', orderData.idempotency_key);
        const accessToken = existingOrder.custom_fields?.order_access_token || crypto.randomUUID();
        return new Response(
          JSON.stringify({ 
            success: true, 
            order: { 
              ...existingOrder, 
              access_token: accessToken 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ✅ Extract funnel_id from custom_fields if not already set
    if (!orderData.funnel_id && orderData.custom_fields?.funnelId) {
      orderData.funnel_id = orderData.custom_fields.funnelId;
    }

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

    // Insert order items with proper field mapping (same as create-order function)
    const itemsToInsert = itemsData.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku ?? null,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      variation: item.variation ?? null,
      created_at: new Date().toISOString(),
    }));

    console.log('Inserting order items:', { 
      orderId: order.id, 
      itemsCount: itemsToInsert.length,
      sampleItem: itemsToInsert[0] 
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('Order items created successfully:', { 
      orderId: order.id, 
      itemsCount: itemsToInsert.length 
    });

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

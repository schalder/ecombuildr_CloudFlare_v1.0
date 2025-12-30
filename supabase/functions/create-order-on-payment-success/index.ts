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
        
        // ✅ Check if order status should be updated based on product types
        const productIds = itemsData.map(item => item.product_id).filter(Boolean);
        let shouldBeDelivered = false;
        
        if (productIds.length > 0) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, product_type')
            .in('id', productIds);

          console.log('create-order-on-payment-success: Checking product types for existing order', {
            productIds,
            productsFound: products?.length || 0,
            products: products?.map(p => ({ id: p.id, product_type: p.product_type })),
            error: productsError?.message
          });

          if (!productsError && products && products.length > 0) {
            let hasDigitalProducts = false;
            let hasPhysicalProducts = false;
            
            for (const product of products) {
              if (product.product_type === 'digital') {
                hasDigitalProducts = true;
              } else if (product.product_type !== null && product.product_type !== undefined) {
                hasPhysicalProducts = true;
              }
            }
            
            // If all products are digital, status should be 'delivered'
            if (hasDigitalProducts && !hasPhysicalProducts) {
              shouldBeDelivered = true;
              console.log('create-order-on-payment-success: All products are digital, order should be delivered');
            }
          }
        }
        
        // ✅ Update order status if it's wrong (e.g., if it's 'processing' but should be 'delivered')
        if (shouldBeDelivered && existingOrder.status !== 'delivered') {
          console.log('create-order-on-payment-success: Updating existing order status from', existingOrder.status, 'to delivered (digital products)');
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              status: 'delivered',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingOrder.id);
          
          if (!updateError) {
            existingOrder.status = 'delivered';
            console.log('create-order-on-payment-success: ✅ Order status updated to delivered');
          } else {
            console.error('create-order-on-payment-success: Failed to update order status:', updateError);
          }
        }
        
        // Extract upfront payment fields from orderData to update existing order
        const { upfront_payment_amount, upfront_payment_method, delivery_payment_amount } = orderData as any;
        
        // Update custom_fields with upfront payment info if provided
        let updatedCustomFields = existingOrder.custom_fields || {};
        if (typeof updatedCustomFields === 'object' && !Array.isArray(updatedCustomFields)) {
          updatedCustomFields = { ...updatedCustomFields };
        } else if (Array.isArray(updatedCustomFields)) {
          // Convert array to object
          updatedCustomFields = {};
          (existingOrder.custom_fields as any[]).forEach((cf: any) => {
            if (cf && cf.id) {
              updatedCustomFields[cf.id] = cf.value;
            }
          });
        }
        
        // Merge upfront payment info if provided
        if (upfront_payment_amount !== null && upfront_payment_amount !== undefined) {
          updatedCustomFields.upfront_payment_amount = upfront_payment_amount;
        }
        if (upfront_payment_method !== null && upfront_payment_method !== undefined) {
          updatedCustomFields.upfront_payment_method = upfront_payment_method;
        }
        if (delivery_payment_amount !== null && delivery_payment_amount !== undefined) {
          updatedCustomFields.delivery_payment_amount = delivery_payment_amount;
        }
        
        // Update payment_details if provided
        if (paymentDetails) {
          updatedCustomFields.payment_details = paymentDetails;
        }
        
        // Update the order's custom_fields in the database
        if (JSON.stringify(updatedCustomFields) !== JSON.stringify(existingOrder.custom_fields)) {
          console.log('create-order-on-payment-success: Updating existing order custom_fields with upfront payment info');
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              custom_fields: updatedCustomFields,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingOrder.id);
          
          if (!updateError) {
            existingOrder.custom_fields = updatedCustomFields;
            console.log('create-order-on-payment-success: ✅ Order custom_fields updated with upfront payment info');
          } else {
            console.error('create-order-on-payment-success: Failed to update order custom_fields:', updateError);
          }
        }
        
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
    
    // Extract upfront payment fields from orderData (they're at top level, not in custom_fields yet)
    const { upfront_payment_amount, upfront_payment_method, delivery_payment_amount, ...orderDataWithoutUpfront } = orderData as any;
    
    // Build custom_fields, preserving existing fields and adding upfront payment info
    let baseCustomFields: any = {};
    if (Array.isArray(orderData.custom_fields)) {
      // Convert array format [{id, label, value}] to object for easier access
      orderData.custom_fields.forEach((cf: any) => {
        if (cf && cf.id) {
          baseCustomFields[cf.id] = cf.value;
        }
      });
    } else if (orderData.custom_fields && typeof orderData.custom_fields === 'object') {
      baseCustomFields = { ...orderData.custom_fields };
    }
    
    // Merge with upfront payment fields and other required fields
    orderData.custom_fields = {
      ...baseCustomFields,
      order_access_token: orderAccessToken,
      ...(paymentDetails && { payment_details: paymentDetails }),
      // Preserve upfront payment info in custom_fields (same as create-order function)
      upfront_payment_amount: upfront_payment_amount || null,
      upfront_payment_method: upfront_payment_method || null,
      delivery_payment_amount: delivery_payment_amount || null,
    };

    // ✅ Determine order status based on product types and payment method
    // For EPS/EB Pay (payment collected upfront):
    // - Digital products: 'delivered' (instant delivery)
    // - Physical products: 'processing' (skip pending, start processing)
    const productIds = itemsData.map(item => item.product_id).filter(Boolean);
    console.log('create-order-on-payment-success: Checking product types', {
      productIds,
      itemsCount: itemsData.length,
      sampleItem: itemsData[0]
    });
    
    let hasDigitalProducts = false;
    let hasPhysicalProducts = false;

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, product_type')
        .in('id', productIds);

      console.log('create-order-on-payment-success: Products query result', {
        productIds,
        productsFound: products?.length || 0,
        products: products?.map(p => ({ id: p.id, product_type: p.product_type })),
        error: productsError?.message
      });

      if (productsError) {
        console.error('create-order-on-payment-success: Error fetching products:', productsError);
        // Don't fail the order, but log the error
      }

      if (products && products.length > 0) {
        for (const product of products) {
          console.log('create-order-on-payment-success: Checking product', {
            productId: product.id,
            product_type: product.product_type,
            isDigital: product.product_type === 'digital',
            isPhysical: product.product_type !== 'digital' && product.product_type !== null
          });
          
          if (product.product_type === 'digital') {
            hasDigitalProducts = true;
          } else if (product.product_type !== null && product.product_type !== undefined) {
            // Only mark as physical if product_type is explicitly set (not null/undefined)
            hasPhysicalProducts = true;
          }
        }
      } else {
        console.warn('create-order-on-payment-success: No products found for productIds:', productIds);
      }
    } else {
      console.warn('create-order-on-payment-success: No product IDs found in itemsData');
    }

    console.log('create-order-on-payment-success: Product type analysis', {
      hasDigitalProducts,
      hasPhysicalProducts,
      willSetToDelivered: hasDigitalProducts && !hasPhysicalProducts
    });

    // Set status based on product types
    // If all products are digital, set to 'delivered' (instant delivery)
    // If any product is physical, set to 'processing' (payment collected, ready to process)
    if (hasDigitalProducts && !hasPhysicalProducts) {
      // All digital products - instant delivery
      orderData.status = 'delivered';
      console.log('create-order-on-payment-success: ✅ Order status set to DELIVERED (digital products only)');
    } else {
      // Has physical products - start processing (payment already collected)
      orderData.status = 'processing';
      console.log('create-order-on-payment-success: ⚠️ Order status set to PROCESSING', {
        reason: hasPhysicalProducts ? 'has physical products' : 'no digital products found or query failed',
        hasDigitalProducts,
        hasPhysicalProducts
      });
    }

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

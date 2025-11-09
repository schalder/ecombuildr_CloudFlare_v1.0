import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type OrderItemInput = {
  product_id: string;
  product_name: string;
  product_sku?: string | null;
  price: number;
  quantity: number;
  image?: string | null;
  variation?: Record<string, any> | null;
};

type OrderInput = {
  store_id: string;
  website_id?: string | null;
  funnel_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  shipping_address: string;
  shipping_city?: string | null;
  shipping_area?: string | null;
  shipping_country?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  payment_method: 'cod' | 'bkash' | 'nagad' | 'sslcommerz';
  payment_transaction_number?: string | null;
  notes?: string | null;
  subtotal: number;
  shipping_cost?: number | null;
  discount_amount?: number | null;
  total: number;
  status?: string;
  custom_fields?: Record<string, any>;
  idempotency_key?: string | null;
  ip_address?: string | null;
};

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${Date.now()}-${rand}`;
}

// Generate access token for order
function generateAccessToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

// Extract IP address from request headers
function getClientIP(req: Request): string | null {
  // Check various headers for IP address (in order of preference)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return null;
}

// Validate Bangladeshi phone number format (11 digits, starts with 01)
function isValidBangladeshiPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove any spaces, dashes, or plus signs
  const cleaned = phone.replace(/[\s\-+]/g, '');
  
  // Check if it's exactly 11 digits and starts with 01
  const phoneRegex = /^01[0-9]{9}$/;
  return phoneRegex.test(cleaned);
}

// Check if IP address has placed frequent orders recently
async function checkIPOrderFrequency(
  supabase: any,
  ipAddress: string,
  storeId: string,
  timeWindowHours: number = 24,
  maxOrdersThreshold: number = 3
): Promise<{ isFrequent: boolean; orderCount: number }> {
  if (!ipAddress) {
    return { isFrequent: false, orderCount: 0 };
  }
  
  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - timeWindowHours);
  
  const { data: recentOrders, error, count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: false })
    .eq('store_id', storeId)
    .eq('ip_address', ipAddress)
    .eq('payment_method', 'cod')
    .gte('created_at', timeWindow.toISOString())
    .neq('status', 'cancelled');
  
  if (error) {
    console.error('Error checking IP order frequency:', error);
    // Don't block on error, allow order to proceed
    return { isFrequent: false, orderCount: 0 };
  }
  
  const orderCount = count || recentOrders?.length || 0;
  const isFrequent = orderCount >= maxOrdersThreshold;
  
  return { isFrequent, orderCount };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order, items, storeId }: { order: OrderInput; items: OrderItemInput[]; storeId: string } = await req.json();

    if (!order || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!storeId || !order.store_id || storeId !== order.store_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing or mismatched store id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Service role client to bypass RLS for server-side creation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract IP address from request
    const clientIP = getClientIP(req);
    
    // Fake order detection for COD orders only
    if (order.payment_method === 'cod') {
      const isValidPhone = isValidBangladeshiPhone(order.customer_phone);
      
      if (isValidPhone && clientIP) {
        // Check for frequent orders from same IP
        const ipCheck = await checkIPOrderFrequency(supabase, clientIP, storeId, 24, 3);
        
        if (ipCheck.isFrequent) {
          console.log(`Fake order detected: Valid phone format but frequent orders from IP ${clientIP} (${ipCheck.orderCount} orders in last 24 hours)`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Order cannot be placed. Multiple orders detected from the same location. Please contact support if this is a mistake.' 
            }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      // Optional: Log suspicious patterns (valid phone but no IP or invalid phone)
      if (isValidPhone && !clientIP) {
        console.log('Warning: Valid phone format but no IP address captured');
      }
    }

    // Check for existing order if idempotency key is provided
    if (order.idempotency_key) {
      const { data: existingOrder, error: existingError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId)
        .eq('idempotency_key', order.idempotency_key)
        .single();

      if (!existingError && existingOrder) {
        console.log('create-order: returning existing order for idempotency key', order.idempotency_key);
        const accessToken = existingOrder.custom_fields?.order_access_token || generateAccessToken();
        return new Response(
          JSON.stringify({ success: true, order: { ...existingOrder, access_token: accessToken } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare order insert with safe defaults and status normalization
    const allowedStatuses = new Set(['pending','confirmed','processing','shipped','delivered','cancelled']);
    const defaultStatus = (order.payment_method === 'cod') ? 'pending' : 'processing';
    const incomingStatus = (order.status || '').toLowerCase();
    const safeStatus = allowedStatuses.has(incomingStatus) ? incomingStatus : defaultStatus;

    // Generate access token for public order access
    const accessToken = generateAccessToken();
    
    const toInsert: any = {
      ...order,
      order_number: order && (order as any).order_number ? (order as any).order_number : generateOrderNumber(),
      status: safeStatus,
      discount_amount: order.discount_amount ?? 0,
      shipping_cost: order.shipping_cost ?? 0,
      subtotal: order.subtotal ?? 0,
      total: order.total ?? ((order.subtotal ?? 0) + (order.shipping_cost ?? 0) - (order.discount_amount ?? 0)),
      payment_transaction_number: order.payment_transaction_number ?? null,
      idempotency_key: order.idempotency_key ?? null,
      ip_address: clientIP || order.ip_address || null,
      custom_fields: {
        ...(order.custom_fields || {}),
        order_access_token: accessToken,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1) Insert order
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert(toInsert)
      .select('*')
      .single();

    if (orderError || !createdOrder) {
      console.error('create-order: insert order error', orderError);
      return new Response(JSON.stringify({ success: false, error: orderError?.message || 'Failed to create order' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Insert order items
    const itemsToInsert = items.map((i) => ({
      order_id: createdOrder.id,
      product_id: i.product_id,
      product_name: i.product_name,
      product_sku: i.product_sku ?? null,
      price: i.price,
      quantity: i.quantity,
      total: i.price * i.quantity,
      variation: i.variation ?? null,
      created_at: new Date().toISOString(),
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsError) {
      console.error('create-order: insert items error', itemsError);
      return new Response(JSON.stringify({ success: false, error: itemsError.message || 'Failed to create order items' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Send email notification (don't block order creation if email fails)
    try {
      await supabase.functions.invoke('send-order-email', {
        body: {
          order_id: createdOrder.id,
          store_id: storeId,
          website_id: order.website_id,
          event_type: 'new_order'
        }
      });
      console.log('New order email notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send new order email notification:', emailError);
      // Don't fail the order creation if email fails
    }

    return new Response(
      JSON.stringify({ success: true, order: { ...createdOrder, access_token: accessToken } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('create-order: unexpected error', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
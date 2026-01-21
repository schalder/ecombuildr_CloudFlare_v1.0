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
  payment_method: 'cod' | 'bkash' | 'nagad' | 'sslcommerz' | 'stripe';
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
  upfront_payment_amount?: number | null;
  upfront_payment_method?: string | null;
  delivery_payment_amount?: number | null;
  attribution_source?: string | null;
  attribution_medium?: string | null;
  attribution_campaign?: string | null;
  attribution_data?: Record<string, any> | null;
};

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${Date.now()}-${rand}`;
}

// Generate access token for order
function generateAccessToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

// Normalize IP address (remove port, trim whitespace)
function normalizeIP(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // Remove port if present (e.g., "192.168.1.1:8080" -> "192.168.1.1")
  // Also handle IPv6 addresses with ports
  const trimmed = ip.trim();
  // For IPv4, split by colon and take first part
  // For IPv6, we need to be more careful, but for now just take before last colon if it looks like a port
  if (trimmed.includes(':')) {
    // Check if it's IPv6 (contains multiple colons) or IPv4 with port
    const parts = trimmed.split(':');
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      // Likely IPv4 with port
      return parts[0];
    }
    // For IPv6, return as-is for now (could enhance later)
    return trimmed;
  }
  return trimmed;
}

// Extract IP address from request headers
function getClientIP(req: Request): string | null {
  // Log all available headers for debugging
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log('Available headers for IP extraction:', Object.keys(allHeaders));
  
  // Check various headers for IP address (in order of preference)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    console.log('Extracted IP from x-forwarded-for:', ip);
    return ip;
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    const ip = realIP.trim();
    console.log('Extracted IP from x-real-ip:', ip);
    return ip;
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    const ip = cfConnectingIP.trim();
    console.log('Extracted IP from cf-connecting-ip:', ip);
    return ip;
  }
  
  // Try additional headers
  const clientIP = req.headers.get('x-client-ip');
  if (clientIP) {
    console.log('Extracted IP from x-client-ip:', clientIP);
    return clientIP.trim();
  }
  
  console.log('Warning: No IP address found in request headers');
  return null;
}

// Validate international phone number format
// Supports formats like: +1234567890, +1-234-567-8900, +44 20 1234 5678, etc.
function isValidInternationalPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces, dashes, parentheses, and dots (keep + and digits)
  const cleaned = phone.replace(/[\s\-().]/g, '');
  
  // International phone number regex:
  // - Must start with + followed by country code (1-3 digits)
  // - Then 4-14 more digits (total 7-15 digits after +)
  // OR
  // - Can be 7-15 digits without + (for backward compatibility with local formats)
  const internationalRegex = /^(\+[1-9]\d{6,14}|\d{7,15})$/;
  
  return internationalRegex.test(cleaned);
}

// Legacy function for backward compatibility (deprecated, use isValidInternationalPhone)
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
    console.log('Extracted client IP for order:', clientIP);
    
    // Normalize IPs for comparison
    const normalizedClientIP = normalizeIP(clientIP);
    const normalizedOrderIP = normalizeIP(order.ip_address);
    
    // Track if order should be marked as potential fake
    let isPotentialFake = false;
    
    // Check if IP is blocked before creating order
    // Check both clientIP (from headers) and order.ip_address (from request body)
    const ipsToCheck: string[] = [];
    if (normalizedClientIP) {
      ipsToCheck.push(normalizedClientIP);
    }
    if (normalizedOrderIP && normalizedOrderIP !== normalizedClientIP) {
      ipsToCheck.push(normalizedOrderIP);
    }
    
    if (ipsToCheck.length > 0) {
      // Check each IP against blocked list
      for (const ipToCheck of ipsToCheck) {
        const { data: blockedIP, error: blockedError } = await supabase
          .from('blocked_ips')
          .select('id')
          .eq('store_id', storeId)
          .eq('ip_address', ipToCheck)
          .eq('is_active', true)
          .maybeSingle();
        
        if (blockedError) {
          // Fail-safe: if database check fails, block the order to be safe
          console.error('Error checking blocked IPs:', blockedError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Unable to verify order location. Please contact support if this is a mistake.' 
            }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (blockedIP) {
          console.log(`Order blocked: IP ${ipToCheck} is blocked for store ${storeId}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Order cannot be placed from this location. Please contact support if this is a mistake.' 
            }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }
    
    // Fake order detection for COD orders only
    if (order.payment_method === 'cod') {
      const isValidPhone = isValidInternationalPhone(order.customer_phone);
      
      // Block invalid phone numbers
      if (!isValidPhone) {
        console.log(`Fake order detected: Invalid phone number format - ${order.customer_phone}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid phone number format. Please enter a valid international phone number (e.g., +1234567890, +44 20 1234 5678).' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Check for frequent orders from same IP (mark as potential fake instead of blocking)
      const ipToCheckForFrequency = normalizedClientIP || normalizedOrderIP;
      if (ipToCheckForFrequency) {
        const ipCheck = await checkIPOrderFrequency(supabase, ipToCheckForFrequency, storeId, 24, 3);
        
        if (ipCheck.isFrequent) {
          console.log(`Potential fake order detected: Frequent orders from IP ${ipToCheckForFrequency} (${ipCheck.orderCount} orders in last 24 hours)`);
          isPotentialFake = true;
        }
      }
      
      // Log warning if valid phone but no IP captured
      if (!ipToCheckForFrequency) {
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
    const allowedStatuses = new Set(['pending','confirmed','processing','shipped','delivered','cancelled','payment_failed','pending_payment']);
    
    // ✅ Determine default status based on payment method and product types
    // For EBPay/EPS/Stripe: Use 'pending_payment' (incomplete orders until payment verified)
    // For COD: Digital products = 'delivered', Physical products = 'pending'
    // For other payment methods: Use 'processing' as default
    let defaultStatus = 'processing';
    if (order.payment_method === 'eps' || order.payment_method === 'ebpay' || order.payment_method === 'stripe') {
      defaultStatus = 'pending_payment';
      console.log(`${order.payment_method.toUpperCase()} order: status set to pending_payment (incomplete order)`);
    } else if (order.payment_method === 'cod') {
      defaultStatus = 'pending';
    }
    
    // Check product types if items are provided
    if (items && items.length > 0) {
      const productIds = items.map(i => i.product_id).filter(Boolean);
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
          
          // For COD orders: If all products are digital, set to 'delivered' (instant delivery)
          if (order.payment_method === 'cod' && hasDigitalProducts && !hasPhysicalProducts) {
            defaultStatus = 'delivered';
            console.log('COD order with digital products only: status set to delivered');
          }
        }
      }
    }
    
    const incomingStatus = (order.status || '').toLowerCase();
    // For EBPay/EPS/Stripe, always use 'pending_payment' unless explicitly set to a valid status
    const safeStatus = (order.payment_method === 'eps' || order.payment_method === 'ebpay' || order.payment_method === 'stripe') && !allowedStatuses.has(incomingStatus)
      ? 'pending_payment'
      : (allowedStatuses.has(incomingStatus) ? incomingStatus : defaultStatus);

    // Generate access token for public order access
    const accessToken = generateAccessToken();
    
    // Extract upfront payment fields before spreading order (they should only be in custom_fields, not as columns)
    const { upfront_payment_amount, upfront_payment_method, delivery_payment_amount, ...orderWithoutUpfrontFields } = order as any;
    
    const toInsert: any = {
      ...orderWithoutUpfrontFields,
      order_number: order && (order as any).order_number ? (order as any).order_number : generateOrderNumber(),
      status: safeStatus,
      discount_amount: order.discount_amount ?? 0,
      shipping_cost: order.shipping_cost ?? 0,
      subtotal: order.subtotal ?? 0,
      total: order.total ?? ((order.subtotal ?? 0) + (order.shipping_cost ?? 0) - (order.discount_amount ?? 0)),
      payment_transaction_number: order.payment_transaction_number ?? null,
      idempotency_key: order.idempotency_key ?? null,
      ip_address: normalizedClientIP || normalizedOrderIP || null,
      is_potential_fake: isPotentialFake,
      marked_not_fake: false,
      attribution_source: order.attribution_source || null,
      attribution_medium: order.attribution_medium || null,
      attribution_campaign: order.attribution_campaign || null,
      attribution_data: order.attribution_data || null,
      custom_fields: (() => {
        // Handle both array and object formats for custom_fields
        let baseFields: any = {};
        if (Array.isArray(order.custom_fields)) {
          // Convert array format [{id, label, value}] to object for easier access
          order.custom_fields.forEach((cf: any) => {
            if (cf && cf.id) {
              baseFields[cf.id] = cf.value;
            }
          });
        } else if (order.custom_fields && typeof order.custom_fields === 'object') {
          baseFields = { ...order.custom_fields };
        }
        
        // Merge with upfront payment fields
        return {
          ...baseFields,
          order_access_token: accessToken,
          upfront_payment_amount: upfront_payment_amount || null,
          upfront_payment_method: upfront_payment_method || null,
          delivery_payment_amount: delivery_payment_amount || null,
        };
      })(),
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

    // ✅ Track Purchase event server-side for COD orders
    if (order.payment_method === 'cod') {
      try {
        // Fetch pixel config from website or funnel
        let pixel_id: string | null = null;
        let access_token: string | null = null;
        let test_event_code: string | null = null;

        if (order.website_id) {
          const { data: website } = await supabase
            .from('websites')
            .select('facebook_pixel_id, facebook_access_token, facebook_test_event_code, facebook_server_side_enabled')
            .eq('id', order.website_id)
            .single();

          if (website?.facebook_server_side_enabled && website?.facebook_pixel_id && website?.facebook_access_token) {
            pixel_id = website.facebook_pixel_id;
            access_token = website.facebook_access_token;
            test_event_code = website.facebook_test_event_code;
          }
        }

        if (!pixel_id && order.funnel_id) {
          const { data: funnel } = await supabase
            .from('funnels')
            .select('settings')
            .eq('id', order.funnel_id)
            .single();

          if (funnel?.settings) {
            const settings = funnel.settings as any;
            if (settings.facebook_server_side_enabled && settings.facebook_pixel_id && settings.facebook_access_token) {
              pixel_id = settings.facebook_pixel_id;
              access_token = settings.facebook_access_token;
              test_event_code = settings.facebook_test_event_code || null;
            }
          }
        }

        if (pixel_id && access_token) {
          // Generate event_id for deduplication
          const eventId = `Purchase_${Date.now()}_${createdOrder.id}_${Math.random().toString(36).substring(2, 9)}`;
          
          // Prepare event data
          const eventData = {
            content_ids: items.map(item => item.product_id),
            content_type: 'product',
            value: createdOrder.total,
            currency: 'BDT',
            contents: items.map(item => ({
              id: item.product_id,
              quantity: item.quantity,
              price: item.price,
            })),
          };

          // Prepare user data
          const userData = {
            email: order.customer_email || null,
            phone: order.customer_phone || null,
            firstName: order.customer_name ? order.customer_name.split(' ')[0] : null,
            lastName: order.customer_name && order.customer_name.includes(' ') 
              ? order.customer_name.substring(order.customer_name.indexOf(' ') + 1) 
              : null,
            city: order.shipping_city || null,
            state: order.shipping_state || null,
            zipCode: order.shipping_postal_code || null,
            country: order.shipping_country || null,
          };

          // Call send-facebook-event edge function
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          await fetch(`${supabaseUrl}/functions/v1/send-facebook-event`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              pixel_id,
              access_token,
              event_name: 'Purchase',
              event_data: eventData,
              user_data: userData,
              browser_context: {}, // No browser context for server-side COD orders
              event_id: eventId,
              event_time: Math.floor(Date.now() / 1000),
              test_event_code: test_event_code || null,
            }),
          });
          
          console.log('Purchase event tracked server-side for COD order:', createdOrder.id);
        }
      } catch (purchaseError) {
        console.error('Failed to track Purchase event for COD order:', purchaseError);
        // Don't fail order creation if tracking fails
      }
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
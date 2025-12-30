
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

// CORS headers for web calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

type CreateOrderBody = {
  store_id?: string;
  order_id?: string;
};

function buildRecipientAddress(order: any) {
  const parts = [
    order?.shipping_address,
    order?.shipping_area,
    order?.shipping_city,
    order?.shipping_postal_code,
  ]
    .map((p) => (p || '').toString().trim())
    .filter(Boolean);
  return parts.join(', ');
}

function normalizeBdPhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // If starts with +88, keep it
  if (cleaned.startsWith('+88')) {
    return cleaned;
  }
  // If starts with 88, add +
  if (cleaned.startsWith('88')) {
    return '+' + cleaned;
  }
  // If starts with 01 (local format), add +88
  if (cleaned.startsWith('01')) {
    return '+88' + cleaned;
  }
  // If it's 11 digits starting with 1, assume it's missing the 0
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+880' + cleaned;
  }
  return cleaned;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing Authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { store_id, order_id }: CreateOrderBody = await req.json().catch(() => ({}));
    if (!store_id || !order_id) {
      return new Response(JSON.stringify({ error: 'store_id and order_id are required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Use the caller's JWT so RLS enforces "store owner" access
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1) Load active Steadfast credentials for this store (protected by RLS)
    const { data: account, error: accountErr } = await supabase
      .from('store_shipping_accounts')
      .select('id, api_key, secret_key, is_active')
      .eq('store_id', store_id)
      .eq('provider', 'steadfast')
      .eq('is_active', true)
      .maybeSingle();

    if (accountErr) {
      console.error('Error loading shipping account:', accountErr);
      return new Response(JSON.stringify({ error: 'Failed to load shipping account' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!account?.api_key || !account?.secret_key) {
      return new Response(JSON.stringify({ error: 'Steadfast credentials not configured for this store' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2) Load order details (protected by RLS)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('store_id', store_id)
      .maybeSingle();

    if (orderErr || !order) {
      console.error('Error loading order:', orderErr);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 3) Map order to Steadfast fields and validate phone
    const invoice = order.order_number || order.id;
    const recipient_name = order.customer_name || 'N/A';
    const rawPhone = order.customer_phone || '';
    const recipient_phone = normalizeBdPhone(rawPhone);
    const recipient_address = buildRecipientAddress(order);
    const note = order.notes || null;

    // Validate phone number
    if (!recipient_phone || recipient_phone.length < 11) {
      return new Response(JSON.stringify({ 
        error: 'Invalid phone number format',
        details: 'Phone number must be a valid Bangladesh number (11 digits starting with +88)'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Load order items with product types to filter out digital products
    // Only include physical products that require shipping
    const { data: allItems, error: itemsErr } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        variation,
        price,
        total,
        product_id,
        products(product_type)
      `)
      .eq('order_id', order_id);

    if (itemsErr) {
      console.error('Error loading order items:', itemsErr);
      return new Response(JSON.stringify({ 
        error: 'Failed to load order items',
        details: itemsErr.message
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Filter out digital products - only keep physical products
    const items = Array.isArray(allItems) 
      ? allItems.filter((item: any) => {
          // products is returned as an object or array, handle both
          const product = item.products;
          if (Array.isArray(product) && product.length > 0) {
            return product[0]?.product_type === 'physical';
          }
          if (product && typeof product === 'object') {
            return product.product_type === 'physical';
          }
          // If product type is not available, assume physical (backward compatibility)
          return true;
        })
      : [];

    // Check if there are any physical products to ship
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No physical products to ship',
        details: 'This order contains only digital products which do not require shipping'
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    function formatVariant(variation: any): string {
      try {
        if (!variation) return '';
        const source = variation && typeof variation === 'object' && !Array.isArray(variation) && (variation as any).options
          ? (variation as any).options
          : variation;
        if (source && typeof source === 'object' && !Array.isArray(source)) {
          const entries = Object.entries(source).filter(([_, v]) => v !== undefined && v !== null && v !== '');
          if (!entries.length) return '';
          return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
        }
        if (Array.isArray(source)) {
          return source.map(String).join(', ');
        }
        return String(source);
      } catch {
        return '';
      }
    }

    function nameWithVariant(name: string, variation?: any): string {
      const v = formatVariant(variation);
      return v ? `${name} — ${v}` : name;
    }

    const item_description = Array.isArray(items)
      ? items.map((it: any) => `${nameWithVariant(it.product_name, it.variation)} x${Number(it.quantity || 0)}`).join('; ')
      : null;

    const total_lot = Array.isArray(items)
      ? items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0)
      : 0;

    // Calculate cod_amount based on upfront payment status
    const isCOD = (order.payment_method || 'cod') === 'cod';
    let cod_amount = 0;
    
    if (isCOD) {
      // Extract upfront payment info from custom_fields
      const customFields = order.custom_fields;
      let upfrontAmount: number | null = null;
      let deliveryAmount: number | null = null;
      
      // Handle both array and object formats for custom_fields
      if (Array.isArray(customFields)) {
        const upfrontField = customFields.find((cf: any) => cf.id === 'upfront_payment_amount' || cf.label === 'upfront_payment_amount');
        const deliveryField = customFields.find((cf: any) => cf.id === 'delivery_payment_amount' || cf.label === 'delivery_payment_amount');
        upfrontAmount = upfrontField ? Number(upfrontField.value) : null;
        deliveryAmount = deliveryField ? Number(deliveryField.value) : null;
      } else if (customFields && typeof customFields === 'object') {
        upfrontAmount = (customFields as any).upfront_payment_amount ? Number((customFields as any).upfront_payment_amount) : null;
        deliveryAmount = (customFields as any).delivery_payment_amount ? Number((customFields as any).delivery_payment_amount) : null;
      }
      
      // If shipping was collected upfront, use delivery_payment_amount (product price only)
      // Otherwise, use order.total (product price + shipping)
      if (upfrontAmount && upfrontAmount > 0 && deliveryAmount !== null && deliveryAmount >= 0) {
        // Shipping collected upfront, so only collect product price on delivery
        cod_amount = deliveryAmount;
      } else {
        // Shipping not collected upfront, so collect full amount (product + shipping)
        cod_amount = Number(order.total || 0);
      }
    }

    const payload = {
      invoice,
      recipient_name,
      recipient_phone,
      recipient_address,
      cod_amount,
      note,
      delivery_type: 0, // default to home delivery
      // optional fields: alternative_phone, recipient_email, item_description, total_lot
      item_description,
      total_lot,
    };

    console.log('Steadfast create_order payload:', payload);
    console.log('Steadfast order details:', {
      order_id: order.id,
      payment_method: order.payment_method,
      order_total: order.total,
      order_subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      custom_fields: order.custom_fields,
      cod_amount,
      physical_items_count: items?.length || 0
    });

    // 4) Call Steadfast API
    const resp = await fetch('https://portal.packzy.com/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': account.api_key,
        'Secret-Key': account.secret_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const respText = await resp.text();
    let respJson: any;
    try {
      respJson = JSON.parse(respText);
    } catch {
      respJson = { raw: respText };
    }

    // 5) Persist shipment record regardless of success/failure
    const provider = 'steadfast';
    const success =
      resp.ok && respJson && typeof respJson.status !== 'undefined' && Number(respJson.status) === 200;

    if (success) {
      const consignment = respJson?.consignment || {};
      const insertRes = await supabase.from('courier_shipments').insert({
        store_id,
        order_id,
        provider,
        invoice: consignment.invoice || invoice,
        consignment_id: String(consignment.consignment_id || ''),
        tracking_code: consignment.tracking_code || null,
        status: consignment.status || 'in_review',
        request_payload: payload,
        response_payload: respJson,
        error: null,
      });

      if (insertRes.error) {
        console.error('Failed to insert courier_shipments on success:', insertRes.error);
      }

      // Update order with courier info and set a meaningful status
      const tracking = consignment.tracking_code || consignment.consignment_id || null;
      const updRes = await supabase
        .from('orders')
        .update({
          courier_name: 'steadfast',
          tracking_number: tracking,
          status: 'shipped',
        })
        .eq('id', order_id)
        .eq('store_id', store_id);

      if (updRes.error) {
        console.error('Failed to update order with courier info:', updRes.error);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: respJson?.message || 'Consignment created',
          consignment: consignment,
        }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      const insertRes = await supabase.from('courier_shipments').insert({
        store_id,
        order_id,
        provider,
        invoice,
        consignment_id: null,
        tracking_code: null,
        status: 'error',
        request_payload: payload,
        response_payload: respJson,
        error: `Steadfast error (HTTP ${resp.status}): ${respText?.slice(0, 500)}`,
      });

      if (insertRes.error) {
        console.error('Failed to insert courier_shipments on error:', insertRes.error);
      }

      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Failed to create consignment',
          details: respJson,
        }),
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

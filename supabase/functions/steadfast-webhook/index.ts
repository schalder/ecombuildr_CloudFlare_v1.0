import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1];
  return null;
}

function mapStatusToOrder(raw: string): 'shipped' | 'delivered' | 'cancelled' | null {
  const s = (raw || '').toLowerCase();
  if (!s) return null;
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('cancel') || s.includes('rto') || s.includes('return')) return 'cancelled';
  // default progression when we receive a tracking update
  return 'shipped';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: any = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    const providedToken = getBearerToken(authHeader);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Identify shipment by consignment_id first, then invoice
    const consignment_id = String(
      body.consignment_id || body.consignment || body.tracking_id || body.customer_tracking_id || body.tracking_code || ''
    ).trim();
    const invoice = String(body.invoice || body.invoice_no || body.merchant_order_id || '').trim();

    if (!consignment_id && !invoice) {
      return new Response(JSON.stringify({ error: 'Missing consignment_id or invoice' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let shipment: any = null;
    {
      const { data: s1, error: e1 } = await supabase
        .from('courier_shipments')
        .select('id, store_id, order_id, website_id')
        .eq('provider', 'steadfast')
        .eq('consignment_id', consignment_id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (e1) console.error('Lookup by consignment_id error', e1);
      if (s1 && s1.length) shipment = s1[0];
    }

    if (!shipment && invoice) {
      const { data: s2, error: e2 } = await supabase
        .from('courier_shipments')
        .select('id, store_id, order_id, website_id')
        .eq('provider', 'steadfast')
        .eq('invoice', invoice)
        .order('created_at', { ascending: false })
        .limit(1);
      if (e2) console.error('Lookup by invoice error', e2);
      if (s2 && s2.length) shipment = s2[0];
    }

    if (!shipment) {
      return new Response(JSON.stringify({ error: 'Shipment not found for webhook' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const store_id = shipment.store_id;
    const order_id = shipment.order_id;
    const website_id = shipment.website_id;

    // Fetch expected token from store settings (webhook_token) or fallback to api_key
    const { data: account, error: accountErr } = await supabase
      .from('store_shipping_accounts')
      .select('settings, api_key, is_active')
      .eq('store_id', store_id)
      .eq('provider', 'steadfast')
      .eq('is_active', true)
      .maybeSingle();

    if (accountErr || !account) {
      console.error('Webhook: shipping account missing', accountErr);
      return new Response(JSON.stringify({ error: 'Account not found' }), { status: 400, headers: corsHeaders });
    }

    const expected = (account.settings && (account.settings as any).webhook_token) || account.api_key;
    if (!providedToken || providedToken !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), { status: 401, headers: corsHeaders });
    }

    const rawStatus: string = String(
      body.status || body.current_status || body.delivery_status || body.status_name || ''
    );
    const event_type: string = String(body.notification_type || body.event || 'status_update');
    const message: string = String(body.message || body.remarks || body.note || '');

    // Update shipment status and last payload snapshot
    const { error: updShipErr } = await supabase
      .from('courier_shipments')
      .update({ status: rawStatus, response_payload: body })
      .eq('id', shipment.id);
    if (updShipErr) console.error('Failed to update shipment from webhook:', updShipErr);

    // Insert event log (best-effort)
    await supabase.from('courier_shipment_events').insert({
      store_id,
      order_id,
      shipment_id: shipment.id,
      provider: 'steadfast',
      consignment_id: consignment_id || null,
      invoice: invoice || null,
      event_type,
      status: rawStatus || null,
      message: message || null,
      payload: body,
    });

    // Progress order status
    const mapped = mapStatusToOrder(rawStatus);
    if (mapped) {
      // fetch current status to avoid regressions
      const { data: ord } = await supabase.from('orders').select('status').eq('id', order_id).maybeSingle();
      const current = (ord?.status as string | undefined) || 'pending';

      let next: 'shipped' | 'delivered' | 'cancelled' | null = null;
      if (mapped === 'delivered') {
        next = current === 'delivered' ? null : 'delivered';
      } else if (mapped === 'cancelled') {
        // don't override delivered
        next = current === 'delivered' ? null : 'cancelled';
      } else if (mapped === 'shipped') {
        // move forward from pending/processing
        next = current === 'pending' || current === 'processing' ? 'shipped' : null;
      }

      if (next) {
        const { error: updOrderErr } = await supabase
          .from('orders')
          .update({ status: next })
          .eq('id', order_id)
          .eq('store_id', store_id);
        if (updOrderErr) {
          console.error('Failed to update order from webhook:', updOrderErr);
        } else {
          console.log(`Order ${order_id} status updated to: ${next}`);
          
          // Send cancellation email if order is cancelled
          if (next === 'cancelled') {
            try {
              await supabase.functions.invoke('send-order-email', {
                body: {
                  order_id: order_id,
                  store_id: store_id,
                  website_id: website_id,
                  event_type: 'order_cancelled'
                }
              });
              console.log('Order cancellation email sent successfully');
            } catch (emailError) {
              console.error('Failed to send cancellation email:', emailError);
            }
          }

          // Check for low stock after order delivery
          if (next === 'delivered') {
            try {
              // Fetch order items with product details to check for low stock
              const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                  product_id,
                  products!inner(
                    id,
                    name,
                    inventory_quantity,
                    track_inventory,
                    store_id
                  )
                `)
                .eq('order_id', order_id);

              if (!itemsError && orderItems) {
                for (const item of orderItems) {
                  const product = item.products;
                  if (product.track_inventory && product.inventory_quantity <= 5) {
                    try {
                      await supabase.functions.invoke('send-low-stock-email', {
                        body: {
                          store_id: product.store_id,
                          product_id: product.id
                        }
                      });
                      console.log(`Low stock email sent for product: ${product.name}`);
                    } catch (lowStockError) {
                      console.error('Failed to send low stock email:', lowStockError);
                    }
                  }
                }
              }
            } catch (stockCheckError) {
              console.error('Error checking stock levels:', stockCheckError);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
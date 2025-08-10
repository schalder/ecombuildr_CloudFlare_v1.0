// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY,
    } = Deno.env.toObject();

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), { status: 400, headers: corsHeaders });
    }

    // Fetch the order to validate ownership
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, store_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: corsHeaders });
    }

    // Validate the caller owns the store
    const { data: store, error: storeError } = await adminClient
      .from('stores')
      .select('id, owner_id')
      .eq('id', order.store_id)
      .single();

    if (storeError || !store || store.owner_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Delete order (let FK cascade handle items if configured). If not, delete items first safely.
    // Attempt direct delete first
    const { error: deleteOrderError } = await adminClient
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteOrderError) {
      // Fallback: delete order_items then order
      await adminClient.from('order_items').delete().eq('order_id', orderId);
      const { error: deleteOrderError2 } = await adminClient
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (deleteOrderError2) {
        return new Response(JSON.stringify({ error: deleteOrderError2.message }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('delete-order error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
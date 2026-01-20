import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface UpdateOrderStatusRequest {
  orderId: string;
  status: 'payment_failed' | 'cancelled' | 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'pending_payment' | 'hold';
  storeId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, status, storeId }: UpdateOrderStatusRequest = await req.json();

    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ error: 'orderId and status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build update query
    let updateQuery = supabase
      .from('orders')
      .update({ 
        status: status as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Add storeId filter if provided for additional security
    if (storeId) {
      updateQuery = updateQuery.eq('store_id', storeId);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      console.error('Error updating order status:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, order: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Update order status error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


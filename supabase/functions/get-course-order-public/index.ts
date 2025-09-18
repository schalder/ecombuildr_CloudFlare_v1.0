import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('course_orders')
      .select(`
        *,
        courses (
          title,
          description,
          thumbnail_url
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching course order:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ order: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For completed orders, get member account details if they exist
    let memberCredentials = null;
    if (data.payment_status === 'completed') {
      const { data: memberData } = await supabase
        .from('member_accounts')
        .select('email')
        .eq('store_id', data.store_id)
        .eq('email', data.customer_email)
        .maybeSingle();

      if (memberData) {
        memberCredentials = {
          email: data.customer_email,
          password: data.metadata?.member_password || null
        };
      }
    }

    const orderWithCredentials = {
      ...data,
      memberCredentials
    };

    return new Response(JSON.stringify({ order: orderWithCredentials }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('get-course-order-public error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

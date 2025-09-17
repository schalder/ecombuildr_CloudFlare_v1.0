import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoursePaymentRequest {
  orderId: string;
  paymentMethod: string;
  paymentId?: string;
  transactionId?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentMethod, paymentId, transactionId }: CoursePaymentRequest = await req.json();

    console.log('Processing course payment:', { orderId, paymentMethod, paymentId });

    // Get the course order
    const { data: order, error: orderError } = await supabase
      .from('course_orders')
      .select('*, courses(title)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment based on method
    let paymentStatus = 'failed';
    
    if (paymentMethod === 'eps' && paymentId) {
      // For EPS, payment verification is handled by the EPS webhook
      // This endpoint mainly handles manual confirmations
      paymentStatus = 'completed';
    } else if (paymentMethod === 'bkash' && transactionId) {
      // For bKash, we can verify the transaction
      paymentStatus = 'pending'; // Manual approval required
    } else if (paymentMethod === 'nagad' && transactionId) {
      // For Nagad, we can verify the transaction
      paymentStatus = 'pending'; // Manual approval required
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('course_orders')
      .update({
        payment_status: paymentStatus,
        metadata: {
          ...order.metadata,
          payment_id: paymentId,
          transaction_id: transactionId,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Course payment processed successfully:', { orderId, paymentStatus });

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentStatus,
        message: paymentStatus === 'completed' ? 'Payment successful' : 'Payment pending approval'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Course payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
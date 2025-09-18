import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseCheckoutRequest {
  courseId: string;
  storeId: string;
  paymentMethod: string;
  customerData: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
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
    const { courseId, storeId, paymentMethod, customerData, amount }: CourseCheckoutRequest = await req.json();

    console.log('Course checkout request:', { courseId, storeId, paymentMethod, amount });

    // Validate input
    if (!courseId || !storeId || !paymentMethod || !customerData || amount === undefined) {
      throw new Error('Missing required fields');
    }

    // Generate order number
    const orderNumber = `CO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create course order
    const { data: orderData, error: orderError } = await supabase
      .from('course_orders')
      .insert({
        store_id: storeId,
        course_id: courseId,
        order_number: orderNumber,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        total: amount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'eps' ? 'pending' : 'pending_manual'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating course order:', orderError);
      throw new Error('Failed to create course order');
    }

    console.log('Course order created:', orderData.id);

    // Handle different payment methods
    if (paymentMethod === 'eps') {
      // Call EPS payment
      try {
        const originHeader = req.headers.get('origin');
        const referer = req.headers.get('referer');
        let redirectOrigin = originHeader || '';
        if (!redirectOrigin && referer) {
          try { redirectOrigin = new URL(referer).origin; } catch { /* ignore */ }
        }

        const { data: epsResponse, error: epsError } = await supabase.functions.invoke('eps-payment', {
          body: {
            orderId: orderData.id,
            amount: amount,
            storeId: storeId,
            customerData: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.phone, // Fallback address for courses
              city: 'Dhaka', // Default city
              country: 'BD'
            },
            redirectOrigin
          }
        });

        if (epsError) {
          console.error('EPS payment error:', epsError);
          throw new Error('EPS payment failed');
        }

        if (epsResponse && epsResponse.paymentURL) {
          return new Response(JSON.stringify({
            success: true,
            paymentURL: epsResponse.paymentURL,
            orderId: orderData.id
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } catch (epsError) {
        console.error('EPS integration error:', epsError);
        // Continue with manual flow as fallback
      }
    }

    // For manual payment methods (bKash, Nagad) or EPS fallback
    let message = '';
    
    if (paymentMethod === 'bkash') {
      message = 'Order created! Please complete payment via bKash and wait for approval.';
    } else if (paymentMethod === 'nagad') {
      message = 'Order created! Please complete payment via Nagad and wait for approval.';
    } else {
      message = 'Order created! Please wait for payment processing.';
    }

    return new Response(JSON.stringify({
      success: true,
      message: message,
      orderId: orderData.id,
      orderNumber: orderData.order_number
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Course checkout error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Course checkout failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
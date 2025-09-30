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
    password: string;
  };
  amount: number;
  isNewStudent: boolean;
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
    const { courseId, storeId, paymentMethod, customerData, amount, isNewStudent }: CourseCheckoutRequest = await req.json();

    console.log('Course checkout request:', { courseId, storeId, paymentMethod, amount, isNewStudent });

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
        payment_status: (paymentMethod === 'eps' || paymentMethod === 'ebpay') ? 'pending' : 'pending_manual'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating course order:', orderError);
      throw new Error('Failed to create course order');
    }

    console.log('Course order created:', orderData.id);

    // Handle free courses
    if (amount === 0 || paymentMethod === 'free') {
      try {
        // Create member account for free course
        const { data: memberId, error: memberError } = await supabase.rpc('create_member_account_with_password', {
          p_store_id: storeId,
          p_email: customerData.email,
          p_password: customerData.password,
          p_full_name: customerData.name,
          p_phone: customerData.phone,
          p_course_order_id: orderData.id
        });

        if (memberError) {
          console.error('Error creating member account for free course:', memberError);
          throw new Error('Failed to create account');
        }

        console.log('Member account created for free course:', memberId);
        
        // Grant course access immediately for free courses
        const { error: accessError } = await supabase.rpc('grant_course_access', {
          p_member_account_id: memberId,
          p_course_id: courseId,
          p_course_order_id: orderData.id
        });

        if (accessError) {
          console.error('Error granting course access for free course:', accessError);
          throw new Error('Failed to grant course access');
        }

        console.log('Course access granted for free course');

        // Update order status to completed for free courses
        const { error: updateError } = await supabase
          .from('course_orders')
          .update({ 
            payment_status: 'completed',
            status: 'completed'
          })
          .eq('id', orderData.id);

        if (updateError) {
          console.error('Error updating free course order status:', updateError);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Successfully enrolled in the free course!',
          orderId: orderData.id,
          orderNumber: orderData.order_number,
          memberAccountId: memberId
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      } catch (error: any) {
        console.error('Free course enrollment error:', error);
        throw new Error(`Free course enrollment failed: ${error.message}`);
      }
    }

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
    } else if (paymentMethod === 'ebpay') {
      // Call EB Pay payment
      try {
        const originHeader = req.headers.get('origin');
        const referer = req.headers.get('referer');
        let redirectOrigin = originHeader || '';
        if (!redirectOrigin && referer) {
          try { redirectOrigin = new URL(referer).origin; } catch { /* ignore */ }
        }

        const { data: ebpayResponse, error: ebpayError } = await supabase.functions.invoke('ebpay-payment', {
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

        if (ebpayError) {
          console.error('EB Pay payment error:', ebpayError);
          throw new Error('EB Pay payment failed');
        }

        if (ebpayResponse && ebpayResponse.paymentURL) {
          return new Response(JSON.stringify({
            success: true,
            paymentURL: ebpayResponse.paymentURL,
            orderId: orderData.id
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } catch (ebpayError) {
        console.error('EB Pay integration error:', ebpayError);
        // Continue with manual flow as fallback
      }
    }

    // For manual payment methods (bKash, Nagad) or EPS fallback
    let message = '';
    
    // Create member account for manual payments if new student
    if (paymentMethod !== 'eps' && paymentMethod !== 'ebpay' && isNewStudent && customerData.password) {
      try {
        const { data: memberId, error: memberError } = await supabase.rpc('create_member_account_with_password', {
          p_store_id: storeId,
          p_email: customerData.email,
          p_password: customerData.password,
          p_full_name: customerData.name,
          p_phone: customerData.phone,
          p_course_order_id: orderData.id
        });

        if (memberError) {
          console.error('Error creating member account:', memberError);
        } else {
          console.log('Member account created:', memberId);
          
          // Grant course access for completed manual payments
          const { error: accessError } = await supabase.rpc('grant_course_access', {
            p_member_account_id: memberId,
            p_course_id: courseId,
            p_course_order_id: orderData.id
          });

          if (accessError) {
            console.error('Error granting course access:', accessError);
          } else {
            console.log('Course access granted for manual payment');
          }
        }
      } catch (error) {
        console.error('Member account creation error:', error);
      }
    }
    
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
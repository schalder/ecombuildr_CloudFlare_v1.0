// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  orderId: string;
  transactionId: string;
  method: string;
  password?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, transactionId, method, password }: VerifyPaymentRequest = await req.json();
    console.log('EB Pay Verify Payment Request:', { orderId, transactionId, method, hasPassword: !!password });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch course order data
    const { data: courseOrder, error: orderError } = await supabase
      .from('course_orders')
      .select(`
        *,
        courses (
          id,
          title,
          store_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !courseOrder) {
      console.error('Course order fetch error:', orderError);
      throw new Error('Order not found');
    }

    console.log('Course order fetched:', { 
      orderId: courseOrder.id, 
      status: courseOrder.payment_status,
      paymentMethod: courseOrder.payment_method 
    });

    // Call EB Pay verification function
    const verificationResult = await verifyEBPayPayment(transactionId, courseOrder.courses.store_id, supabase);
    console.log('EB Pay verification result:', verificationResult);

    // Update course order based on verification result
    const updateData = {
      payment_status: verificationResult,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('course_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update course order:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log('Course order updated:', { orderId, newStatus: verificationResult });

    // If payment is successful, create member account and grant access
    if (verificationResult === 'completed') {
      try {
        console.log('Creating member account for successful payment...');
        
        // Create member account
        const { data: memberAccount, error: memberError } = await supabase.rpc('create_member_account_with_password', {
          p_store_id: courseOrder.courses.store_id,
          p_email: courseOrder.customer_email,
          p_password: password,
          p_full_name: courseOrder.customer_name,
          p_phone: courseOrder.customer_phone,
          p_course_order_id: courseOrder.id
        });

        if (memberError) {
          console.error('Failed to create member account:', memberError);
          throw new Error('Failed to create member account');
        }

        console.log('Member account created:', { memberAccountId: memberAccount });

        // Grant course access
        const { error: accessError } = await supabase.rpc('grant_course_access', {
          p_member_account_id: memberAccount,
          p_course_id: courseOrder.course_id,
          p_course_order_id: courseOrder.id
        });

        if (accessError) {
          console.error('Failed to grant course access:', accessError);
          throw new Error('Failed to grant course access');
        }

        console.log('Course access granted successfully');

      } catch (error) {
        console.error('Error in post-payment processing:', error);
        // Don't fail the verification, but log the error
        console.error('Post-payment processing failed, but payment was verified');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: verificationResult === 'completed',
        status: verificationResult,
        message: verificationResult === 'completed' ? 'Payment verified successfully' : 'Payment verification failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EB Pay verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment verification failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// EB Pay verification function
async function verifyEBPayPayment(transactionId: string, storeId: string, supabase: any): Promise<string> {
  try {
    console.log('Verifying EB Pay payment:', { transactionId, storeId });

    // Get EB Pay configuration for the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.ebpay) {
      console.error('EB Pay config not found:', storeError);
      throw new Error('EB Pay configuration not found');
    }

    const ebpayConfig = store.settings.ebpay;
    
    // Validate required configuration for verification
    if (!ebpayConfig.brand_key || !ebpayConfig.api_key || !ebpayConfig.secret_key) {
      console.error('Missing EB Pay credentials for verification:', {
        hasBrandKey: !!ebpayConfig.brand_key,
        hasApiKey: !!ebpayConfig.api_key,
        hasSecretKey: !!ebpayConfig.secret_key
      });
      throw new Error('EB Pay credentials not configured for verification');
    }
    
    console.log('Using EB Pay config for verification');

    // Verify payment with EB Pay API
    const verifyResponse = await fetch('https://pay.ecombuildr.com/verify/api/payment/verify', {
      method: 'POST',
      headers: {
        'BRAND-KEY': ebpayConfig.brand_key,
        'API-KEY': ebpayConfig.api_key,
        'SECRET-KEY': ebpayConfig.secret_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_id: transactionId
      }),
    });

    const verifyResult = await verifyResponse.json();
    console.log('EB Pay verify response:', { 
      status: verifyResponse.status,
      resultStatus: verifyResult.status,
      hasTransactionId: !!verifyResult.transaction_id 
    });

    // Return appropriate status based on EB Pay response
    if (verifyResult.status === 'COMPLETED') {
      return 'completed';
    } else if (verifyResult.status === 'PENDING') {
      return 'pending';
    } else {
      return 'failed';
    }

  } catch (error) {
    console.error('EB Pay API verification error:', error);
    return 'failed';
  }
}
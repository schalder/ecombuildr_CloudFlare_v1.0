// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface PlatformEBPayPaymentRequest {
  userId: string;
  planName: string;
  planPrice: number;
  customerData: {
    name: string;
    email: string;
    phone?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { userId, planName, planPrice, customerData }: PlatformEBPayPaymentRequest = await req.json();
    console.log('Platform EB Pay Payment Request:', { 
      userId, 
      planName, 
      planPrice,
      customerEmail: customerData.email
    });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get platform-level EB Pay configuration
    const { data: paymentOption, error: configError } = await supabase
      .from('platform_payment_options')
      .select('*')
      .eq('provider', 'ebpay')
      .eq('is_enabled', true)
      .single();

    if (configError || !paymentOption) {
      console.error('EB Pay configuration not found:', configError);
      throw new Error('EB Pay is not enabled for platform payments');
    }

    // Parse EB Pay credentials from account_number field (stored as JSON)
    let ebpayConfig;
    try {
      ebpayConfig = typeof paymentOption.account_number === 'string' 
        ? JSON.parse(paymentOption.account_number)
        : paymentOption.account_number;
    } catch (e) {
      console.error('Failed to parse EB Pay config:', e);
      throw new Error('Invalid EB Pay configuration');
    }

    // Validate required credentials
    if (!ebpayConfig?.brand_key || !ebpayConfig?.api_key || !ebpayConfig?.secret_key) {
      console.error('EB Pay credentials missing');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'EB Pay credentials not configured' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('EB Pay Config loaded for platform payments');

    // Create subscription record first
    const subscriptionData = {
      user_id: userId,
      plan_name: planName,
      plan_price_bdt: planPrice,
      payment_method: 'ebpay',
      subscription_status: 'pending',
      payment_reference: '', // Will be updated after verification
    };

    const { data: subscription, error: subError } = await supabase
      .from('saas_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subError || !subscription) {
      console.error('Failed to create subscription:', subError);
      throw new Error('Failed to create subscription record');
    }

    console.log('Subscription record created:', subscription.id);

    // Determine redirect URLs
    const originBase = req.headers.get('origin') || 'https://ecombuildr.com';
    
    // Prepare EB Pay payment request data
    const paymentData = {
      success_url: `${originBase}/payment-success?subscriptionId=${subscription.id}&status=success&pm=ebpay`,
      cancel_url: `${originBase}/payment-failed?subscriptionId=${subscription.id}&status=failed&pm=ebpay`,
      amount: planPrice.toString(),
      cus_name: customerData.name || '',
      cus_email: customerData.email || '',
      cus_phone: customerData.phone || '',
      meta_data: { 
        subscription_id: subscription.id,
        user_id: userId,
        plan_name: planName,
        payment_type: 'platform_subscription',
        customer_name: customerData.name,
        customer_email: customerData.email,
      }
    };

    console.log('EB Pay payment request prepared for subscription:', subscription.id);

    // Make payment creation request to EB Pay
    const paymentResponse = await fetch('https://pay.ecombuildr.com/verify/api/payment/create', {
      method: 'POST',
      headers: {
        'BRAND-KEY': ebpayConfig.brand_key,
        'API-KEY': ebpayConfig.api_key,
        'SECRET-KEY': ebpayConfig.secret_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();

    console.log('EB Pay Payment Response:', { 
      status: paymentResponse.status,
      hasPaymentUrl: !!paymentResult.payment_url,
      resultStatus: paymentResult.status
    });

    if (!paymentResult.status || !paymentResult.payment_url) {
      // Delete the pending subscription if payment creation failed
      await supabase
        .from('saas_subscriptions')
        .delete()
        .eq('id', subscription.id);
      
      throw new Error(paymentResult.message || 'Payment session creation failed');
    }

    // Update subscription with transaction reference
    if (paymentResult.transaction_id) {
      await supabase
        .from('saas_subscriptions')
        .update({ payment_reference: paymentResult.transaction_id })
        .eq('id', subscription.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: paymentResult.payment_url,
        subscriptionId: subscription.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Platform EB Pay payment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment initiation failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

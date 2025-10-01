// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  subscriptionId: string;
  transactionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, transactionId }: VerifyPaymentRequest = await req.json();
    console.log('Platform EB Pay Verify Request:', { subscriptionId, transactionId });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch subscription data
    const { data: subscription, error: subError } = await supabase
      .from('saas_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Subscription fetch error:', subError);
      throw new Error('Subscription not found');
    }

    console.log('Subscription fetched:', { 
      id: subscription.id, 
      status: subscription.subscription_status,
      userId: subscription.user_id
    });

    // Use transaction ID from request or from subscription record
    const txnId = transactionId || subscription.payment_reference;
    if (!txnId) {
      throw new Error('Transaction ID not found');
    }

    // Get platform EB Pay configuration
    const { data: paymentOption, error: configError } = await supabase
      .from('platform_payment_options')
      .select('*')
      .eq('provider', 'ebpay')
      .eq('is_enabled', true)
      .single();

    if (configError || !paymentOption) {
      console.error('EB Pay configuration not found:', configError);
      throw new Error('EB Pay configuration not found');
    }

    // Parse EB Pay credentials
    let ebpayConfig;
    try {
      ebpayConfig = typeof paymentOption.account_number === 'string' 
        ? JSON.parse(paymentOption.account_number)
        : paymentOption.account_number;
    } catch (e) {
      console.error('Failed to parse EB Pay config:', e);
      throw new Error('Invalid EB Pay configuration');
    }

    // Validate credentials
    if (!ebpayConfig?.brand_key || !ebpayConfig?.api_key || !ebpayConfig?.secret_key) {
      throw new Error('EB Pay credentials not configured');
    }

    console.log('Verifying EB Pay payment with transaction ID:', txnId);

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
        transaction_id: txnId
      }),
    });

    const verifyResult = await verifyResponse.json();
    console.log('EB Pay verify response:', { 
      status: verifyResponse.status,
      resultStatus: verifyResult.status
    });

    // Determine payment status
    let paymentStatus = 'failed';
    if (verifyResult.status === 'COMPLETED') {
      paymentStatus = 'completed';
    } else if (verifyResult.status === 'PENDING') {
      paymentStatus = 'pending';
    }

    // Update subscription status
    const updateData: any = {
      subscription_status: paymentStatus === 'completed' ? 'active' : 'cancelled',
      payment_reference: txnId,
      updated_at: new Date().toISOString(),
    };

    // If payment is completed, set subscription dates
    if (paymentStatus === 'completed') {
      updateData.starts_at = new Date().toISOString();
      updateData.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    } else {
      // For failed/cancelled payments, mark as cancelled so it doesn't affect user profile
      console.log('Payment failed/cancelled, marking subscription as cancelled');
    }

    const { error: updateError } = await supabase
      .from('saas_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      throw new Error('Failed to update subscription status');
    }

    console.log('Subscription updated:', { subscriptionId, status: updateData.subscription_status });

    // If payment is successful, auto-upgrade user account
    if (paymentStatus === 'completed') {
      try {
        console.log('Auto-upgrading user account...');

        // Check if plan name is valid
        const validPlans = ['free', 'pro_monthly', 'pro_yearly', 'reseller', 'starter', 'professional', 'enterprise'];
        const planName = validPlans.includes(subscription.plan_name) ? subscription.plan_name : 'starter';

        // Update user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: planName,
            account_status: 'active',
            subscription_expires_at: updateData.expires_at,
            // Clear trial dates when user upgrades
            trial_expires_at: null,
            trial_started_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.user_id);

        if (profileError) {
          console.error('Failed to update user profile:', profileError);
          throw new Error('Failed to upgrade user account');
        }

        console.log('User account upgraded successfully:', { userId: subscription.user_id, plan: planName });

      } catch (error) {
        console.error('Error in account upgrade:', error);
        // Don't fail the verification, but log the error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: paymentStatus === 'completed',
        status: paymentStatus,
        message: paymentStatus === 'completed' ? 'Payment verified and account upgraded' : 'Payment verification failed',
        subscription: {
          id: subscription.id,
          status: updateData.subscription_status,
          expiresAt: updateData.expires_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Platform EB Pay verification error:', error);
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

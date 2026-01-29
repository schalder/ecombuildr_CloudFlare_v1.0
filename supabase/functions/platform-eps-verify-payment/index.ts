// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/crypto.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  subscriptionId: string;
  transactionId?: string;
}

// Helper function to generate HMAC-SHA512 hash for EPS API
async function generateHash(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  return encodeBase64(new Uint8Array(signature));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, transactionId }: VerifyPaymentRequest = await req.json();
    console.log('Platform EPS Verify Request:', { subscriptionId, transactionId });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscription, error: subError } = await supabase
      .from('saas_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Subscription fetch error:', subError);
      throw new Error('Subscription not found');
    }

    const txnId = transactionId || subscription.payment_reference;
    if (!txnId) {
      throw new Error('Transaction ID not found');
    }

    const { data: paymentOption, error: configError } = await supabase
      .from('platform_payment_options')
      .select('*')
      .eq('provider', 'eps')
      .eq('is_enabled', true)
      .single();

    if (configError || !paymentOption) {
      console.error('EPS configuration not found:', configError);
      throw new Error('EPS configuration not found');
    }

    let epsConfig;
    try {
      epsConfig = typeof paymentOption.account_number === 'string'
        ? JSON.parse(paymentOption.account_number)
        : paymentOption.account_number;
    } catch (e) {
      console.error('Failed to parse EPS config:', e);
      throw new Error('Invalid EPS configuration');
    }

    if (!epsConfig?.merchant_id || !epsConfig?.store_id || !epsConfig?.username || !epsConfig?.password || !epsConfig?.hash_key) {
      throw new Error('EPS credentials not configured');
    }

    const baseUrl = epsConfig?.is_live ? 'https://pgapi.eps.com.bd' : 'https://sandboxpgapi.eps.com.bd';

    // Token
    const userNameHash = await generateHash(epsConfig.username, epsConfig.hash_key);
    const tokenResponse = await fetch(`${baseUrl}/v1/Auth/GetToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-hash': userNameHash,
      },
      body: JSON.stringify({
        userName: epsConfig.username,
        password: epsConfig.password,
      }),
    });

    const tokenResult = await tokenResponse.json();
    if (!tokenResult.token) {
      throw new Error(tokenResult.errorMessage || 'Failed to get EPS authentication token');
    }

    const merchantTransactionHash = await generateHash(txnId, epsConfig.hash_key);
    const verifyResponse = await fetch(
      `${baseUrl}/v1/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${txnId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenResult.token}`,
          'x-hash': merchantTransactionHash,
        },
      }
    );

    const verifyResult = await verifyResponse.json();
    const isSuccess = verifyResult.Status === 'Success';
    const paymentStatus = isSuccess ? 'completed' : 'failed';

    const updateData: any = {
      subscription_status: isSuccess ? 'active' : 'cancelled',
      payment_reference: txnId,
      updated_at: new Date().toISOString(),
    };

    if (isSuccess) {
      updateData.starts_at = new Date().toISOString();
      updateData.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from('saas_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      throw new Error('Failed to update subscription status');
    }

    if (isSuccess) {
      try {
        const validPlans = ['free', 'pro_monthly', 'pro_yearly', 'reseller', 'starter', 'professional', 'enterprise'];
        const planName = validPlans.includes(subscription.plan_name) ? subscription.plan_name : 'starter';

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: planName,
            account_status: 'active',
            subscription_expires_at: updateData.expires_at,
            trial_expires_at: null,
            trial_started_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.user_id);

        if (profileError) {
          console.error('Failed to update user profile:', profileError);
        }
      } catch (error) {
        console.error('Error in account upgrade:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: isSuccess,
        status: paymentStatus,
        message: isSuccess ? 'Payment verified and account upgraded' : 'Payment verification failed',
        subscription: {
          id: subscription.id,
          status: updateData.subscription_status,
          expiresAt: updateData.expires_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Platform EPS verification error:', error);
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

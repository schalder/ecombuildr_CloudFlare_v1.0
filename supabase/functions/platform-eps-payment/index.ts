// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/crypto.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface PlatformEPSPaymentRequest {
  userId: string;
  planName: string;
  planPrice: number;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
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

// Generate a merchantTransactionId that meets EPS 30-char limit
function generateMerchantTxnId(id: string) {
  const ts = Date.now().toString().slice(-10); // 10 digits
  const compact = id.replace(/-/g, '');
  const value = `T${ts}${compact.slice(0, 19)}`; // length <= 30
  return value.slice(0, 30);
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
    const { userId, planName, planPrice, customerData }: PlatformEPSPaymentRequest = await req.json();
    console.log('Platform EPS Payment Request:', {
      userId,
      planName,
      planPrice,
      customerEmail: customerData.email
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Load EPS configuration from platform_payment_options
    const { data: paymentOption, error: configError } = await supabase
      .from('platform_payment_options')
      .select('*')
      .eq('provider', 'eps')
      .eq('is_enabled', true)
      .single();

    if (configError || !paymentOption) {
      console.error('EPS configuration not found:', configError);
      throw new Error('EPS is not enabled for platform payments');
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
      console.error('EPS credentials missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'EPS credentials not configured'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const baseUrl = epsConfig?.is_live ? 'https://pgapi.eps.com.bd' : 'https://sandboxpgapi.eps.com.bd';

    // Fetch user's current plan expiry date
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('trial_expires_at, subscription_expires_at')
      .eq('id', userId)
      .single();

    const currentExpiryDate = userProfile?.subscription_expires_at || userProfile?.trial_expires_at;

    // Create subscription record first
    const subscriptionData = {
      user_id: userId,
      plan_name: planName,
      plan_price_bdt: planPrice,
      payment_method: 'eps',
      subscription_status: 'pending',
      payment_reference: '',
      expires_at: currentExpiryDate,
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

    // EPS auth token
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

    const merchantTransactionId = generateMerchantTxnId(subscription.id);
    const transactionHash = await generateHash(merchantTransactionId, epsConfig.hash_key);

    const paymentData = {
      storeId: epsConfig.store_id,
      CustomerOrderId: subscription.id,
      merchantTransactionId,
      transactionTypeId: 1,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: planPrice,
      ipAddress: "127.0.0.1",
      version: "1",
      successUrl: `${originBase}/payment-success?subscriptionId=${subscription.id}&status=success&pm=eps`,
      failUrl: `${originBase}/payment-failed?subscriptionId=${subscription.id}&status=failed&pm=eps`,
      cancelUrl: `${originBase}/payment-failed?subscriptionId=${subscription.id}&status=cancelled&pm=eps`,
      customerName: customerData.name || '',
      customerEmail: customerData.email || '',
      CustomerAddress: customerData.address || 'N/A',
      CustomerAddress2: "",
      CustomerCity: customerData.city || 'N/A',
      CustomerState: customerData.city || 'N/A',
      CustomerPostcode: "1000",
      CustomerCountry: customerData.country || "BD",
      CustomerPhone: customerData.phone || '',
      ShipmentName: customerData.name || '',
      ShipmentAddress: customerData.address || 'N/A',
      ShipmentAddress2: "",
      ShipmentCity: customerData.city || 'N/A',
      ShipmentState: customerData.city || 'N/A',
      ShipmentPostcode: "1000",
      ShipmentCountry: customerData.country || "BD",
      ValueA: "",
      ValueB: "",
      ValueC: "",
      ValueD: "",
      ShippingMethod: "NO",
      NoOfItem: "1",
      ProductName: `Subscription: ${planName}`,
      ProductProfile: "general",
      ProductCategory: "SaaS"
    };

    const paymentResponse = await fetch(`${baseUrl}/v1/EPSEngine/InitializeEPS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenResult.token}`,
        'x-hash': transactionHash,
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();

    // EPS sometimes returns RedirectURL (uppercase URL). Normalize here and fallback-build if missing.
    const redirectUrl = paymentResult.RedirectUrl || paymentResult.RedirectURL;
    if (!redirectUrl) {
      await supabase
        .from('saas_subscriptions')
        .delete()
        .eq('id', subscription.id);
      throw new Error(paymentResult.errorMessage || 'Payment session creation failed');
    }

    // Update subscription with transaction reference (merchant transaction id)
    await supabase
      .from('saas_subscriptions')
      .update({ payment_reference: merchantTransactionId })
      .eq('id', subscription.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: redirectUrl,
        subscriptionId: subscription.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Platform EPS payment error:', error);
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

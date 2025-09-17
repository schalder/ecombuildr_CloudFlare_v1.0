import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { HmacSha512 } from "https://deno.land/std@0.190.0/crypto/hmac.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EPSPaymentRequest {
  orderId: string;
  amount: number;
  storeId: string;
  customerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country?: string;
  };
}

// Helper function to generate HMAC-SHA512 hash
function generateHash(data: string, key: string): string {
  const hmac = new HmacSha512(key);
  hmac.update(data);
  const hash = hmac.digest();
  return encode(hash).replace(/=/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, storeId, customerData }: EPSPaymentRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store settings for EPS configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.eps) {
      throw new Error('EPS configuration not found for this store');
    }

    const epsConfig = {
      merchant_id: store.settings.eps.merchant_id,
      store_id: store.settings.eps.store_id,
      username: store.settings.eps.username,
      password: store.settings.eps.password,
      hash_key: store.settings.eps.hash_key,
      base_url: store.settings.eps.is_live ? 'https://www.eps.com.bd' : 'https://demo.epsbd.com',
    };

    // Step 1: Get authentication token
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const tokenData = `${epsConfig.merchant_id}${epsConfig.store_id}${timestamp}`;
    const tokenHash = generateHash(tokenData, epsConfig.hash_key);

    const tokenResponse = await fetch(`${epsConfig.base_url}/api/v1/get-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: epsConfig.merchant_id,
        store_id: epsConfig.store_id,
        username: epsConfig.username,
        password: epsConfig.password,
        timestamp: timestamp,
        hash: tokenHash,
      }),
    });

    const tokenResult = await tokenResponse.json();
    console.log('EPS Token Response:', tokenResult);

    if (tokenResult.status !== 'SUCCESS') {
      throw new Error(tokenResult.message || 'Failed to get EPS authentication token');
    }

    // Step 2: Initialize payment
    const transactionId = `TXN-${orderId}-${Date.now()}`;
    const paymentTimestamp = Math.floor(Date.now() / 1000).toString();
    const paymentHashData = `${epsConfig.merchant_id}${transactionId}${amount}BDT${paymentTimestamp}`;
    const paymentHash = generateHash(paymentHashData, epsConfig.hash_key);

    const paymentData = {
      merchant_id: epsConfig.merchant_id,
      store_id: epsConfig.store_id,
      tran_id: transactionId,
      amount: amount,
      currency: 'BDT',
      success_url: `${req.headers.get('origin')}/store/payment/eps/success`,
      fail_url: `${req.headers.get('origin')}/store/payment/eps/fail`,
      cancel_url: `${req.headers.get('origin')}/store/payment/eps/cancel`,
      ipn_url: `${req.headers.get('origin')}/store/payment/eps/ipn`,
      cus_name: customerData.name,
      cus_email: customerData.email,
      cus_phone: customerData.phone,
      desc: `Order #${orderId}`,
      timestamp: paymentTimestamp,
      hash: paymentHash,
      opt_a: orderId, // Pass order ID for reference
      opt_b: storeId, // Pass store ID for reference
    };

    const paymentResponse = await fetch(`${epsConfig.base_url}/api/v1/payment/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenResult.token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();
    console.log('EPS Payment Response:', paymentResult);

    if (paymentResult.status !== 'SUCCESS') {
      throw new Error(paymentResult.failedreason || 'Payment session creation failed');
    }

    // Update order with payment details
    await supabase
      .from('orders')
      .update({
        payment_method: 'eps',
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: paymentResult.GatewayPageURL,
        sessionKey: paymentResult.sessionkey,
        transactionId: transactionId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EPS payment error:', error);
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
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/crypto.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { orderId, amount, storeId, customerData }: EPSPaymentRequest = await req.json();
    console.log('EPS Payment Request:', { orderId, amount, storeId, customerData });

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
      console.error('Store error:', storeError);
      throw new Error('EPS configuration not found for this store');
    }

    const epsConfig = {
      merchant_id: store.settings.eps.merchant_id,
      store_id: store.settings.eps.store_id,
      username: store.settings.eps.username,
      password: store.settings.eps.password,
      hash_key: store.settings.eps.hash_key,
      base_url: store.settings.eps.is_live ? 'https://pgapi.eps.com.bd' : 'https://sandboxpgapi.eps.com.bd',
    };

    console.log('EPS Config:', { ...epsConfig, password: '[HIDDEN]', hash_key: '[HIDDEN]' });

    // Step 1: Get authentication token
    const userNameHash = await generateHash(epsConfig.username, epsConfig.hash_key);
    console.log('Generated userName hash for token request');

    const tokenResponse = await fetch(`${epsConfig.base_url}/v1/Auth/GetToken`, {
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
    console.log('EPS Token Response:', { 
      status: tokenResponse.status, 
      hasToken: !!tokenResult.token,
      error: tokenResult.errorMessage 
    });

    if (!tokenResult.token) {
      throw new Error(tokenResult.errorMessage || 'Failed to get EPS authentication token');
    }

    // Step 2: Initialize payment
    const merchantTransactionId = `TXN-${orderId}-${Date.now()}`;
    const transactionHash = await generateHash(merchantTransactionId, epsConfig.hash_key);
    console.log('Generated transaction hash for payment initialization');

    const paymentData = {
      storeId: epsConfig.store_id,
      CustomerOrderId: orderId,
      merchantTransactionId: merchantTransactionId,
      transactionTypeId: 1, // Web
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: amount,
      ipAddress: "127.0.0.1", // Default IP
      version: "1",
      successUrl: `${req.headers.get('origin')}/payment-processing?orderId=${orderId}&status=success`,
      failUrl: `${req.headers.get('origin')}/payment-processing?orderId=${orderId}&status=failed`,
      cancelUrl: `${req.headers.get('origin')}/payment-processing?orderId=${orderId}&status=cancelled`,
      customerName: customerData.name,
      customerEmail: customerData.email,
      CustomerAddress: customerData.address,
      CustomerAddress2: "",
      CustomerCity: customerData.city,
      CustomerState: customerData.city, // Using city as state
      CustomerPostcode: "1000", // Default postcode
      CustomerCountry: customerData.country || "BD",
      CustomerPhone: customerData.phone,
      ShipmentName: customerData.name,
      ShipmentAddress: customerData.address,
      ShipmentAddress2: "",
      ShipmentCity: customerData.city,
      ShipmentState: customerData.city,
      ShipmentPostcode: "1000",
      ShipmentCountry: customerData.country || "BD",
      ValueA: "",
      ValueB: "",
      ValueC: "",
      ValueD: "",
      ShippingMethod: "NO",
      NoOfItem: "1",
      ProductName: `Order #${orderId}`,
      ProductProfile: "general",
      ProductCategory: "E-commerce"
    };

    console.log('Payment initialization request data prepared');

    const paymentResponse = await fetch(`${epsConfig.base_url}/v1/EPSEngine/InitializeEPS`, {
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
    console.log('EPS Payment Response:', { 
      status: paymentResponse.status,
      hasTransactionId: !!paymentResult.TransactionId,
      hasRedirectUrl: !!paymentResult.RedirectUrl,
      error: paymentResult.ErrorMessage 
    });

    if (paymentResult.ErrorCode || !paymentResult.TransactionId) {
      throw new Error(paymentResult.ErrorMessage || 'Payment session creation failed');
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

    console.log('Order updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: paymentResult.RedirectUrl,
        transactionId: paymentResult.TransactionId,
        merchantTransactionId: merchantTransactionId,
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
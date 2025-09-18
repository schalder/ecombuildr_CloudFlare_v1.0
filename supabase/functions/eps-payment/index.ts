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
  redirectOrigin?: string; // Explicit origin from client for proper redirects when called server-to-server
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
function generateMerchantTxnId(orderId: string) {
  const ts = Date.now().toString().slice(-10); // 10 digits
  const compact = orderId.replace(/-/g, '');
  // Prefix T, then ts, then first 19 chars of uuid to stay <=30
  const id = `T${ts}${compact.slice(0, 19)}`; // length <= 30
  return id.slice(0, 30);
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
    const { orderId, amount, storeId, customerData, redirectOrigin }: EPSPaymentRequest = await req.json();
    console.log('EPS Payment Request:', { orderId, amount, storeId, hasCustomerData: !!customerData, redirectOrigin });

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

  // Determine origin for redirects (explicit from client preferred)
  const ref = req.headers.get('referer') || '';
  let originBase = redirectOrigin || req.headers.get('origin') || '';
  if (!originBase && ref) {
    try { originBase = new URL(ref).origin; } catch { /* ignore */ }
  }
  if (!originBase) {
    // Fallback: use first verified custom domain for this store
    const { data: domainRow } = await supabase
      .from('custom_domains')
      .select('domain')
      .eq('store_id', storeId)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .limit(1)
      .maybeSingle();
    if (domainRow?.domain) originBase = `https://${domainRow.domain}`;
  }

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
    const merchantTransactionId = generateMerchantTxnId(orderId);
    const transactionHash = await generateHash(merchantTransactionId, epsConfig.hash_key);
    console.log('Generated transaction hash for payment initialization');

    // Fetch order access token to attach in redirect URLs
    // Check if this is a course order or regular order
    let orderRow: any = null;
    let orderToken = '';
    let isCourseOrder = false;

    // Try course_orders first
    const { data: courseOrderRow } = await supabase
      .from('course_orders')
      .select('order_number, metadata')
      .eq('id', orderId)
      .maybeSingle();

    if (courseOrderRow) {
      isCourseOrder = true;
      orderRow = courseOrderRow;
    } else {
      // Try regular orders
      const { data: regularOrderRow } = await supabase
        .from('orders')
        .select('custom_fields')
        .eq('id', orderId)
        .maybeSingle();
      
      if (regularOrderRow) {
        orderRow = regularOrderRow;
        orderToken = regularOrderRow?.custom_fields?.order_access_token || '';
      }
    }

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
      successUrl: isCourseOrder 
        ? `${originBase}/courses/payment-processing?orderId=${orderId}&status=success`
        : `${originBase}/order-confirmation?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=success`,
      failUrl: isCourseOrder
        ? `${originBase}/courses/payment-processing?orderId=${orderId}&status=failed`
        : `${originBase}/payment-processing?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=failed`,
      cancelUrl: isCourseOrder
        ? `${originBase}/courses/payment-processing?orderId=${orderId}&status=cancelled`
        : `${originBase}/payment-processing?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=cancelled`,
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

    // EPS sometimes returns RedirectURL (uppercase URL). Normalize here and fallback-build if missing.
    let redirectUrl: string | undefined = paymentResult.RedirectUrl || paymentResult.RedirectURL;
    if (!redirectUrl && paymentResult.TransactionId) {
      const pgBase = epsConfig.base_url.includes('sandbox') ? 'https://sandboxpg.eps.com.bd' : 'https://pg.eps.com.bd';
      redirectUrl = `${pgBase}/PG?data=${paymentResult.TransactionId}`;
    }

    console.log('EPS Payment Response:', { 
      status: paymentResponse.status,
      hasTransactionId: !!paymentResult.TransactionId,
      hasRedirectUrl: !!redirectUrl,
      error: paymentResult.ErrorMessage 
    });

    if (paymentResult.ErrorCode || !paymentResult.TransactionId) {
      throw new Error(paymentResult.ErrorMessage || 'Payment session creation failed');
    }

    // Update order with EPS details - keep as pending; verification will complete it
    if (isCourseOrder) {
      const newMeta = { ...(orderRow?.metadata || {}), eps: { merchantTransactionId, transactionId: paymentResult.TransactionId } };
      const { error: updateErr } = await supabase
        .from('course_orders')
        .update({
          payment_method: 'eps',
          payment_status: 'pending',
          updated_at: new Date().toISOString(),
          metadata: newMeta
        })
        .eq('id', orderId);
      if (updateErr) {
        console.error('EPS init: failed to update course order', updateErr);
      }
    } else {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          payment_method: 'eps',
          status: 'pending',
          updated_at: new Date().toISOString(),
          custom_fields: {
            ...(orderRow?.custom_fields || {}),
            eps: {
              merchantTransactionId,
              transactionId: paymentResult.TransactionId,
            }
          }
        })
        .eq('id', orderId);
      if (updateErr) {
        console.error('EPS init: failed to update order', updateErr);
      }
    }

    console.log('EPS init: order updated with EPS metadata', { isCourseOrder, orderId });

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: redirectUrl,
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
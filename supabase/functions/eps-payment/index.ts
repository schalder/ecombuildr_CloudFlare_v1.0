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

interface EPSPaymentRequest {
  tempOrderId?: string; // Temporary ID for tracking (backward compatibility)
  orderId?: string; // Real order ID (preferred when order is already created)
  amount: number;
  storeId: string;
  orderData?: any; // Full order data for deferred creation
  itemsData?: any[]; // Order items data
  customerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country?: string;
  };
  redirectOrigin?: string;
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

// Helper function to get store slug for system domain URLs
async function getStoreSlug(supabase: any, storeId: string): Promise<string> {
  const { data: store } = await supabase
    .from('stores')
    .select('slug')
    .eq('id', storeId)
    .maybeSingle();
  return store?.slug || 'store';
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
    const { tempOrderId, orderId, amount, storeId, orderData, itemsData, customerData, redirectOrigin }: EPSPaymentRequest = await req.json();
    // ✅ Prioritize orderId (real order) over tempOrderId (for backward compatibility)
    const trackingId = orderId || tempOrderId;
    if (!trackingId) {
      throw new Error('orderId or tempOrderId is required');
    }
    console.log('EPS Payment Request:', { 
      trackingId, 
      amount, 
      storeId, 
      hasCustomerData: !!customerData, 
      hasOrderData: !!orderData,
      redirectOrigin 
    });

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

  // Determine origin for redirects - preserve user's current domain
  const ref = req.headers.get('referer') || '';
  let originBase = redirectOrigin || req.headers.get('origin') || '';
  
  // Extract domain from referer if origin not available
  if (!originBase && ref) {
    try { 
      const refUrl = new URL(ref);
      originBase = refUrl.origin;
    } catch { /* ignore malformed referer */ }
  }
  
  // Verify the detected domain belongs to this store (security check)
  if (originBase && !originBase.includes('localhost') && !originBase.includes('127.0.0.1')) {
    const hostname = new URL(originBase).hostname;
    if (hostname !== 'ecombuildr.com') { // Not system domain
      const { data: domainRow } = await supabase
        .from('custom_domains')
        .select('domain')
        .eq('store_id', storeId)
        .eq('domain', hostname)
        .eq('is_verified', true)
        .eq('dns_configured', true)
        .maybeSingle();
      
      // If custom domain not verified for this store, fallback to system domain
      if (!domainRow) {
        originBase = '';
      }
    }
  }
  
  // Final fallback to system domain only if no custom domain detected
  if (!originBase) {
    originBase = 'https://ecombuildr.com';
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
    const merchantTransactionId = generateMerchantTxnId(trackingId);
    const transactionHash = await generateHash(merchantTransactionId, epsConfig.hash_key);
    console.log('Generated transaction hash for payment initialization');

    // For deferred order creation, store order data in payment metadata
    // Success URL will trigger order creation after verification
    const isCourseOrder = false; // Regular orders only for now

    const paymentData = {
      storeId: epsConfig.store_id,
      CustomerOrderId: trackingId,
      merchantTransactionId: merchantTransactionId,
      transactionTypeId: 1, // Web
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: amount,
      ipAddress: "127.0.0.1", // Default IP
      version: "1",
      // Pass order ID in URLs for payment processing (use orderId if available, otherwise tempId)
      // PaymentProcessing.tsx handles both tempId (for backward compatibility) and orderId
      successUrl: originBase.includes('ecombuildr.com') 
        ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=success&pm=eps`
        : `${originBase}/payment-processing?tempId=${trackingId}&status=success&pm=eps`,
      failUrl: originBase.includes('ecombuildr.com')
        ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=failed&pm=eps`
        : `${originBase}/payment-processing?tempId=${trackingId}&status=failed&pm=eps`,
      cancelUrl: originBase.includes('ecombuildr.com')
        ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=cancelled&pm=eps`
        : `${originBase}/payment-processing?tempId=${trackingId}&status=cancelled&pm=eps`,
      customerName: customerData.name,
      customerEmail: customerData.email,
      CustomerAddress: customerData.address,
      CustomerAddress2: "",
      CustomerCity: customerData.city,
      CustomerState: customerData.city,
      CustomerPostcode: "1000",
      CustomerCountry: customerData.country || "BD",
      CustomerPhone: customerData.phone,
      ShipmentName: customerData.name,
      ShipmentAddress: customerData.address,
      ShipmentAddress2: "",
      ShipmentCity: customerData.city,
      ShipmentState: customerData.city,
      ShipmentPostcode: "1000",
      ShipmentCountry: customerData.country || "BD",
      ValueA: orderData ? JSON.stringify({ orderData, itemsData }) : "", // Store order data
      ValueB: "",
      ValueC: "",
      ValueD: "",
      ShippingMethod: "NO",
      NoOfItem: "1",
      ProductName: `Order #${trackingId}`,
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

    // For deferred orders, we store the payment tracking info in a temporary way
    // The actual order will be created after successful payment verification
    console.log('EPS payment initiated (deferred order creation)', { trackingId, merchantTransactionId });

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
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NagadPaymentRequest {
  orderId: string;
  amount: number;
  storeId: string;
}

// Helper function to determine proper domain for Nagad redirects
async function getCurrentDomain(req: Request, supabase: any, storeId: string): Promise<string> {
  // Extract current domain from referer or origin
  const ref = req.headers.get('referer') || '';
  let originBase = req.headers.get('origin') || '';
  
  if (!originBase && ref) {
    try { 
      const refUrl = new URL(ref);
      originBase = refUrl.origin;
    } catch { /* ignore malformed referer */ }
  }
  
  // Verify custom domain belongs to this store
  if (originBase && !originBase.includes('localhost') && !originBase.includes('127.0.0.1')) {
    const hostname = new URL(originBase).hostname;
    if (hostname !== 'ecombuildr.com') {
      const { data: domainRow } = await supabase
        .from('custom_domains')
        .select('domain')
        .eq('store_id', storeId)
        .eq('domain', hostname)
        .eq('is_verified', true)
        .eq('dns_configured', true)
        .maybeSingle();
      
      if (!domainRow) {
        originBase = '';
      }
    }
  }
  
  // Fallback to system domain with store slug
  if (!originBase) {
    const { data: store } = await supabase
      .from('stores')
      .select('slug')
      .eq('id', storeId)
      .maybeSingle();
    const storeSlug = store?.slug || 'store';
    return `https://ecombuildr.com/store/${storeSlug}`;
  }
  
  return originBase;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, storeId }: NagadPaymentRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store settings for Nagad configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.nagad) {
      throw new Error('Nagad configuration not found for this store');
    }

    const nagadConfig = {
      merchant_id: store.settings.nagad.merchant_id,
      merchant_number: store.settings.nagad.merchant_number || store.settings.nagad.merchant_id,
      public_key: store.settings.nagad.public_key,
      private_key: store.settings.nagad.private_key,
      base_url: store.settings.nagad.base_url || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
    };

    // Generate timestamp and random string
    const timestamp = Date.now().toString();
    const orderId_timestamp = `${orderId}_${timestamp}`;

    // Step 1: Initialize payment
    const initResponse = await fetch(`${nagadConfig.base_url}/check-out/initialize/${nagadConfig.merchant_id}/${orderId_timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-IP-V4': req.headers.get('x-forwarded-for') || '127.0.0.1',
        'X-KM-Client-Type': 'PC_WEB',
      },
      body: JSON.stringify({
        account: nagadConfig.merchant_number,
        amount: amount.toString(),
        currency: 'BDT',
        challenge: await generateChallenge(nagadConfig, orderId_timestamp, amount),
      }),
    });

    const initData = await initResponse.json();

    if (initData.status !== 'Success') {
      throw new Error(initData.message || 'Payment initialization failed');
    }

    // Step 2: Complete payment initialization
    const completeResponse = await fetch(`${nagadConfig.base_url}/check-out/complete/${initData.paymentReferenceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-IP-V4': req.headers.get('x-forwarded-for') || '127.0.0.1',
        'X-KM-Client-Type': 'PC_WEB',
      },
      body: JSON.stringify({
        merchantId: nagadConfig.merchant_id,
        orderId: orderId_timestamp,
        amount: amount.toString(),
        currencyCode: '050',
        challenge: await generateCompleteChallenge(nagadConfig, orderId_timestamp, amount),
      }),
    });

    const completeData = await completeResponse.json();

    if (completeData.status !== 'Success') {
      throw new Error(completeData.message || 'Payment completion failed');
    }

    // Update order with payment details
    await supabase
      .from('orders')
      .update({
        payment_method: 'nagad',
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: completeData.callBackUrl,
        paymentID: completeData.paymentReferenceId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Nagad payment error:', error);
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

// Helper function to generate challenge for Nagad
async function generateChallenge(config: any, orderId: string, amount: number): Promise<string> {
  // This is a simplified version. In production, you need proper RSA encryption
  const data = `${config.merchant_id}${orderId}${amount}BDT`;
  return btoa(data); // Base64 encode as placeholder
}

async function generateCompleteChallenge(config: any, orderId: string, amount: number): Promise<string> {
  // This is a simplified version. In production, you need proper RSA encryption
  const data = `${config.merchant_id}${orderId}${amount}050`;
  return btoa(data); // Base64 encode as placeholder
}
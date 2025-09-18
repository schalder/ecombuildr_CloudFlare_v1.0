import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/crypto.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  method: 'eps';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentId, method }: VerifyPaymentRequest = await req.json();
    console.log('EPS Course Verification Request:', { orderId, paymentId, method });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let paymentStatus = 'failed';

    // Get course order details to find store ID
    const { data: order, error: orderError } = await supabase
      .from('course_orders')
      .select('store_id, metadata')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Course order not found');
    }

    if (method === 'eps') {
      // Get merchant transaction ID from order metadata or use paymentId
      const storedMTID = order.metadata?.eps?.merchantTransactionId;
      const merchantTxnId = paymentId && paymentId !== orderId ? paymentId : storedMTID;
      
      if (!merchantTxnId) {
        console.error('EPS verify: missing merchantTransactionId');
        paymentStatus = 'failed';
      } else {
        paymentStatus = await verifyEPSPayment(merchantTxnId, order.store_id, supabase);
      }
    }

    // Update course order status
    const orderStatus = paymentStatus === 'success' ? 'completed' : 'payment_failed';
    
    const { error } = await supabase
      .from('course_orders')
      .update({
        payment_status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update course order: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus,
        orderStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EPS course payment verification error:', error);
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

async function verifyEPSPayment(transactionId: string, storeId: string, supabase: any): Promise<string> {
  try {
    // Get store settings for EPS configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.eps) {
      console.error('EPS configuration not found for store:', storeId);
      return 'failed';
    }

    const epsConfig = {
      merchant_id: store.settings.eps.merchant_id,
      store_id: store.settings.eps.store_id,
      username: store.settings.eps.username,
      password: store.settings.eps.password,
      hash_key: store.settings.eps.hash_key,
      base_url: store.settings.eps.is_live ? 'https://pgapi.eps.com.bd' : 'https://sandboxpgapi.eps.com.bd',
    };

    // Helper function to generate HMAC-SHA512 hash
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

    // Get authentication token
    const userNameHash = await generateHash(epsConfig.username, epsConfig.hash_key);

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
    
    if (!tokenResult.token) {
      console.error('Failed to get EPS token:', tokenResult.errorMessage);
      return 'failed';
    }

    // Verify payment using the merchant transaction ID
    const merchantTransactionHash = await generateHash(transactionId, epsConfig.hash_key);

    const verifyResponse = await fetch(
      `${epsConfig.base_url}/v1/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${transactionId}`,
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
    console.log('EPS Verification Result:', { status: verifyResult.Status, transactionId });
    
    return verifyResult.Status === 'Success' ? 'success' : 'failed';
  } catch (error) {
    console.error('EPS verification error:', error);
    return 'failed';
  }
}
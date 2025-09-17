import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  method: 'bkash' | 'nagad' | 'eps';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentId, method }: VerifyPaymentRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let paymentStatus = 'failed';
    let paymentDetails = {};

    // Get order details to find store ID and website ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id, website_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    switch (method) {
      case 'bkash':
        paymentStatus = await verifyBkashPayment(paymentId, order.store_id, supabase);
        break;
      case 'nagad':
        paymentStatus = await verifyNagadPayment(paymentId, order.store_id, supabase);
        break;
      case 'eps':
        paymentStatus = await verifyEPSPayment(paymentId, order.store_id, supabase);
        break;
    }

    // Update order status
    const orderStatus = paymentStatus === 'success' ? 'processing' : 'pending';
    
    const { error } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }


    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus,
        orderStatus,
        paymentDetails,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
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

async function verifyBkashPayment(paymentId: string, storeId: string, supabase: any): Promise<string> {
  try {
    // Get store settings for bKash configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.bkash) {
      console.error('bKash configuration not found for store:', storeId);
      return 'failed';
    }

    const bkashConfig = {
      app_key: store.settings.bkash.app_key,
      app_secret: store.settings.bkash.app_secret,
      username: store.settings.bkash.username,
      password: store.settings.bkash.password,
      base_url: store.settings.bkash.base_url || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    };

    // Get token
    const tokenResponse = await fetch(`${bkashConfig.base_url}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'username': bkashConfig.username!,
        'password': bkashConfig.password!,
      },
      body: JSON.stringify({
        app_key: bkashConfig.app_key,
        app_secret: bkashConfig.app_secret,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Query payment
    const queryResponse = await fetch(`${bkashConfig.base_url}/tokenized/checkout/payment/query/${paymentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'authorization': tokenData.id_token,
        'x-app-key': bkashConfig.app_key!,
      },
    });

    const queryData = await queryResponse.json();
    
    return queryData.transactionStatus === 'Completed' ? 'success' : 'failed';
  } catch (error) {
    console.error('bKash verification error:', error);
    return 'failed';
  }
}

async function verifyNagadPayment(paymentId: string, storeId: string, supabase: any): Promise<string> {
  try {
    // Get store settings for Nagad configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.nagad) {
      console.error('Nagad configuration not found for store:', storeId);
      return 'failed';
    }

    const nagadConfig = {
      merchant_id: store.settings.nagad.merchant_id,
      base_url: store.settings.nagad.base_url || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
    };

    const verifyResponse = await fetch(`${nagadConfig.base_url}/verify/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-IP-V4': '127.0.0.1',
        'X-KM-Client-Type': 'PC_WEB',
      },
    });

    const verifyData = await verifyResponse.json();
    
    return verifyData.status === 'Success' && verifyData.statusCode === '000' ? 'success' : 'failed';
  } catch (error) {
    console.error('Nagad verification error:', error);
    return 'failed';
  }
}

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
      base_url: store.settings.eps.is_live ? 'https://www.eps.com.bd' : 'https://demo.epsbd.com',
    };

    // Helper function to generate HMAC-SHA512 hash
    function generateHash(data: string, key: string): string {
      const encoder = new TextEncoder();
      const keyBytes = encoder.encode(key);
      const dataBytes = encoder.encode(data);
      
      // Simple HMAC implementation for Deno
      const hmac = crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );
      
      return hmac.then(key => 
        crypto.subtle.sign('HMAC', key, dataBytes)
      ).then(signature => 
        Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      );
    }

    // Get authentication token
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const tokenData = `${epsConfig.merchant_id}${epsConfig.store_id}${timestamp}`;
    const tokenHash = await generateHash(tokenData, epsConfig.hash_key);

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
    
    if (tokenResult.status !== 'SUCCESS') {
      console.error('Failed to get EPS token:', tokenResult);
      return 'failed';
    }

    // Verify payment
    const verifyTimestamp = Math.floor(Date.now() / 1000).toString();
    const verifyHashData = `${epsConfig.merchant_id}${transactionId}${verifyTimestamp}`;
    const verifyHash = await generateHash(verifyHashData, epsConfig.hash_key);

    const verifyResponse = await fetch(`${epsConfig.base_url}/api/v1/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenResult.token}`,
      },
      body: JSON.stringify({
        merchant_id: epsConfig.merchant_id,
        tran_id: transactionId,
        timestamp: verifyTimestamp,
        hash: verifyHash,
      }),
    });

    const verifyResult = await verifyResponse.json();
    
    return verifyResult.status === 'SUCCESS' && verifyResult.data?.payment_status === 'PAID' ? 'success' : 'failed';
  } catch (error) {
    console.error('EPS verification error:', error);
    return 'failed';
  }
}
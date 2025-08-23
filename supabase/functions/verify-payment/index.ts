import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  method: 'bkash' | 'nagad' | 'sslcommerz';
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
      case 'sslcommerz':
        paymentStatus = await verifySSLCommerzPayment(paymentId, order.store_id, supabase);
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

async function verifySSLCommerzPayment(transactionId: string, storeId: string, supabase: any): Promise<string> {
  try {
    // Get store settings for SSLCommerz configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.sslcommerz) {
      console.error('SSLCommerz configuration not found for store:', storeId);
      return 'failed';
    }

    const sslConfig = {
      store_id: store.settings.sslcommerz.store_id,
      store_passwd: store.settings.sslcommerz.store_password,
      base_url: store.settings.sslcommerz.base_url || 'https://sandbox.sslcommerz.com',
    };

    const formData = new URLSearchParams();
    formData.append('store_id', sslConfig.store_id!);
    formData.append('store_passwd', sslConfig.store_passwd!);
    formData.append('format', 'json');

    const response = await fetch(`${sslConfig.base_url}/validator/api/merchantTransIDvalidationAPI.php?tran_id=${transactionId}&store_id=${sslConfig.store_id}&store_passwd=${sslConfig.store_passwd}&format=json`, {
      method: 'GET',
    });

    const data = await response.json();
    
    return data.status === 'VALID' || data.status === 'VALIDATED' ? 'success' : 'failed';
  } catch (error) {
    console.error('SSLCommerz verification error:', error);
    return 'failed';
  }
}
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

    switch (method) {
      case 'bkash':
        paymentStatus = await verifyBkashPayment(paymentId);
        break;
      case 'nagad':
        paymentStatus = await verifyNagadPayment(paymentId);
        break;
      case 'sslcommerz':
        paymentStatus = await verifySSLCommerzPayment(paymentId);
        break;
    }

    // Update order status
    const orderStatus = paymentStatus === 'success' ? 'paid' : 'payment_failed';
    
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

async function verifyBkashPayment(paymentId: string): Promise<string> {
  try {
    const bkashConfig = {
      app_key: Deno.env.get('BKASH_APP_KEY'),
      app_secret: Deno.env.get('BKASH_APP_SECRET'),
      username: Deno.env.get('BKASH_USERNAME'),
      password: Deno.env.get('BKASH_PASSWORD'),
      base_url: Deno.env.get('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
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

async function verifyNagadPayment(paymentId: string): Promise<string> {
  try {
    const nagadConfig = {
      merchant_id: Deno.env.get('NAGAD_MERCHANT_ID'),
      base_url: Deno.env.get('NAGAD_BASE_URL') || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
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

async function verifySSLCommerzPayment(transactionId: string): Promise<string> {
  try {
    const sslConfig = {
      store_id: Deno.env.get('SSLCOMMERZ_STORE_ID'),
      store_passwd: Deno.env.get('SSLCOMMERZ_STORE_PASSWORD'),
      base_url: Deno.env.get('SSLCOMMERZ_BASE_URL') || 'https://sandbox.sslcommerz.com',
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
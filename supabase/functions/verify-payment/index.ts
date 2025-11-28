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
  method: 'bkash' | 'nagad' | 'eps' | 'stripe';
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
      .select('store_id, website_id, custom_fields')
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
      case 'eps': {
        const storedMTID = order.custom_fields?.eps?.merchantTransactionId || order.custom_fields?.eps?.merchant_transaction_id;
        const merchantTxnId = paymentId && paymentId !== orderId ? paymentId : storedMTID;
        if (!merchantTxnId) {
          console.error('EPS verify: missing merchantTransactionId');
          paymentStatus = 'failed';
        } else {
          paymentStatus = await verifyEPSPayment(merchantTxnId, order.store_id, supabase);
        }
        break;
      }
      case 'stripe':
        paymentStatus = await verifyStripePayment(paymentId, order.store_id, supabase);
        break;
    }

    // ✅ Determine order status based on product types (only for successful payments)
    // For digital products: preserve 'delivered' status (don't override)
    // For physical products: set to 'processing' (payment collected, ready to process)
    let orderStatus = paymentStatus === 'success' ? 'processing' : 'payment_failed';
    
    if (paymentStatus === 'success') {
      // Get order items to check product types
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', orderId);

      if (!itemsError && orderItems && orderItems.length > 0) {
        const productIds = orderItems.map(item => item.product_id).filter(Boolean);
        
        if (productIds.length > 0) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, product_type')
            .in('id', productIds);

          if (!productsError && products && products.length > 0) {
            let hasDigitalProducts = false;
            let hasPhysicalProducts = false;
            
            for (const product of products) {
              if (product.product_type === 'digital') {
                hasDigitalProducts = true;
              } else {
                hasPhysicalProducts = true;
              }
            }
            
            // If all products are digital, set to 'delivered' (instant delivery)
            // If any product is physical, set to 'processing' (payment collected, ready to process)
            if (hasDigitalProducts && !hasPhysicalProducts) {
              orderStatus = 'delivered';
              console.log('verify-payment: Order status set to delivered (digital products only)');
            } else {
              orderStatus = 'processing';
              console.log('verify-payment: Order status set to processing (physical products, payment collected)');
            }
          }
        }
      }
    }
    
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

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Payment verification failed' 
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

    // Get authentication token using new EPS API structure
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
    
    return verifyResult.Status === 'Success' ? 'success' : 'failed';
  } catch (error) {
    console.error('EPS verification error:', error);
    return 'failed';
  }
}

async function verifyStripePayment(paymentId: string, storeId: string, supabase: any): Promise<string> {
  try {
    // Get store settings for Stripe configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.payment?.stripe) {
      console.error('Stripe configuration not found for store:', storeId);
      return 'failed';
    }

    const stripeConfig = store.settings.payment.stripe;

    if (!stripeConfig.stripe_account_id || !stripeConfig.access_token) {
      console.error('Stripe account not connected');
      return 'failed';
    }

    // Get encryption key
    const ENCRYPTION_KEY = Deno.env.get('STRIPE_ENCRYPTION_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || 'default-key-32-chars-long!!';

    // Decrypt access token
    const combined = Uint8Array.from(atob(stripeConfig.access_token), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );
    
    const accessToken = new TextDecoder().decode(decrypted);

    // Import Stripe SDK
    const Stripe = (await import("https://esm.sh/stripe@14.21.0?target=deno")).default;
    
    // Initialize Stripe with store's access token
    const stripe = new Stripe(accessToken, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Retrieve PaymentIntent using the payment ID (could be session ID or payment intent ID)
    // Try as payment intent ID first
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentId, {
        stripeAccount: stripeConfig.stripe_account_id,
      });
    } catch (err) {
      // If not found, try as checkout session ID
      try {
        const session = await stripe.checkout.sessions.retrieve(paymentId, {
          stripeAccount: stripeConfig.stripe_account_id,
        });
        if (session.payment_intent) {
          paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
            stripeAccount: stripeConfig.stripe_account_id,
          });
        } else {
          return 'failed';
        }
      } catch (sessionErr) {
        console.error('Stripe verification error:', sessionErr);
        return 'failed';
      }
    }

    // Check payment intent status
    if (paymentIntent.status === 'succeeded') {
      return 'success';
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      return 'failed';
    } else {
      // Other statuses like 'processing', 'requires_confirmation', etc.
      return 'failed';
    }
  } catch (error) {
    console.error('Stripe verification error:', error);
    return 'failed';
  }
}
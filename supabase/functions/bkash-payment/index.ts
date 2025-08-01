import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BkashPaymentRequest {
  orderId: string;
  amount: number;
  storeId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, storeId }: BkashPaymentRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // bKash API configuration
  // Get store settings for bKash configuration
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('settings')
    .eq('id', storeId)
    .single();

  if (storeError || !store?.settings?.bkash) {
    throw new Error('bKash configuration not found for this store');
  }

  const bkashConfig = {
    app_key: store.settings.bkash.app_key,
    app_secret: store.settings.bkash.app_secret,
    username: store.settings.bkash.username,
    password: store.settings.bkash.password,
    base_url: store.settings.bkash.base_url || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  };

    // Step 1: Get bKash access token
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
    
    if (!tokenData.id_token) {
      throw new Error('Failed to get bKash token');
    }

    // Step 2: Create payment
    const paymentResponse = await fetch(`${bkashConfig.base_url}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'authorization': tokenData.id_token,
        'x-app-key': bkashConfig.app_key!,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: orderId,
        callbackURL: `${req.headers.get('origin')}/store/payment/bkash/callback`,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `INV-${orderId}-${Date.now()}`,
      }),
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.statusCode !== '0000') {
      throw new Error(paymentData.statusMessage || 'Payment creation failed');
    }

    // Update order with payment details
    await supabase
      .from('orders')
      .update({
        payment_method: 'bkash',
        status: 'payment_pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: paymentData.bkashURL,
        paymentID: paymentData.paymentID,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('bKash payment error:', error);
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
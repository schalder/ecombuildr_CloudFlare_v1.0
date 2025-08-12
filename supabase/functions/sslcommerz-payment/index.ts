import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SSLCommerzPaymentRequest {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, storeId, customerData }: SSLCommerzPaymentRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SSLCommerz API configuration
  // Get store settings for SSLCommerz configuration
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('settings')
    .eq('id', storeId)
    .single();

  if (storeError || !store?.settings?.sslcommerz) {
    throw new Error('SSLCommerz configuration not found for this store');
  }

  const sslConfig = {
    store_id: store.settings.sslcommerz.store_id,
    store_passwd: store.settings.sslcommerz.store_password,
    base_url: store.settings.sslcommerz.base_url || 'https://sandbox.sslcommerz.com',
  };

    // Prepare payment data
    const paymentData = {
      store_id: sslConfig.store_id,
      store_passwd: sslConfig.store_passwd,
      total_amount: amount.toString(),
      currency: 'BDT',
      tran_id: `TXN-${orderId}-${Date.now()}`,
      success_url: `${req.headers.get('origin')}/store/payment/sslcommerz/success`,
      fail_url: `${req.headers.get('origin')}/store/payment/sslcommerz/fail`,
      cancel_url: `${req.headers.get('origin')}/store/payment/sslcommerz/cancel`,
      ipn_url: `${req.headers.get('origin')}/store/payment/sslcommerz/ipn`,
      
      // Customer information
      cus_name: customerData.name,
      cus_email: customerData.email,
      cus_add1: customerData.address,
      cus_city: customerData.city,
      cus_country: customerData.country || 'Bangladesh',
      cus_phone: customerData.phone,
      
      // Shipping information (same as customer for simplicity)
      ship_name: customerData.name,
      ship_add1: customerData.address,
      ship_city: customerData.city,
      ship_country: customerData.country || 'Bangladesh',
      
      // Product information
      product_name: `Order #${orderId}`,
      product_category: 'E-commerce',
      product_profile: 'general',
      
      // Additional parameters
      value_a: orderId, // Pass order ID for reference
      value_b: storeId, // Pass store ID for reference
    };

    // Convert to form data
    const formData = new URLSearchParams();
    Object.entries(paymentData).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    // Initialize payment session
    const response = await fetch(`${sslConfig.base_url}/gwprocess/v3/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const responseData = await response.json();

    if (responseData.status !== 'SUCCESS') {
      throw new Error(responseData.failedreason || 'Payment session creation failed');
    }

    // Update order with payment details
    await supabase
      .from('orders')
      .update({
        payment_method: 'sslcommerz',
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: responseData.GatewayPageURL,
        sessionKey: responseData.sessionkey,
        transactionId: paymentData.tran_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SSLCommerz payment error:', error);
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
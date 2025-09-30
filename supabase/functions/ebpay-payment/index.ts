// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface EBPayPaymentRequest {
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
  redirectOrigin?: string;
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
    const { orderId, amount, storeId, customerData, redirectOrigin }: EBPayPaymentRequest = await req.json();
    console.log('EB Pay Payment Request:', { orderId, amount, storeId, hasCustomerData: !!customerData, redirectOrigin });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store settings for EB Pay configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.ebpay) {
      console.error('Store error:', storeError);
      throw new Error('EB Pay configuration not found for this store');
    }

    const ebpayConfig = {
      brand_key: store.settings.ebpay.brand_key,
      api_key: store.settings.ebpay.api_key,
      secret_key: store.settings.ebpay.secret_key,
      is_live: store.settings.ebpay.is_live,
    };

    // Validate required credentials
    if (!ebpayConfig.brand_key || !ebpayConfig.api_key || !ebpayConfig.secret_key) {
      console.error('EB Pay credentials missing:', {
        hasBrandKey: !!ebpayConfig.brand_key,
        hasApiKey: !!ebpayConfig.api_key,
        hasSecretKey: !!ebpayConfig.secret_key
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'EB Pay credentials not configured' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('EB Pay Config:', { ...ebpayConfig, brand_key: '[HIDDEN]' });

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

    // Fetch order details to determine order type and create redirect URLs
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

    // Prepare EB Pay payment request data with correct format
    const paymentData = {
      success_url: isCourseOrder 
        ? `${originBase}/courses/order-confirmation?orderId=${orderId}&status=success`
        : originBase.includes('ecombuildr.com') 
          ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/order-confirmation?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=success`
          : `${originBase}/order-confirmation?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=success`,
      cancel_url: isCourseOrder
        ? `${originBase}/courses/payment-processing?orderId=${orderId}&status=failed`
        : originBase.includes('ecombuildr.com')
          ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=failed`
          : `${originBase}/payment-processing?orderId=${orderId}${orderToken ? `&ot=${orderToken}` : ''}&status=failed`,
      amount: amount.toString(),
      cus_name: customerData.name || '',
      cus_email: customerData.email || '',
      cus_phone: customerData.phone || '',
      meta_data: { 
        order_id: orderId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        phone: customerData.phone
      }
    };

    console.log('EB Pay payment request data prepared');
    console.log('EB Pay request payload:', JSON.stringify(paymentData, null, 2));
    console.log('EB Pay request headers:', {
      'BRAND-KEY': ebpayConfig.brand_key ? '[SET]' : '[NOT SET]',
      'API-KEY': ebpayConfig.api_key ? '[SET]' : '[NOT SET]',
      'SECRET-KEY': ebpayConfig.secret_key ? '[SET]' : '[NOT SET]',
      'Content-Type': 'application/json'
    });

    // Make payment creation request to EB Pay
    const paymentResponse = await fetch('https://pay.ecombuildr.com/verify/api/payment/create', {
      method: 'POST',
      headers: {
        'BRAND-KEY': ebpayConfig.brand_key,
        'API-KEY': ebpayConfig.api_key,
        'SECRET-KEY': ebpayConfig.secret_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();

    console.log('EB Pay Payment Response:', { 
      status: paymentResponse.status,
      hasPaymentUrl: !!paymentResult.payment_url,
      resultStatus: paymentResult.status,
      message: paymentResult.message,
      fullResponse: paymentResult
    });

    // Log detailed error information for debugging
    if (paymentResponse.status !== 200) {
      console.error('EB Pay API Error Details:', {
        httpStatus: paymentResponse.status,
        httpStatusText: paymentResponse.statusText,
        responseHeaders: Object.fromEntries(paymentResponse.headers.entries()),
        responseBody: paymentResult
      });
    }

    if (!paymentResult.status || !paymentResult.payment_url) {
      throw new Error(paymentResult.message || 'Payment session creation failed');
    }

    // Store transaction ID if provided by EB Pay
    const transactionId = paymentResult.transaction_id || paymentResult.id;

    // Update order with EB Pay details - keep as pending; verification will complete it
    if (isCourseOrder) {
      const newMeta = { 
        ...(orderRow?.metadata || {}), 
        ebpay: { 
          payment_request: paymentData,
          ...(transactionId && { transactionId })
        } 
      };
      const { error: updateErr } = await supabase
        .from('course_orders')
        .update({
          payment_method: 'ebpay',
          payment_status: 'pending',
          updated_at: new Date().toISOString(),
          metadata: newMeta
        })
        .eq('id', orderId);
      if (updateErr) {
        console.error('EB Pay init: failed to update course order', updateErr);
      }
    } else {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          payment_method: 'ebpay',
          status: 'pending',
          updated_at: new Date().toISOString(),
          custom_fields: {
            ...(orderRow?.custom_fields || {}),
            ebpay: {
              payment_request: paymentData,
              ...(transactionId && { transactionId })
            }
          }
        })
        .eq('id', orderId);
      if (updateErr) {
        console.error('EB Pay init: failed to update order', updateErr);
      }
    }

    console.log('EB Pay init: order updated with EB Pay metadata', { isCourseOrder, orderId });

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: paymentResult.payment_url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EB Pay payment error:', error);
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

// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface EBPayPaymentRequest {
  tempOrderId: string; // Temporary ID for tracking before order creation
  orderId?: string; // Real order ID (for backward compatibility)
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

// Helper function to get store slug for system domain URLs
async function getStoreSlug(supabase: any, storeId: string): Promise<string> {
  const { data: store } = await supabase
    .from('stores')
    .select('slug')
    .eq('id', storeId)
    .maybeSingle();
  return store?.slug || 'store';
}

// Helper function to get next step slug for funnel custom domain redirects
async function getNextStepSlugForFunnel(supabase: any, funnelId: string, stepId?: string): Promise<string | null> {
  try {
    if (!stepId) {
      // If no stepId provided, get the first step of the funnel
      const { data: firstStep } = await supabase
        .from('funnel_steps')
        .select('slug')
        .eq('funnel_id', funnelId)
        .eq('is_published', true)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      return firstStep?.slug || null;
    }

    // Get the current step and its on_success_step_id
    const { data: currentStep } = await supabase
      .from('funnel_steps')
      .select('on_success_step_id')
      .eq('id', stepId)
      .eq('funnel_id', funnelId)
      .maybeSingle();

    if (!currentStep?.on_success_step_id) {
      // No next step configured, return null to use fallback
      return null;
    }

    // Get the next step slug
    const { data: nextStep } = await supabase
      .from('funnel_steps')
      .select('slug')
      .eq('id', currentStep.on_success_step_id)
      .eq('is_published', true)
      .maybeSingle();

    return nextStep?.slug || null;
  } catch (error) {
    console.error('Error fetching next step slug for funnel:', error);
    return null;
  }
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
    const { tempOrderId, orderId, amount, storeId, orderData, itemsData, customerData, redirectOrigin }: EBPayPaymentRequest = await req.json();
    const trackingId = tempOrderId || orderId;
    console.log('EB Pay Payment Request:', { 
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

    // For deferred order creation, store order data in payment metadata
    const isCourseOrder = false; // Regular orders only for now

    // Detect funnel context from order data
    const isFunnelOrder = orderData?.funnel_id;

    // Construct appropriate redirect URLs based on context
    let successUrl: string;
    let cancelUrl: string;

    if (isFunnelOrder) {
      // Funnel context: determine if this is a custom domain funnel
      const isCustomDomainFunnel = !originBase.includes('ecombuildr.com');
      
      if (isCustomDomainFunnel) {
        // Custom domain funnel: get the next step slug from the funnel step
        const nextStepSlug = await getNextStepSlugForFunnel(supabase, orderData.funnel_id, orderData.step_id);
        
        if (nextStepSlug) {
          // Redirect to the actual next step (e.g., /thank-you, /confirmation, etc.)
          successUrl = `${originBase}/${nextStepSlug}?tempId=${trackingId}&status=success&pm=ebpay`;
          cancelUrl = `${originBase}/${nextStepSlug}?tempId=${trackingId}&status=failed&pm=ebpay`;
        } else {
          // Fallback to generic payment processing
          successUrl = `${originBase}/payment-processing?tempId=${trackingId}&status=success&pm=ebpay`;
          cancelUrl = `${originBase}/payment-processing?tempId=${trackingId}&status=failed&pm=ebpay`;
        }
      } else {
        // System domain funnel: use funnel-specific route
        successUrl = `${originBase}/funnel/${orderData.funnel_id}/payment-processing?tempId=${trackingId}&status=success&pm=ebpay`;
        cancelUrl = `${originBase}/funnel/${orderData.funnel_id}/payment-processing?tempId=${trackingId}&status=failed&pm=ebpay`;
      }
    } else if (originBase.includes('ecombuildr.com')) {
      // System domain: use store-specific route
      successUrl = `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=success&pm=ebpay`;
      cancelUrl = `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=failed&pm=ebpay`;
    } else {
      // Custom domain: use generic route (for websites)
      successUrl = `${originBase}/payment-processing?tempId=${trackingId}&status=success&pm=ebpay`;
      cancelUrl = `${originBase}/payment-processing?tempId=${trackingId}&status=failed&pm=ebpay`;
    }

    // Prepare EB Pay payment request data with correct format
    const paymentData = {
      success_url: successUrl,
      cancel_url: cancelUrl,
      amount: amount.toString(),
      cus_name: customerData.name || '',
      cus_email: customerData.email || '',
      cus_phone: customerData.phone || '',
      meta_data: { 
        tracking_id: trackingId,
        store_id: storeId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        phone: customerData.phone,
        // Store order data for deferred creation
        ...(orderData && { order_data: orderData }),
        ...(itemsData && { items_data: itemsData })
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

    // For deferred orders, we store the payment tracking info in metadata
    // The actual order will be created after successful payment verification
    console.log('EB Pay payment initiated (deferred order creation)', { trackingId });

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

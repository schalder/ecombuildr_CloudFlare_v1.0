// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface StripePaymentRequest {
  tempOrderId?: string; // Temporary ID for tracking (backward compatibility)
  orderId?: string; // Real order ID (preferred when order is already created)
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
    state?: string;
    postal_code?: string;
  };
  currency?: string; // Currency code (e.g., 'USD', 'BDT')
  redirectOrigin?: string;
}

// Simple decryption using Web Crypto API
async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    
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
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt token: ${error.message || error}`);
  }
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
    const { tempOrderId, orderId, amount, storeId, orderData, itemsData, customerData, currency, redirectOrigin }: StripePaymentRequest = await req.json();
    
    // Prioritize orderId (real order) over tempOrderId (for backward compatibility)
    const trackingId = orderId || tempOrderId;
    if (!trackingId) {
      throw new Error('orderId or tempOrderId is required');
    }

    console.log('Stripe Payment Request:', { 
      trackingId, 
      amount, 
      storeId, 
      currency,
      hasCustomerData: !!customerData, 
      hasOrderData: !!orderData,
      redirectOrigin 
    });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store settings for Stripe configuration
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.settings?.payment?.stripe) {
      console.error('Store error:', storeError);
      throw new Error('Stripe configuration not found for this store');
    }

    const stripeConfig = store.settings.payment.stripe;

    if (!stripeConfig.stripe_account_id || !stripeConfig.access_token) {
      throw new Error('Stripe account not connected. Please connect your Stripe account in payment settings.');
    }

    // Get encryption key
    const ENCRYPTION_KEY = Deno.env.get('STRIPE_ENCRYPTION_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || 'default-key-32-chars-long!!';

    // Decrypt access token
    const accessToken = await decryptToken(stripeConfig.access_token, ENCRYPTION_KEY);

    // Initialize Stripe with store's access token (Stripe Connect)
    const stripe = new Stripe(accessToken, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Determine origin for redirects - prioritize redirectOrigin parameter
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
    // If redirectOrigin was explicitly provided from frontend, trust it more (but still verify)
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
        
        // If custom domain not verified for this store
        if (!domainRow) {
          // If redirectOrigin was explicitly provided, log warning but still use it
          // (frontend already validated it, but we log for security monitoring)
          if (redirectOrigin && redirectOrigin === originBase) {
            console.warn('Stripe Payment - Custom domain not verified in database, but redirectOrigin was provided:', {
              hostname,
              storeId,
              redirectOrigin
            });
            // Trust redirectOrigin from frontend - don't clear originBase
          } else {
            // Not from redirectOrigin, so reject it
            originBase = '';
          }
        }
      }
    }
    
    // Final fallback to system domain only if no custom domain detected
    if (!originBase) {
      originBase = 'https://ecombuildr.com';
    }

    console.log('Stripe Payment - Origin detection:', {
      redirectOrigin,
      detectedOrigin: originBase,
      referer: ref,
      requestOrigin: req.headers.get('origin')
    });

    // Determine currency (default to USD if not provided)
    const paymentCurrency = (currency || 'USD').toLowerCase();

    // Convert amount to cents (Stripe uses smallest currency unit)
    // For most currencies, multiply by 100, but some currencies don't have subunits
    const currencyMultiplier: Record<string, number> = {
      'bdt': 100, // Bangladeshi Taka
      'usd': 100,
      'eur': 100,
      'gbp': 100,
      'inr': 100,
      'jpy': 1,   // Japanese Yen (no subunits)
      'krw': 1,   // South Korean Won (no subunits)
    };
    const amountInCents = Math.round(amount * (currencyMultiplier[paymentCurrency] || 100));

    // Create success and cancel URLs
    const successUrl = originBase.includes('ecombuildr.com') 
      ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=success&pm=stripe`
      : `${originBase}/payment-processing?tempId=${trackingId}&status=success&pm=stripe`;
    
    const cancelUrl = originBase.includes('ecombuildr.com')
      ? `${originBase}/store/${await getStoreSlug(supabase, storeId)}/payment-processing?tempId=${trackingId}&status=failed&pm=stripe`
      : `${originBase}/payment-processing?tempId=${trackingId}&status=failed&pm=stripe`;

    // Create Stripe Checkout Session
    // Note: Checkout Sessions require line_items, not amount directly
    const sessionParams: any = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: paymentCurrency,
            product_data: {
              name: orderData?.items?.[0]?.product?.name || 'Order',
              description: orderData?.items?.length > 1 
                ? `${orderData.items.length} items` 
                : orderData?.items?.[0]?.product?.name || 'Order',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerData.email,
      metadata: {
        order_id: trackingId,
        store_id: storeId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        ...(orderData && { order_data: JSON.stringify(orderData) }),
        ...(itemsData && { items_data: JSON.stringify(itemsData) }),
      },
    };

    // Only collect shipping address in Stripe if we DON'T already have it
    // This prevents customers from entering shipping info twice (better UX like Shopify/WooCommerce)
    const hasShippingInfo = customerData.address && customerData.city;
    
    if (!hasShippingInfo) {
      // We don't have shipping info yet, let Stripe collect it
      sessionParams.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'BD', 'IN', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'IE', 'PT', 'GR', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY'],
      };
      console.log('Stripe Payment - Shipping address collection enabled (not provided in checkout form)');
    } else {
      // We already have shipping info, don't ask for it again in Stripe
      // The shipping address will be used from customerData when creating the order
      console.log('Stripe Payment - Shipping address already collected, skipping Stripe collection');
    }

    // Create checkout session on the connected account
    // Note: When using Stripe Connect with access token, we don't need stripeAccount parameter
    // The access token already scopes requests to the connected account
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe Checkout Session created:', { 
      sessionId: session.id,
      url: session.url,
      amount: amountInCents,
      currency: paymentCurrency
    });

    // Store session ID in order custom_fields for reference
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('custom_fields')
        .eq('id', orderId)
        .single();

      if (order) {
        const updatedCustomFields = {
          ...(order.custom_fields || {}),
          stripe: {
            session_id: session.id,
            payment_intent_id: session.payment_intent,
          },
        };

        await supabase
          .from('orders')
          .update({ custom_fields: updatedCustomFields })
          .eq('id', orderId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentURL: session.url, // Stripe Checkout URL
        sessionId: session.id,
        clientSecret: session.payment_intent ? (await stripe.paymentIntents.retrieve(session.payment_intent)).client_secret : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Stripe payment error:', {
      message: error?.message,
      stack: error?.stack,
      type: error?.type,
      code: error?.code,
      statusCode: error?.statusCode,
      raw: error?.raw
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Payment initiation failed',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


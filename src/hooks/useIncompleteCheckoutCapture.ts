import { useEffect, useRef, useCallback } from 'react';
import { callEdgeFunction } from '@/lib/supabase-edge';

interface IncompleteCheckoutData {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_area?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  cart_items?: any[];
  subtotal?: number;
  shipping_cost?: number;
  total?: number;
  payment_method?: string;
  custom_fields?: Record<string, any>;
}

export const useIncompleteCheckoutCapture = (
  storeId: string | undefined,
  websiteId: string | null,
  funnelId: string | null,
  formData: IncompleteCheckoutData,
  cartItems: any[],
  enabled: boolean = true
) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const incompleteCheckoutIdRef = useRef<string | null>(null);

  // Get or create session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      let sessionId = sessionStorage.getItem('checkout_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('checkout_session_id', sessionId);
        console.log('[useIncompleteCheckoutCapture] Created new session ID:', sessionId);
      } else {
        console.log('[useIncompleteCheckoutCapture] Using existing session ID:', sessionId);
      }
      sessionIdRef.current = sessionId;
    }
  }, []);

  // Check if form has meaningful data (at least name or phone)
  const hasMeaningfulData = useCallback(() => {
    return !!(formData.customer_name?.trim() || formData.customer_phone?.trim());
  }, [formData.customer_name, formData.customer_phone]);

  // Save incomplete checkout to database
  const saveIncompleteCheckout = useCallback(async () => {
    console.log('[useIncompleteCheckoutCapture] saveIncompleteCheckout called', {
      storeId,
      enabled,
      hasMeaningfulData: hasMeaningfulData(),
      hasSessionId: !!sessionIdRef.current,
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
    });

    // ✅ FIX: If storeId is not ready yet, retry after a delay
    if (!storeId) {
      console.log('[useIncompleteCheckoutCapture] storeId not ready, will retry');
      // Retry after 500ms if storeId becomes available
      setTimeout(() => {
        if (storeId) {
          console.log('[useIncompleteCheckoutCapture] Retrying save after storeId became available');
          saveIncompleteCheckout();
        } else {
          console.warn('[useIncompleteCheckoutCapture] storeId still not available after retry');
        }
      }, 500);
      return;
    }

    if (!enabled) {
      console.log('[useIncompleteCheckoutCapture] Hook disabled, skipping save');
      return;
    }

    if (!hasMeaningfulData()) {
      console.log('[useIncompleteCheckoutCapture] No meaningful data (name or phone), skipping save');
      return;
    }

    if (!sessionIdRef.current) {
      console.warn('[useIncompleteCheckoutCapture] No session ID, skipping save');
      return;
    }

    try {
      const checkoutData = {
        store_id: storeId,
        website_id: websiteId || null,
        funnel_id: funnelId || null,
        customer_name: formData.customer_name || null,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        shipping_address: formData.shipping_address || null,
        shipping_city: formData.shipping_city || null,
        shipping_area: formData.shipping_area || null,
        shipping_country: formData.shipping_country || null,
        shipping_state: formData.shipping_state || null,
        shipping_postal_code: formData.shipping_postal_code || null,
        cart_items: cartItems || [],
        subtotal: formData.subtotal || 0,
        shipping_cost: formData.shipping_cost || 0,
        total: formData.total || 0,
        payment_method: formData.payment_method || null,
        custom_fields: formData.custom_fields || {},
        session_id: sessionIdRef.current,
        page_url: window.location.href,
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        last_updated_at: new Date().toISOString(),
      };

      console.log('[useIncompleteCheckoutCapture] Attempting to save incomplete checkout', {
        hasExistingId: !!incompleteCheckoutIdRef.current,
        storeId: checkoutData.store_id,
        customerName: checkoutData.customer_name,
        customerPhone: checkoutData.customer_phone,
        cartItemsCount: checkoutData.cart_items?.length || 0,
        total: checkoutData.total,
      });

      // Call Edge Function to securely capture incomplete checkout
      // Edge Function uses service role and handles deduplication
      console.log('[useIncompleteCheckoutCapture] Calling Edge Function to capture incomplete checkout');
      
      try {
        const result = await callEdgeFunction('capture-incomplete-checkout', {
          session_id: sessionIdRef.current,
          store_id: checkoutData.store_id,
          website_id: checkoutData.website_id,
          funnel_id: checkoutData.funnel_id,
          customer_name: checkoutData.customer_name,
          customer_email: checkoutData.customer_email,
          customer_phone: checkoutData.customer_phone,
          shipping_address: checkoutData.shipping_address,
          shipping_city: checkoutData.shipping_city,
          shipping_area: checkoutData.shipping_area,
          shipping_country: checkoutData.shipping_country,
          shipping_state: checkoutData.shipping_state,
          shipping_postal_code: checkoutData.shipping_postal_code,
          cart_items: checkoutData.cart_items,
          subtotal: checkoutData.subtotal,
          shipping_cost: checkoutData.shipping_cost,
          total: checkoutData.total,
          payment_method: checkoutData.payment_method,
          custom_fields: checkoutData.custom_fields,
          page_url: checkoutData.page_url,
          referrer: checkoutData.referrer,
          utm_source: checkoutData.utm_source,
          utm_campaign: checkoutData.utm_campaign,
          utm_medium: checkoutData.utm_medium,
          step: 'checkout_progress', // Indicates user is progressing through checkout
        });

        if (result?.id) {
          console.log('[useIncompleteCheckoutCapture] Successfully captured incomplete checkout:', result.id);
          incompleteCheckoutIdRef.current = result.id;
        } else {
          console.warn('[useIncompleteCheckoutCapture] Edge Function succeeded but no ID returned');
        }
      } catch (error: any) {
        console.error('[useIncompleteCheckoutCapture] Failed to capture incomplete checkout:', error);
        console.error('[useIncompleteCheckoutCapture] Error details:', {
          message: error?.message,
          details: error?.details,
          code: error?.code,
        });
        // Don't throw - silently fail to avoid disrupting user experience
      }
    } catch (error) {
      console.error('[useIncompleteCheckoutCapture] Exception saving incomplete checkout:', error);
      console.error('[useIncompleteCheckoutCapture] Exception stack:', (error as Error)?.stack);
    }
  }, [storeId, websiteId, funnelId, formData, cartItems, enabled, hasMeaningfulData]);

  // Debounced save (save 2 seconds after user stops typing)
  useEffect(() => {
    console.log('[useIncompleteCheckoutCapture] Debounce effect triggered', {
      enabled,
      hasMeaningfulData: hasMeaningfulData(),
      customerName: formData.customer_name,
      customerPhone: formData.customer_phone,
      storeId,
    });

    if (!enabled) {
      console.log('[useIncompleteCheckoutCapture] Hook disabled, not setting debounce timer');
      return;
    }

    if (!hasMeaningfulData()) {
      console.log('[useIncompleteCheckoutCapture] No meaningful data, not setting debounce timer');
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      console.log('[useIncompleteCheckoutCapture] Clearing existing debounce timer');
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    console.log('[useIncompleteCheckoutCapture] Setting debounce timer (2 seconds)');
    debounceTimerRef.current = setTimeout(() => {
      console.log('[useIncompleteCheckoutCapture] Debounce timer fired, calling saveIncompleteCheckout');
      saveIncompleteCheckout();
    }, 2000); // 2 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, cartItems, enabled, hasMeaningfulData, saveIncompleteCheckout, storeId]);

  // Save on page unload (beforeunload)
  useEffect(() => {
    if (!enabled || !hasMeaningfulData()) return;

    const handleBeforeUnload = () => {
      // Use synchronous save on page unload
      saveIncompleteCheckout();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, hasMeaningfulData, saveIncompleteCheckout]);

  // Cleanup function to mark incomplete checkout as completed when order is successfully placed
  // We'll call the Edge Function to mark it complete, or it can be handled server-side
  const clearIncompleteCheckout = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        // Call Edge Function to mark checkout as completed
        // The Edge Function can handle this, or we can create a separate endpoint
        // For now, just clear the local reference
        incompleteCheckoutIdRef.current = null;
        sessionStorage.removeItem('checkout_session_id');
        console.log('[useIncompleteCheckoutCapture] Cleared incomplete checkout reference');
      } catch (error) {
        // Silently fail
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to clear incomplete checkout:', error);
        }
      }
    }
  }, []);

  return { clearIncompleteCheckout };
};

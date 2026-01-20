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
      }
      sessionIdRef.current = sessionId;
    }
  }, []);

  // Check if form has meaningful data (at least name or phone)
  const hasMeaningfulData = useCallback(() => {
    return !!(formData.customer_name?.trim() || formData.customer_phone?.trim());
  }, [formData.customer_name, formData.customer_phone]);

  // Save incomplete checkout via Edge Function (secure server-side capture)
  const saveIncompleteCheckout = useCallback(async () => {
    // If storeId is not ready yet, retry after a delay
    if (!storeId) {
      setTimeout(() => {
        if (storeId) {
          saveIncompleteCheckout();
        }
      }, 500);
      return;
    }

    if (!enabled || !hasMeaningfulData() || !sessionIdRef.current) {
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

      // Call Edge Function to securely capture incomplete checkout
      // Edge Function uses service role, validates input, and handles deduplication
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
          step: 'checkout_progress',
        });

        if (result?.id) {
          incompleteCheckoutIdRef.current = result.id;
        }
      } catch (error: any) {
        // Silently fail to avoid disrupting user experience
        // Errors are logged server-side in Edge Function
        if (process.env.NODE_ENV === 'development') {
          console.error('[useIncompleteCheckoutCapture] Failed to capture:', error);
        }
      }
    } catch (error) {
      console.error('[useIncompleteCheckoutCapture] Exception saving incomplete checkout:', error);
      console.error('[useIncompleteCheckoutCapture] Exception stack:', (error as Error)?.stack);
    }
  }, [storeId, websiteId, funnelId, formData, cartItems, enabled, hasMeaningfulData]);

  // Debounced save (save 2 seconds after user stops typing)
  useEffect(() => {
    if (!enabled || !hasMeaningfulData()) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
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

  // Cleanup function - clear local reference when order is successfully placed
  // The incomplete checkout record can be cleaned up server-side or marked as completed
  const clearIncompleteCheckout = useCallback(async () => {
    incompleteCheckoutIdRef.current = null;
    sessionStorage.removeItem('checkout_session_id');
  }, []);

  return { clearIncompleteCheckout };
};

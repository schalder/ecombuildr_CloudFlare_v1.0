import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Update existing or create new
      if (incompleteCheckoutIdRef.current) {
        console.log('[useIncompleteCheckoutCapture] Updating existing incomplete checkout:', incompleteCheckoutIdRef.current);
        const { data, error } = await supabase
          .from('incomplete_checkouts')
          .update(checkoutData)
          .eq('id', incompleteCheckoutIdRef.current)
          .select()
          .single();
        
        if (error) {
          console.error('[useIncompleteCheckoutCapture] Failed to update incomplete checkout:', error);
          console.error('[useIncompleteCheckoutCapture] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
        } else {
          console.log('[useIncompleteCheckoutCapture] Successfully updated incomplete checkout:', data?.id);
        }
      } else {
        console.log('[useIncompleteCheckoutCapture] Creating new incomplete checkout');
        const { data, error } = await supabase
          .from('incomplete_checkouts')
          .insert(checkoutData)
          .select()
          .single();
        
        if (error) {
          console.error('[useIncompleteCheckoutCapture] Failed to insert incomplete checkout:', error);
          console.error('[useIncompleteCheckoutCapture] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          console.log('[useIncompleteCheckoutCapture] Attempted to insert:', {
            store_id: storeId,
            hasName: !!formData.customer_name,
            hasPhone: !!formData.customer_phone,
            cartItemsCount: cartItems?.length || 0,
            sessionId: sessionIdRef.current,
          });
        } else if (data) {
          console.log('[useIncompleteCheckoutCapture] Successfully created incomplete checkout:', data.id);
          incompleteCheckoutIdRef.current = data.id;
        } else {
          console.warn('[useIncompleteCheckoutCapture] Insert succeeded but no data returned');
        }
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

  // Cleanup function to delete incomplete checkout when order is successfully placed
  const clearIncompleteCheckout = useCallback(async () => {
    if (incompleteCheckoutIdRef.current) {
      try {
        await supabase
          .from('incomplete_checkouts')
          .delete()
          .eq('id', incompleteCheckoutIdRef.current);
        incompleteCheckoutIdRef.current = null;
        sessionStorage.removeItem('checkout_session_id');
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

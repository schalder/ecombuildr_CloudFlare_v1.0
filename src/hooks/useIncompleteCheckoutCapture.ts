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
    if (!storeId || !enabled || !hasMeaningfulData() || !sessionIdRef.current) {
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

      // Update existing or create new
      if (incompleteCheckoutIdRef.current) {
        await supabase
          .from('incomplete_checkouts')
          .update(checkoutData)
          .eq('id', incompleteCheckoutIdRef.current);
      } else {
        const { data, error } = await supabase
          .from('incomplete_checkouts')
          .insert(checkoutData)
          .select()
          .single();
        
        if (data && !error) {
          incompleteCheckoutIdRef.current = data.id;
        }
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save incomplete checkout:', error);
      }
    }
  }, [storeId, websiteId, funnelId, formData, cartItems, enabled, hasMeaningfulData]);

  // Debounced save (save 2 seconds after user stops typing)
  useEffect(() => {
    if (!enabled || !hasMeaningfulData()) return;

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
  }, [formData, cartItems, enabled, hasMeaningfulData, saveIncompleteCheckout]);

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

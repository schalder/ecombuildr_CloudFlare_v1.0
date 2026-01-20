import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, shouldDisableTracking } from '@/lib/logger';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    _fbq?: any;
    _gtag?: any;
  }
}

interface PixelConfig {
  facebook_pixel_id?: string;
  google_analytics_id?: string;
  google_ads_id?: string;
}

interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
}

interface EcommerceEvent {
  currency?: string;
  value?: number;
  items?: EcommerceItem[];
  transaction_id?: string;
  event_id?: string;
}

// Helper function to extract Facebook browser context cookies
const getFacebookBrowserContext = () => {
  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return {
      fbp: cookies['_fbp'] || null, // Facebook Browser ID
      fbc: cookies['_fbc'] || null, // Facebook Click ID
      client_user_agent: navigator.userAgent,
      event_source_url: window.location.href,
    };
  } catch (error) {
    logger.warn('[PixelTracking] Failed to extract browser context:', error);
    return {
      fbp: null,
      fbc: null,
      client_user_agent: navigator.userAgent,
      event_source_url: window.location.href,
    };
  }
};

export const usePixelTracking = (pixelConfig?: PixelConfig, storeId?: string, websiteId?: string, funnelId?: string) => {
  const storePixelEvent = useCallback(async (eventType: string, eventData: any, providers?: { facebook?: { configured: boolean; attempted: boolean; success: boolean }; google?: { configured: boolean; attempted: boolean; success: boolean } }) => {
    if (!storeId) {
      // ✅ FIX: Add detailed logging when storeId is missing
      console.error('[PixelTracking] storePixelEvent called without storeId:', {
        eventType,
        websiteId,
        funnelId,
        hasPixelConfig: !!pixelConfig,
        eventData: Object.keys(eventData || {}),
        stackTrace: new Error().stack?.split('\n').slice(0, 5).join('\n')
      });
      return; // Still return early, but log the error
    }
    
    try {
      // Ensure session consistency
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('session_id', sessionId);
      }
      
      // Generate event_id for deduplication (consistent between client and server-side)
      // Use existing event_id if provided, otherwise generate one
      const eventId = eventData.event_id || `${eventType}_${Date.now()}_${sessionId}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Capture browser context for server-side matching (when PII is missing)
      const browserContext = getFacebookBrowserContext();
      
      // Add provider metadata, event_id, and browser context to event data
      const enhancedEventData = {
        ...eventData,
        event_id: eventId,
        _providers: providers || {},
        // Browser context for server-side matching (when PII is missing)
        fbp: browserContext.fbp,
        fbc: browserContext.fbc,
        client_user_agent: browserContext.client_user_agent,
        event_source_url: browserContext.event_source_url,
      };
      
      const eventRecord = {
        store_id: storeId,
        website_id: websiteId || null,
        funnel_id: funnelId || null,
        event_type: eventType,
        event_data: enhancedEventData,
        session_id: sessionId,
        page_url: window.location.href,
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_term: new URLSearchParams(window.location.search).get('utm_term'),
        utm_content: new URLSearchParams(window.location.search).get('utm_content'),
        user_agent: navigator.userAgent,
      };
      
      // Add funnel context if available
      if (funnelId) {
        eventRecord.event_data = { ...enhancedEventData, funnel_id: funnelId };
      }

      await supabase.from('pixel_events').insert(eventRecord);
      logger.debug('[PixelTracking] Stored event in database:', eventType, enhancedEventData, { websiteId, funnelId, eventId });
    } catch (error) {
      logger.warn('[PixelTracking] Failed to store event:', error);
    }
  }, [storeId, websiteId, funnelId]);

  const trackEvent = useCallback((eventName: string, eventData: any = {}) => {
    // Skip tracking entirely in dashboard/builder routes
    if (shouldDisableTracking()) {
      return;
    }

    // Warn if tracking is called without store ID (helps debugging)
    if (!storeId) {
      console.warn('[PixelTracking] trackEvent called without storeId - events will not be stored in database');
    }

    // Track provider attempts and success
    const providers = {
      facebook: {
        configured: !!pixelConfig?.facebook_pixel_id,
        attempted: false,
        success: false
      },
      google: {
        configured: !!(pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id),
        attempted: false,
        success: false
      }
    };

    // Generate event_id ONCE - use same ID for browser pixel AND server-side
    // This ensures proper deduplication between browser and server events
    const eventId = eventData.event_id || `${eventName}_${Date.now()}_${crypto.randomUUID()}`;
    const eventDataWithId = {
      ...eventData,
      event_id: eventId // Same event_id used for both browser and server
    };

    // Facebook Pixel tracking - fire if fbq is available (regardless of pixelConfig)
    if (window.fbq) {
      providers.facebook.attempted = true;
      try {
        // ✅ FIX: Pass event_id in options parameter (4th argument) for proper deduplication
        // Facebook Pixel requires eventID in options, not inside eventData
        window.fbq('track', eventName, eventDataWithId, { eventID: eventId });
        providers.facebook.success = true;
        logger.debug('[PixelTracking] Facebook event:', eventName, eventDataWithId, { eventID: eventId });
      } catch (error) {
        logger.warn('[PixelTracking] Facebook tracking error:', error);
      }
    }

    // Google Analytics 4 tracking
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      providers.google.attempted = true;
      try {
        window.gtag('event', eventName.toLowerCase().replace(/([A-Z])/g, '_$1'), {
          ...eventData,
          send_to: pixelConfig?.google_analytics_id,
        });
        providers.google.success = true;
        logger.debug('[PixelTracking] Google event:', eventName, eventData);
      } catch (error) {
        logger.warn('[PixelTracking] Google tracking error:', error);
      }
    }

    // Store event in database with provider metadata and same event_id for server-side forwarding
    storePixelEvent(eventName, eventDataWithId, providers);
  }, [pixelConfig, storePixelEvent]);

  const trackViewContent = useCallback((product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }) => {
    const eventData = {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'BDT',
    };

    // Facebook Pixel
    trackEvent('ViewContent', eventData);

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'BDT',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: 1,
          item_category: product.category,
        }],
      });
    }
  }, [trackEvent, pixelConfig]);

  const trackAddToCart = useCallback((product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    variant?: string;
  }) => {
    const eventData = {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * product.quantity,
      currency: 'BDT',
      contents: [{
        id: product.id,
        quantity: product.quantity,
        price: product.price, // ✅ Add price for server-side tracking
      }],
    };


    // Facebook Pixel
    trackEvent('AddToCart', eventData);

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'BDT',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
          item_category: product.category,
          item_variant: product.variant,
        }],
      });
    }
  }, [trackEvent, pixelConfig]);

  const trackInitiateCheckout = useCallback((data: {
    value: number;
    items: EcommerceItem[];
  }) => {
    console.log('[usePixelTracking] 🔍 trackInitiateCheckout called', {
      value: data.value,
      itemsCount: data.items.length,
      items: data.items,
      storeId,
      websiteId,
      funnelId,
      hasPixelConfig: !!pixelConfig,
      hasTrackEvent: typeof trackEvent === 'function'
    });
    
    const eventData = {
      content_ids: data.items.map(item => item.item_id),
      value: data.value,
      currency: 'BDT',
      num_items: data.items.reduce((sum, item) => sum + item.quantity, 0),
      contents: data.items.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
        price: item.price, // ✅ Add price for server-side tracking
      })),
    };

    console.log('[usePixelTracking] 📤 Calling trackEvent for InitiateCheckout', {
      eventData,
      storeId
    });

    // Facebook Pixel
    trackEvent('InitiateCheckout', eventData);

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'BDT',
        value: data.value,
        items: data.items,
      });
    }
  }, [trackEvent, pixelConfig]);

  const trackPurchase = useCallback((data: {
    transaction_id: string;
    value: number;
    items: EcommerceItem[];
    // Optional customer data for better Facebook matching
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_name?: string | null;
    shipping_city?: string | null;
    shipping_state?: string | null;
    shipping_postal_code?: string | null;
    shipping_country?: string | null;
  }) => {
    const eventData = {
      content_ids: data.items.map(item => item.item_id),
      content_type: 'product',
      value: data.value,
      currency: 'BDT',
      contents: data.items.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
        price: item.price, // ✅ Add price for server-side tracking
      })),
      // ✅ Include customer data for better Facebook matching (extracted by database trigger)
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone || null,
      customer_name: data.customer_name || null,
      shipping_city: data.shipping_city || null,
      shipping_state: data.shipping_state || null,
      shipping_postal_code: data.shipping_postal_code || null,
      shipping_country: data.shipping_country || null,
    };

    // Facebook Pixel
    trackEvent('Purchase', eventData);

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: data.transaction_id,
        currency: 'BDT',
        value: data.value,
        items: data.items,
      });
    }
  }, [trackEvent, pixelConfig]);

  const trackPageView = useCallback((data?: {
    page_title?: string;
    page_location?: string;
  }) => {
    // Skip tracking entirely in dashboard/builder routes
    if (shouldDisableTracking()) {
      return;
    }

    // Generate event_id for PageView
    // ✅ FIX: Since we disabled auto PageView, we don't need deduplication check here
    const currentUrl = data?.page_location || window.location.href;
    const eventId = `PageView_${currentUrl}_${Math.floor(Date.now() / 1000)}`;
    const eventData = {
      page_title: data?.page_title || document.title,
      page_location: currentUrl,
      referrer: document.referrer || null,
      event_id: eventId, // Include in eventData for server-side
    };

    // Track provider attempts and success
    const providers = {
      facebook: {
        configured: !!pixelConfig?.facebook_pixel_id,
        attempted: false,
        success: false
      },
      google: {
        configured: !!(pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id),
        attempted: false,
        success: false
      }
    };

    // Facebook Pixel - fire if fbq is available
    if (window.fbq) {
      providers.facebook.attempted = true;
      try {
        // ✅ FIX: Pass event_id in options parameter for PageView too
        window.fbq('track', 'PageView', eventData, { eventID: eventId });
        providers.facebook.success = true;
      } catch (error) {
        logger.warn('[PixelTracking] Facebook PageView tracking error:', error);
      }
    }

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      providers.google.attempted = true;
      try {
        window.gtag('event', 'page_view', {
          page_title: data?.page_title || document.title,
          page_location: data?.page_location || window.location.href,
        });
        providers.google.success = true;
      } catch (error) {
        logger.warn('[PixelTracking] Google PageView tracking error:', error);
      }
    }

    // Store PageView event in database with provider metadata
    storePixelEvent('PageView', eventData, providers);
  }, [pixelConfig, storePixelEvent]);

  const trackSearch = useCallback((data: {
    search_string: string;
    content_category?: string;
  }) => {
    const eventData = {
      search_string: data.search_string,
      content_category: data.content_category || 'product',
    };

    // Facebook Pixel
    trackEvent('Search', eventData);

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'search', {
        search_term: data.search_string,
      });
    }
  }, [trackEvent, pixelConfig]);

  const trackAddPaymentInfo = useCallback((data: {
    currency?: string;
    value?: number;
    payment_type?: string;
    items?: EcommerceItem[];
  }) => {
    const eventData = {
      currency: data.currency || 'BDT',
      value: data.value || 0,
      payment_type: data.payment_type || 'credit_card',
      content_ids: data.items?.map(item => item.item_id) || [],
      contents: data.items?.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
        price: item.price, // ✅ Add price for server-side tracking
      })) || [],
    };

    // Facebook Pixel
    trackEvent('AddPaymentInfo', eventData);

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'add_payment_info', {
        currency: data.currency || 'BDT',
        value: data.value || 0,
        payment_type: data.payment_type || 'credit_card',
        items: data.items || [],
      });
    }
  }, [trackEvent, pixelConfig]);

  return {
    trackEvent,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackPageView,
    trackSearch,
    trackAddPaymentInfo,
  };
};
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const usePixelTracking = (pixelConfig?: PixelConfig, storeId?: string) => {
  const storePixelEvent = useCallback(async (eventType: string, eventData: any) => {
    if (!storeId) return;
    
    try {
      // For now, just log the event since pixel_events table needs to be created
      console.debug('[PixelTracking] Would store event in database:', eventType, eventData);
      
      // TODO: Uncomment when pixel_events table is created
      // await supabase.from('pixel_events').insert({
      //   store_id: storeId,
      //   event_type: eventType,
      //   event_data: eventData,
      //   session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
      //   page_url: window.location.href,
      //   referrer: document.referrer,
      //   utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      //   utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      //   utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      //   utm_term: new URLSearchParams(window.location.search).get('utm_term'),
      //   utm_content: new URLSearchParams(window.location.search).get('utm_content'),
      //   user_agent: navigator.userAgent,
      // });
    } catch (error) {
      console.warn('[PixelTracking] Failed to store event:', error);
    }
  }, [storeId]);

  const trackEvent = useCallback((eventName: string, eventData: any = {}) => {
    // Store event in database
    storePixelEvent(eventName, eventData);

    // Facebook Pixel tracking
    if (pixelConfig?.facebook_pixel_id && window.fbq) {
      try {
        window.fbq('track', eventName, eventData);
        console.debug('[PixelTracking] Facebook event:', eventName, eventData);
      } catch (error) {
        console.warn('[PixelTracking] Facebook tracking error:', error);
      }
    }

    // Google Analytics 4 tracking
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      try {
        window.gtag('event', eventName.toLowerCase().replace(/([A-Z])/g, '_$1'), {
          ...eventData,
          send_to: pixelConfig?.google_analytics_id,
        });
        console.debug('[PixelTracking] Google event:', eventName, eventData);
      } catch (error) {
        console.warn('[PixelTracking] Google tracking error:', error);
      }
    }
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
    const eventData = {
      content_ids: data.items.map(item => item.item_id),
      value: data.value,
      currency: 'BDT',
      num_items: data.items.reduce((sum, item) => sum + item.quantity, 0),
      contents: data.items.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
      })),
    };

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
  }) => {
    const eventData = {
      content_ids: data.items.map(item => item.item_id),
      content_type: 'product',
      value: data.value,
      currency: 'BDT',
      contents: data.items.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
      })),
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
    // Facebook Pixel
    if (pixelConfig?.facebook_pixel_id && window.fbq) {
      window.fbq('track', 'PageView');
    }

    // Google Analytics 4
    if ((pixelConfig?.google_analytics_id || pixelConfig?.google_ads_id) && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: data?.page_title || document.title,
        page_location: data?.page_location || window.location.href,
      });
    }
  }, [pixelConfig]);

  return {
    trackEvent,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackPageView,
  };
};
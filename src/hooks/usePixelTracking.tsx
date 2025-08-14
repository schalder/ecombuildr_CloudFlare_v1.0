import { useEffect, useRef } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';

interface PixelEvent {
  event_type: string;
  event_data: Record<string, any>;
  page_url?: string;
  user_id?: string;
  session_id?: string;
}

interface ProductData {
  content_ids: string[];
  content_name?: string;
  content_category?: string;
  value: number;
  currency: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
}

// Declare global Facebook Pixel functions
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    gtag: (...args: any[]) => void;
    _fbq_loaded?: boolean;
    _gtag_loaded?: boolean;
  }
}

export const usePixelTracking = () => {
  const { store } = useStore();
  const sessionId = useRef<string>();
  const pixelsLoaded = useRef<Set<string>>(new Set());

  // Generate session ID once
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Load Facebook Pixel
  const loadFacebookPixel = (pixelId: string) => {
    if (pixelsLoaded.current.has(`fb_${pixelId}`) || window._fbq_loaded) return;
    
    // Initialize Facebook Pixel
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    window._fbq_loaded = true;
    pixelsLoaded.current.add(`fb_${pixelId}`);
    
    console.log('Facebook Pixel loaded:', pixelId);
  };

  // Load Google Analytics/Ads
  const loadGoogleAnalytics = (trackingId: string) => {
    if (pixelsLoaded.current.has(`ga_${trackingId}`) || window._gtag_loaded) return;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = function(...args: any[]) {
      (window.gtag as any).queue = (window.gtag as any).queue || [];
      (window.gtag as any).queue.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', trackingId);
    
    window._gtag_loaded = true;
    pixelsLoaded.current.add(`ga_${trackingId}`);
    
    console.log('Google Analytics loaded:', trackingId);
  };

  // Load pixels when store changes
  useEffect(() => {
    if (!store) return;

    const { facebook_pixel_id, google_analytics_id, google_ads_id } = store;

    if (facebook_pixel_id && !pixelsLoaded.current.has(`fb_${facebook_pixel_id}`)) {
      loadFacebookPixel(facebook_pixel_id);
    }

    if (google_analytics_id && !pixelsLoaded.current.has(`ga_${google_analytics_id}`)) {
      loadGoogleAnalytics(google_analytics_id);
    }

    if (google_ads_id && !pixelsLoaded.current.has(`ga_${google_ads_id}`)) {
      loadGoogleAnalytics(google_ads_id);
    }
  }, [store]);

  // Get URL parameters
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_medium: urlParams.get('utm_medium'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
      fbclid: urlParams.get('fbclid'),
      gclid: urlParams.get('gclid'),
    };
  };

  // Track pixel event
  const trackEvent = async (eventType: string, eventData: Record<string, any> = {}) => {
    if (!store) return;

    const urlParams = getUrlParams();
    const event: PixelEvent = {
      event_type: eventType,
      event_data: eventData,
      page_url: window.location.href,
      session_id: sessionId.current,
    };

    try {
      // Store event in database for analytics
      await supabase.from('pixel_events').insert({
        store_id: store.id,
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId.current,
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        ...urlParams,
      });
    } catch (error) {
      console.error('Failed to store pixel event:', error);
    }

    // Fire Facebook Pixel events
    if (window.fbq && store.facebook_pixel_id) {
      try {
        switch (eventType) {
          case 'PageView':
            window.fbq('track', 'PageView');
            break;
          case 'ViewContent':
            window.fbq('track', 'ViewContent', eventData);
            break;
          case 'AddToCart':
            window.fbq('track', 'AddToCart', eventData);
            break;
          case 'InitiateCheckout':
            window.fbq('track', 'InitiateCheckout', eventData);
            break;
          case 'Purchase':
            window.fbq('track', 'Purchase', eventData);
            break;
          case 'Search':
            window.fbq('track', 'Search', eventData);
            break;
          default:
            window.fbq('trackCustom', eventType, eventData);
        }
      } catch (error) {
        console.error('Facebook Pixel tracking error:', error);
      }
    }

    // Fire Google Analytics events
    if (window.gtag && (store.google_analytics_id || store.google_ads_id)) {
      try {
        switch (eventType) {
          case 'PageView':
            // PageView is automatically tracked by gtag config
            break;
          case 'ViewContent':
            window.gtag('event', 'view_item', {
              currency: eventData.currency || 'BDT',
              value: eventData.value || 0,
              items: eventData.contents || [],
            });
            break;
          case 'AddToCart':
            window.gtag('event', 'add_to_cart', {
              currency: eventData.currency || 'BDT',
              value: eventData.value || 0,
              items: eventData.contents || [],
            });
            break;
          case 'InitiateCheckout':
            window.gtag('event', 'begin_checkout', {
              currency: eventData.currency || 'BDT',
              value: eventData.value || 0,
              items: eventData.contents || [],
            });
            break;
          case 'Purchase':
            window.gtag('event', 'purchase', {
              transaction_id: eventData.transaction_id,
              currency: eventData.currency || 'BDT',
              value: eventData.value || 0,
              items: eventData.contents || [],
            });
            break;
          case 'Search':
            window.gtag('event', 'search', {
              search_term: eventData.search_string || '',
            });
            break;
          default:
            window.gtag('event', eventType, eventData);
        }
      } catch (error) {
        console.error('Google Analytics tracking error:', error);
      }
    }

    console.log('Pixel event tracked:', eventType, eventData);
  };

  // Specific tracking methods
  const trackPageView = () => {
    trackEvent('PageView');
  };

  const trackViewContent = (productData: ProductData) => {
    trackEvent('ViewContent', productData);
  };

  const trackAddToCart = (productData: ProductData) => {
    trackEvent('AddToCart', productData);
  };

  const trackInitiateCheckout = (checkoutData: { value: number; currency: string; contents: any[] }) => {
    trackEvent('InitiateCheckout', checkoutData);
  };

  const trackPurchase = (purchaseData: { 
    transaction_id: string;
    value: number;
    currency: string;
    contents: any[];
  }) => {
    trackEvent('Purchase', purchaseData);
  };

  const trackSearch = (searchString: string) => {
    trackEvent('Search', { search_string: searchString });
  };

  return {
    trackEvent,
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
  };
};
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
    _fbq?: any;
    gtag: (...args: any[]) => void;
    _fbq_loaded?: boolean;
    _gtag_loaded?: boolean;
  }
}

interface PixelConfig {
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  googleAdsId?: string;
}

export const usePixelTracking = (websitePixels?: PixelConfig) => {
  const { store } = useStore();
  const sessionId = useRef<string>();
  const currentPixels = useRef<{
    facebookPixelId?: string;
    googleAnalyticsId?: string;
    googleAdsId?: string;
  }>({});

  // Generate session ID once
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Cleanup function for removing pixels
  const cleanupPixels = () => {
    // Remove Facebook Pixel scripts
    const fbScripts = document.querySelectorAll('script[data-pixel-id^="fb-"]');
    fbScripts.forEach(script => script.remove());
    
    // Remove Google Analytics scripts
    const gaScripts = document.querySelectorAll('script[data-pixel-id^="ga-"]');
    gaScripts.forEach(script => script.remove());
    
    // Reset global variables
    delete window.fbq;
    delete window._fbq;
    delete window._fbq_loaded;
    delete window._gtag_loaded;
    
    // Clear current pixels
    currentPixels.current = {};
  };

  // Load Facebook Pixel
  const loadFacebookPixel = (pixelId: string) => {
    // If same pixel is already loaded, skip
    if (currentPixels.current.facebookPixelId === pixelId) return;
    
    // Remove previous Facebook Pixel if different
    if (currentPixels.current.facebookPixelId && currentPixels.current.facebookPixelId !== pixelId) {
      const existingScripts = document.querySelectorAll('script[data-pixel-id^="fb-"]');
      existingScripts.forEach(script => script.remove());
      delete window.fbq;
      delete window._fbq;
      delete window._fbq_loaded;
    }
    
    // Load new pixel
    if (!document.querySelector(`script[data-pixel-id="fb-${pixelId}"]`)) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      script.setAttribute('data-pixel-id', `fb-${pixelId}`);
      document.head.appendChild(script);
      
      currentPixels.current.facebookPixelId = pixelId;
      console.log('Facebook Pixel loaded:', pixelId);
    }
  };

  // Load Google Analytics/Ads
  const loadGoogleAnalytics = (trackingId: string, isAds: boolean = false) => {
    const pixelKey = isAds ? 'googleAdsId' : 'googleAnalyticsId';
    
    // If same tracking ID is already loaded, skip
    if (currentPixels.current[pixelKey] === trackingId) return;
    
    // Remove previous Google Analytics/Ads if different
    if (currentPixels.current[pixelKey] && currentPixels.current[pixelKey] !== trackingId) {
      const existingScripts = document.querySelectorAll(`script[data-pixel-id^="ga-"]`);
      existingScripts.forEach(script => {
        if (script.getAttribute('data-pixel-id')?.includes(currentPixels.current[pixelKey]!)) {
          script.remove();
        }
      });
    }
    
    // Load new tracking
    if (!document.querySelector(`script[data-pixel-id="ga-${trackingId}"]`)) {
      // Load gtag script
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      gtagScript.setAttribute('data-pixel-id', `ga-${trackingId}`);
      document.head.appendChild(gtagScript);

      // Initialize gtag
      const initScript = document.createElement('script');
      initScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingId}');
      `;
      initScript.setAttribute('data-pixel-id', `ga-init-${trackingId}`);
      document.head.appendChild(initScript);
      
      currentPixels.current[pixelKey] = trackingId;
      console.log(`Google ${isAds ? 'Ads' : 'Analytics'} loaded:`, trackingId);
    }
  };

  // Load pixels when store or websitePixels change
  useEffect(() => {
    // Prioritize website pixels over store pixels
    const facebookPixelId = websitePixels?.facebookPixelId || store?.facebook_pixel_id;
    const googleAnalyticsId = websitePixels?.googleAnalyticsId || store?.google_analytics_id;
    const googleAdsId = websitePixels?.googleAdsId || store?.google_ads_id;

    if (facebookPixelId) {
      loadFacebookPixel(facebookPixelId);
    }

    if (googleAnalyticsId) {
      loadGoogleAnalytics(googleAnalyticsId, false);
    }

    if (googleAdsId) {
      loadGoogleAnalytics(googleAdsId, true);
    }

    // Cleanup function when component unmounts or pixels change
    return () => {
      // Only cleanup if pixels are actually changing, not just unmounting
      const newFacebookPixelId = websitePixels?.facebookPixelId || store?.facebook_pixel_id;
      const newGoogleAnalyticsId = websitePixels?.googleAnalyticsId || store?.google_analytics_id;
      const newGoogleAdsId = websitePixels?.googleAdsId || store?.google_ads_id;
      
      if (currentPixels.current.facebookPixelId && currentPixels.current.facebookPixelId !== newFacebookPixelId) {
        const fbScripts = document.querySelectorAll('script[data-pixel-id^="fb-"]');
        fbScripts.forEach(script => script.remove());
        delete window.fbq;
        delete window._fbq;
      }
    };
  }, [store, websitePixels]);

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

    // Prioritize website pixels over store pixels
    const facebookPixelId = websitePixels?.facebookPixelId || store?.facebook_pixel_id;
    const googleAnalyticsId = websitePixels?.googleAnalyticsId || store?.google_analytics_id;
    const googleAdsId = websitePixels?.googleAdsId || store?.google_ads_id;

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
    if (window.fbq && facebookPixelId) {
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
    if (window.gtag && (googleAnalyticsId || googleAdsId)) {
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
import React, { useEffect } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { useWebsiteContext } from '@/contexts/WebsiteContext';
import { logger, shouldDisableTracking } from '@/lib/logger';

interface PixelManagerProps {
  websitePixels?: {
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
  };
  children: React.ReactNode;
  storeId?: string;
  funnelId?: string;
}

const PixelContext = React.createContext<{
  pixels?: {
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
  };
  updatePixels?: (pixels: {
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
  }) => void;
}>({});

export const usePixelContext = () => React.useContext(PixelContext);

export const PixelManager: React.FC<PixelManagerProps> = ({ websitePixels: initialPixels, children, storeId, funnelId: propFunnelId }) => {
  const [currentPixels, setCurrentPixels] = React.useState(initialPixels);
  const { websiteId } = useWebsiteContext();
  
  // Use passed funnelId or extract from URL if it's a funnel route
  const funnelId = React.useMemo(() => {
    if (propFunnelId) return propFunnelId;
    const path = window.location.pathname;
    const funnelMatch = path.match(/\/funnel\/([^\/]+)/);
    return funnelMatch ? funnelMatch[1] : undefined;
  }, [propFunnelId]);
  
  // ✅ CRITICAL: Update pixels when initialPixels prop changes
  // This ensures PixelManager updates when website/funnel data loads
  React.useEffect(() => {
    if (initialPixels) {
      setCurrentPixels(initialPixels);
    }
  }, [initialPixels]);
  
  const { trackPageView } = usePixelTracking(currentPixels, storeId, websiteId, funnelId);

  const updatePixels = React.useCallback((newPixels: any) => {
    logger.debug('[PixelManager] Updating pixels:', newPixels);
    setCurrentPixels(newPixels);
  }, []);

  useEffect(() => {
    if (!currentPixels || shouldDisableTracking()) return;

    // Load Facebook Pixel
    if (currentPixels.facebook_pixel_id && !window.fbq) {
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
        fbq('init', '${currentPixels.facebook_pixel_id}');
      `;
      document.head.appendChild(script);
      
      const noscript = document.createElement('noscript');
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = `https://www.facebook.com/tr?id=${currentPixels.facebook_pixel_id}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.head.appendChild(noscript);
      
      logger.debug('[PixelManager] Facebook Pixel loaded:', currentPixels.facebook_pixel_id);
    }

    // Load Google Analytics/Ads
    if ((currentPixels.google_analytics_id || currentPixels.google_ads_id) && !window.gtag) {
      const gtagId = currentPixels.google_analytics_id || currentPixels.google_ads_id;
      
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
      document.head.appendChild(script1);
      
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        ${currentPixels.google_analytics_id ? `gtag('config', '${currentPixels.google_analytics_id}');` : ''}
        ${currentPixels.google_ads_id ? `gtag('config', '${currentPixels.google_ads_id}');` : ''}
      `;
      document.head.appendChild(script2);
      
      logger.debug('[PixelManager] Google Analytics/Ads loaded:', gtagId);
    }

    // Track initial page view
    const timer = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentPixels, trackPageView]);

  // Track navigation changes using browser's History API (works everywhere)
  useEffect(() => {
    if (!currentPixels || shouldDisableTracking()) return;

    let lastUrl = window.location.href;
    
    const handleNavigation = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        trackPageView();
      }
    };

    // Listen to popstate (back/forward buttons)
    window.addEventListener('popstate', handleNavigation);
    
    // Listen to pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleNavigation, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleNavigation, 0);
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentPixels, trackPageView]);

  return (
    <PixelContext.Provider value={{ pixels: currentPixels, updatePixels }}>
      {children}
    </PixelContext.Provider>
  );
};
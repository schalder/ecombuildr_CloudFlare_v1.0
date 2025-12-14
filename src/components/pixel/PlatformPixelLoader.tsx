import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, shouldDisableTracking } from '@/lib/logger';

interface PlatformPixelLoaderProps {
  children: React.ReactNode;
}

export const PlatformPixelLoader: React.FC<PlatformPixelLoaderProps> = ({ children }) => {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch platform tracking settings
    const fetchPixelSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_tracking_settings')
          .select('facebook_pixel_id')
          .maybeSingle();

        if (error) {
          logger.warn('[PlatformPixelLoader] Error fetching pixel settings:', error);
          return;
        }

        if (data?.facebook_pixel_id) {
          setPixelId(data.facebook_pixel_id);
        }
      } catch (error) {
        logger.warn('[PlatformPixelLoader] Error fetching pixel settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPixelSettings();
  }, []);

  useEffect(() => {
    if (!pixelId || loading || shouldDisableTracking()) return;

    // Load Facebook Pixel script if not already loaded
    if (!window.fbq) {
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
      document.head.appendChild(script);
      
      // Add noscript fallback
      const noscript = document.createElement('noscript');
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.head.appendChild(noscript);
      
      logger.debug('[PlatformPixelLoader] Facebook Pixel loaded:', pixelId);
    } else {
      // Pixel already loaded, just track PageView
      try {
        window.fbq('track', 'PageView');
        logger.debug('[PlatformPixelLoader] PageView tracked');
      } catch (error) {
        logger.warn('[PlatformPixelLoader] Error tracking PageView:', error);
      }
    }
  }, [pixelId, loading]);

  // Track page views on navigation
  useEffect(() => {
    if (!pixelId || loading || shouldDisableTracking()) return;

    let lastUrl = window.location.href;
    
    const handleNavigation = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl && window.fbq) {
        lastUrl = currentUrl;
        try {
          window.fbq('track', 'PageView');
          logger.debug('[PlatformPixelLoader] PageView tracked on navigation');
        } catch (error) {
          logger.warn('[PlatformPixelLoader] Error tracking PageView on navigation:', error);
        }
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
  }, [pixelId, loading]);

  return <>{children}</>;
};


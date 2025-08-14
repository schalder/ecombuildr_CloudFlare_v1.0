import React, { useEffect } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';

interface PixelManagerProps {
  websitePixels?: {
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
  };
  children: React.ReactNode;
}

const PixelContext = React.createContext<{
  pixels?: {
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
  };
}>({});

export const usePixelContext = () => React.useContext(PixelContext);

export const PixelManager: React.FC<PixelManagerProps> = ({ websitePixels, children }) => {
  const { trackPageView } = usePixelTracking(websitePixels);

  useEffect(() => {
    if (!websitePixels) return;

    // Load Facebook Pixel
    if (websitePixels.facebook_pixel_id && !window.fbq) {
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
        fbq('init', '${websitePixels.facebook_pixel_id}');
      `;
      document.head.appendChild(script);
      
      const noscript = document.createElement('noscript');
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = `https://www.facebook.com/tr?id=${websitePixels.facebook_pixel_id}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.head.appendChild(noscript);
      
      console.debug('[PixelManager] Facebook Pixel loaded:', websitePixels.facebook_pixel_id);
    }

    // Load Google Analytics/Ads
    if ((websitePixels.google_analytics_id || websitePixels.google_ads_id) && !window.gtag) {
      const gtagId = websitePixels.google_analytics_id || websitePixels.google_ads_id;
      
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
      document.head.appendChild(script1);
      
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        ${websitePixels.google_analytics_id ? `gtag('config', '${websitePixels.google_analytics_id}');` : ''}
        ${websitePixels.google_ads_id ? `gtag('config', '${websitePixels.google_ads_id}');` : ''}
      `;
      document.head.appendChild(script2);
      
      console.debug('[PixelManager] Google Analytics/Ads loaded:', gtagId);
    }

    // Track initial page view
    const timer = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timer);
  }, [websitePixels, trackPageView]);

  return (
    <PixelContext.Provider value={{ pixels: websitePixels }}>
      {children}
    </PixelContext.Provider>
  );
};
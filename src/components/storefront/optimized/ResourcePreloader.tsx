import { useEffect } from 'react';

interface ResourcePreloaderProps {
  criticalImages?: string[];
  criticalFonts?: string[];
  preloadRoutes?: string[];
  enableDNSPrefetch?: boolean;
}

export const ResourcePreloader: React.FC<ResourcePreloaderProps> = ({
  criticalImages = [],
  criticalFonts = [],
  preloadRoutes = [],
  enableDNSPrefetch = true
}) => {
  useEffect(() => {
    // Preload critical images with high priority
    criticalImages.forEach((imageSrc, index) => {
      const preloadId = `preload-image-${index}`;
      if (!document.getElementById(preloadId)) {
        const link = document.createElement('link');
        link.id = preloadId;
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageSrc;
        link.setAttribute('fetchpriority', 'high');
        
        // Add responsive preloading
        if (imageSrc.includes('@2x')) {
          link.media = '(min-resolution: 2dppx)';
        }
        
        document.head.appendChild(link);
      }
    });

    // Preload critical fonts
    criticalFonts.forEach((fontSrc, index) => {
      const preloadId = `preload-font-${index}`;
      if (!document.getElementById(preloadId)) {
        const link = document.createElement('link');
        link.id = preloadId;
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.href = fontSrc;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

    // Prefetch likely next routes
    preloadRoutes.forEach((route, index) => {
      const prefetchId = `prefetch-route-${index}`;
      if (!document.getElementById(prefetchId)) {
        const link = document.createElement('link');
        link.id = prefetchId;
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      }
    });

    // DNS prefetch for external domains
    if (enableDNSPrefetch) {
      const externalDomains = [
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdn.jsdelivr.net',
        'unpkg.com'
      ];

      externalDomains.forEach((domain, index) => {
        const prefetchId = `dns-prefetch-${index}`;
        if (!document.getElementById(prefetchId)) {
          const link = document.createElement('link');
          link.id = prefetchId;
          link.rel = 'dns-prefetch';
          link.href = `https://${domain}`;
          document.head.appendChild(link);
        }
      });
    }

    // Preconnect to critical external domains
    const preconnectDomains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    preconnectDomains.forEach((domain, index) => {
      const preconnectId = `preconnect-${index}`;
      if (!document.getElementById(preconnectId)) {
        const link = document.createElement('link');
        link.id = preconnectId;
        link.rel = 'preconnect';
        link.href = `https://${domain}`;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, [criticalImages, criticalFonts, preloadRoutes, enableDNSPrefetch]);

  return null;
};
import { useEffect } from 'react';

interface PreloadManagerProps {
  criticalResources?: string[];
  preloadRoutes?: string[];
  enablePrefetch?: boolean;
}

export const PreloadManager: React.FC<PreloadManagerProps> = ({
  criticalResources = [],
  preloadRoutes = [],
  enablePrefetch = true
}) => {
  useEffect(() => {
    // Preload critical resources
    criticalResources.forEach((resource, index) => {
      const preloadId = `preload-${index}`;
      if (!document.getElementById(preloadId)) {
        const link = document.createElement('link');
        link.id = preloadId;
        link.rel = 'preload';
        
        // Determine resource type
        if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
          link.as = 'image';
        } else if (resource.match(/\.(woff2|woff|ttf)$/i)) {
          link.as = 'font';
          link.crossOrigin = 'anonymous';
        } else if (resource.match(/\.(css)$/i)) {
          link.as = 'style';
        } else if (resource.match(/\.(js)$/i)) {
          link.as = 'script';
        }
        
        link.href = resource;
        document.head.appendChild(link);
      }
    });

    // Prefetch likely next routes
    if (enablePrefetch) {
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
    }

    // Add DNS prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];

    externalDomains.forEach((domain, index) => {
      const dnsPrefetchId = `dns-prefetch-${index}`;
      if (!document.getElementById(dnsPrefetchId)) {
        const link = document.createElement('link');
        link.id = dnsPrefetchId;
        link.rel = 'dns-prefetch';
        link.href = `https://${domain}`;
        document.head.appendChild(link);
      }
    });
  }, [criticalResources, preloadRoutes, enablePrefetch]);

  return null;
};
import { useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

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
    const usedResources = new Set<string>();
    
    // Track resource usage
    const trackResourceUsage = (resource: string) => {
      usedResources.add(resource);
    };

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
          // Optimize image URLs if they're from Supabase
          link.href = getOptimizedImageUrl(resource, { width: 1200, quality: 85, format: 'auto' });
        } else if (resource.match(/\.(woff2|woff|ttf)$/i)) {
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          link.href = resource;
        } else if (resource.match(/\.(css)$/i)) {
          link.as = 'style';
          link.href = resource;
        } else if (resource.match(/\.(js)$/i)) {
          link.as = 'script';
          link.href = resource;
        } else {
          link.href = resource;
        }
        
        document.head.appendChild(link);
        trackResourceUsage(link.href);
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

    // Clean up unused preloads after 5 seconds
    const cleanupTimer = setTimeout(() => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      preloadLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !usedResources.has(href) && !criticalResources.includes(href)) {
          link.remove();
        }
      });
    }, 5000);

    return () => {
      clearTimeout(cleanupTimer);
    };
  }, [criticalResources, preloadRoutes, enablePrefetch]);

  return null;
};
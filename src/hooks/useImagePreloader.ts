import { useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;

    imageUrls.forEach(url => {
      // Skip if already preloaded
      if (document.querySelector(`link[href="${url}"]`)) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });

    // Cleanup function to remove preload links when component unmounts
    return () => {
      imageUrls.forEach(url => {
        const existingLink = document.querySelector(`link[href="${url}"]`);
        if (existingLink) {
          existingLink.remove();
        }
      });
    };
  }, [imageUrls]);
};

// Hook for preloading critical images with optimization
export const useCriticalImagePreloader = (imageUrls: string[]) => {
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;

    imageUrls.forEach(url => {
      // Skip if already preloaded
      if (document.querySelector(`link[href="${url}"]`)) return;

      // Generate optimized URL for preloading
      const getOptimizedUrl = (originalUrl: string) => {
        if (!originalUrl.includes('supabase.co/storage')) return originalUrl;
        
        try {
          const baseUrl = originalUrl.replace('/object/public/', '/render/image/public/');
          const params = new URLSearchParams();
          params.set('width', '1024');
          params.set('resize', 'cover');
          params.set('format', 'webp');
          params.set('quality', '80');
          
          return `${baseUrl}?${params.toString()}`;
        } catch (error) {
          console.warn('Failed to optimize preload URL:', error);
          return originalUrl;
        }
      };

      const optimizedUrl = getOptimizedUrl(url);
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedUrl;
      document.head.appendChild(link);
    });

    // Cleanup function
    return () => {
      imageUrls.forEach(url => {
        const optimizedUrl = url.includes('supabase.co/storage') 
          ? url.replace('/object/public/', '/render/image/public/') + '?width=1024&resize=cover&format=webp&quality=80'
          : url;
        
        const existingLink = document.querySelector(`link[href="${optimizedUrl}"]`);
        if (existingLink) {
          existingLink.remove();
        }
      });
    };
  }, [imageUrls]);
};

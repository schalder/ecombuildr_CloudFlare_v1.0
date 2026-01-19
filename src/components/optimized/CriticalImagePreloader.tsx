import { useEffect } from 'react';

interface CriticalImagePreloaderProps {
  /**
   * Array of image URLs to preload
   * First image gets high priority, others get auto priority
   */
  images: string[];
  
  /**
   * Optional: Custom priority for first image (default: 'high')
   */
  firstImagePriority?: 'high' | 'auto';
}

/**
 * CriticalImagePreloader - Preloads critical above-the-fold images
 * 
 * This component preloads images with high priority to improve LCP (Largest Contentful Paint).
 * Use this for hero images and other critical above-the-fold images.
 * 
 * @example
 * <CriticalImagePreloader images={[heroImage, logoImage]} />
 */
export const CriticalImagePreloader: React.FC<CriticalImagePreloaderProps> = ({ 
  images, 
  firstImagePriority = 'high' 
}) => {
  useEffect(() => {
    if (!images || images.length === 0) return;

    images.forEach((src, index) => {
      // Skip if already preloaded
      const existingLink = document.querySelector(`link[rel="preload"][href="${src}"]`);
      if (existingLink) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      
      // First image gets high priority, others get auto
      if (index === 0) {
        link.setAttribute('fetchpriority', firstImagePriority);
      } else {
        link.setAttribute('fetchpriority', 'auto');
      }
      
      // Add crossorigin if needed (for CDN images)
      if (src.includes('supabase.co') || src.includes('cloudinary.com')) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });

    // Cleanup function (optional - preloads can stay in head)
    return () => {
      // Note: We don't remove preload links as they're beneficial even after component unmounts
    };
  }, [images, firstImagePriority]);

  return null;
};

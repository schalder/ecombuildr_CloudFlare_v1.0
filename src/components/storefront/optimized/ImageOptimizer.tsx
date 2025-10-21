import { useEffect, useRef, useCallback } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  priority?: 'high' | 'low' | 'auto';
  loading?: 'lazy' | 'eager';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  className = '',
  priority = 'auto',
  loading = 'lazy',
  sizes,
  onLoad,
  onError
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;

    // Set fetchpriority attribute for modern browsers
    if (priority !== 'auto') {
      img.setAttribute('fetchpriority', priority);
    }

    // Intersection Observer for lazy loading fallback
    if (loading === 'lazy' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                target.removeAttribute('data-src');
                observer.unobserve(target);
              }
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before entering viewport
          threshold: 0.01
        }
      );

      observer.observe(img);

      return () => observer.disconnect();
    }
  }, [priority, loading]);

  // Generate optimized image URL using Cloudflare Image Resizing
  const getImageSrc = useCallback(() => {
    return getOptimizedImageUrl(src, { quality: 85, format: 'auto' });
  }, [src]);

  if (loading === 'lazy' && 'IntersectionObserver' in window) {
    return (
      <img
        ref={imgRef}
        data-src={getImageSrc()}
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
        alt={alt}
        className={`transition-opacity duration-300 ${className}`}
        loading={loading}
        onLoad={onLoad}
        onError={onError}
        style={{
          backgroundColor: '#f3f4f6', // Placeholder background
          minHeight: '200px' // Prevent layout shift
        }}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={getImageSrc()}
      alt={alt}
      className={className}
      loading={loading}
      onLoad={onLoad}
      onError={onError}
    />
  );
};
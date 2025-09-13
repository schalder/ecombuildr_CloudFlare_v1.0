import { useEffect, useRef } from 'react';

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

  // Generate WebP/AVIF sources if supported
  const generateSources = () => {
    if (!src) return null;

    const baseUrl = src.split('.').slice(0, -1).join('.');
    const extension = src.split('.').pop()?.toLowerCase();

    // Only generate alternative formats for common image types
    if (!['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return null;
    }

    return (
      <>
        <source srcSet={`${baseUrl}.avif`} type="image/avif" sizes={sizes} />
        <source srcSet={`${baseUrl}.webp`} type="image/webp" sizes={sizes} />
      </>
    );
  };

  // Generate responsive srcSet for different screen sizes
  const generateSrcSet = () => {
    if (!src || !sizes) return undefined;

    const baseUrl = src.split('.').slice(0, -1).join('.');
    const extension = src.split('.').pop();

    return [
      `${baseUrl}_400w.${extension} 400w`,
      `${baseUrl}_800w.${extension} 800w`,
      `${baseUrl}_1200w.${extension} 1200w`,
      `${baseUrl}_1600w.${extension} 1600w`
    ].join(', ');
  };

  if (loading === 'lazy' && 'IntersectionObserver' in window) {
    return (
      <picture>
        {generateSources()}
        <img
          ref={imgRef}
          data-src={src}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
          alt={alt}
          className={`transition-opacity duration-300 ${className}`}
          srcSet={generateSrcSet()}
          sizes={sizes}
          onLoad={onLoad}
          onError={onError}
          style={{
            backgroundColor: '#f3f4f6', // Placeholder background
            minHeight: '200px' // Prevent layout shift
          }}
        />
      </picture>
    );
  }

  return (
    <picture>
      {generateSources()}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        srcSet={generateSrcSet()}
        sizes={sizes}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
};
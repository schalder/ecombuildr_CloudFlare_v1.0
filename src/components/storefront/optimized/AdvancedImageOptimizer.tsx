import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AdvancedImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: 'high' | 'low' | 'auto';
  loading?: 'lazy' | 'eager';
  sizes?: string;
  isCritical?: boolean;
  aspectRatio?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

export const AdvancedImageOptimizer: React.FC<AdvancedImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = 'auto',
  loading = 'lazy',
  sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  isCritical = false,
  aspectRatio,
  onLoad,
  onError,
  style
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(isCritical || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive srcSet with multiple resolutions
  const generateResponsiveSrcSet = useCallback((originalSrc: string, format?: string) => {
    const baseUrl = originalSrc.split('.').slice(0, -1).join('.');
    const extension = format || originalSrc.split('.').pop();
    
    // Generate multiple resolutions for responsive images
    const resolutions = [400, 600, 800, 1200, 1600, 2000];
    return resolutions
      .map(res => `${baseUrl}_${res}w.${extension} ${res}w`)
      .join(', ');
  }, []);

  // Generate modern format sources with responsive srcSet
  const generateModernSources = useCallback(() => {
    if (!src) return null;

    const baseUrl = src.split('.').slice(0, -1).join('.');
    const extension = src.split('.').pop()?.toLowerCase();

    // Only generate for common raster formats
    if (!['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return null;
    }

    return (
      <>
        {/* AVIF - best compression */}
        <source 
          srcSet={generateResponsiveSrcSet(src, 'avif')} 
          type="image/avif" 
          sizes={sizes} 
        />
        {/* WebP - wide support, good compression */}
        <source 
          srcSet={generateResponsiveSrcSet(src, 'webp')} 
          type="image/webp" 
          sizes={sizes} 
        />
        {/* Original format fallback with responsive srcSet */}
        <source 
          srcSet={generateResponsiveSrcSet(src)} 
          type={`image/${extension}`}
          sizes={sizes} 
        />
      </>
    );
  }, [src, sizes, generateResponsiveSrcSet]);

  // Intelligent lazy loading with intersection observer
  useEffect(() => {
    if (isCritical || loading === 'eager' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px 0px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isCritical, loading]);

  // Set fetchpriority for critical images
  useEffect(() => {
    if (!imgRef.current) return;

    const fetchPriority = isCritical ? 'high' : priority;
    if (fetchPriority !== 'auto') {
      imgRef.current.setAttribute('fetchpriority', fetchPriority);
    }
  }, [isCritical, priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Calculate container styles with aspect ratio preservation
  const getContainerStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'hsl(var(--muted))',
      ...style
    };

    // Use explicit dimensions if provided
    if (width && height) {
      return {
        ...baseStyles,
        width,
        height,
        aspectRatio: `${width} / ${height}`
      };
    }

    // Use aspect ratio if provided
    if (aspectRatio) {
      return {
        ...baseStyles,
        aspectRatio
      };
    }

    // Default aspect ratio for unknown dimensions
    return {
      ...baseStyles,
      aspectRatio: '16 / 9'
    };
  }, [width, height, aspectRatio, style]);

  // Error fallback
  if (hasError) {
    return (
      <div 
        className={`bg-muted rounded flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={getContainerStyles()}
      >
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${className}`}
      style={getContainerStyles()}
    >
      {/* Loading placeholder with exact dimensions */}
      {!isLoaded && isInView && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.1) 50%, hsl(var(--muted)) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite'
          }}
        />
      )}
      
      {/* Render image when in view */}
      {isInView && (
        <picture>
          {generateModernSources()}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={isCritical ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes}
            srcSet={generateResponsiveSrcSet(src)}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      )}
    </div>
  );
};
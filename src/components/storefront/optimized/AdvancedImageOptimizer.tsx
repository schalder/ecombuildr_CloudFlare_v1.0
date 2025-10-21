import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getOptimizedImageUrl, generateCloudflareResponsiveSrcSet } from '@/lib/imageOptimization';

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
  preserveOriginal?: boolean; // New prop to preserve original dimensions
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
  style,
  preserveOriginal = true // Default to preserving original dimensions
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(isCritical || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive srcSet with multiple resolutions using Cloudflare Image Resizing
  const generateResponsiveSrcSet = useCallback((originalSrc: string, format?: string) => {
    return generateCloudflareResponsiveSrcSet(originalSrc, format as any);
  }, []);

  // Generate modern format sources with responsive srcSet using Cloudflare Image Resizing
  const generateModernSources = useCallback(() => {
    if (preserveOriginal) return null;
    
    // Cloudflare handles format detection automatically
    return (
      <>
        <source 
          srcSet={generateCloudflareResponsiveSrcSet(src, 'avif')} 
          type="image/avif" 
          sizes={sizes} 
        />
        <source 
          srcSet={generateCloudflareResponsiveSrcSet(src, 'webp')} 
          type="image/webp" 
          sizes={sizes} 
        />
      </>
    );
  }, [src, sizes, preserveOriginal]);

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
    // Try fallback to original image if transform fails
    if (imgRef.current && imgRef.current.src !== src) {
      imgRef.current.src = src;
      return;
    }
    
    setHasError(true);
    onError?.();
  }, [onError, src]);

  // Calculate container styles
  const getContainerStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      // Remove default background color to preserve transparency
      ...style
    };

    // When preserving original, respect all styles from page builder
    if (preserveOriginal) {
      return baseStyles;
    }

    // Explicit dimensions take precedence for responsive mode
    if (width && height) {
      return {
        ...baseStyles,
        width,
        height,
        aspectRatio: `${width} / ${height}`
      };
    }

    // Use aspect ratio if provided (responsive layout mode)
    if (aspectRatio) {
      return {
        ...baseStyles,
        aspectRatio
      };
    }

    // Default aspect ratio for unknown dimensions in responsive mode
    return {
      ...baseStyles,
      aspectRatio: '16 / 9'
    };
  }, [width, height, aspectRatio, style, preserveOriginal]);

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
            src={preserveOriginal 
              ? getOptimizedImageUrl(src, { quality: 85, format: 'auto' })
              : getOptimizedImageUrl(src, { width: 800, quality: 85, format: 'auto' })
            }
            alt={alt}
            width={width}
            height={height}
            className={`${preserveOriginal ? 'block max-w-full h-auto' : 'absolute inset-0 w-full h-full object-cover'} transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={preserveOriginal ? style : undefined}
            loading={isCritical ? 'eager' : 'lazy'}
            decoding="async"
            sizes={preserveOriginal ? undefined : sizes}
            srcSet={preserveOriginal ? undefined : generateResponsiveSrcSet(src, 'webp')}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      )}
    </div>
  );
};
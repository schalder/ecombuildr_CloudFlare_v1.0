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

  // Generate responsive srcSet with multiple resolutions using transformation endpoint
  const generateResponsiveSrcSet = useCallback((originalSrc: string, format?: string) => {
    const baseUrl = 'https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/image-transform';
    const targetFormat = format || 'webp';
    
    // If preserving original, don't generate a srcset (single candidate handled elsewhere)
    if (preserveOriginal) return '';
    
    // Otherwise, use responsive resolutions
    const resolutions = [400, 600, 800, 1200, 1600, 2000];
    return resolutions
      .map(res => `${baseUrl}?url=${encodeURIComponent(originalSrc)}&format=${targetFormat}&w=${res}&q=85 ${res}w`)
      .join(', ');
  }, [preserveOriginal]);

  // Generate modern format sources with responsive srcSet using transformation endpoint
  const generateModernSources = useCallback(() => {
    if (!src) return null;

    const transformBaseUrl = 'https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/image-transform';

    return (
      <>
        {/* AVIF - best compression */}
        <source 
          srcSet={preserveOriginal
            ? `${transformBaseUrl}?url=${encodeURIComponent(src)}&format=avif&q=85 1x`
            : generateResponsiveSrcSet(src, 'avif')
          }
          type="image/avif" 
          sizes={preserveOriginal ? undefined : sizes} 
        />
        {/* WebP - wide support, good compression */}
        <source 
          srcSet={preserveOriginal
            ? `${transformBaseUrl}?url=${encodeURIComponent(src)}&format=webp&q=85 1x`
            : generateResponsiveSrcSet(src, 'webp')
          }
          type="image/webp" 
          sizes={preserveOriginal ? undefined : sizes} 
        />
        {/* Original format fallback */}
        <source 
          srcSet={`${transformBaseUrl}?url=${encodeURIComponent(src)}&format=original&q=85 1x`} 
          type="image/*"
          sizes={preserveOriginal ? undefined : sizes} 
        />
      </>
    );
  }, [src, sizes, generateResponsiveSrcSet, preserveOriginal]);

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
      backgroundColor: 'hsl(var(--muted))',
      ...style
    };

    // Extract dimensions from style prop if available
    const styleWidth = style?.width;
    const styleHeight = style?.height;
    const styleAspectRatio = style?.aspectRatio;

    // Priority order: props > style prop > default
    const finalWidth = width || styleWidth;
    const finalHeight = height || styleHeight;
    const finalAspectRatio = aspectRatio || styleAspectRatio;

    // Explicit dimensions take precedence
    if (finalWidth && finalHeight) {
      return {
        ...baseStyles,
        width: finalWidth,
        height: finalHeight,
        aspectRatio: typeof finalWidth === 'number' && typeof finalHeight === 'number' 
          ? `${finalWidth} / ${finalHeight}` 
          : finalAspectRatio
      };
    }

    // When preserving original, respect style dimensions but don't enforce aspect ratio
    if (preserveOriginal) {
      return {
        ...baseStyles,
        ...(finalWidth && { width: finalWidth }),
        ...(finalHeight && { height: finalHeight }),
        ...(finalAspectRatio && { aspectRatio: finalAspectRatio })
      };
    }

    // Use aspect ratio if provided (responsive layout mode)
    if (finalAspectRatio) {
      return {
        ...baseStyles,
        aspectRatio: finalAspectRatio
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
              ? `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/image-transform?url=${encodeURIComponent(src)}&format=webp&q=85`
              : `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/image-transform?url=${encodeURIComponent(src)}&format=webp&w=800&q=85`
            }
            alt={alt}
            width={width}
            height={height}
            className={`${preserveOriginal ? 'block max-w-full h-auto' : 'absolute inset-0 w-full h-full object-cover'} transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
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
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

  // Generate optimized Supabase URL using direct storage optimization
  const getOptimizedUrl = useCallback((originalSrc: string, w?: number, h?: number, format: string = 'webp') => {
    if (!originalSrc.includes('supabase.co/storage')) return originalSrc;
    
    try {
      const baseUrl = originalSrc.replace('/object/public/', '/render/image/public/');
      const params = new URLSearchParams();
      
      if (w) params.set('width', w.toString());
      if (h) params.set('height', h.toString());
      params.set('resize', 'cover');
      params.set('format', format);
      params.set('quality', '80');
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      console.warn('Failed to optimize image URL:', error);
      return originalSrc;
    }
  }, []);

  // Generate responsive srcSet with multiple resolutions using direct Supabase optimization
  const generateResponsiveSrcSet = useCallback((originalSrc: string, format?: string) => {
    const targetFormat = format || 'webp';
    
    // If preserving original, don't generate a srcset (single candidate handled elsewhere)
    if (preserveOriginal) return '';
    
    // Otherwise, use responsive resolutions
    const resolutions = [400, 600, 800, 1200, 1600, 2000];
    return resolutions
      .map(res => `${getOptimizedUrl(originalSrc, res, undefined, targetFormat)} ${res}w`)
      .join(', ');
  }, [preserveOriginal, getOptimizedUrl]);

  // Generate modern format sources with responsive srcSet using direct Supabase optimization
  const generateModernSources = useCallback(() => {
    if (!src) return null;

    return (
      <>
        {/* AVIF - best compression */}
        <source 
          srcSet={preserveOriginal
            ? `${getOptimizedUrl(src, undefined, undefined, 'avif')} 1x`
            : generateResponsiveSrcSet(src, 'avif')
          }
          type="image/avif" 
          sizes={preserveOriginal ? undefined : sizes} 
        />
        {/* WebP - wide support, good compression */}
        <source 
          srcSet={preserveOriginal
            ? `${getOptimizedUrl(src, undefined, undefined, 'webp')} 1x`
            : generateResponsiveSrcSet(src, 'webp')
          }
          type="image/webp" 
          sizes={preserveOriginal ? undefined : sizes} 
        />
        {/* Original format fallback */}
        <source 
          srcSet={`${getOptimizedUrl(src, undefined, undefined, 'original')} 1x`} 
          type="image/*"
          sizes={preserveOriginal ? undefined : sizes} 
        />
      </>
    );
  }, [src, sizes, generateResponsiveSrcSet, preserveOriginal, getOptimizedUrl]);

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
    // When preserving original, exclude width-related properties from container
    // These should only be applied to the image itself, not the container
    let containerStyle = style || {};
    if (preserveOriginal && style) {
      const { width, maxWidth, minWidth, height, maxHeight, minHeight, margin, marginLeft, marginRight, marginTop, marginBottom, ...rest } = style;
      containerStyle = rest;
    }
    
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      // Remove default background color to preserve transparency
      ...containerStyle
    };

    // When preserving original, container should not have width constraints
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
              ? getOptimizedUrl(src, undefined, undefined, 'webp')
              : getOptimizedUrl(src, 800, undefined, 'webp')
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
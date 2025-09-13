import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AdvancedImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const AdvancedImageOptimizer: React.FC<AdvancedImageOptimizerProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw',
  placeholder = 'blur',
  quality = 80,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized sources for different formats and sizes
  const generateOptimizedSources = useCallback((originalSrc: string) => {
    const baseSrc = originalSrc.split('.').slice(0, -1).join('.');
    const extension = originalSrc.split('.').pop()?.toLowerCase();
    
    if (!['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return { webp: originalSrc, avif: originalSrc, original: originalSrc };
    }

    return {
      avif: `${baseSrc}.avif`,
      webp: `${baseSrc}.webp`, 
      original: originalSrc
    };
  }, []);

  // Generate responsive srcSet for different screen densities
  const generateSrcSet = useCallback((src: string) => {
    const sources = generateOptimizedSources(src);
    const baseName = src.split('.').slice(0, -1).join('.');
    
    return {
      avif: `${sources.avif} 1x, ${baseName}@2x.avif 2x`,
      webp: `${sources.webp} 1x, ${baseName}@2x.webp 2x`,
      original: `${sources.original} 1x, ${baseName}@2x.jpg 2x`
    };
  }, [generateOptimizedSources]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.1 
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const srcSets = generateSrcSet(src);
  const aspectRatio = width && height ? (height / width) * 100 : 56.25; // Default 16:9

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : '16/9',
        containIntrinsicSize: width && height ? `${width}px ${height}px` : '300px 200px'
      }}
    >
      {/* Placeholder while loading */}
      {!isLoaded && !hasError && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 skeleton-loader"
          style={{ paddingBottom: `${aspectRatio}%` }}
        />
      )}
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}

      {/* Optimized image with multiple formats */}
      {isInView && !hasError && (
        <picture>
          {/* AVIF - best compression for modern browsers */}
          <source 
            srcSet={srcSets.avif}
            type="image/avif"
            sizes={sizes}
          />
          
          {/* WebP - good compression for most browsers */}
          <source 
            srcSet={srcSets.webp}
            type="image/webp" 
            sizes={sizes}
          />
          
          {/* Original format fallback */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes}
            fetchPriority={priority ? 'high' : 'auto'}
            data-loading={priority ? 'eager' : 'lazy'}
          />
        </picture>
      )}
    </div>
  );
};
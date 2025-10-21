import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getOptimizedImageUrl, generateCloudflareResponsiveSrcSet } from '@/lib/imageOptimization';

interface LazyImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export const LazyImageLoader: React.FC<LazyImageLoaderProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate optimized image URL using Cloudflare Image Resizing
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    return getOptimizedImageUrl(originalSrc, { width, quality: 85, format: 'auto' });
  }, [width]);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ paddingBottom: height && width ? `${(height / width) * 100}%` : '60%' }}
        />
      )}
      
      {isInView && (
        <picture>
          <source srcSet={generateCloudflareResponsiveSrcSet(src, 'webp')} type="image/webp" sizes={sizes} />
          <img
            src={getOptimizedSrc(src)}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleLoad}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes}
          />
        </picture>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { AdvancedImageOptimizer } from '../optimized/AdvancedImageOptimizer';
import { ImageMagnifier } from '../optimized/ImageMagnifier';
import { EnhancedImageMagnifier } from '../optimized/EnhancedImageMagnifier';
import { useCriticalImage } from '../optimized/CriticalImageManager';

// Hook to safely use CriticalImageManager (returns null if not available)
const useSafeCriticalImage = () => {
  try {
    return useCriticalImage();
  } catch {
    // Return a safe fallback when CriticalImageManager is not provided
    return {
      addCriticalImage: () => {},
      isCriticalImage: () => false,
    };
  }
};

interface StorefrontImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  isCritical?: boolean;
  sizes?: string;
  aspectRatio?: string;
  style?: React.CSSProperties;
  preserveOriginal?: boolean; // Pass through to AdvancedImageOptimizer
  enableMagnifier?: boolean; // Enable image magnification on hover
  magnifierSize?: number; // Size of the magnifier lens
  zoomLevel?: number; // Magnification level
  responsiveMagnifier?: boolean; // Enable responsive magnifier sizing
  enhancedMagnifier?: boolean; // Use enhanced professional magnifier
  highResolutionSrc?: string; // High-resolution image for enhanced zoom
  enableFullscreen?: boolean; // Enable fullscreen zoom modal
}

export const StorefrontImage: React.FC<StorefrontImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  isCritical,
  sizes,
  aspectRatio,
  style,
  preserveOriginal = true, // Default to preserving original dimensions
  enableMagnifier = false,
  magnifierSize = 300, // Enhanced default size for professional look
  zoomLevel = 6, // Enhanced default zoom for better detail
  responsiveMagnifier = true,
  enhancedMagnifier = true, // Default to enhanced magnifier
  highResolutionSrc,
  enableFullscreen = true
}) => {
  const { addCriticalImage, isCriticalImage } = useSafeCriticalImage();
  const [autoDetectedCritical, setAutoDetectedCritical] = useState(false);

  // Auto-detect critical images (above the fold)
  useEffect(() => {
    if (priority && !isCriticalImage(src)) {
      addCriticalImage(src);
      setAutoDetectedCritical(true);
    }
  }, [src, priority, addCriticalImage, isCriticalImage]);

  const isImageCritical = isCritical ?? autoDetectedCritical ?? isCriticalImage(src);

  // Use Enhanced Magnifier for the best experience, fallback to regular magnifier
  if (enableMagnifier) {
    if (enhancedMagnifier) {
      return (
        <EnhancedImageMagnifier
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={style}
          zoomLevel={zoomLevel}
          magnifierSize={magnifierSize}
          responsive={responsiveMagnifier}
          highResolutionSrc={highResolutionSrc}
          enableFullscreen={enableFullscreen}
        />
      );
    } else {
      return (
        <ImageMagnifier
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={style}
          zoomLevel={zoomLevel}
          magnifierSize={magnifierSize}
          responsive={responsiveMagnifier}
        />
      );
    }
  }

  return (
    <AdvancedImageOptimizer
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      isCritical={isImageCritical}
      sizes={sizes || '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'}
      aspectRatio={aspectRatio}
      style={style}
      preserveOriginal={preserveOriginal}
    />
  );
};
import React, { useState, useEffect } from 'react';
import { AdvancedImageOptimizer } from '../optimized/AdvancedImageOptimizer';
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
  style
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
    />
  );
};
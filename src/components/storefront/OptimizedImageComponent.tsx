import React from 'react';
import { OptimizedImage } from './OptimizedImage';

interface OptimizedImageComponentProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
}

export const OptimizedImageComponent: React.FC<OptimizedImageComponentProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '100vw'
}) => {
  // For LCP images (first visible image), use eager loading and high priority
  const isLCPCandidate = priority || loading === 'eager';
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      priority={isLCPCandidate}
      sizes={sizes}
    />
  );
};
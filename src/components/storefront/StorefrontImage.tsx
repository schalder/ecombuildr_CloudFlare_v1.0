import React from 'react';
import { cn } from '@/lib/utils';

interface StorefrontImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  lazy?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export const StorefrontImage: React.FC<StorefrontImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  lazy = true,
  sizes,
  style,
  onLoad,
  onError
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : lazy ? 'lazy' : 'eager'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes}
      className={cn(className)}
      style={style}
      onLoad={onLoad}
      onError={onError}
    />
  );
};
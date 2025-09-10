import React, { useState } from 'react';

interface StorefrontImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

export const StorefrontImage: React.FC<StorefrontImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  style
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  if (hasError) {
    return (
      <div 
        className={`bg-muted rounded flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ width, height, ...style }}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};
import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onClick?: () => void;
  placeholder?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  sizes = '100vw',
  width,
  height,
  objectFit = 'cover',
  onClick,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjZTVlN2ViIi8+Cjwvc3ZnPgo='
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!src || hasError) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;
  }, [src, hasError]);

  const imageStyle: React.CSSProperties = {
    objectFit,
    ...(width && { width }),
    ...(height && { height }),
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50"
          style={imageStyle}
        />
      )}
      
      {!hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={sizes}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            onClick && 'cursor-pointer'
          )}
          style={imageStyle}
          onClick={onClick}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
      
      {hasError && (
        <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
};
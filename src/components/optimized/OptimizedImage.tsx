import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  aspectRatio?: string;
  style?: React.CSSProperties;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  priority = false,
  loading = 'lazy',
  decoding = 'async',
  aspectRatio,
  style
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate optimized Supabase URL
  const getOptimizedUrl = (originalUrl: string, w?: number, h?: number) => {
    if (!originalUrl.includes('supabase.co/storage')) return originalUrl;
    
    try {
      const baseUrl = originalUrl.replace('/object/public/', '/render/image/public/');
      const params = new URLSearchParams();
      
      if (w) params.set('width', w.toString());
      if (h) params.set('height', h.toString());
      params.set('resize', 'cover');
      params.set('format', 'webp');
      params.set('quality', '80');
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      console.warn('Failed to optimize image URL:', error);
      return originalUrl;
    }
  };

  const optimizedSrc = getOptimizedUrl(src, width, height);
  const loadingStrategy = priority ? 'eager' : loading;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse" 
          style={aspectRatio ? { aspectRatio } : undefined}
        />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loadingStrategy}
        decoding={decoding}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={{ ...style, aspectRatio }}
      />
      
      {error && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          Image failed to load
        </div>
      )}
    </div>
  );
};

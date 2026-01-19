import { useState, useMemo, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width: number; // Required to prevent layout shift (CLS)
  height: number; // Required to prevent layout shift (CLS)
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  aspectRatio?: string; // Optional override, defaults to width/height
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
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

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

  // Memoize optimized URL
  const optimizedSrc = useMemo(() => getOptimizedUrl(src, width, height), [src, width, height]);
  
  // Calculate aspect ratio from width/height if not provided
  const calculatedAspectRatio = aspectRatio || (width && height ? `${width}/${height}` : undefined);
  
  // Determine which URL to use
  const currentSrc = hasTriedFallback ? src : optimizedSrc;
  
  // Reset state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
    setHasTriedFallback(false);
  }, [src]);

  const loadingStrategy = priority ? 'eager' : loading;
  
  // Ensure aspect ratio container prevents layout shift
  const containerStyle: React.CSSProperties = {
    aspectRatio: calculatedAspectRatio,
    position: 'relative',
    overflow: 'hidden',
  };

  const handleError = () => {
    // If optimized URL failed and we haven't tried original yet, fall back
    if (!hasTriedFallback && optimizedSrc !== src) {
      setHasTriedFallback(true);
      setError(false); // Reset error to retry with original
      setLoaded(false); // Reset loaded state
    } else {
      // Both optimized and original failed, or no fallback available
      setError(true);
    }
  };

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={containerStyle}>
      {!loaded && !error && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loadingStrategy}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          ...style, 
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        fetchPriority={priority ? 'high' : 'auto'}
      />
      
      {error && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
        >
          Image failed to load
        </div>
      )}
    </div>
  );
};

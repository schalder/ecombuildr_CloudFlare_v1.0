import { OptimizedImage } from './OptimizedImage';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: string;
}

export const ResponsiveImage = ({ 
  src, 
  alt, 
  className, 
  sizes = '100vw',
  priority = false,
  aspectRatio
}: ResponsiveImageProps) => {
  // Generate optimized Supabase URL
  const getOptimizedUrl = (originalUrl: string, width?: number) => {
    if (!originalUrl.includes('supabase.co/storage')) return originalUrl;
    
    try {
      const baseUrl = originalUrl.replace('/object/public/', '/render/image/public/');
      const params = new URLSearchParams();
      
      if (width) params.set('width', width.toString());
      params.set('resize', 'cover');
      params.set('format', 'webp');
      params.set('quality', '80');
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      console.warn('Failed to optimize image URL:', error);
      return originalUrl;
    }
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseUrl: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .map(width => {
        const optimizedUrl = getOptimizedUrl(baseUrl, width);
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  };

  const srcSet = generateSrcSet(src);
  const fallbackSrc = getOptimizedUrl(src, 1024);

  return (
    <img
      src={fallbackSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={aspectRatio ? { aspectRatio } : undefined}
    />
  );
};

/**
 * Generates optimized image URL using Supabase Edge Function
 * Falls back to original URL for external images
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  }
): string => {
  // Only optimize Supabase-hosted images
  if (!originalUrl || !originalUrl.includes('fhqwacmokbtbspkxjixf.supabase.co')) {
    return originalUrl;
  }

  const params = new URLSearchParams();
  params.set('url', originalUrl);
  
  if (options?.width) params.set('w', options.width.toString());
  if (options?.height) params.set('h', options.height.toString());
  params.set('q', (options?.quality || 85).toString());
  params.set('f', options?.format || 'auto');
  
  return `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/image-transform?${params.toString()}`;
};

/**
 * Generates responsive srcSet using Supabase Edge Function
 */
export const generateCloudflareResponsiveSrcSet = (
  originalUrl: string,
  format: 'auto' | 'webp' | 'avif' = 'auto'
): string => {
  if (!originalUrl.includes('fhqwacmokbtbspkxjixf.supabase.co')) {
    return '';
  }

  const resolutions = [400, 600, 800, 1200, 1600, 2000];
  return resolutions
    .map(width => `${getOptimizedImageUrl(originalUrl, { width, format, quality: 85 })} ${width}w`)
    .join(', ');
};

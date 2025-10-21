/**
 * Generates Cloudflare-optimized image URL for Supabase images
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

  const params: string[] = [];
  
  if (options?.width) params.push(`width=${options.width}`);
  if (options?.height) params.push(`height=${options.height}`);
  params.push(`quality=${options?.quality || 85}`);
  params.push(`format=${options?.format || 'auto'}`);
  
  const queryString = params.join(',');
  return `https://ecombuildr.com/cdn-cgi/image/${queryString}/${originalUrl}`;
};

/**
 * Generates responsive srcSet using Cloudflare Image Resizing
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

// Utility functions for responsive image optimization

export interface ImageBreakpoint {
  minWidth: number;
  width: string;
  density?: number;
}

export interface ResponsiveImageConfig {
  breakpoints: ImageBreakpoint[];
  formats: string[];
  quality: number;
  loading: 'lazy' | 'eager';
  priority: 'high' | 'low' | 'auto';
}

// Default responsive configuration
export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveImageConfig = {
  breakpoints: [
    { minWidth: 1200, width: '33vw' }, // Desktop - 3 columns
    { minWidth: 768, width: '50vw' },  // Tablet - 2 columns
    { minWidth: 0, width: '100vw' }    // Mobile - 1 column
  ],
  formats: ['avif', 'webp'],
  quality: 85,
  loading: 'lazy',
  priority: 'auto'
};

// Generate sizes attribute for responsive images
export function generateSizesAttribute(breakpoints: ImageBreakpoint[]): string {
  return breakpoints
    .sort((a, b) => b.minWidth - a.minWidth) // Sort by descending min-width
    .map(bp => bp.minWidth > 0 ? `(min-width: ${bp.minWidth}px) ${bp.width}` : bp.width)
    .join(', ');
}

// Generate srcSet for multiple resolutions
export function generateSrcSet(
  baseSrc: string, 
  resolutions: number[] = [400, 600, 800, 1200, 1600, 2000],
  format?: string
): string {
  const baseUrl = baseSrc.split('.').slice(0, -1).join('.');
  const extension = format || baseSrc.split('.').pop();
  
  return resolutions
    .map(resolution => `${baseUrl}_${resolution}w.${extension} ${resolution}w`)
    .join(', ');
}

// Check if image format is supported
export function supportsImageFormat(format: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const dataUrl = canvas.toDataURL(`image/${format}`);
    return dataUrl.startsWith(`data:image/${format}`);
  } catch {
    return false;
  }
}

// Get optimal image format for browser
export function getOptimalFormat(supportedFormats: string[]): string {
  const formatPriority = ['avif', 'webp', 'jpg', 'jpeg', 'png'];
  
  for (const format of formatPriority) {
    if (supportedFormats.includes(format) && supportsImageFormat(format)) {
      return format;
    }
  }
  
  return 'jpg'; // Fallback
}

// Calculate aspect ratio from dimensions
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor} / ${height / divisor}`;
}

// Determine if image should be preloaded based on position
export function shouldPreloadImage(
  elementPosition: { top: number; left: number },
  viewportHeight: number,
  foldThreshold: number = 0.8
): boolean {
  return elementPosition.top < viewportHeight * foldThreshold;
}

// Generate critical CSS for image containers
export function generateImageContainerCSS(): string {
  return `
    .image-container {
      position: relative;
      overflow: hidden;
      background-color: hsl(var(--muted));
    }
    
    .image-container::before {
      content: '';
      display: block;
      width: 100%;
      height: 0;
      padding-bottom: var(--aspect-ratio, 56.25%); /* 16:9 default */
    }
    
    .image-container img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    .loading-shimmer {
      background: linear-gradient(
        90deg,
        hsl(var(--muted)) 25%,
        hsl(var(--muted-foreground) / 0.1) 50%,
        hsl(var(--muted)) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
  `;
}
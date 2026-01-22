import { Helmet } from 'react-helmet-async';

interface CriticalResourceLoaderProps {
  heroImage?: string;
  primaryFonts?: string[];
  preloadImages?: string[];
}

// Helper function to optimize image URLs for LCP (use optimized Supabase URLs)
const optimizeImageUrl = (src: string, width?: number): string => {
  if (!src || !src.includes('supabase.co/storage')) return src;
  
  try {
    const baseUrl = src.replace('/object/public/', '/render/image/public/');
    const params = new URLSearchParams();
    
    if (width) params.set('width', width.toString());
    params.set('resize', 'cover');
    params.set('format', 'webp');
    params.set('quality', '80');
    
    return `${baseUrl}?${params.toString()}`;
  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return src;
  }
};

export const CriticalResourceLoader: React.FC<CriticalResourceLoaderProps> = ({
  heroImage,
  primaryFonts = ['Inter'],
  preloadImages = []
}) => {
  // Use Helmet for synchronous injection (before React renders)
  // This ensures resources are in the HTML head immediately, improving Lighthouse scores
  
  const optimizedHeroImage = heroImage ? optimizeImageUrl(heroImage, 1200) : undefined;
  const optimizedPreloadImages = preloadImages.map(img => optimizeImageUrl(img, 800));

  return (
    <Helmet>
      {/* Preload hero/LCP image with high priority */}
      {optimizedHeroImage && (
        <link 
          rel="preload" 
          as="image" 
          href={optimizedHeroImage}
          fetchPriority="high"
        />
      )}

      {/* Preload critical images */}
      {optimizedPreloadImages.map((imageSrc, index) => (
        imageSrc && (
          <link 
            key={`preload-img-${index}`}
            rel="preload" 
            as="image" 
            href={imageSrc}
          />
        )
      ))}

      {/* Load critical fonts with font-display: swap */}
      {primaryFonts.map((fontFamily, index) => {
        const encodedFamily = fontFamily.replace(/\s+/g, '+');
        return (
          <link
            key={`font-${index}`}
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400;500;600;700&display=swap`}
          />
        );
      })}

      {/* Critical CSS for font loading and layout stability */}
      <style>{`
        /* Ensure text remains visible during webfont load */
        * {
          font-display: swap;
        }
        
        /* Prevent layout shift for hero images */
        img[data-hero="true"] {
          content-visibility: auto;
          contain-intrinsic-size: 1200px 600px;
        }
        
        /* Prevent FOUC (Flash of Unstyled Content) */
        body {
          visibility: visible;
        }
      `}</style>
    </Helmet>
  );
};
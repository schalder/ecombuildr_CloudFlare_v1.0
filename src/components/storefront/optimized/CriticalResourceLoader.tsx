import { useEffect } from 'react';

interface CriticalResourceLoaderProps {
  heroImage?: string;
  primaryFonts?: string[];
  preloadImages?: string[];
}

export const CriticalResourceLoader: React.FC<CriticalResourceLoaderProps> = ({
  heroImage,
  primaryFonts = ['Inter'],
  preloadImages = []
}) => {
  useEffect(() => {
    // Preload hero image with high priority
    if (heroImage) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroImage;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }

    // Preload critical images
    preloadImages.forEach(imageSrc => {
      if (imageSrc) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageSrc;
        document.head.appendChild(link);
      }
    });

    // Ensure critical fonts are loaded with font-display: swap
    primaryFonts.forEach(fontFamily => {
      if (!document.querySelector(`link[href*="${fontFamily.replace(' ', '+')}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });

    // Add critical CSS for font loading
    if (!document.querySelector('#critical-font-css')) {
      const style = document.createElement('style');
      style.id = 'critical-font-css';
      style.textContent = `
        /* Ensure text remains visible during webfont load */
        * {
          font-display: swap;
        }
        
        /* Prevent layout shift for hero images */
        img[data-hero="true"] {
          content-visibility: auto;
          contain-intrinsic-size: 1200px 600px;
        }
      `;
      document.head.appendChild(style);
    }
  }, [heroImage, primaryFonts, preloadImages]);

  return null;
};
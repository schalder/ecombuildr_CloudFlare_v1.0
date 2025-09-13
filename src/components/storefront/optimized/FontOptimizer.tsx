import { useEffect } from 'react';

interface FontOptimizerProps {
  fonts?: string[];
}

export const FontOptimizer: React.FC<FontOptimizerProps> = ({ fonts = [] }) => {
  useEffect(() => {
    // Add font preconnect for Google Fonts
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://fonts.googleapis.com';
    preconnectLink.crossOrigin = 'anonymous';
    
    const preconnectGstaticLink = document.createElement('link');
    preconnectGstaticLink.rel = 'preconnect';
    preconnectGstaticLink.href = 'https://fonts.gstatic.com';
    preconnectGstaticLink.crossOrigin = 'anonymous';

    // Check if preconnect links already exist
    const existingPreconnects = document.querySelectorAll('link[rel="preconnect"]');
    const hasGoogleFonts = Array.from(existingPreconnects).some(link => 
      (link as HTMLLinkElement).href.includes('fonts.googleapis.com')
    );
    const hasGstatic = Array.from(existingPreconnects).some(link => 
      (link as HTMLLinkElement).href.includes('fonts.gstatic.com')
    );

    if (!hasGoogleFonts) {
      document.head.appendChild(preconnectLink);
    }
    if (!hasGstatic) {
      document.head.appendChild(preconnectGstaticLink);
    }

    // If specific fonts are provided, preload them with font-display: swap
    const preloadPromises = fonts.map(fontFamily => {
      return new Promise<void>((resolve) => {
        const fontId = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
        
        // Check if font is already loaded
        if (document.getElementById(fontId)) {
          resolve();
          return;
        }
        
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
        link.onload = () => resolve();
        link.onerror = () => resolve(); // Don't fail if font fails to load
        document.head.appendChild(link);
      });
    });

    return () => {
      // Cleanup function - normally we'd keep preconnects, but for completeness
      if (!hasGoogleFonts && preconnectLink.parentNode) {
        preconnectLink.parentNode.removeChild(preconnectLink);
      }
      if (!hasGstatic && preconnectGstaticLink.parentNode) {
        preconnectGstaticLink.parentNode.removeChild(preconnectGstaticLink);
      }
    };
  }, [fonts]);

  return null;
};

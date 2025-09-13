import { useEffect } from 'react';

interface CriticalCSSLoaderProps {
  css?: string;
  fonts?: string[];
}

export const CriticalCSSLoader: React.FC<CriticalCSSLoaderProps> = ({ css, fonts = [] }) => {
  useEffect(() => {
    // Inject critical CSS
    if (css && !document.getElementById('critical-css')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = css;
      document.head.appendChild(style);
    }

    // Preload critical fonts
    fonts.forEach((font, index) => {
      const fontId = `critical-font-${index}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'preload';
        link.as = 'font';
        link.href = font;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

    // Add font-display: swap to existing font links
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !href.includes('display=swap')) {
        link.setAttribute('href', href + (href.includes('?') ? '&' : '?') + 'display=swap');
      }
    });
  }, [css, fonts]);

  return null;
};
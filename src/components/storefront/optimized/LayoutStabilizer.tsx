import { useEffect } from 'react';

interface LayoutStabilizerProps {
  reserveHeroSpace?: boolean;
  reserveNavSpace?: boolean;
  preventFontSwap?: boolean;
}

export const LayoutStabilizer: React.FC<LayoutStabilizerProps> = ({
  reserveHeroSpace = true,
  reserveNavSpace = true,
  preventFontSwap = true
}) => {
  useEffect(() => {
    // Inject layout stabilization CSS
    const stabilizationCSS = `
      ${reserveHeroSpace ? `
        .hero-container {
          min-height: 60vh;
          contain-intrinsic-size: 100vw 60vh;
          content-visibility: auto;
        }
        
        .hero-image {
          aspect-ratio: 16/9;
          contain-intrinsic-size: 1200px 675px;
        }
      ` : ''}
      
      ${reserveNavSpace ? `
        .navigation-container {
          min-height: 64px;
          contain: layout style;
        }
        
        .header-logo {
          width: 120px;
          height: 40px;
          contain-intrinsic-size: 120px 40px;
        }
      ` : ''}
      
      ${preventFontSwap ? `
        /* Prevent FOIT/FOUT with font-display: swap */
        @font-face {
          font-display: swap;
        }
        
        .text-loading {
          visibility: hidden;
        }
        
        .font-loaded .text-loading {
          visibility: visible;
        }
        
        /* Size fallback fonts to match web fonts */
        .font-inter {
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          size-adjust: 100%;
        }
      ` : ''}
      
      /* Prevent layout shifts for common elements */
      .card-skeleton {
        aspect-ratio: 1;
        contain-intrinsic-size: 300px 300px;
      }
      
      .button-skeleton {
        height: 40px;
        min-width: 120px;
        contain-intrinsic-size: 120px 40px;
      }
      
      /* Optimize container queries for performance */
      .responsive-container {
        contain: layout style inline-size;
      }
      
      /* Prevent shifts in grid layouts */
      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        contain: layout;
      }
      
      .product-card {
        aspect-ratio: 4/5;
        contain-intrinsic-size: 250px 312px;
      }
      
      /* Stabilize form elements */
      .form-field {
        min-height: 40px;
        contain: layout style;
      }
      
      /* Optimize scroll performance */
      .scroll-container {
        contain: layout style paint;
        will-change: scroll-position;
      }
      
      /* Prevent CLS in image galleries */
      .gallery-item {
        aspect-ratio: 1;
        contain-intrinsic-size: 200px 200px;
      }
    `;

    if (!document.getElementById('layout-stabilization-css')) {
      const style = document.createElement('style');
      style.id = 'layout-stabilization-css';
      style.textContent = stabilizationCSS;
      document.head.appendChild(style);
    }

    // Add font loading event listeners
    if (preventFontSwap && 'fonts' in document) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('font-loaded');
      });

      // Fallback for older browsers
      const timeout = setTimeout(() => {
        document.documentElement.classList.add('font-loaded');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [reserveHeroSpace, reserveNavSpace, preventFontSwap]);

  return null;
};
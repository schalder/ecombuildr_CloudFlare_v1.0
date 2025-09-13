import { useEffect } from 'react';

interface CriticalCSSInlinerProps {
  inlineCriticalCSS?: boolean;
}

export const CriticalCSSInliner: React.FC<CriticalCSSInlinerProps> = ({ 
  inlineCriticalCSS = true 
}) => {
  useEffect(() => {
    if (!inlineCriticalCSS) return;

    // Critical CSS for above-the-fold content
    const criticalCSS = `
      /* Critical layout styles to prevent CLS */
      .hero-section {
        min-height: 60vh;
        contain: layout style paint;
      }
      
      .product-grid {
        contain: layout;
      }
      
      .skeleton-loader {
        background: linear-gradient(90deg, hsl(var(--muted)) 25%, transparent 37%, hsl(var(--muted)) 63%);
        background-size: 400% 100%;
        animation: skeleton 1.5s ease-in-out infinite;
      }
      
      @keyframes skeleton {
        0% { background-position: 100% 50%; }
        100% { background-position: -100% 50%; }
      }
      
      /* Prevent layout shifts for images */
      img[data-loading="lazy"] {
        content-visibility: auto;
        contain-intrinsic-size: 300px 200px;
      }
      
      /* Critical font loading */
      .font-loading {
        font-display: swap;
        visibility: hidden;
      }
      
      .font-loaded .font-loading {
        visibility: visible;
      }
      
      /* Optimize rendering performance */
      .will-change-transform {
        will-change: transform;
      }
      
      .contain-layout {
        contain: layout;
      }
      
      .contain-strict {
        contain: strict;
      }
    `;

    // Check if critical CSS is already injected
    if (!document.getElementById('critical-inline-css')) {
      const style = document.createElement('style');
      style.id = 'critical-inline-css';
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }

    // Mark document as having critical CSS loaded
    document.documentElement.classList.add('critical-css-loaded');
  }, [inlineCriticalCSS]);

  return null;
};
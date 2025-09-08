import { useEffect } from 'react';

/**
 * Hook to inject CSS into the document head
 * Prevents CSS from being visible as text content in the page
 */
export const useHeadStyle = (styleId: string, css: string) => {
  useEffect(() => {
    if (!css) return;

    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    // Create or update style element in document head
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
    
    // Cleanup function
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [styleId, css]);
};
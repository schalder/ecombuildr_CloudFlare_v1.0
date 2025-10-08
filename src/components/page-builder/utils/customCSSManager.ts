import { useEffect, useRef } from 'react';

/**
 * Custom CSS Manager - Handles consistent CSS injection and cleanup
 * across different rendering contexts (edit, preview, live)
 */
export class CustomCSSManager {
  private static instance: CustomCSSManager;
  private styleElements: Map<string, HTMLStyleElement> = new Map();
  private cssCache: Map<string, { css: string; anchor: string }> = new Map();

  static getInstance(): CustomCSSManager {
    if (!CustomCSSManager.instance) {
      CustomCSSManager.instance = new CustomCSSManager();
    }
    return CustomCSSManager.instance;
  }

  /**
   * Apply custom CSS to an element
   */
  applyCSS(elementId: string, anchor: string, customCSS: string): void {
    const styleId = `custom-css-${elementId}`;
    
    // Cache the CSS for later re-application
    if (customCSS) {
      this.cssCache.set(elementId, { css: customCSS, anchor });
    } else {
      this.cssCache.delete(elementId);
    }
    
    // Remove existing style if it exists
    this.removeCSS(elementId);
    
    // Only apply if CSS exists and anchor is available
    if (customCSS && anchor) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.setAttribute('data-element-id', elementId);
      styleElement.setAttribute('data-anchor', anchor);
      
      // Apply CSS with high specificity to override inline styles
      styleElement.textContent = `
        /* Custom CSS for element ${elementId} */
        #${anchor} { 
          ${String(customCSS).replace(/;/g, ' !important;')} 
        }
        /* High specificity override for inline styles */
        #${anchor}.element-${elementId} { 
          ${String(customCSS).replace(/;/g, ' !important;')} 
        }
        /* Additional specificity for nested elements - EXCLUDE toolbars and editor UI */
        #${anchor} *:not([data-pb-toolbar]):not([data-rte-floating]):not([data-pb-toolbar] *):not([data-rte-floating] *) { 
          ${String(customCSS).replace(/;/g, ' !important;')} 
        }
      `;
      
      document.head.appendChild(styleElement);
      this.styleElements.set(elementId, styleElement);
    }
  }

  /**
   * Remove custom CSS for an element
   */
  removeCSS(elementId: string): void {
    const styleId = `custom-css-${elementId}`;
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
      this.styleElements.delete(elementId);
    }
  }

  /**
   * Clean up all custom CSS styles but keep cache
   */
  cleanupAll(): void {
    this.styleElements.forEach((styleElement) => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    });
    this.styleElements.clear();
  }

  /**
   * Re-apply all cached CSS (for mode switching)
   */
  reapplyAllCachedCSS(): void {
    this.cssCache.forEach(({ css, anchor }, elementId) => {
      this.applyCSS(elementId, anchor, css);
    });
  }

  /**
   * Get all custom CSS style elements
   */
  getAllStyles(): HTMLStyleElement[] {
    return Array.from(this.styleElements.values());
  }

  /**
   * Check if an element has custom CSS
   */
  hasCustomCSS(elementId: string): boolean {
    return this.cssCache.has(elementId);
  }

  /**
   * Get cached CSS for an element
   */
  getCachedCSS(elementId: string): { css: string; anchor: string } | undefined {
    return this.cssCache.get(elementId);
  }
}

/**
 * React hook for managing custom CSS
 */
export function useCustomCSS(elementId: string, anchor: string, customCSS: string): void {
  const manager = CustomCSSManager.getInstance();
  const prevCSSRef = useRef<string>('');
  const prevAnchorRef = useRef<string>('');

  useEffect(() => {
    const currentCSS = customCSS || '';
    const currentAnchor = anchor || elementId;
    
    // Only update if CSS or anchor has changed
    if (currentCSS !== prevCSSRef.current || currentAnchor !== prevAnchorRef.current) {
      manager.applyCSS(elementId, currentAnchor, currentCSS);
      
      prevCSSRef.current = currentCSS;
      prevAnchorRef.current = currentAnchor;
    }

    // Cleanup on unmount
    return () => {
      manager.removeCSS(elementId);
    };
  }, [elementId, anchor, customCSS, manager]);
}

/**
 * Global cleanup utility for mode switching
 */
export function cleanupAllCustomCSS(): void {
  const manager = CustomCSSManager.getInstance();
  manager.cleanupAll();
}

/**
 * Re-apply all cached CSS (for mode switching)
 */
export function reapplyAllCachedCSS(): void {
  const manager = CustomCSSManager.getInstance();
  manager.reapplyAllCachedCSS();
}

/**
 * Get all custom CSS elements for debugging
 */
export function getAllCustomCSSElements(): HTMLStyleElement[] {
  const manager = CustomCSSManager.getInstance();
  return manager.getAllStyles();
}

import React, { memo, useMemo, useState, useEffect } from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { storefrontElementRegistry } from './storefrontElementRegistry';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { generateResponsiveCSS } from '@/components/page-builder/utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface StorefrontElementRendererProps {
  element: PageBuilderElement;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
}

export const StorefrontElementRenderer = memo<StorefrontElementRendererProps>(({
  element,
  deviceType = 'desktop',
  columnCount = 1
}) => {
  const [elementDef, setElementDef] = useState(() => storefrontElementRegistry.get(element.type));
  const [isLoading, setIsLoading] = useState(!elementDef);
  const [showFallback, setShowFallback] = useState(false);

  // Reactive element loading
  useEffect(() => {
    let mounted = true;
    
    const checkAndLoadElement = async () => {
      // Check if element is already available
      const existing = storefrontElementRegistry.get(element.type);
      if (existing) {
        if (mounted) {
          setElementDef(existing);
          setIsLoading(false);
        }
        return;
      }

      // Start loading
      if (mounted) setIsLoading(true);
      
      try {
        await storefrontElementRegistry.ensureLoaded(element.type);
        const loaded = storefrontElementRegistry.get(element.type);
        if (mounted) {
          setElementDef(loaded);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn(`Failed to load element ${element.type}:`, err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Subscribe to registry changes
    const unsubscribe = storefrontElementRegistry.subscribe(() => {
      if (mounted) {
        const updated = storefrontElementRegistry.get(element.type);
        if (updated && !elementDef) {
          setElementDef(updated);
          setIsLoading(false);
        }
      }
    });

    checkAndLoadElement();

    // Show fallback after 800ms if still loading
    const fallbackTimer = setTimeout(() => {
      if (mounted && isLoading) {
        setShowFallback(true);
      }
    }, 800);

    return () => {
      mounted = false;
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [element.type, elementDef, isLoading]);

  // Memoize styles calculation
  const styles = useMemo(() => 
    renderElementStyles(element, deviceType), 
    [element, deviceType]
  );

  // Memoize responsive CSS generation
  const responsiveCSS = useMemo(() => 
    generateResponsiveCSS(element.id, element.styles), 
    [element.id, element.styles]
  );

  // Inject responsive CSS into document head
  useHeadStyle(`responsive-css-${element.id}`, responsiveCSS);

  // Apply Custom CSS to document head
  React.useEffect(() => {
    const customCSS = (element as any).content?.customCSS;
    if (!customCSS || !element.anchor) return;

    const styleId = `custom-css-${element.id}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      #${element.anchor} { 
        ${String(customCSS)} 
      }
      #${element.anchor} *:not(style):not(script) { 
        ${String(customCSS).replace(/([^{]+){([^}]+)}/g, '$2')} 
      }
    `;
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [(element as any).content?.customCSS, element.anchor, element.id]);

  // Apply Custom JS for this element
  React.useEffect(() => {
    const code = (element as any).content?.customJS;
    if (!code) return;
    
    let cleanupFn: (() => void) | null = null;
    
    try {
      const targetElement = document.getElementById(element.anchor || '');
      if (!targetElement) return;
      
      const fn = new Function(
        'element', 'targetElement', 'document', 'window', 'console',
        `
        try {
          ${String(code)}
          return typeof cleanup === 'function' ? cleanup : null;
        } catch (error) {
          console.error('Custom JS execution error:', error);
          return null;
        }
        `
      );
      
      cleanupFn = fn(element, targetElement, document, window, console);
      
    } catch (err) {
      console.error('Custom JS execution failed for', element.anchor, err);
    }
    
    return () => {
      if (cleanupFn && typeof cleanupFn === 'function') {
        try {
          cleanupFn();
        } catch (err) {
          console.warn('Custom JS cleanup failed:', err);
        }
      }
    };
  }, [(element as any).content?.customJS, element.anchor]);

  // Show loading skeleton while loading
  if (isLoading && !showFallback) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[60px]">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show fallback if element not found after timeout
  if (!elementDef) {
    if (showFallback) {
      console.warn(`Element type "${element.type}" not found in storefront registry`);
      return (
        <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded">
          <p className="text-sm">Unable to load element: {element.type}</p>
        </div>
      );
    }
    // Still loading, show skeleton
    return (
      <div className="flex items-center justify-center p-4 min-h-[60px]">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const Component = elementDef.component;

  // Merge responsive styles for spacing
  const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);
  
  // Don't apply spacing for media elements as they handle it internally
  const isMediaElement = ['image-carousel', 'image-gallery', 'video-playlist'].includes(element.type);
  
  // For button elements, only apply margins if explicitly set by user
  const isButtonElement = element.type === 'button';
  
  // Helper function to check if margin is defined in any responsive style
  const hasMarginDefined = (property: string) => {
    if (element.styles?.[property] !== undefined) return true;
    if (element.styles?.responsive?.desktop?.[property] !== undefined) return true;
    if (element.styles?.responsive?.tablet?.[property] !== undefined) return true;
    if (element.styles?.responsive?.mobile?.[property] !== undefined) return true;
    if (element.styles?.margin !== undefined) return true;
    if (element.styles?.responsive?.desktop?.margin !== undefined) return true;
    if (element.styles?.responsive?.tablet?.margin !== undefined) return true;
    if (element.styles?.responsive?.mobile?.margin !== undefined) return true;
    return false;
  };
  
  const userDefinedMargins = isButtonElement ? {
    marginTop: hasMarginDefined('marginTop') ? mergedStyles.marginTop : undefined,
    marginBottom: hasMarginDefined('marginBottom') ? mergedStyles.marginBottom : undefined,
    marginLeft: hasMarginDefined('marginLeft') ? mergedStyles.marginLeft : undefined,
    marginRight: hasMarginDefined('marginRight') ? mergedStyles.marginRight : undefined,
  } : {
    marginTop: mergedStyles.marginTop,
    marginBottom: mergedStyles.marginBottom,
    marginLeft: mergedStyles.marginLeft,
    marginRight: mergedStyles.marginRight,
  };

  // For button elements, don't apply padding from the wrapper
  const shouldApplyPadding = !isButtonElement;
  
  return (
    <div
      id={element.anchor}
      data-pb-element-id={element.id}
      className={cn(
        'relative transition-all duration-200 w-full'
      )}
      style={{
        ...(!isMediaElement ? {
          ...userDefinedMargins,
          ...(shouldApplyPadding ? {
            paddingTop: mergedStyles.paddingTop,
            paddingRight: mergedStyles.paddingRight,
            paddingBottom: mergedStyles.paddingBottom,
            paddingLeft: mergedStyles.paddingLeft,
          } : {})
        } : {})
      }}
    >
      <Component
        element={element}
        isEditing={false}
        deviceType={deviceType}
        columnCount={columnCount}
        onUpdate={() => {}} // No-op for storefront
      />
    </div>
  );
});

StorefrontElementRenderer.displayName = 'StorefrontElementRenderer';
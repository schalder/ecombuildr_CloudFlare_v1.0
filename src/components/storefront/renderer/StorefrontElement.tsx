import React, { useState, useEffect, useMemo } from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { storefrontRegistry } from '../registry/storefrontRegistry';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { getDeviceAwareSpacing } from '@/components/page-builder/utils/styleRenderer';
import { useCustomCSS } from '@/components/page-builder/utils/customCSSManager';
import { isElementVisible, getVisibilityStyles } from '@/components/page-builder/utils/deviceDetection';

interface StorefrontElementProps {
  element: PageBuilderElement;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
}

const ElementSkeleton = ({ element }: { element: PageBuilderElement }) => {
  // Smart skeleton based on element type
  const getSkeletonHeight = () => {
    const baseHeight = element.styles?.height || element.styles?.minHeight;
    if (baseHeight) return baseHeight;
    
    switch (element.type) {
      case 'heading': return '2rem';
      case 'text': return '4rem';
      case 'image': return '12rem';
      case 'video': return '16rem';
      case 'button': return '2.5rem';
      case 'product-grid': return '20rem';
      case 'countdown-timer': return '8rem';
      default: return '6rem';
    }
  };

  return (
    <div className="animate-pulse" style={{ height: getSkeletonHeight() }}>
      <Skeleton className="w-full h-full rounded-md" />
    </div>
  );
};

const ElementNotSupported = ({ elementType }: { elementType: string }) => {
  // Enhanced logging for QA
  console.warn(`[StorefrontElement] Element "${elementType}" is not available - showing fallback UI`);
  
  return (
    <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center text-muted-foreground">
      <p className="text-sm">Element "{elementType}" is not available</p>
    </div>
  );
};

export const StorefrontElement: React.FC<StorefrontElementProps> = ({
  element,
  deviceType = 'desktop',
  columnCount
}) => {
  const [elementDef, setElementDef] = useState(() => storefrontRegistry.get(element.type));
  const [isLoading, setIsLoading] = useState(!elementDef);
  const [showFallback, setShowFallback] = useState(false);

  // Check element visibility
  const isVisible = isElementVisible(element.visibility, deviceType);
  const visibilityStyles = getVisibilityStyles(element.visibility, deviceType);

  // Move useMemo to top level - this was causing the hooks rule violation
  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    // Use mergeResponsiveStyles to properly handle shorthand margin/padding parsing
    // This is especially important for spacer/divider elements that use shorthand styles
    const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);
    
    // Handle device-aware spacing
    const marginByDevice = (element.styles as any)?.marginByDevice;
    const deviceAwareMargin = marginByDevice ? getDeviceAwareSpacing(marginByDevice, deviceType) : null;
    
    const style: React.CSSProperties = {};
    
    // Apply device-aware margins if available, otherwise fallback to legacy margins
    if (deviceAwareMargin) {
      if (deviceAwareMargin.top > 0) style.marginTop = `${deviceAwareMargin.top}px`;
      if (deviceAwareMargin.right > 0) style.marginRight = `${deviceAwareMargin.right}px`;
      if (deviceAwareMargin.bottom > 0) style.marginBottom = `${deviceAwareMargin.bottom}px`;
      if (deviceAwareMargin.left > 0) style.marginLeft = `${deviceAwareMargin.left}px`;
    } else {
      // Fallback to legacy margin styles
      if (mergedStyles.marginTop) style.marginTop = mergedStyles.marginTop;
      if (mergedStyles.marginRight) style.marginRight = mergedStyles.marginRight;
      if (mergedStyles.marginBottom) style.marginBottom = mergedStyles.marginBottom;
      if (mergedStyles.marginLeft) style.marginLeft = mergedStyles.marginLeft;
    }
    
    // Apply visibility styles
    Object.assign(style, visibilityStyles);
    
    return style;
  }, [element, deviceType, visibilityStyles]);

  useEffect(() => {
    let mounted = true;
    let fallbackTimer: NodeJS.Timeout;

    const loadElement = async () => {
      if (elementDef) return;

      setIsLoading(true);
      
      // Show skeleton initially, fallback after delay
      fallbackTimer = setTimeout(() => {
        if (mounted) setShowFallback(true);
      }, 2000);

      try {
        await storefrontRegistry.ensureElementLoaded(element.type);
        
        if (mounted) {
          const newElementDef = storefrontRegistry.get(element.type);
          setElementDef(newElementDef);
          setIsLoading(false);
          clearTimeout(fallbackTimer);
        }
      } catch (error) {
        console.warn(`Failed to load element ${element.type}:`, error);
        if (mounted) {
          setIsLoading(false);
          setShowFallback(true);
        }
      }
    };

    // Subscribe to registry updates
    const unsubscribe = storefrontRegistry.subscribe(() => {
      if (!elementDef && mounted) {
        const newElementDef = storefrontRegistry.get(element.type);
        if (newElementDef) {
          setElementDef(newElementDef);
          setIsLoading(false);
          clearTimeout(fallbackTimer);
        }
      }
    });

    loadElement();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [element.type, elementDef]);

  // Apply Custom CSS using the CSS manager
  const anchor = element.anchor || element.id;
  useCustomCSS(element.id, anchor, (element as any).content?.customCSS || '');

  // Apply Custom JS for this element (for live pages)
  useEffect(() => {
    const code = (element as any).content?.customJS;
    if (!code) return;
    
    let cleanupFn: (() => void) | null = null;
    
    // Use element ID as fallback if anchor is missing
    const anchor = element.anchor || element.id;
    if (!anchor) return;
    
    const executeJS = () => {
      try {
        const targetElement = document.getElementById(anchor);
        if (!targetElement) {
          console.warn('Custom JS target element not found:', anchor);
          return;
        }
        
        // Create a scoped execution context with cleanup support
        // eslint-disable-next-line no-new-func
        const fn = new Function(
          'element', 'targetElement', 'document', 'window', 'console',
          `
          try {
            ${String(code)}
            // Return cleanup function if defined
            return typeof cleanup === 'function' ? cleanup : null;
          } catch (error) {
            console.error('Custom JS execution error:', error);
            return null;
          }
          `
        );
        
        cleanupFn = fn(element, targetElement, document, window, console);
        
      } catch (err) {
        console.error('Custom JS execution failed for', anchor, err);
      }
    };

    // Execute JS after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(executeJS, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (cleanupFn && typeof cleanupFn === 'function') {
        try {
          cleanupFn();
        } catch (err) {
          console.warn('Custom JS cleanup failed:', err);
        }
      }
    };
  }, [(element as any).content?.customJS, element.anchor, element.id]);

  // Use conditional rendering instead of early returns to fix hooks rule violation
  if (isLoading && !showFallback) {
    return <ElementSkeleton element={element} />;
  }

  if (showFallback || !elementDef) {
    return <ElementNotSupported elementType={element.type} />;
  }

  // Don't render element if it's not visible on current device
  if (!isVisible) {
    return null;
  }

  const ElementComponent = elementDef.component;

  return (
    <div 
      id={element.anchor}
      data-pb-element-id={element.id}
      style={wrapperStyle}
    >
      <ErrorBoundary
        fallback={({ retry }) => (
          <div className="p-4 border border-destructive/30 rounded-lg text-center text-destructive">
            <p className="text-sm">Error rendering "{element.type}"</p>
          </div>
        )}
      >
        <ElementComponent
          element={element}
          isEditing={false}
          deviceType={deviceType}
          columnCount={columnCount}
        />
      </ErrorBoundary>
    </div>
  );
};
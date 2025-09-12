import React, { useState, useEffect } from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { storefrontRegistry } from '../registry/storefrontRegistry';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { generateResponsiveCSS } from '@/components/page-builder/utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';

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

  // Generate and inject responsive CSS for this element
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  
  // Debug log for spacing issues
  if (element.styles) {
    const hasResponsive = !!element.styles.responsive;
    const baseSpacing = {
      margin: element.styles.margin,
      marginTop: element.styles.marginTop,
      marginRight: element.styles.marginRight,
      marginBottom: element.styles.marginBottom,
      marginLeft: element.styles.marginLeft,
      padding: element.styles.padding,
      paddingTop: element.styles.paddingTop,
      paddingRight: element.styles.paddingRight,
      paddingBottom: element.styles.paddingBottom,
      paddingLeft: element.styles.paddingLeft
    };
    const spacingKeys = Object.keys(baseSpacing).filter(k => baseSpacing[k as keyof typeof baseSpacing]);
    console.log(`[StorefrontElement] ${element.id} (${element.type}): hasResponsive=${hasResponsive}, baseSpacing=[${spacingKeys.join(',')}], css=${responsiveCSS.substring(0, 160)}...`);
  }
  
  useHeadStyle(`storefront-element-${element.id}`, responsiveCSS);

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

  // Show loading skeleton while element is being loaded
  if (isLoading && !showFallback) {
    return <ElementSkeleton element={element} />;
  }

  // Show gentle fallback if element failed to load
  if (showFallback || !elementDef) {
    return <ElementNotSupported elementType={element.type} />;
  }

  const ElementComponent = elementDef.component;

  return (
    <div 
      id={element.anchor}
      data-pb-element-id={element.id}
      className={`storefront element-${element.id}`}
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
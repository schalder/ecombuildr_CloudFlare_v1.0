import React, { useState, useEffect } from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { storefrontRegistry } from '../registry/storefrontRegistry';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

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

const ElementNotSupported = ({ elementType }: { elementType: string }) => (
  <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center text-muted-foreground">
    <p className="text-sm">Element "{elementType}" is not available</p>
  </div>
);

export const StorefrontElement: React.FC<StorefrontElementProps> = ({
  element,
  deviceType = 'desktop',
  columnCount
}) => {
  const [elementDef, setElementDef] = useState(() => storefrontRegistry.get(element.type));
  const [isLoading, setIsLoading] = useState(!elementDef);
  const [showFallback, setShowFallback] = useState(false);

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
  );
};
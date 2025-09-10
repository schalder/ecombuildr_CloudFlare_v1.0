import React, { memo, useMemo } from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { getStorefrontRegistry } from './StorefrontElementRegistry';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { generateResponsiveCSS } from '@/components/page-builder/utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';
import { ElementErrorBoundary } from '@/components/ui/error-boundary';

interface StorefrontOptimizedElementRendererProps {
  element: PageBuilderElement;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontOptimizedElementRenderer = memo<StorefrontOptimizedElementRendererProps>(({
  element,
  deviceType = 'desktop'
}) => {
  // Use storefront-only registry to avoid loading editor components
  const elementDef = useMemo(() => 
    getStorefrontRegistry().get(element.type), 
    [element.type]
  );

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

  if (!elementDef) {
    console.warn(`Element type "${element.type}" not found in storefront registry`);
    return (
      <div className="p-2 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
        Element type "{element.type}" not supported in storefront
      </div>
    );
  }

  const Component = elementDef.component;

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
    `;
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [(element as any).content?.customCSS, element.anchor, element.id]);

  return (
    <ElementErrorBoundary elementId={element.id} elementType={element.type}>
      <Component
        element={element}
        isEditing={false}
        deviceType={deviceType}
      />
    </ElementErrorBoundary>
  );
});

StorefrontOptimizedElementRenderer.displayName = 'StorefrontOptimizedElementRenderer';
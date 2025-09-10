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
  console.log(`[StorefrontElementRenderer] Rendering element: ${element.type} (${element.id})`);
  
  // CRITICAL: ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY TIME
  // Never put hooks after conditional returns or inside conditions
  
  // Hook 1: Element definition lookup
  const elementDef = useMemo(() => {
    const def = getStorefrontRegistry().get(element.type);
    console.log(`[StorefrontElementRenderer] Element definition for ${element.type}:`, def ? 'Found' : 'Missing');
    return def;
  }, [element.type]);

  // Hook 2: Styles calculation
  const styles = useMemo(() => 
    renderElementStyles(element, deviceType), 
    [element, deviceType]
  );

  // Hook 3: Responsive CSS generation
  const responsiveCSS = useMemo(() => 
    generateResponsiveCSS(element.id, element.styles), 
    [element.id, element.styles]
  );

  // Hook 4: ALWAYS inject responsive CSS - even if element doesn't exist
  useHeadStyle(`responsive-css-${element.id}`, responsiveCSS);

  // Hook 5: ALWAYS run useEffect - even if element doesn't exist
  React.useEffect(() => {
    // Safe to have early returns INSIDE the effect
    if (!elementDef) return;
    
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
  }, [elementDef, (element as any).content?.customCSS, element.anchor, element.id]);

  // NOW it's safe to do conditional rendering - ALL hooks have been called
  if (!elementDef) {
    console.warn(`[StorefrontElementRenderer] Element type "${element.type}" not found in storefront registry`);
    console.log(`[StorefrontElementRenderer] Available elements:`, getStorefrontRegistry().getAll().map(el => el.id));
    return (
      <div className="p-2 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
        Element type "{element.type}" not supported in storefront
      </div>
    );
  }

  const Component = elementDef.component;

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
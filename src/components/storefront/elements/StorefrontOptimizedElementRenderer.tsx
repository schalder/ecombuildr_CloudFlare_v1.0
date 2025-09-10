import React, { memo, useMemo } from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { getStorefrontRegistry } from './StorefrontElementRegistry';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { generateResponsiveCSS } from '@/components/page-builder/utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';
import { ElementErrorBoundary } from '@/components/ui/error-boundary';
import { SafeModeRenderer } from '../SafeModeRenderer';
import { AlertTriangle } from 'lucide-react';

interface StorefrontOptimizedElementRendererProps {
  element: PageBuilderElement;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontOptimizedElementRenderer = memo<StorefrontOptimizedElementRendererProps>(({
  element,
  deviceType = 'desktop'
}) => {
  // Check for safe mode parameter
  const isSafeMode = new URLSearchParams(window.location.search).has('safe-mode');
  const problematicElements = ['checkout-full', 'order-confirmation', 'list', 'testimonial'];
  
  console.log(`[StorefrontElementRenderer] Rendering element: ${element.type} (${element.id})`);
  console.log(`[StorefrontElementRenderer] Safe mode: ${isSafeMode}`);
  
  // If safe mode is enabled and this is a problematic element, render safe placeholder
  if (isSafeMode && problematicElements.includes(element.type)) {
    console.log(`[StorefrontElementRenderer] Rendering ${element.type} in safe mode`);
    return <SafeModeRenderer element={element} deviceType={deviceType} />;
  }
  
  // CRITICAL: ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY TIME
  // Never put hooks after conditional returns or inside conditions
  
  // Hook 1: Element definition lookup with enhanced diagnostics
  const elementDef = useMemo(() => {
    console.log(`[StorefrontElementRenderer] Looking up element definition for: ${element.type}`);
    console.log(`[StorefrontElementRenderer] Registry state:`, {
      isInitialized: getStorefrontRegistry().getAll().length > 0,
      availableElements: getStorefrontRegistry().getAll().map(el => el.id)
    });
    
    const def = getStorefrontRegistry().get(element.type);
    console.log(`[StorefrontElementRenderer] Element definition for ${element.type}:`, def ? 'Found' : 'Missing');
    
    if (!def) {
      console.warn(`[StorefrontElementRenderer] MISSING ELEMENT: ${element.type} not found in registry`);
      console.log(`[StorefrontElementRenderer] Available elements:`, getStorefrontRegistry().getAll().map(el => el.id));
    }
    
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
    console.log(`[StorefrontElementRenderer] Effect running for element: ${element.type} (${element.id})`);
    console.log(`[StorefrontElementRenderer] Element def exists:`, !!elementDef);
    
    // Safe to have early returns INSIDE the effect
    if (!elementDef) {
      console.log(`[StorefrontElementRenderer] Skipping custom CSS injection - no element definition`);
      return;
    }
    
    const customCSS = (element as any).content?.customCSS;
    if (!customCSS || !element.anchor) {
      console.log(`[StorefrontElementRenderer] Skipping custom CSS injection - no CSS or anchor`);
      return;
    }

    console.log(`[StorefrontElementRenderer] Injecting custom CSS for ${element.anchor}`);
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
      console.log(`[StorefrontElementRenderer] Cleaning up custom CSS for ${element.id}`);
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [elementDef, (element as any).content?.customCSS, element.anchor, element.id]);

  // NOW it's safe to do conditional rendering - ALL hooks have been called
  if (!elementDef) {
    console.warn(`[StorefrontElementRenderer] RENDER FALLBACK: Element type "${element.type}" not found in storefront registry`);
    return (
      <div className="p-3 border border-amber-300 bg-amber-50 rounded-lg text-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="font-semibold text-amber-800">Unsupported Element</span>
        </div>
        <div className="text-amber-700">
          <div><strong>Type:</strong> {element.type}</div>
          <div><strong>ID:</strong> {element.id}</div>
        </div>
        {isSafeMode && (
          <div className="mt-2 text-xs text-amber-600">
            Safe mode is enabled. <a href="?" className="underline">Disable safe mode</a> to try rendering this element.
          </div>
        )}
      </div>
    );
  }

  console.log(`[StorefrontElementRenderer] Rendering component for ${element.type}`);
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
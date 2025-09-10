import React, { memo, useMemo } from 'react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';

interface OptimizedElementRendererProps {
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onSelect?: (elementId: string) => void;
  onDelete?: (elementId: string) => void;
  isSelected?: boolean;
}

export const OptimizedElementRenderer = memo<OptimizedElementRendererProps>(({
  element,
  isEditing = false,
  deviceType = 'desktop',
  onUpdate,
  onSelect,
  onDelete,
  isSelected = false
}) => {
  // ALWAYS call all hooks first - never skip any hooks
  // Memoize element definition lookup
  const elementDef = useMemo(() => 
    elementRegistry.get(element.type), 
    [element.type]
  );

  // Memoize styles calculation - always calculate 
  const styles = useMemo(() => 
    renderElementStyles(element, deviceType), 
    [element, deviceType]
  );

  // Memoize responsive CSS generation - always calculate
  const responsiveCSS = useMemo(() => 
    generateResponsiveCSS(element.id, element.styles), 
    [element.id, element.styles]
  );

  // ALWAYS inject responsive CSS into document head
  useHeadStyle(`responsive-css-${element.id}`, responsiveCSS);

  // Wrap onUpdate to match expected signature - always do this
  const handleUpdate = useMemo(() => 
    onUpdate ? (updates: Partial<PageBuilderElement>) => onUpdate(element.id, updates) : undefined,
    [onUpdate, element.id]
  );

  // ALWAYS apply Custom CSS to document head - even if element doesn't exist
  React.useEffect(() => {
    if (!elementDef) return; // Safe early return inside effect
    
    const customCSS = (element as any).content?.customCSS;
    if (!customCSS || !element.anchor) return;

    const styleId = `custom-css-${element.id}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    // Create or update style element in document head
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Apply CSS with proper scoping to element anchor
    styleElement.textContent = `
      /* Custom CSS for element ${element.id} */
      #${element.anchor} { 
        ${String(customCSS)} 
      }
      /* High specificity selectors for better override capability, excluding internal elements */
      #${element.anchor} *:not(style):not(script) { 
        ${String(customCSS).replace(/([^{]+){([^}]+)}/g, '$2')} 
      }
    `;
    
    // Cleanup function
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [elementDef, (element as any).content?.customCSS, element.anchor, element.id]);

  // Now safe to do conditional rendering after ALL hooks have been called
  if (!elementDef) {
    console.warn(`Element type "${element.type}" not found in registry`);
    return null;
  }

  const Component = elementDef.component;

  return (
    <Component
      element={element}
      isEditing={isEditing}
      onUpdate={handleUpdate}
      deviceType={deviceType}
    />
  );
});

OptimizedElementRenderer.displayName = 'OptimizedElementRenderer';
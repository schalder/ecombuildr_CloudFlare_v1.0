import React, { memo, useMemo } from 'react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';

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
  // Memoize element definition lookup
  const elementDef = useMemo(() => 
    elementRegistry.get(element.type), 
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

  if (!elementDef) {
    console.warn(`Element type "${element.type}" not found in registry`);
    return null;
  }

  const Component = elementDef.component;

  // Wrap onUpdate to match expected signature
  const handleUpdate = useMemo(() => 
    onUpdate ? (updates: Partial<PageBuilderElement>) => onUpdate(element.id, updates) : undefined,
    [onUpdate, element.id]
  );

  // Apply Custom CSS to document head (prevents visible text in builder)
  React.useEffect(() => {
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
      /* High specificity selectors for better override capability */
      #${element.anchor} * { 
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
  }, [(element as any).content?.customCSS, element.anchor, element.id]);

  return (
    <>
      <style>{responsiveCSS}</style>
      <Component
        element={element}
        isEditing={isEditing}
        onUpdate={handleUpdate}
        deviceType={deviceType}
      />
    </>
  );
});

OptimizedElementRenderer.displayName = 'OptimizedElementRenderer';
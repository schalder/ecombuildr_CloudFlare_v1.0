import React, { memo, useMemo } from 'react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';
import { useCustomCSS } from '../utils/customCSSManager';

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

  // Inject responsive CSS into document head
  useHeadStyle(`responsive-css-${element.id}`, responsiveCSS);

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

  // Apply Custom CSS using the CSS manager
  const anchor = element.anchor || element.id;
  useCustomCSS(element.id, anchor, (element as any).content?.customCSS || '');

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
import React from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { cn } from '@/lib/utils';
import { mergeResponsiveStyles, generateResponsiveCSS } from '../utils/responsiveStyles';
import { useHeadStyle } from '@/hooks/useHeadStyle';

interface ElementRendererProps {
  element: PageBuilderElement;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onRemoveElement: (elementId: string) => void;
  sectionId?: string;
  rowId?: string;
  columnId?: string;
  elementIndex?: number;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isPreviewMode,
  deviceType = 'desktop',
  columnCount = 1,
  onSelectElement,
  onUpdateElement,
  onRemoveElement,
  sectionId,
  rowId,
  columnId,
  elementIndex,
  onMoveElement
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isSelected, setIsSelected] = React.useState(false);

  const [{ isDragging }, drag] = isPreviewMode 
    ? [{ isDragging: false }, React.useRef(null)]
    : useDrag({
        type: 'element',
        item: { 
          elementId: element.id,
          elementType: element.type,
          sectionId,
          rowId,
          columnId,
          elementIndex
        },
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      });

  // Resolve element type with backward-compatible fallbacks
  let elementType = elementRegistry.get(element.type);
  if (!elementType) {
    const normalized = element.type.replace(/_/g, '-');
    const aliasMap: Record<string, string> = {
      'product_grid': 'product-grid',
      'featured_products': 'featured-products',
      'product_categories': 'product-categories',
      'category_navigation': 'product-categories',
    };
    const candidates = Array.from(
      new Set([
        normalized,
        aliasMap[element.type],
        aliasMap[normalized as keyof typeof aliasMap],
      ].filter(Boolean) as string[])
    );
    for (const id of candidates) {
      const hit = elementRegistry.get(id);
      if (hit) {
        elementType = hit;
        break;
      }
    }
    if (!elementType) {
      console.warn('ElementRenderer: Unknown element type', element.type, 'tried:', candidates, 'available:', elementRegistry.getAll().map(e => e.id));
    }
  }

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
    // Use highly specific selectors and exclude internal elements like style and script tags
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
  }, [(element as any).content?.customCSS, element.anchor, element.id]);

  // Apply Custom JS for this element (scoped to its DOM node by anchor)
  React.useEffect(() => {
    const code = (element as any).content?.customJS;
    if (!code) return;
    
    let cleanupFn: (() => void) | null = null;
    
    try {
      const targetElement = document.getElementById(element.anchor || '');
      if (!targetElement) {
        console.warn('Custom JS target element not found:', element.anchor);
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
      console.error('Custom JS execution failed for', element.anchor, err);
    }
    
    // Cleanup function
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

  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      setIsSelected(true);
      onSelectElement(element);
    }
  };

  const handleDeleteElement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveElement(element.id);
  };

  const handleDuplicateElement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sectionId && rowId && columnId && elementIndex !== undefined) {
      if (onMoveElement) {
        // Create a new element with same content but new ID
        const newElement = {
          ...element,
          id: `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        // This is a workaround - ideally we'd have an onDuplicateElement callback
        
      }
    }
  };

  const handleUpdateElement = (updates: Partial<PageBuilderElement>) => {
    onUpdateElement(element.id, updates);
  };

  if (!elementType) {
    return (
      <div className="p-4 border border-destructive/50 rounded bg-destructive/10 text-destructive text-sm">
        Unknown element type: {element.type}
      </div>
    );
  }

  const ElementComponent = elementType.component;

  // Generate and inject responsive CSS like StorefrontElement does
  const responsiveCSS = React.useMemo(() => 
    generateResponsiveCSS(element.id, element.styles), 
    [element.id, element.styles]
  );
  
  // Inject responsive CSS into document head for consistency with storefront
  useHeadStyle(`responsive-css-${element.id}`, responsiveCSS);

  // Merge responsive styles for spacing
  const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);
  
  // Don't apply spacing for media elements as they handle it internally
  const isMediaElement = ['image-carousel', 'image-gallery', 'video-playlist'].includes(element.type);
  
  // For button elements, only apply margins if explicitly set by user
  const isButtonElement = element.type === 'button';
  
  // Helper function to check if margin is defined in any responsive style
  const hasMarginDefined = (property: string) => {
    // Check base styles
    if (element.styles?.[property] !== undefined) return true;
    
    // Check responsive overrides
    if (element.styles?.responsive?.desktop?.[property] !== undefined) return true;
    if (element.styles?.responsive?.tablet?.[property] !== undefined) return true;
    if (element.styles?.responsive?.mobile?.[property] !== undefined) return true;
    
    // Check shorthand margin
    if (element.styles?.margin !== undefined) return true;
    if (element.styles?.responsive?.desktop?.margin !== undefined) return true;
    if (element.styles?.responsive?.tablet?.margin !== undefined) return true;
    if (element.styles?.responsive?.mobile?.margin !== undefined) return true;
    
    return false;
  };
  
  // Apply margins in both edit and preview mode
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

  // For button elements, don't apply padding from the wrapper - let the button handle its own padding
  const shouldApplyPadding = !isButtonElement;
  
  return (
    <div
      ref={drag}
      id={element.anchor}
      data-pb-element-id={element.id}
      className={cn(
        'relative group transition-all duration-200 w-full',
        isDragging && 'opacity-50',
        isSelected && !isPreviewMode && 'ring-2 ring-primary ring-opacity-50'
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
        } : {}),
        // Apply user-defined border radius to selection ring when selected
        ...(isSelected && !isPreviewMode && mergedStyles.borderRadius ? {
          borderRadius: mergedStyles.borderRadius
        } : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleElementClick}
    >
      {/* Element Controls */}
      {!isPreviewMode && isHovered && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs z-20">
          <GripVertical className="h-3 w-3" />
          <span className="capitalize">{elementType.name}</span>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-accent-foreground/20"
              onClick={handleDuplicateElement}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-destructive/20"
              onClick={handleDeleteElement}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <ElementComponent
        element={element}
        isEditing={!isPreviewMode}
        deviceType={deviceType}
        columnCount={columnCount}
        onUpdate={handleUpdateElement}
      />
    </div>
  );
};
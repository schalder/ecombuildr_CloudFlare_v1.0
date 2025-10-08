import React from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { cn } from '@/lib/utils';
import { mergeResponsiveStyles } from '../utils/responsiveStyles';
import { getDeviceAwareSpacing } from '../utils/styleRenderer';
import { useCustomCSS } from '../utils/customCSSManager';

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

  // Apply Custom CSS using the CSS manager
  const anchor = element.anchor || element.id;
  useCustomCSS(element.id, anchor, (element as any).content?.customCSS || '');

  // Apply Custom JS for this element (scoped to its DOM node by anchor)
  React.useEffect(() => {
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

  // Merge responsive styles for spacing
  const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);
  
  // Handle device-aware spacing
  const marginByDevice = (element.styles as any)?.marginByDevice;
  const paddingByDevice = (element.styles as any)?.paddingByDevice;
  
  // Get device-aware spacing values
  const deviceAwareMargin = marginByDevice ? getDeviceAwareSpacing(marginByDevice, deviceType) : null;
  const deviceAwarePadding = paddingByDevice ? getDeviceAwareSpacing(paddingByDevice, deviceType) : null;
  
  // Don't apply spacing for media elements as they handle it internally
  const isMediaElement = ['image-carousel', 'image-gallery', 'video-playlist'].includes(element.type);
  
  // For button elements, only apply margins if explicitly set by user
  const isButtonElement = element.type === 'button';
  
  // Helper function to check if margin is defined in any responsive style
  const hasMarginDefined = (property: string) => {
    // Check device-aware spacing first
    if (deviceAwareMargin && deviceAwareMargin[property as keyof typeof deviceAwareMargin] > 0) return true;
    
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
    marginTop: hasMarginDefined('top') ? (deviceAwareMargin?.top ? `${deviceAwareMargin.top}px` : mergedStyles.marginTop) : undefined,
    marginBottom: hasMarginDefined('bottom') ? (deviceAwareMargin?.bottom ? `${deviceAwareMargin.bottom}px` : mergedStyles.marginBottom) : undefined,
    marginLeft: hasMarginDefined('left') ? (deviceAwareMargin?.left ? `${deviceAwareMargin.left}px` : mergedStyles.marginLeft) : undefined,
    marginRight: hasMarginDefined('right') ? (deviceAwareMargin?.right ? `${deviceAwareMargin.right}px` : mergedStyles.marginRight) : undefined,
  } : {
    marginTop: deviceAwareMargin?.top ? `${deviceAwareMargin.top}px` : mergedStyles.marginTop,
    marginBottom: deviceAwareMargin?.bottom ? `${deviceAwareMargin.bottom}px` : mergedStyles.marginBottom,
    marginLeft: deviceAwareMargin?.left ? `${deviceAwareMargin.left}px` : mergedStyles.marginLeft,
    marginRight: deviceAwareMargin?.right ? `${deviceAwareMargin.right}px` : mergedStyles.marginRight,
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
            paddingTop: deviceAwarePadding?.top ? `${deviceAwarePadding.top}px` : mergedStyles.paddingTop,
            paddingRight: deviceAwarePadding?.right ? `${deviceAwarePadding.right}px` : mergedStyles.paddingRight,
            paddingBottom: deviceAwarePadding?.bottom ? `${deviceAwarePadding.bottom}px` : mergedStyles.paddingBottom,
            paddingLeft: deviceAwarePadding?.left ? `${deviceAwarePadding.left}px` : mergedStyles.paddingLeft,
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
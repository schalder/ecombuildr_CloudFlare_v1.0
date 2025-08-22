import React from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { cn } from '@/lib/utils';
import { mergeResponsiveStyles } from '../utils/responsiveStyles';

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

  // Apply Custom JS for this element (scoped to its DOM node by anchor)
  React.useEffect(() => {
    const code = (element as any).content?.customJS;
    if (!code) return;
    try {
      const el = document.getElementById(element.anchor || '') as HTMLElement | null;
      // eslint-disable-next-line no-new-func
      const fn = new Function('el', 'element', 'document', 'window', String(code));
      fn(el, element, document, window);
    } catch (err) {
      console.warn('Custom JS execution failed for', element.anchor, err);
    }
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
        console.log('Duplication not fully implemented yet');
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

  return (
    <div
      ref={drag}
      id={element.anchor}
      data-pb-element-id={element.id}
      className={cn(
        'relative group transition-all duration-200 w-full',
        isDragging && 'opacity-50',
        isSelected && !isPreviewMode && 'ring-2 ring-primary ring-opacity-50 rounded'
      )}
      style={{
        marginTop: mergedStyles.marginTop,
        marginRight: mergedStyles.marginRight,
        marginBottom: mergedStyles.marginBottom,
        marginLeft: mergedStyles.marginLeft,
        paddingTop: mergedStyles.paddingTop,
        paddingRight: mergedStyles.paddingRight,
        paddingBottom: mergedStyles.paddingBottom,
        paddingLeft: mergedStyles.paddingLeft,
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
      {/* Custom CSS injection targeting the real DOM id (anchor) */}
      {((element as any).content?.customCSS) ? (
        <style>{`#${element.anchor} { ${String((element as any).content?.customCSS)} }`}</style>
      ) : null}

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
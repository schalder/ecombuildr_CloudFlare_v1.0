import React from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '../types';
import { elementRegistry } from '../elements';
import { cn } from '@/lib/utils';

interface ElementRendererProps {
  element: PageBuilderElement;
  isPreviewMode: boolean;
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onRemoveElement: (elementId: string) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isPreviewMode,
  onSelectElement,
  onUpdateElement,
  onRemoveElement
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isSelected, setIsSelected] = React.useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { elementId: element.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const elementType = elementRegistry.get(element.type);

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
    // TODO: Implement element duplication
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

  return (
    <div
      ref={drag}
      className={cn(
        'relative group transition-all duration-200',
        isDragging && 'opacity-50',
        isSelected && !isPreviewMode && 'ring-2 ring-primary ring-opacity-50 rounded',
        element.styles?.margin,
        element.styles?.padding
      )}
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

      <div
        className={cn(
          element.styles?.backgroundColor && `bg-[${element.styles.backgroundColor}]`,
          element.styles?.color && `text-[${element.styles.color}]`,
          element.styles?.fontSize && `text-[${element.styles.fontSize}]`,
          element.styles?.textAlign === 'center' && 'text-center',
          element.styles?.textAlign === 'right' && 'text-right'
        )}
      >
        <ElementComponent
          element={element}
          isEditing={!isPreviewMode}
          onUpdate={handleUpdateElement}
        />
      </div>
    </div>
  );
};
import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderColumn, PageBuilderElement } from '../types';
import { ElementRenderer } from './ElementRenderer';
import { cn } from '@/lib/utils';

interface ColumnRendererProps {
  column: PageBuilderColumn;
  rowId: string;
  isPreviewMode: boolean;
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (elementType: string, targetPath: string) => void;
  onRemoveElement: (elementId: string) => void;
}

export const ColumnRenderer: React.FC<ColumnRendererProps> = ({
  column,
  rowId,
  isPreviewMode,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onRemoveElement
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'element',
    drop: (item: { elementType: string }) => {
      onAddElement(item.elementType, `column-${column.id}`);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleColumnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      onSelectElement(column as any);
    }
  };

  const handleAddElement = () => {
    onAddElement('text', `column-${column.id}`);
  };

  return (
    <div
      ref={drop}
      className={cn(
        'relative min-h-[60px] rounded border-2 border-dashed border-transparent transition-colors',
        isOver && 'border-primary/40 bg-primary/5',
        !isPreviewMode && isHovered && 'border-muted-foreground/30',
        column.styles?.backgroundColor && `bg-[${column.styles.backgroundColor}]`,
        column.styles?.padding || 'p-2'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleColumnClick}
    >
      {/* Column Controls */}
      {!isPreviewMode && isHovered && column.elements.length === 0 && (
        <div className="absolute -top-6 left-0 flex items-center space-x-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs z-10">
          <GripVertical className="h-3 w-3" />
          <span>Column</span>
        </div>
      )}

      {column.elements.length === 0 ? (
        <div className="min-h-[60px] flex items-center justify-center">
          {!isPreviewMode && (
            <Button variant="ghost" size="sm" onClick={handleAddElement} className="text-muted-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Element
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {column.elements.map((element) => (
            <ElementRenderer
              key={element.id}
              element={element}
              isPreviewMode={isPreviewMode}
              onSelectElement={onSelectElement}
              onUpdateElement={onUpdateElement}
              onRemoveElement={onRemoveElement}
            />
          ))}
        </div>
      )}
    </div>
  );
};
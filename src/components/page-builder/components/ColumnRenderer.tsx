import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderColumn, PageBuilderElement } from '../types';
import { ElementRenderer } from './ElementRenderer';
import { ElementDropZone } from './ElementDropZone';
import { isColumnHidden, getColumnResponsiveClasses } from '../utils/responsive';
import { cn } from '@/lib/utils';

interface ColumnRendererProps {
  column: PageBuilderColumn;
  sectionId: string;
  rowId: string;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onRemoveElement: (elementId: string) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
}

export const ColumnRenderer: React.FC<ColumnRendererProps> = ({
  column,
  sectionId,
  rowId,
  isPreviewMode,
  deviceType = 'desktop',
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onRemoveElement,
  onMoveElement
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const [{ isOver }, drop] = useDrop({
    accept: ['element-type', 'element'],
    drop: (item: { elementType?: string; elementId?: string }, monitor) => {
      if (!monitor.didDrop()) {
        console.log('ColumnRenderer drop:', { elementType: item.elementType, sectionId, rowId, columnId: column.id });
        if (item.elementType) {
          // Adding new element
          onAddElement(sectionId, rowId, column.id, item.elementType);
        } else if (item.elementId && onMoveElement) {
          // Moving existing element
          onMoveElement(item.elementId, sectionId, rowId, column.id, column.elements.length);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && !monitor.didDrop(),
    }),
  });

  const handleColumnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      onSelectElement(column as any);
    }
  };

  const handleAddElement = () => {
    onAddElement(sectionId, rowId, column.id, 'text');
  };

  // Check if column should be hidden on current device
  if (isColumnHidden(column, deviceType)) {
    return null;
  }

  return (
    <div
      ref={drop}
      className={cn(
        'relative min-h-[60px] rounded border-2 border-dashed border-transparent transition-colors',
        isOver && 'border-primary/40 bg-primary/5',
        !isPreviewMode && isHovered && 'border-muted-foreground/30',
        getColumnResponsiveClasses(column, deviceType)
      )}
      style={{
        backgroundColor: column.styles?.backgroundColor || 'transparent',
        margin: column.styles?.margin || '0',
        padding: column.styles?.padding || '8px'
      }}
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
        <div className="space-y-2">
          {column.elements.map((element, index) => (
            <div key={element.id} className="relative">
              {/* Drop zone above element */}
              {!isPreviewMode && (
                <ElementDropZone
                  sectionId={sectionId}
                  rowId={rowId}
                  columnId={column.id}
                  insertIndex={index}
                  onAddElement={(elementType, insertIndex) => {
                    console.log('ElementDropZone callback:', { sectionId, rowId, columnId: column.id, elementType, insertIndex });
                    onAddElement(sectionId, rowId, column.id, elementType, insertIndex);
                  }}
                  onMoveElement={onMoveElement ? (elementId, insertIndex) => {
                    onMoveElement(elementId, sectionId, rowId, column.id, insertIndex);
                  } : undefined}
                />
              )}
              
              <ElementRenderer
                element={element}
                isPreviewMode={isPreviewMode}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onRemoveElement={onRemoveElement}
                sectionId={sectionId}
                rowId={rowId}
                columnId={column.id}
                elementIndex={index}
                onMoveElement={onMoveElement}
              />
            </div>
          ))}
          
          {/* Drop zone after last element */}
          {!isPreviewMode && column.elements.length > 0 && (
            <ElementDropZone
              sectionId={sectionId}
              rowId={rowId}
              columnId={column.id}
              insertIndex={column.elements.length}
              onAddElement={(elementType, insertIndex) => {
                console.log('ElementDropZone callback (end):', { sectionId, rowId, columnId: column.id, elementType, insertIndex });
                onAddElement(sectionId, rowId, column.id, elementType, insertIndex);
              }}
              onMoveElement={onMoveElement ? (elementId, insertIndex) => {
                onMoveElement(elementId, sectionId, rowId, column.id, insertIndex);
              } : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
};
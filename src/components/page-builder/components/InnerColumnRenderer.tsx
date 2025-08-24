import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderColumn, PageBuilderElement } from '../types';
import { OptimizedElementRenderer } from './OptimizedElementRenderer';
import { InnerElementDropZone } from './InnerElementDropZone';
import { cn } from '@/lib/utils';

interface InnerColumnRendererProps {
  column: PageBuilderColumn;
  rowId: string;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onAddElement: (rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onRemoveElement: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onSelectElement?: (elementId: string) => void;
  selectedElementId?: string;
}

export const InnerColumnRenderer: React.FC<InnerColumnRendererProps> = ({
  column,
  rowId,
  isPreviewMode,
  deviceType = 'desktop',
  onAddElement,
  onRemoveElement,
  onUpdateElement,
  onSelectElement,
  selectedElementId
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [{ isOver }, drop] = isPreviewMode 
    ? [{ isOver: false }, React.useRef(null)]
    : useDrop({
        accept: ['element-type'],
        drop: (item: { elementType?: string }, monitor) => {
          if (!monitor.didDrop() && item.elementType) {
            onAddElement(rowId, column.id, item.elementType);
          }
        },
        collect: (monitor) => ({
          isOver: monitor.isOver() && !monitor.didDrop(),
        }),
      });

  const handleAddElement = () => {
    onAddElement(rowId, column.id, 'text');
  };

  const handleElementSelect = (elementId: string) => {
    onSelectElement?.(elementId);
  };

  const handleElementDelete = (elementId: string) => {
    onRemoveElement(elementId);
  };

  return (
    <div
      ref={drop}
      className={cn(
        'inner-column relative min-h-[60px] transition-colors',
        !isPreviewMode && 'rounded border-2 border-dashed border-transparent',
        !isPreviewMode && isOver && 'border-primary/40 bg-primary/5',
        !isPreviewMode && isHovered && 'border-muted-foreground/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Controls */}
      {!isPreviewMode && isHovered && column.elements.length === 0 && (
        <div className="absolute -top-6 left-0 flex items-center space-x-1 bg-muted-foreground text-background px-2 py-1 rounded-md text-xs z-10">
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
                <InnerElementDropZone
                  rowId={rowId}
                  columnId={column.id}
                  insertIndex={index}
                  onAddElement={(elementType, insertIndex) => {
                    onAddElement(rowId, column.id, elementType, insertIndex);
                  }}
                />
              )}
              
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPreviewMode) {
                    handleElementSelect(element.id);
                  }
                }}
                className={cn(
                  "cursor-pointer rounded",
                  !isPreviewMode && selectedElementId === element.id && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <OptimizedElementRenderer
                  element={element}
                  isEditing={!isPreviewMode}
                  deviceType={deviceType}
                  onUpdate={(elementId, updates) => onUpdateElement(elementId, updates)}
                  onSelect={() => handleElementSelect(element.id)}
                  onDelete={() => handleElementDelete(element.id)}
                  isSelected={selectedElementId === element.id}
                />
              </div>
            </div>
          ))}
          
          {/* Drop zone after last element */}
          {!isPreviewMode && column.elements.length > 0 && (
            <InnerElementDropZone
              rowId={rowId}
              columnId={column.id}
              insertIndex={column.elements.length}
              onAddElement={(elementType, insertIndex) => {
                onAddElement(rowId, column.id, elementType, insertIndex);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
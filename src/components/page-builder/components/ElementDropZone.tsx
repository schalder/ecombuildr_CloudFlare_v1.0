import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineAddButton } from './InlineAddButton';
import { cn } from '@/lib/utils';

interface ElementDropZoneProps {
  sectionId: string;
  rowId: string;
  columnId: string;
  insertIndex: number;
  onAddElement: (elementType: string, insertIndex: number) => void;
  onMoveElement?: (elementId: string, insertIndex: number) => void;
  className?: string;
}

export const ElementDropZone: React.FC<ElementDropZoneProps> = ({
  sectionId,
  rowId,
  columnId,
  insertIndex,
  onAddElement,
  onMoveElement,
  className
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['element-type', 'element'],
    drop: (item: { elementType?: string; elementId?: string }, monitor) => {
      if (!monitor.didDrop()) {
        console.log('ElementDropZone drop:', { 
          elementType: item.elementType, 
          elementId: item.elementId,
          sectionId,
          rowId,
          columnId,
          insertIndex 
        });
        
        if (item.elementType) {
          // Adding new element at specific index
          onAddElement(item.elementType, insertIndex);
        } else if (item.elementId && onMoveElement) {
          // Moving existing element to specific index
          onMoveElement(item.elementId, insertIndex);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && !monitor.didDrop(),
      canDrop: monitor.canDrop()
    }),
  });

  const showDropZone = canDrop || isOver;

  return (
    <div
      ref={drop}
      className={cn(
        'relative h-1 mx-2 transition-all duration-200 group',
        className,
        showDropZone ? 'h-8' : 'h-1'
      )}
    >
      {/* Blue line indicator like Elementor */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200',
          showDropZone 
            ? 'h-0.5 bg-blue-500 shadow-md opacity-100' 
            : 'h-0 bg-transparent opacity-0'
        )}
      />
      
      {/* Drop zone background */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-200 rounded',
          isOver 
            ? 'bg-blue-100/50 border border-blue-200' 
            : showDropZone 
            ? 'bg-blue-50/30' 
            : 'bg-transparent'
        )}
      />

      {/* Inline add button - shows on hover */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        {isOver ? (
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            Drop here
          </div>
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddElement('text', insertIndex)}
              className="bg-background/90 border border-dashed border-muted-foreground/30 hover:bg-primary/5 hover:border-primary/50 p-2 h-8 w-8"
              title="Add element"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
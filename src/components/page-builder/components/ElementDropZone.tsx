import React from 'react';
import { useDrop } from 'react-dnd';
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
  const [{ isOver }, drop] = useDrop({
    accept: ['element-type', 'element'],
    drop: (item: { elementType?: string; elementId?: string }, monitor) => {
      if (!monitor.didDrop()) {
        
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
      isOver: monitor.isOver({ shallow: true }) && !monitor.didDrop()
    }),
  });

  const showDropZone = isOver;

  return (
    <div
      ref={drop}
      className={cn(
        'relative mx-2 h-0', // No default height, no layout shift
        className
      )}
    >
      {/* Always present invisible hit area */}
      <div className="absolute inset-0 -my-2" />
      
      {/* Blue line indicator - only visible on hover */}
      {showDropZone && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary shadow-lg z-30" />
      )}

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
};
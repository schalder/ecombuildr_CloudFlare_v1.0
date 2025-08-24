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
  const [{ isOver, canDrop }, drop] = useDrop({
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
      isOver: monitor.isOver() && !monitor.didDrop(),
      canDrop: monitor.canDrop()
    }),
  });

  const showDropZone = canDrop || isOver;

  return (
    <div
      ref={drop}
      className={cn(
        'relative mx-2 transition-all duration-200',
        className,
        showDropZone ? 'h-4' : 'h-0'
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

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
};
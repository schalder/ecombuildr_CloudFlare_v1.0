import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface ColumnLayoutOption {
  id: string;
  name: string;
  layout: number[];
}

interface InnerElementDropZoneProps {
  rowId?: string;
  columnId?: string;
  insertIndex: number;
  onAddElement?: (elementType: string, insertIndex: number) => void;
  onAddRow?: (layout: ColumnLayoutOption) => void;
  className?: string;
}

export const InnerElementDropZone: React.FC<InnerElementDropZoneProps> = ({
  rowId,
  columnId,
  insertIndex,
  onAddElement,
  onAddRow,
  className
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['element-type'],
    drop: (item: { elementType?: string }, monitor) => {
      if (!monitor.didDrop() && item.elementType && onAddElement) {
        onAddElement(item.elementType, insertIndex);
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
        'relative h-1 mx-2 transition-all duration-200',
        className,
        showDropZone ? 'h-4' : 'h-1'
      )}
    >
      {/* Blue line indicator */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200',
          showDropZone 
            ? 'h-0.5 bg-primary shadow-md opacity-100' 
            : 'h-0 bg-transparent opacity-0'
        )}
      />
      
      {/* Drop zone background */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-200 rounded',
          isOver 
            ? 'bg-primary/10 border border-primary/20' 
            : showDropZone 
            ? 'bg-primary/5' 
            : 'bg-transparent'
        )}
      />

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface RowDropZoneProps {
  sectionId: string;
  insertIndex: number;
  onMoveRow?: (rowId: string, targetSectionId: string, insertIndex: number) => void;
  className?: string;
}

export const RowDropZone: React.FC<RowDropZoneProps> = ({
  sectionId,
  insertIndex,
  onMoveRow,
  className
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['row'],
    drop: (item: { rowId?: string }, monitor) => {
      if (!monitor.didDrop() && item.rowId && onMoveRow) {
        onMoveRow(item.rowId, sectionId, insertIndex);
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
        'relative h-1.5 mx-2 transition-all duration-200',
        className,
        showDropZone ? 'h-6' : 'h-1.5'
      )}
    >
      {/* Blue line indicator */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200',
          showDropZone 
            ? 'h-0.5 bg-secondary shadow-md opacity-100' 
            : 'h-0 bg-transparent opacity-0'
        )}
      />
      
      {/* Drop zone background */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-200 rounded',
          isOver 
            ? 'bg-secondary/20 border border-secondary border-dashed' 
            : showDropZone 
            ? 'bg-secondary/10' 
            : 'bg-transparent'
        )}
      />

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            Drop row here
          </div>
        </div>
      )}
    </div>
  );
};
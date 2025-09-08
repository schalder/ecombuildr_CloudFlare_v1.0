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
  const [{ isOver }, drop] = useDrop({
    accept: ['row'],
    drop: (item: { rowId?: string }, monitor) => {
      if (!monitor.didDrop() && item.rowId && onMoveRow) {
        onMoveRow(item.rowId, sectionId, insertIndex);
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
        'relative h-0 mx-2', // No default height, no layout shift
        className
      )}
    >
      {/* Always present invisible hit area */}
      <div className="absolute inset-0 -my-3" />
      
      {/* Blue line indicator - only visible on hover */}
      {showDropZone && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-secondary shadow-lg z-30" />
      )}

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
            Drop row here
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface SectionDropZoneProps {
  insertIndex: number;
  onMoveSection?: (sectionId: string, insertIndex: number) => void;
  className?: string;
}

export const SectionDropZone: React.FC<SectionDropZoneProps> = ({
  insertIndex,
  onMoveSection,
  className
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['section'],
    drop: (item: { sectionId?: string }, monitor) => {
      if (!monitor.didDrop() && item.sectionId && onMoveSection) {
        onMoveSection(item.sectionId, insertIndex);
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
        'relative mx-4 transition-all duration-200',
        className,
        showDropZone ? 'h-8 -my-2' : 'h-2 -my-1'
      )}
    >
      {/* Blue line indicator */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200',
          showDropZone 
            ? 'h-1 bg-primary shadow-lg opacity-100' 
            : 'h-0 bg-transparent opacity-0'
        )}
      />
      
      {/* Drop zone background */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-200 rounded-lg',
          isOver 
            ? 'bg-primary/20 border-2 border-primary border-dashed' 
            : showDropZone 
            ? 'bg-primary/10 border border-primary/30 border-dashed' 
            : 'bg-transparent'
        )}
      />

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
            Drop section here
          </div>
        </div>
      )}
    </div>
  );
};
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
  const [{ isOver }, drop] = useDrop({
    accept: ['section'],
    drop: (item: { sectionId?: string }, monitor) => {
      if (!monitor.didDrop() && item.sectionId && onMoveSection) {
        onMoveSection(item.sectionId, insertIndex);
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
        'relative h-0 mx-4', // No default height, no layout shift
        className
      )}
    >
      {/* Always present invisible hit area */}
      <div className="absolute inset-0 -my-4" />
      
      {/* Blue line indicator - only visible on hover */}
      {showDropZone && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-primary shadow-lg z-30 rounded" />
      )}

      {/* Drop here indicator */}
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
            Drop section here
          </div>
        </div>
      )}
    </div>
  );
};
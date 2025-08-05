import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface ElementDropZoneProps {
  sectionId: string;
  rowId: string;
  columnId: string;
  insertIndex: number;
  onAddElement: (elementType: string, targetPath: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, targetPath: string, insertIndex: number) => void;
}

export const ElementDropZone: React.FC<ElementDropZoneProps> = ({
  sectionId,
  rowId,
  columnId,
  insertIndex,
  onAddElement,
  onMoveElement
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['element-type', 'element'],
    drop: (item: { elementType?: string; elementId?: string }, monitor) => {
      if (!monitor.didDrop()) {
        const targetPath = `${sectionId}.${rowId}.${columnId}`;
        if (item.elementType) {
          // Adding new element
          onAddElement(item.elementType, targetPath, insertIndex);
        } else if (item.elementId && onMoveElement) {
          // Moving existing element
          onMoveElement(item.elementId, targetPath, insertIndex);
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
        'h-2 -mx-2 transition-all duration-200',
        showDropZone ? 'bg-primary/20 border-t-2 border-primary rounded' : 'bg-transparent',
        isOver && 'bg-primary/30 scale-y-150'
      )}
    >
      {isOver && (
        <div className="absolute left-0 right-0 flex items-center justify-center z-20">
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
};
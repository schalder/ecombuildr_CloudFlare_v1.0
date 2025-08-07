import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionDropZoneProps {
  insertIndex: number;
  onAddSection: (insertIndex: number) => void;
  className?: string;
}

export const SectionDropZone: React.FC<SectionDropZoneProps> = ({
  insertIndex,
  onAddSection,
  className
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ['section-type'],
    drop: (item: { sectionType?: string }) => {
      onAddSection(insertIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleAddSection = () => {
    onAddSection(insertIndex);
  };

  return (
    <div
      ref={drop}
      className={cn(
        'group relative py-2 transition-all duration-200',
        className
      )}
    >
      {/* Drop indicator line */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200',
          isOver 
            ? 'h-1 bg-primary opacity-100' 
            : 'h-0 bg-transparent opacity-0'
        )}
      />
      
      {/* Add section button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddSection}
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'bg-background border border-dashed border-muted-foreground/30',
            'hover:bg-primary/5 hover:border-primary/50',
            isOver && 'opacity-100 bg-primary/10 border-primary/60'
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          <Layout className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  );
};
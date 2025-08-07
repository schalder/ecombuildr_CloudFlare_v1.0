import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionAddButtonProps {
  onAddSection: () => void;
  position: 'between' | 'end';
  className?: string;
}

export const SectionAddButton: React.FC<SectionAddButtonProps> = ({
  onAddSection,
  position,
  className
}) => {
  return (
    <div 
      className={cn(
        'flex items-center justify-center group',
        position === 'between' 
          ? 'h-12 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200' 
          : 'h-16 py-4',
        className
      )}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onAddSection}
        className={cn(
          'bg-card border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200',
          position === 'between' && 'opacity-0 group-hover:opacity-100 hover:opacity-100 scale-90 hover:scale-100'
        )}
      >
        <Plus className="h-4 w-4 mr-2 text-primary" />
        <span className="text-primary font-medium">Add Section</span>
      </Button>
    </div>
  );
};
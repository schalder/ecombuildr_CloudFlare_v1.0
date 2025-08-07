import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RowAddButtonProps {
  onAddRow: () => void;
  position: 'between' | 'end';
  className?: string;
}

export const RowAddButton: React.FC<RowAddButtonProps> = ({
  onAddRow,
  position,
  className
}) => {
  return (
    <div 
      className={cn(
        'flex items-center justify-center group',
        position === 'between' 
          ? 'h-8 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200' 
          : 'h-12 py-2',
        className
      )}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onAddRow}
        className={cn(
          'bg-card border-2 border-dashed border-secondary/50 hover:border-secondary hover:bg-secondary/5 transition-all duration-200',
          position === 'between' && 'opacity-0 group-hover:opacity-100 hover:opacity-100 scale-90 hover:scale-100'
        )}
      >
        <Plus className="h-3 w-3 mr-1 text-secondary-foreground" />
        <span className="text-secondary-foreground text-sm font-medium">Add Row</span>
      </Button>
    </div>
  );
};
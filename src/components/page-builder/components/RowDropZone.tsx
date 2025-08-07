import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Columns, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COLUMN_LAYOUTS } from '../types';
import { cn } from '@/lib/utils';

interface RowDropZoneProps {
  sectionId: string;
  insertIndex: number;
  onAddRow: (sectionId: string, columnLayout: string, insertIndex: number) => void;
  className?: string;
}

const LAYOUT_OPTIONS = [
  { key: '1', label: '1 Column', icon: '1', columns: COLUMN_LAYOUTS['1'] || [12] },
  { key: '1-1', label: '2 Columns', icon: '2', columns: COLUMN_LAYOUTS['1-1'] || [6, 6] },
  { key: '1-1-1', label: '3 Columns', icon: '3', columns: COLUMN_LAYOUTS['1-1-1'] || [4, 4, 4] },
  { key: '1-2', label: '1/3 - 2/3', icon: '⅓⅔', columns: COLUMN_LAYOUTS['1-2'] || [4, 8] },
  { key: '2-1', label: '2/3 - 1/3', icon: '⅔⅓', columns: COLUMN_LAYOUTS['2-1'] || [8, 4] },
  { key: '1-1-1-1', label: '4 Columns', icon: '4', columns: COLUMN_LAYOUTS['1-1-1-1'] || [3, 3, 3, 3] }
].filter(layout => layout.columns && layout.columns.length > 0);

export const RowDropZone: React.FC<RowDropZoneProps> = ({
  sectionId,
  insertIndex,
  onAddRow,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [{ isOver }, drop] = useDrop({
    accept: ['row-type'],
    drop: (item: { rowType?: string; columnLayout?: string }) => {
      if (item.columnLayout) {
        onAddRow(sectionId, item.columnLayout, insertIndex);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleLayoutSelect = (columnLayout: string) => {
    onAddRow(sectionId, columnLayout, insertIndex);
    setIsOpen(false);
  };

  return (
    <div
      ref={drop}
      className={cn(
        'group relative py-1 transition-all duration-200',
        className
      )}
    >
      {/* Drop indicator line */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200',
          isOver 
            ? 'h-0.5 bg-blue-500 opacity-100' 
            : 'h-0 bg-transparent opacity-0'
        )}
      />
      
      {/* Add row button */}
      <div className="flex justify-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                'bg-background/80 border border-dashed border-muted-foreground/30',
                'hover:bg-blue-50 hover:border-blue-300',
                isOver && 'opacity-100 bg-blue-50 border-blue-300'
              )}
            >
              <Plus className="h-3 w-3 mr-1" />
              <Columns className="h-3 w-3 mr-1" />
              <span className="text-xs">Add Row</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="center">
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map((layout) => (
                <Button
                  key={layout.key}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLayoutSelect(layout.key)}
                  className="flex flex-col items-center p-3 h-auto hover:bg-primary/10"
                >
                  <div className="flex items-center space-x-1 mb-1">
                    {layout.columns.map((width, index) => (
                      <div
                        key={index}
                        className="h-3 bg-primary/30 rounded-sm"
                        style={{ width: `${width * 8}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{layout.label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
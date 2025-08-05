import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, GripVertical, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderRow, PageBuilderElement, COLUMN_LAYOUTS } from '../types';
import { ColumnRenderer } from './ColumnRenderer';
import { cn } from '@/lib/utils';

interface RowRendererProps {
  row: PageBuilderRow;
  sectionId: string;
  isPreviewMode: boolean;
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
  onRemoveElement: (elementId: string) => void;
}

export const RowRenderer: React.FC<RowRendererProps> = ({
  row,
  sectionId,
  isPreviewMode,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onMoveElement,
  onRemoveElement
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'element',
    drop: (item: { elementType: string }) => {
      // Add element to first column by default
      if (row.columns.length > 0) {
        console.log('RowRenderer drop to first column:', { sectionId, rowId: row.id, columnId: row.columns[0].id, elementType: item.elementType });
        onAddElement(sectionId, row.id, row.columns[0].id, item.elementType);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      onSelectElement(row as any);
    }
  };

  const handleDeleteRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveElement(row.id);
  };

  const handleDuplicateRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement row duplication
  };

  const getGridTemplateColumns = () => {
    const layout = COLUMN_LAYOUTS[row.columnLayout];
    if (!layout) {
      console.warn('No layout found for columnLayout:', row.columnLayout);
      return '1fr';
    }
    // Convert the layout numbers to CSS Grid fractional units
    const gridColumns = layout.map(part => `${part}fr`).join(' ');
    console.log('RowRenderer - columnLayout:', row.columnLayout, 'layout:', layout, 'gridColumns:', gridColumns);
    return gridColumns;
  };

  return (
    <div
      ref={drop}
      className={cn(
        'relative group min-h-[80px]',
        isOver && 'bg-primary/5 border border-primary/20 rounded-lg',
        row.styles?.backgroundColor && `bg-[${row.styles.backgroundColor}]`,
        row.styles?.padding || 'p-4'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Row Controls */}
      {!isPreviewMode && isHovered && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs z-10">
          <GripVertical className="h-3 w-3" />
          <Columns className="h-3 w-3" />
          <span>Row</span>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-secondary-foreground/20"
              onClick={handleDuplicateRow}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-destructive/20"
              onClick={handleDeleteRow}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: getGridTemplateColumns(),
          display: 'grid'
        }}
      >
        {row.columns.map((column) => (
            <ColumnRenderer
              key={column.id}
              column={column}
              sectionId={sectionId}
              rowId={row.id}
              isPreviewMode={isPreviewMode}
              onSelectElement={onSelectElement}
              onUpdateElement={onUpdateElement}
              onAddElement={onAddElement}
              onMoveElement={onMoveElement}
              onRemoveElement={onRemoveElement}
            />
        ))}
      </div>
    </div>
  );
};
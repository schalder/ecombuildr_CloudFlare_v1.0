import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, GripVertical, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderRow, PageBuilderElement, COLUMN_LAYOUTS, RESPONSIVE_LAYOUTS } from '../types';
import { ColumnRenderer } from './ColumnRenderer';
import { cn } from '@/lib/utils';

interface RowRendererProps {
  row: PageBuilderRow;
  sectionId: string;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
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
  deviceType = 'desktop',
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

  const getDeviceSpecificGridStyle = () => {
    const columnCount = row.columns.length;
    const stackOnMobile = row.responsive?.mobile?.stackColumns !== false; // Default to true
    
    // Force grid layout based on selected device type
    if (deviceType === 'mobile' && stackOnMobile) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px'
      };
    }
    
    if (deviceType === 'tablet') {
      // On tablet, reduce columns appropriately
      switch (row.columnLayout) {
        case '1-1-1-1':
        case '1-1-1':
          return {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          };
        case '1-2':
          return {
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '16px'
          };
        case '2-1':
          return {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px'
          };
        default:
          return {
            display: 'grid',
            gridTemplateColumns: columnCount > 2 ? 'repeat(2, 1fr)' : 'repeat(' + columnCount + ', 1fr)',
            gap: '16px'
          };
      }
    }
    
    // Desktop - use original layout
    const fractions = COLUMN_LAYOUTS[row.columnLayout] || Array(columnCount).fill(1);
    return {
      display: 'grid',
      gridTemplateColumns: fractions.map(f => `${f}fr`).join(' '),
      gap: '16px'
    };
  };

  return (
    <div
      ref={drop}
      className={cn(
        'relative group min-h-[80px]',
        isOver && 'bg-primary/5 border border-primary/20 rounded-lg'
      )}
      style={{
        backgroundColor: row.styles?.backgroundColor || 'transparent',
        margin: row.styles?.margin || '0',
        padding: row.styles?.padding || '16px'
      }}
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

      <div style={getDeviceSpecificGridStyle()}>
        {row.columns.map((column) => (
            <ColumnRenderer
              key={column.id}
              column={column}
              sectionId={sectionId}
              rowId={row.id}
              isPreviewMode={isPreviewMode}
              deviceType={deviceType}
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
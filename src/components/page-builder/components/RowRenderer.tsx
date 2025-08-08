import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, GripVertical, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderRow, PageBuilderElement, COLUMN_LAYOUTS, RESPONSIVE_LAYOUTS } from '../types';
import { ColumnRenderer } from './ColumnRenderer';
import { cn } from '@/lib/utils';
import { renderRowStyles, hasUserBackground, hasUserShadow } from '../utils/styleRenderer';

interface RowRendererProps {
  row: PageBuilderRow;
  rowIndex: number;
  sectionId: string;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
  onRemoveElement: (elementId: string) => void;
  onAddRowAfter: () => void;
}

export const RowRenderer: React.FC<RowRendererProps> = ({
  row,
  rowIndex,
  sectionId,
  isPreviewMode,
  deviceType = 'desktop',
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onMoveElement,
  onRemoveElement,
  onAddRowAfter
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const [{ isOver }, drop] = isPreviewMode 
    ? [{ isOver: false }, React.useRef(null)]
    : useDrop({
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
      if (row.columnLayout === '1') {
        // True single column - center content
        return {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px',
          justifyItems: 'center'
        };
      } else {
        // Multi-column that should stack - keep left align
        return {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px'
        };
      }
    }
    
    // Desktop - always use the columnLayout configuration, not actual column count
    const fractions = COLUMN_LAYOUTS[row.columnLayout];
    if (fractions) {
      return {
        display: 'grid',
        gridTemplateColumns: fractions.map(f => `${f}fr`).join(' '),
        gap: '16px'
      };
    }
    
    // Fallback to single column if layout not found
    return {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '16px'
    };
  };

  const getColumnsToRender = () => {
    // For mobile, always stack all columns
    if (deviceType === 'mobile') {
      return row.columns;
    }
    
    // For tablet, respect the columnLayout setting
    if (deviceType === 'tablet') {
      if (row.columnLayout === '1') {
        // Only render the first column for true single-column layout
        return row.columns.slice(0, 1);
      } else {
        // For multi-column layouts on tablet, stack all columns
        return row.columns;
      }
    }
    
    // For desktop, render all columns according to the layout
    return row.columns;
  };

  const getEffectiveColumnCount = () => {
    // For tablet with single column layout, return 1
    if (deviceType === 'tablet' && row.columnLayout === '1') {
      return 1;
    }
    // Otherwise return the total number of columns in the row
    return row.columns.length;
  };

  const getRowStyles = (): React.CSSProperties => {
    return renderRowStyles(row, deviceType);
  };

  const userBackground = hasUserBackground(row.styles);
  const userShadow = hasUserShadow(row.styles);

  return (
    <div
      ref={drop}
      className={cn(
        'relative group min-h-[80px] transition-all duration-200',
        // Only apply border/background styles if not in preview mode
        !isPreviewMode && 'border border-dashed',
        !isPreviewMode && isHovered && 'border-secondary/50',
        !isPreviewMode && isHovered && !userBackground && 'bg-secondary/5',
        !isPreviewMode && !isHovered && 'border-transparent',
        !isPreviewMode && isOver && 'border-primary/20 rounded-lg',
        !isPreviewMode && isOver && !userBackground && 'bg-primary/5'
      )}
      style={getRowStyles()}
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
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-secondary-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                onAddRowAfter();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div style={getDeviceSpecificGridStyle()}>
        {getColumnsToRender().map((column) => (
            <ColumnRenderer
              key={column.id}
              column={column}
              sectionId={sectionId}
              rowId={row.id}
              columnCount={getEffectiveColumnCount()}
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
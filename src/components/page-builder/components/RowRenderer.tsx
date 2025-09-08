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
    
    // Get user-defined column gap for current device
    const userColumnGap = row.responsive?.[deviceType]?.columnGap || 
                          row.responsive?.desktop?.columnGap || 
                          '0px';
    
    // Force grid layout based on selected device type
    if (deviceType === 'mobile' && stackOnMobile) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: userColumnGap
      };
    }
    
    if (deviceType === 'tablet') {
      if (row.columnLayout === '1') {
        // True single column - center content
        return {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: userColumnGap,
          justifyItems: 'center'
        };
      } else {
        // Multi-column that should stack - keep left align
        return {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: userColumnGap
        };
      }
    }
    
    // Desktop - always use the columnLayout configuration, not actual column count
    const fractions = COLUMN_LAYOUTS[row.columnLayout];
    if (fractions) {
      return {
        display: 'grid',
        gridTemplateColumns: fractions.map(f => `${f}fr`).join(' '),
        gap: userColumnGap
      };
    }
    
    // Fallback to single column if layout not found
    return {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: userColumnGap
    };
  };

  const getColumnsToRender = () => {
    // For mobile, filter out empty columns in preview mode
    if (deviceType === 'mobile') {
      if (isPreviewMode) {
        return row.columns.filter(column => column.elements.length > 0);
      }
      return row.columns;
    }
    
    // For tablet, respect the columnLayout setting
    if (deviceType === 'tablet') {
      if (row.columnLayout === '1') {
        // Only render the first column for true single-column layout
        const firstColumn = row.columns.slice(0, 1);
        // In preview mode, filter out empty columns
        return isPreviewMode ? firstColumn.filter(column => column.elements.length > 0) : firstColumn;
      } else {
        // For multi-column layouts on tablet, stack all columns
        // In preview mode, filter out empty columns
        return isPreviewMode ? row.columns.filter(column => column.elements.length > 0) : row.columns;
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
    // For tablet and mobile in preview mode, use the filtered column count
    if ((deviceType === 'tablet' || deviceType === 'mobile') && isPreviewMode) {
      return getColumnsToRender().length;
    }
    // Otherwise return the total number of columns in the row
    return row.columns.length;
  };

  const getRowStyles = (): React.CSSProperties => {
    return renderRowStyles(row, deviceType);
  };

  const userBackground = hasUserBackground(row.styles);
  const userShadow = hasUserShadow(row.styles);

  // Hide row if all columns are empty on tablet and mobile preview
  const displayedColumns = getColumnsToRender();
  if ((deviceType === 'tablet' || deviceType === 'mobile') && isPreviewMode && displayedColumns.length === 0) {
    return null;
  }

  return (
    <div
      ref={drop}
      id={row.anchor}
      data-pb-row-id={row.id}
      className={cn(
        'relative group transition-all duration-200',
        // Only apply min-height to empty rows in edit mode
        !isPreviewMode && displayedColumns.length === 0 && (deviceType === 'mobile' ? 'min-h-[40px]' : 'min-h-[80px]'),
        // Only apply border/background styles if not in preview mode and no user background
        !isPreviewMode && !(userBackground || userShadow) && 'border border-dashed border-blue-400',
        !isPreviewMode && !(userBackground || userShadow) && isHovered && 'border-blue-500',
        !isPreviewMode && !(userBackground || userShadow) && isOver && 'border-blue-600'
      )}
      style={getRowStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Overlay border for rows with background */}
      {!isPreviewMode && (userBackground || userShadow) && isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-20 border border-dashed border-blue-500"
        />
      )}

      {/* Row Controls */}
      {!isPreviewMode && isHovered && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs z-10">
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
        {displayedColumns.map((column) => (
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
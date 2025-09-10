import React from 'react';
import { PageBuilderRow, COLUMN_LAYOUTS } from '@/components/page-builder/types';
import { StorefrontColumnRenderer } from './StorefrontColumnRenderer';
import { cn } from '@/lib/utils';
import { renderRowStyles } from '@/components/page-builder/utils/styleRenderer';

interface StorefrontRowRendererProps {
  row: PageBuilderRow;
  rowIndex: number;
  sectionId: string;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontRowRenderer: React.FC<StorefrontRowRendererProps> = ({
  row,
  rowIndex,
  sectionId,
  deviceType = 'desktop'
}) => {
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
    
    // Desktop - always use the columnLayout configuration
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
    // For mobile, filter out empty columns
    if (deviceType === 'mobile') {
      return row.columns.filter(column => column.elements.length > 0);
    }
    
    // For tablet, respect the columnLayout setting
    if (deviceType === 'tablet') {
      if (row.columnLayout === '1') {
        // Only render the first column for true single-column layout
        const firstColumn = row.columns.slice(0, 1);
        return firstColumn.filter(column => column.elements.length > 0);
      } else {
        // For multi-column layouts on tablet, stack all columns
        return row.columns.filter(column => column.elements.length > 0);
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
    // For tablet and mobile, use the filtered column count
    if (deviceType === 'tablet' || deviceType === 'mobile') {
      return getColumnsToRender().length;
    }
    // Otherwise return the total number of columns in the row
    return row.columns.length;
  };

  const getRowStyles = (): React.CSSProperties => {
    return renderRowStyles(row, deviceType);
  };

  // Hide row if all columns are empty on tablet and mobile
  const displayedColumns = getColumnsToRender();
  if ((deviceType === 'tablet' || deviceType === 'mobile') && displayedColumns.length === 0) {
    return null;
  }

  return (
    <div
      id={row.anchor}
      data-pb-row-id={row.id}
      className="relative transition-all duration-200"
      style={getRowStyles()}
    >
      <div style={getDeviceSpecificGridStyle()}>
        {displayedColumns.map((column) => (
          <StorefrontColumnRenderer
            key={column.id}
            column={column}
            sectionId={sectionId}
            rowId={row.id}
            columnCount={getEffectiveColumnCount()}
            deviceType={deviceType}
          />
        ))}
      </div>
    </div>
  );
};

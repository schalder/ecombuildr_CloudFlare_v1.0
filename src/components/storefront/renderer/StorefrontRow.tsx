import React from 'react';
import { PageBuilderRow, RESPONSIVE_LAYOUTS, COLUMN_LAYOUTS } from '@/components/page-builder/types';
import { StorefrontColumn } from './StorefrontColumn';
import { cn } from '@/lib/utils';
import { renderRowStyles } from '@/components/page-builder/utils/styleRenderer';
import { isElementVisible, getVisibilityStyles } from '@/components/page-builder/utils/deviceDetection';
import { getColumnWidthsForDevice, percentagesToGridTemplate } from '@/components/page-builder/utils/columnWidths';

// Helper function to get responsive grid classes based on device type
function getResponsiveGridClasses(columnLayout: string, deviceType: 'desktop' | 'tablet' | 'mobile'): string {
  if (deviceType === 'mobile') {
    return 'grid-cols-1';
  }
  
  if (deviceType === 'tablet') {
    // For tablet, limit to max 2 columns
    const layout = RESPONSIVE_LAYOUTS[columnLayout] || 'grid-cols-1';
    if (layout.includes('grid-cols-3') || layout.includes('grid-cols-4')) {
      return 'grid-cols-2';
    }
    return layout;
  }
  
  // Desktop uses the original responsive layouts
  return RESPONSIVE_LAYOUTS[columnLayout] || 'grid-cols-1';
}

// Get grid style for custom column widths
function getGridStyle(row: PageBuilderRow, deviceType: 'desktop' | 'tablet' | 'mobile'): React.CSSProperties | undefined {
  // Force mobile to always stack columns vertically
  if (deviceType === 'mobile') {
    return {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: row.responsive?.[deviceType]?.columnGap || row.responsive?.desktop?.columnGap || '16px',
      width: '100%'
    };
  }
  
  // Check for custom column widths
  const hasCustomWidths = row.customColumnWidths && (
    row.customColumnWidths[deviceType] || 
    (deviceType !== 'desktop' && row.customColumnWidths.desktop)
  );
  
  if (hasCustomWidths) {
    const customWidths = getColumnWidthsForDevice(row, deviceType, COLUMN_LAYOUTS);
    if (customWidths && customWidths.length > 0) {
      return {
        display: 'grid',
        gridTemplateColumns: percentagesToGridTemplate(customWidths),
        gap: row.responsive?.[deviceType]?.columnGap || row.responsive?.desktop?.columnGap || '16px'
      };
    }
  }
  
  // Force tablet to stack columns for better responsive behavior (unless custom widths are set)
  if (deviceType === 'tablet') {
    if (row.columnLayout === '1') {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: row.responsive?.[deviceType]?.columnGap || row.responsive?.desktop?.columnGap || '16px',
        justifyItems: 'center'
      };
    } else if (!hasCustomWidths) {
      // Multi-column that should stack on tablet (if no custom widths)
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: row.responsive?.[deviceType]?.columnGap || row.responsive?.desktop?.columnGap || '16px'
      };
    }
  }
  
  // For desktop or when custom widths are set, use inline styles
  if (deviceType === 'desktop' || hasCustomWidths) {
    const fractions = COLUMN_LAYOUTS[row.columnLayout];
    if (fractions) {
      return {
        display: 'grid',
        gridTemplateColumns: fractions.map(f => `${f}fr`).join(' '),
        gap: row.responsive?.[deviceType]?.columnGap || row.responsive?.desktop?.columnGap || '16px'
      };
    }
  }
  
  return undefined;
}

interface StorefrontRowProps {
  row: PageBuilderRow;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontRow: React.FC<StorefrontRowProps> = ({
  row,
  deviceType = 'desktop'
}) => {
  // Check row visibility
  const isVisible = isElementVisible(row.visibility, deviceType);
  const visibilityStyles = getVisibilityStyles(row.visibility, deviceType);

  // Don't render row if it's not visible on current device
  if (!isVisible) {
    return null;
  }

  const rowStyles = renderRowStyles(row, deviceType);
  const gridStyle = getGridStyle(row, deviceType);
  const responsiveLayoutClass = gridStyle ? undefined : getResponsiveGridClasses(row.columnLayout, deviceType);
  
  return (
    <div 
      id={row.anchor}
      data-pb-row-id={row.id}
      className={cn("w-full")}
      style={rowStyles}
    >
      <div 
        className={cn(
          "grid w-full",
          !gridStyle && "gap-4",
          !gridStyle && responsiveLayoutClass
        )}
        style={gridStyle}
      >
        {row.columns?.map((column) => (
          <StorefrontColumn
            key={column.id}
            column={column}
            deviceType={deviceType}
            totalColumns={row.columns.length}
          />
        ))}
      </div>
    </div>
  );
};
import React from 'react';
import { PageBuilderRow, RESPONSIVE_LAYOUTS } from '@/components/page-builder/types';
import { StorefrontColumn } from './StorefrontColumn';
import { cn } from '@/lib/utils';
import { renderRowStyles } from '@/components/page-builder/utils/styleRenderer';
import { isElementVisible, getVisibilityStyles } from '@/components/page-builder/utils/deviceDetection';

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
  const responsiveLayoutClass = getResponsiveGridClasses(row.columnLayout, deviceType);
  
  return (
    <div 
      id={row.anchor}
      data-pb-row-id={row.id}
      className={cn("w-full")}
      style={rowStyles}
    >
      <div className={cn(
        "grid gap-4 w-full",
        responsiveLayoutClass
      )}>
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
import React from 'react';
import { PageBuilderRow, RESPONSIVE_LAYOUTS } from '@/components/page-builder/types';
import { StorefrontColumn } from './StorefrontColumn';
import { cn } from '@/lib/utils';
import { renderRowStyles } from '@/components/page-builder/utils/styleRenderer';

interface StorefrontRowProps {
  row: PageBuilderRow;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontRow: React.FC<StorefrontRowProps> = ({
  row,
  deviceType = 'desktop'
}) => {
  const rowStyles = renderRowStyles(row, deviceType);
  const responsiveLayoutClass = RESPONSIVE_LAYOUTS[row.columnLayout] || 'grid-cols-1';
  
  return (
    <div 
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
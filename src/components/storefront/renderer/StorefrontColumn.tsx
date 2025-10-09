import React from 'react';
import { PageBuilderColumn } from '@/components/page-builder/types';
import { StorefrontElement } from './StorefrontElement';
import { cn } from '@/lib/utils';
import { renderColumnStyles } from '@/components/page-builder/utils/styleRenderer';
import { isElementVisible, getVisibilityStyles } from '@/components/page-builder/utils/deviceDetection';

interface StorefrontColumnProps {
  column: PageBuilderColumn;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  totalColumns: number;
}

export const StorefrontColumn: React.FC<StorefrontColumnProps> = ({
  column,
  deviceType = 'desktop',
  totalColumns
}) => {
  // Check column visibility
  const isVisible = isElementVisible(column.visibility, deviceType);
  const visibilityStyles = getVisibilityStyles(column.visibility, deviceType);

  // Don't render column if it's not visible on current device
  if (!isVisible) {
    return null;
  }

  const columnStyles = renderColumnStyles(column, deviceType);
  
  return (
    <div 
      id={column.anchor}
      data-pb-column-id={column.id}
      className={cn("relative min-h-[1px]")}
      style={columnStyles}
    >
      {column.elements?.map((element) => (
        <StorefrontElement
          key={element.id}
          element={element}
          deviceType={deviceType}
          columnCount={totalColumns}
        />
      ))}
    </div>
  );
};
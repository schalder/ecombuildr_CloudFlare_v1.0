import React from 'react';
import { PageBuilderColumn } from '@/components/page-builder/types';
import { StorefrontElement } from './StorefrontElement';
import { cn } from '@/lib/utils';
import { renderColumnStyles } from '@/components/page-builder/utils/styleRenderer';

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
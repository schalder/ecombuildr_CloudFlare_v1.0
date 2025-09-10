import React from 'react';
import { PageBuilderColumn } from '@/components/page-builder/types';
import { StorefrontElementRenderer } from './StorefrontElementRenderer';
import { cn } from '@/lib/utils';
import { renderColumnStyles } from '@/components/page-builder/utils/styleRenderer';

interface StorefrontColumnRendererProps {
  column: PageBuilderColumn;
  sectionId: string;
  rowId: string;
  columnCount: number;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontColumnRenderer: React.FC<StorefrontColumnRendererProps> = ({
  column,
  sectionId,
  rowId,
  columnCount,
  deviceType = 'desktop'
}) => {
  const getColumnStyles = (): React.CSSProperties => {
    return renderColumnStyles(column, deviceType);
  };

  // Hide empty columns in storefront
  if (!column.elements || column.elements.length === 0) {
    return null;
  }

  return (
    <div
      id={column.anchor}
      data-pb-column-id={column.id}
      className="relative transition-all duration-200"
      style={getColumnStyles()}
    >
      <div className="space-y-0 h-full">
        {column.elements.map((element, elementIndex) => (
          <StorefrontElementRenderer
            key={element.id}
            element={element}
            deviceType={deviceType}
            columnCount={columnCount}
          />
        ))}
      </div>
    </div>
  );
};
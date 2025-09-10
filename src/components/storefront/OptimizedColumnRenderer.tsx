import React from 'react';
import { PageBuilderColumn } from '@/components/page-builder/types';
import { DeviceType } from '@/components/page-builder/utils/responsive';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { OptimizedElementRenderer } from '@/components/page-builder/components/OptimizedElementRenderer';

interface OptimizedColumnRendererProps {
  column: PageBuilderColumn;
  deviceType: DeviceType;
}

export const OptimizedColumnRenderer: React.FC<OptimizedColumnRendererProps> = React.memo(({
  column,
  deviceType
}) => {
  const styles = React.useMemo(() => {
    return mergeResponsiveStyles({}, column.styles, deviceType);
  }, [column.styles, deviceType]);

  const columnStyle: React.CSSProperties = React.useMemo(() => {
    const style: React.CSSProperties = {};
    
    if (styles.backgroundColor) style.backgroundColor = styles.backgroundColor;
    if (styles.paddingTop) style.paddingTop = styles.paddingTop;
    if (styles.paddingRight) style.paddingRight = styles.paddingRight;
    if (styles.paddingBottom) style.paddingBottom = styles.paddingBottom;
    if (styles.paddingLeft) style.paddingLeft = styles.paddingLeft;
    if (styles.marginTop) style.marginTop = styles.marginTop;
    if (styles.marginBottom) style.marginBottom = styles.marginBottom;
    if (styles.borderRadius) style.borderRadius = styles.borderRadius;
    if (styles.border) style.border = styles.border;
    if (styles.boxShadow) style.boxShadow = styles.boxShadow;
    
    return style;
  }, [styles]);

  if (!column.elements?.length) {
    return <div className="min-h-[20px]" style={columnStyle} />;
  }

  return (
    <div className="flex flex-col space-y-2" style={columnStyle}>
      {column.elements.map((element, index) => (
        <OptimizedElementRenderer
          key={`${element.id}-${index}`}
          element={element}
          deviceType={deviceType}
        />
      ))}
    </div>
  );
});

OptimizedColumnRenderer.displayName = 'OptimizedColumnRenderer';
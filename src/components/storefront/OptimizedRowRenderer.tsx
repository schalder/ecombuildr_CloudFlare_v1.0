import React from 'react';
import { PageBuilderRow } from '@/components/page-builder/types';
import { DeviceType } from '@/components/page-builder/utils/responsive';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { OptimizedColumnRenderer } from './OptimizedColumnRenderer';

interface OptimizedRowRendererProps {
  row: PageBuilderRow;
  deviceType: DeviceType;
}

export const OptimizedRowRenderer: React.FC<OptimizedRowRendererProps> = React.memo(({
  row,
  deviceType
}) => {
  const styles = React.useMemo(() => {
    return mergeResponsiveStyles({}, row.styles, deviceType);
  }, [row.styles, deviceType]);

  const rowStyle: React.CSSProperties = React.useMemo(() => {
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

  const gridCols = React.useMemo(() => {
    const cols = row.columns?.length || 1;
    if (deviceType === 'mobile') return 'grid-cols-1';
    if (deviceType === 'tablet' && cols > 2) return 'grid-cols-2';
    return `grid-cols-${Math.min(cols, 12)}`;
  }, [row.columns?.length, deviceType]);

  if (!row.columns?.length) {
    return <div className="min-h-[20px]" style={rowStyle} />;
  }

  return (
    <div
      className={`grid gap-4 w-full ${gridCols}`}
      style={rowStyle}
    >
      {row.columns.map((column, index) => (
        <OptimizedColumnRenderer
          key={`${column.id}-${index}`}
          column={column}
          deviceType={deviceType}
        />
      ))}
    </div>
  );
});

OptimizedRowRenderer.displayName = 'OptimizedRowRenderer';
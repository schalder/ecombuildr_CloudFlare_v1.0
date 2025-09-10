import React from 'react';
import { PageBuilderSection } from '@/components/page-builder/types';
import { DeviceType } from '@/components/page-builder/utils/responsive';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { OptimizedRowRenderer } from './OptimizedRowRenderer';

interface OptimizedSectionRendererProps {
  section: PageBuilderSection;
  deviceType: DeviceType;
}

export const OptimizedSectionRenderer: React.FC<OptimizedSectionRendererProps> = React.memo(({
  section,
  deviceType
}) => {
  const styles = React.useMemo(() => {
    return mergeResponsiveStyles({}, section.styles, deviceType);
  }, [section.styles, deviceType]);

  const sectionStyle: React.CSSProperties = React.useMemo(() => {
    const style: React.CSSProperties = {};
    
    // Background
    if (styles.backgroundColor) style.backgroundColor = styles.backgroundColor;
    if (styles.backgroundImage) {
      style.backgroundImage = `url(${styles.backgroundImage})`;
      style.backgroundSize = styles.backgroundSize || 'cover';
      style.backgroundPosition = styles.backgroundPosition || 'center';
      style.backgroundRepeat = styles.backgroundRepeat || 'no-repeat';
    }
    
    // Spacing
    if (styles.paddingTop) style.paddingTop = styles.paddingTop;
    if (styles.paddingRight) style.paddingRight = styles.paddingRight;
    if (styles.paddingBottom) style.paddingBottom = styles.paddingBottom;
    if (styles.paddingLeft) style.paddingLeft = styles.paddingLeft;
    if (styles.marginTop) style.marginTop = styles.marginTop;
    if (styles.marginBottom) style.marginBottom = styles.marginBottom;
    
    // Border
    if (styles.borderRadius) style.borderRadius = styles.borderRadius;
    if (styles.border) style.border = styles.border;
    
    // Effects
    if (styles.boxShadow) style.boxShadow = styles.boxShadow;
    
    return style;
  }, [styles]);

  if (!section.rows?.length) {
    return <div className="min-h-[50px]" style={sectionStyle} />;
  }

  return (
    <section
      id={section.anchor}
      className="w-full"
      style={sectionStyle}
    >
      <div className="container mx-auto px-4">
        {section.rows.map((row, index) => (
          <OptimizedRowRenderer
            key={`${row.id}-${index}`}
            row={row}
            deviceType={deviceType}
          />
        ))}
      </div>
    </section>
  );
});

OptimizedSectionRenderer.displayName = 'OptimizedSectionRenderer';
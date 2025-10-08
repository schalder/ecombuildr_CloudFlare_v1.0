import React from 'react';
import { PageBuilderSection, SECTION_WIDTHS } from '@/components/page-builder/types';
import { StorefrontRow } from './StorefrontRow';
import { DividerRenderer } from '@/components/page-builder/dividers/DividerRenderer';
import { cn } from '@/lib/utils';
import { renderSectionStyles } from '@/components/page-builder/utils/styleRenderer';

interface StorefrontSectionProps {
  section: PageBuilderSection;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontSection: React.FC<StorefrontSectionProps> = ({
  section,
  deviceType = 'desktop'
}) => {
  const sectionStyles = renderSectionStyles(section, deviceType);
  
  const getSectionWidthClasses = () => {
    switch (section.width) {
      case 'full':
        return 'w-full';
      case 'wide':
        return 'w-full max-w-7xl mx-auto px-4';
      case 'medium':
        return 'w-full max-w-4xl mx-auto px-4';
      case 'small':
        return 'w-full max-w-2xl mx-auto px-4';
      default:
        return 'w-full max-w-7xl mx-auto px-4';
    }
  };
  
  const getSectionStyles = (): React.CSSProperties => {
    const baseStyles = sectionStyles;
    
    // Add flex styles for vertical alignment - device aware
    const verticalAlignment = section.styles?.responsive?.[deviceType]?.contentVerticalAlignment || 
                             section.styles?.contentVerticalAlignment;
    
    // Apply vertical alignment if section has height or minHeight
    const hasHeight = baseStyles.height && baseStyles.height !== 'auto';
    const hasMinHeight = baseStyles.minHeight && baseStyles.minHeight !== 'auto';
    
    if (verticalAlignment && (hasHeight || hasMinHeight)) {
      return {
        ...baseStyles,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: verticalAlignment === 'center' ? 'center' : 
                       verticalAlignment === 'bottom' ? 'flex-end' : 'flex-start'
      };
    }
    
    return baseStyles;
  };

  return (
    <div 
      id={section.anchor}
      data-pb-section-id={section.id}
      className={cn("relative")}
      style={getSectionStyles()}
    >
      {/* Top Divider */}
      {section.styles?.topDivider?.enabled && (
        <DividerRenderer divider={section.styles.topDivider} position="top" />
      )}

      {/* Bottom Divider */}
      {section.styles?.bottomDivider?.enabled && (
        <DividerRenderer divider={section.styles.bottomDivider} position="bottom" />
      )}

      <div className={getSectionWidthClasses()}>
        {section.rows?.map((row) => (
          <StorefrontRow
            key={row.id}
            row={row}
            deviceType={deviceType}
          />
        ))}
      </div>
    </div>
  );
};
import React from 'react';
import { PageBuilderSection } from '@/components/page-builder/types';
import { StorefrontRowRenderer } from './StorefrontRowRenderer';
import { cn } from '@/lib/utils';
import { renderSectionStyles, hasUserBackground, hasUserShadow } from '@/components/page-builder/utils/styleRenderer';

interface StorefrontSectionRendererProps {
  section: PageBuilderSection;
  sectionIndex: number;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const StorefrontSectionRenderer: React.FC<StorefrontSectionRendererProps> = ({
  section,
  sectionIndex,
  deviceType = 'desktop'
}) => {
  const getSectionWidth = () => {
    // If custom width is set, don't apply preset classes
    if (section.customWidth) {
      return '';
    }
    
    if (deviceType === 'tablet') {
      switch (section.width) {
        case 'full':
          return 'w-full';
        case 'wide':
          return 'max-w-3xl mx-auto px-4';
        case 'medium':
          return 'max-w-lg mx-auto px-4';
        case 'small':
          return 'max-w-sm mx-auto px-4';
        default:
          return 'max-w-3xl mx-auto px-4';
      }
    }
    
    if (deviceType === 'mobile') {
      switch (section.width) {
        case 'full':
          return 'w-full px-2';
        case 'wide':
          return 'w-full px-3';
        case 'medium':
          return 'w-full px-4';
        case 'small':
          return 'w-full px-6';
        default:
          return 'w-full px-4';
      }
    }
    
    // Desktop (default)
    switch (section.width) {
      case 'full':
        return 'w-full';
      case 'wide':
        return 'max-w-7xl mx-auto px-4';
      case 'medium':
        return 'max-w-4xl mx-auto px-4';
      case 'small':
        return 'max-w-2xl mx-auto px-4';
      default:
        return 'max-w-7xl mx-auto px-4';
    }
  };

  const getSectionStyles = (): React.CSSProperties => {
    const baseStyles = renderSectionStyles(section, deviceType);
    
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

  // Hide empty sections in storefront
  if (!section.rows || section.rows.length === 0) {
    return null;
  }

  return (
    <section
      id={section.anchor}
      data-pb-section-id={section.id}
      className={cn(
        'relative transition-all duration-200'
      )}
      style={getSectionStyles()}
    >
      <div 
        className={cn(
          getSectionWidth(), 
          section.customWidth ? 'mx-auto' : '',
          'flex flex-col',
          section.styles?.contentVerticalAlignment === 'center' && 'justify-center',
          section.styles?.contentVerticalAlignment === 'bottom' && 'justify-end',
          (!section.styles?.contentVerticalAlignment || section.styles?.contentVerticalAlignment === 'top') && 'justify-start'
        )}
        style={{ minHeight: 'inherit' }}
      >
        <div className="space-y-0">
          {section.rows.map((row, rowIndex) => (
            <StorefrontRowRenderer
              key={row.id}
              row={row}
              rowIndex={rowIndex}
              sectionId={section.id}
              deviceType={deviceType}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
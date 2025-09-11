import React from 'react';
import { PageBuilderSection, SECTION_WIDTHS } from '@/components/page-builder/types';
import { StorefrontRow } from './StorefrontRow';
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
  
  return (
    <div 
      id={section.anchor}
      data-pb-section-id={section.id}
      className={cn("relative")}
      style={sectionStyles}
    >
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
import { PageBuilderSection } from '../types';

/**
 * Determines if a section should apply vertical alignment based on height or minHeight
 * @param section - The page builder section
 * @param deviceType - Current device type
 * @returns boolean indicating if vertical alignment should be applied
 */
export function shouldApplyVerticalAlignment(
  section: PageBuilderSection,
  deviceType: 'desktop' | 'tablet' | 'mobile'
): boolean {
  const sectionHeight = section.styles?.responsive?.[deviceType]?.height || section.styles?.height;
  const sectionMinHeight = section.styles?.responsive?.[deviceType]?.minHeight || section.styles?.minHeight;
  
  const hasHeight = sectionHeight && sectionHeight !== 'auto';
  const hasMinHeight = sectionMinHeight && sectionMinHeight !== 'auto';
  
  return hasHeight || hasMinHeight;
}

/**
 * Gets the appropriate vertical alignment class for a section
 * @param section - The page builder section
 * @param deviceType - Current device type
 * @returns CSS class for vertical alignment
 */
export function getVerticalAlignmentClass(
  section: PageBuilderSection,
  deviceType: 'desktop' | 'tablet' | 'mobile'
): string {
  if (!shouldApplyVerticalAlignment(section, deviceType)) {
    return 'justify-start';
  }
  
  const verticalAlignment = section.styles?.responsive?.[deviceType]?.contentVerticalAlignment || 
                           section.styles?.contentVerticalAlignment;
  
  return verticalAlignment === 'center' ? 'justify-center' :
         verticalAlignment === 'bottom' ? 'justify-end' : 'justify-start';
}
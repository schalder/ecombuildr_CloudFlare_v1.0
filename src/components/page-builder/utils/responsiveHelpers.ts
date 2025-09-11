// Enhanced responsive utilities for style inheritance and management

import { PageBuilderElement } from '../types';

export interface ResponsiveStyles {
  desktop: Record<string, any>;
  tablet: Record<string, any>;
  mobile: Record<string, any>;
}

/**
 * Gets the effective value for a style property with proper inheritance fallback
 * Order: current device -> tablet (if mobile) -> desktop
 */
export function getEffectiveResponsiveValue(
  element: PageBuilderElement,
  property: string,
  deviceType: 'desktop' | 'tablet' | 'mobile',
  fallback: any = ''
): any {
  const responsiveStyles = element.styles?.responsive as ResponsiveStyles;
  
  if (!responsiveStyles) {
    return element.styles?.[property] || fallback;
  }

  // Current device value
  const currentValue = responsiveStyles[deviceType]?.[property];
  if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
    return currentValue;
  }

  // Inheritance chain: mobile -> tablet -> desktop
  if (deviceType === 'mobile') {
    const tabletValue = responsiveStyles.tablet?.[property];
    if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
      return tabletValue;
    }
  }
  
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    const desktopValue = responsiveStyles.desktop?.[property];
    if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
      return desktopValue;
    }
  }

  // Final fallback to base styles or provided fallback
  return element.styles?.[property] || fallback;
}

/**
 * Checks if a property has an explicit override for the current device
 */
export function hasResponsiveOverride(
  element: PageBuilderElement,
  property: string,
  deviceType: 'desktop' | 'tablet' | 'mobile'
): boolean {
  const responsiveStyles = element.styles?.responsive as ResponsiveStyles;
  if (!responsiveStyles) return false;
  
  const value = responsiveStyles[deviceType]?.[property];
  return value !== undefined && value !== null && value !== '';
}

/**
 * Gets the inherited value source for display purposes
 */
export function getInheritanceSource(
  element: PageBuilderElement,
  property: string,
  deviceType: 'desktop' | 'tablet' | 'mobile'
): 'current' | 'tablet' | 'desktop' | 'base' | null {
  const responsiveStyles = element.styles?.responsive as ResponsiveStyles;
  
  if (!responsiveStyles) {
    return element.styles?.[property] ? 'base' : null;
  }

  // Check current device
  const currentValue = responsiveStyles[deviceType]?.[property];
  if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
    return 'current';
  }

  // Check inheritance chain
  if (deviceType === 'mobile') {
    const tabletValue = responsiveStyles.tablet?.[property];
    if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
      return 'tablet';
    }
  }
  
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    const desktopValue = responsiveStyles.desktop?.[property];
    if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
      return 'desktop';
    }
  }

  // Check base styles
  if (element.styles?.[property]) {
    return 'base';
  }

  return null;
}

/**
 * Sets a responsive override for a specific device
 */
export function setResponsiveOverride(
  element: PageBuilderElement,
  property: string,
  value: any,
  deviceType: 'desktop' | 'tablet' | 'mobile',
  onStyleUpdate: (property: string, value: any) => void
): void {
  console.log(`setResponsiveOverride: ${property} = ${value} for ${deviceType}`);
  
  const currentResponsive = element.styles?.responsive as ResponsiveStyles || {
    desktop: {},
    tablet: {},
    mobile: {}
  };

  const updatedResponsive = {
    ...currentResponsive,
    [deviceType]: {
      ...currentResponsive[deviceType],
      [property]: value
    }
  };

  console.log('Updated responsive styles:', updatedResponsive);
  onStyleUpdate('responsive', updatedResponsive);
}

/**
 * Clears a responsive override for a specific device
 */
export function clearResponsiveOverride(
  element: PageBuilderElement,
  property: string,
  deviceType: 'desktop' | 'tablet' | 'mobile',
  onStyleUpdate: (property: string, value: any) => void
): void {
  const currentResponsive = element.styles?.responsive as ResponsiveStyles;
  if (!currentResponsive) return;

  const deviceStyles = { ...currentResponsive[deviceType] };
  delete deviceStyles[property];

  const updatedResponsive = {
    ...currentResponsive,
    [deviceType]: deviceStyles
  };

  onStyleUpdate('responsive', updatedResponsive);
}

/**
 * Gets display text for inheritance indicators
 */
export function getInheritanceLabel(
  source: 'current' | 'tablet' | 'desktop' | 'base' | null
): string {
  switch (source) {
    case 'current':
      return '';
    case 'tablet':
      return 'Inherited from Tablet';
    case 'desktop':
      return 'Inherited from Desktop';
    case 'base':
      return 'Base Style';
    default:
      return '';
  }
}

/**
 * Enhanced mergeResponsiveStyles with proper per-property inheritance
 */
export function mergeResponsiveStylesEnhanced(
  baseStyles: any,
  elementStyles: any,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): any {
  // Start with base styles
  let mergedStyles = { ...baseStyles };
  
  // Merge element base styles (non-responsive)
  if (elementStyles) {
    const { responsive, ...nonResponsiveStyles } = elementStyles;
    mergedStyles = { ...mergedStyles, ...nonResponsiveStyles };
    
    // Handle responsive styles with inheritance
    if (responsive) {
      const responsiveObj = responsive as ResponsiveStyles;
      
      // For each property, apply inheritance logic
      const allProperties = new Set([
        ...Object.keys(responsiveObj.desktop || {}),
        ...Object.keys(responsiveObj.tablet || {}),
        ...Object.keys(responsiveObj.mobile || {})
      ]);
      
      allProperties.forEach(property => {
        let effectiveValue;
        
        // Current device value
        const currentValue = responsiveObj[deviceType]?.[property];
        if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
          effectiveValue = currentValue;
        }
        // Inheritance for mobile: tablet -> desktop
        else if (deviceType === 'mobile') {
          const tabletValue = responsiveObj.tablet?.[property];
          if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
            effectiveValue = tabletValue;
          } else {
            const desktopValue = responsiveObj.desktop?.[property];
            if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
              effectiveValue = desktopValue;
            }
          }
        }
        // Inheritance for tablet: desktop
        else if (deviceType === 'tablet') {
          const desktopValue = responsiveObj.desktop?.[property];
          if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
            effectiveValue = desktopValue;
          }
        }
        
        if (effectiveValue !== undefined) {
          mergedStyles[property] = effectiveValue;
        }
      });
    }
  }
  
  return mergedStyles;
}
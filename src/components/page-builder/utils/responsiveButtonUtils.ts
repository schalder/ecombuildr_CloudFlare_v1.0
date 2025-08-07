import { PageBuilderElement } from '../types';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Generate responsive CSS classes for button typography
export function generateResponsiveButtonClasses(
  element: PageBuilderElement,
  deviceType?: DeviceType
): string {
  const classes: string[] = [];
  const desktopStyles = element.styles?.responsive?.desktop;
  const mobileStyles = element.styles?.responsive?.mobile;

  // Add base classes
  classes.push('cursor-pointer', 'transition-all', 'duration-200');

  // Handle full width
  if (element.content.fullWidth) {
    classes.push('w-full');
  } else if (element.content.widthType === 'custom' && element.styles?.width) {
    // Custom width will be handled via inline styles
  } else {
    classes.push('w-auto');
  }

  // Add responsive font size classes
  if (desktopStyles?.fontSize) {
    const desktopSize = parseInt(desktopStyles.fontSize.replace(/\D/g, ''));
    classes.push(getFontSizeClass(desktopSize, 'lg'));
  }

  if (mobileStyles?.fontSize) {
    const mobileSize = parseInt(mobileStyles.fontSize.replace(/\D/g, ''));
    classes.push(getFontSizeClass(mobileSize, 'base'));
  }

  // Add responsive font weight classes
  if (desktopStyles?.fontWeight) {
    classes.push(`lg:font-${getFontWeightClass(desktopStyles.fontWeight)}`);
  }

  if (mobileStyles?.fontWeight) {
    classes.push(`font-${getFontWeightClass(mobileStyles.fontWeight)}`);
  }

  // Add responsive letter spacing classes
  if (desktopStyles?.letterSpacing && desktopStyles.letterSpacing !== 'normal') {
    classes.push(`lg:tracking-${desktopStyles.letterSpacing}`);
  }

  if (mobileStyles?.letterSpacing && mobileStyles.letterSpacing !== 'normal') {
    classes.push(`tracking-${mobileStyles.letterSpacing}`);
  }

  // Add responsive text transform classes
  if (desktopStyles?.textTransform && desktopStyles.textTransform !== 'none') {
    classes.push(`lg:${getTextTransformClass(desktopStyles.textTransform)}`);
  }

  if (mobileStyles?.textTransform && mobileStyles.textTransform !== 'none') {
    classes.push(getTextTransformClass(mobileStyles.textTransform));
  }

  return classes.filter(Boolean).join(' ');
}

// Generate responsive CSS styles for button
export function generateResponsiveButtonStyles(
  element: PageBuilderElement
): React.CSSProperties {
  const styles: React.CSSProperties = {};
  const desktopStyles = element.styles?.responsive?.desktop;
  const mobileStyles = element.styles?.responsive?.mobile;

  // Handle custom width
  if (!element.content.fullWidth && element.content.widthType === 'custom' && element.styles?.width) {
    styles.width = element.styles.width;
  }

  // Base button styles
  if (element.styles?.backgroundColor) {
    styles.backgroundColor = element.styles.backgroundColor;
  }

  if (element.styles?.color) {
    styles.color = element.styles.color;
  }

  if (element.styles?.borderRadius) {
    styles.borderRadius = element.styles.borderRadius;
  }

  if (element.styles?.boxShadow) {
    styles.boxShadow = element.styles.boxShadow;
  }

  if (element.styles?.margin) {
    styles.margin = element.styles.margin;
  }

  // Global padding fallback (if no responsive padding is set)
  if (element.styles?.padding && !desktopStyles?.padding && !mobileStyles?.padding) {
    styles.padding = element.styles.padding;
  }

  return styles;
}

// Generate responsive padding CSS variable
export function generateResponsivePaddingCSS(element: PageBuilderElement): string {
  const desktopPadding = element.styles?.responsive?.desktop?.padding;
  const mobilePadding = element.styles?.responsive?.mobile?.padding;

  if (!desktopPadding && !mobilePadding) {
    return '';
  }

  let css = '';

  if (mobilePadding) {
    css += `padding: ${mobilePadding};`;
  }

  if (desktopPadding) {
    css += `@media (min-width: 1024px) { padding: ${desktopPadding}; }`;
  }

  return css;
}

// Helper functions
function getFontSizeClass(size: number, breakpoint: string): string {
  const sizeMap: { [key: number]: string } = {
    8: 'text-xs',
    10: 'text-xs',
    12: 'text-sm',
    14: 'text-sm',
    16: 'text-base',
    18: 'text-lg',
    20: 'text-xl',
    24: 'text-2xl',
    30: 'text-3xl',
    36: 'text-4xl',
    48: 'text-5xl'
  };

  // Find closest size
  const closestSize = Object.keys(sizeMap)
    .map(Number)
    .reduce((prev, curr) => 
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    );

  const className = sizeMap[closestSize] || 'text-base';
  
  return breakpoint === 'lg' ? `lg:${className}` : className;
}

function getFontWeightClass(weight: string): string {
  const weightMap: { [key: string]: string } = {
    'normal': 'normal',
    'medium': 'medium',
    'semibold': 'semibold',
    'bold': 'bold',
    'extrabold': 'extrabold'
  };

  return weightMap[weight] || 'normal';
}

function getTextTransformClass(transform: string): string {
  const transformMap: { [key: string]: string } = {
    'uppercase': 'uppercase',
    'lowercase': 'lowercase',
    'capitalize': 'capitalize'
  };

  return transformMap[transform] || '';
}
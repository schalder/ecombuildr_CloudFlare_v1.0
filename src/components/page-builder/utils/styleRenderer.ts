import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement, BackgroundImageMode } from '../types';
import { mergeResponsiveStyles } from './responsiveStyles';
import { applyColorOpacity, applyGradientOpacity } from './backgroundOpacity';
import { buildBackgroundStyles } from './backgroundStyleBuilder';

// Device-aware spacing interfaces
interface SpacingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ResponsiveSpacing {
  desktop: SpacingValues;
  tablet: SpacingValues;
  mobile: SpacingValues;
}

// Helper function to get device-aware spacing values with inheritance
export const getDeviceAwareSpacing = (
  spacingByDevice?: ResponsiveSpacing,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): SpacingValues => {
  if (!spacingByDevice) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  // Current device value
  const currentValue = spacingByDevice[deviceType];
  if (currentValue) {
    return currentValue;
  }

  // Inheritance logic: mobile -> tablet -> desktop
  if (deviceType === 'mobile') {
    const tabletValue = spacingByDevice.tablet;
    if (tabletValue) {
      return tabletValue;
    }
  }
  
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    const desktopValue = spacingByDevice.desktop;
    if (desktopValue) {
      return desktopValue;
    }
  }

  return { top: 0, right: 0, bottom: 0, left: 0 };
};

// Helper function to apply device-aware spacing to styles
const applyDeviceAwareSpacing = (
  styles: React.CSSProperties,
  marginByDevice?: ResponsiveSpacing,
  paddingByDevice?: ResponsiveSpacing,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): React.CSSProperties => {
  const margin = getDeviceAwareSpacing(marginByDevice, deviceType);
  const padding = getDeviceAwareSpacing(paddingByDevice, deviceType);

  // Apply margin
  if (margin.top > 0) styles.marginTop = `${margin.top}px`;
  if (margin.right > 0) styles.marginRight = `${margin.right}px`;
  if (margin.bottom > 0) styles.marginBottom = `${margin.bottom}px`;
  if (margin.left > 0) styles.marginLeft = `${margin.left}px`;

  // Apply padding
  if (padding.top > 0) styles.paddingTop = `${padding.top}px`;
  if (padding.right > 0) styles.paddingRight = `${padding.right}px`;
  if (padding.bottom > 0) styles.paddingBottom = `${padding.bottom}px`;
  if (padding.left > 0) styles.paddingLeft = `${padding.left}px`;

  return styles;
};

// Helper function to get background image properties based on mode
const getBackgroundImageProperties = (mode: BackgroundImageMode = 'full-center', deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop') => {
  const responsiveMode = deviceType === 'mobile' ? mode : mode;
  
  switch (responsiveMode) {
    case 'full-center':
      return {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      };
    case 'parallax':
      return {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: deviceType === 'mobile' ? 'scroll' : 'fixed'
      };
    case 'fill-width':
      return {
        backgroundSize: '100% auto',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      };
    case 'no-repeat':
      return {
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      };
    case 'repeat':
      return {
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'scroll'
      };
    default:
      return {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      };
  }
};

// Universal style renderer that creates pure inline styles
export const renderSectionStyles = (section: PageBuilderSection, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop', isPreviewMode: boolean = false): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  // Device-aware spacing styles - check for new responsive spacing first (moved outside if block for scope)
  const marginByDevice = section.styles?.marginByDevice as ResponsiveSpacing | undefined;
  const paddingByDevice = section.styles?.paddingByDevice as ResponsiveSpacing | undefined;
  
  if (section.styles) {
    // FIXED: No mixing of shorthand and individual properties
    
    // Background styles will be applied after responsive merge
    
    // Box shadow styles
    if (section.styles.boxShadow && section.styles.boxShadow !== 'none') {
      styles.boxShadow = section.styles.boxShadow;
    }
    
    // Border styles
    if (section.styles.borderWidth) styles.borderWidth = section.styles.borderWidth;
    if (section.styles.borderStyle) styles.borderStyle = section.styles.borderStyle;
    if (section.styles.borderColor) styles.borderColor = section.styles.borderColor;
    if (section.styles.borderRadius) styles.borderRadius = section.styles.borderRadius;
    
    if (marginByDevice || paddingByDevice) {
      // Use device-aware spacing
      applyDeviceAwareSpacing(styles, marginByDevice, paddingByDevice, deviceType);
    } else {
      // Fallback to legacy spacing styles - prioritize individual properties over shorthand to prevent conflicts
      if (section.styles.paddingTop || section.styles.paddingRight || section.styles.paddingBottom || section.styles.paddingLeft) {
        if (section.styles.paddingTop) styles.paddingTop = section.styles.paddingTop;
        if (section.styles.paddingRight) styles.paddingRight = section.styles.paddingRight;
        if (section.styles.paddingBottom) styles.paddingBottom = section.styles.paddingBottom;
        if (section.styles.paddingLeft) styles.paddingLeft = section.styles.paddingLeft;
      } else if (section.styles.padding) {
        styles.padding = section.styles.padding;
      }
      
      if (section.styles.marginTop || section.styles.marginRight || section.styles.marginBottom || section.styles.marginLeft) {
        if (section.styles.marginTop) styles.marginTop = section.styles.marginTop;
        if (section.styles.marginRight) styles.marginRight = section.styles.marginRight;
        if (section.styles.marginBottom) styles.marginBottom = section.styles.marginBottom;
        if (section.styles.marginLeft) styles.marginLeft = section.styles.marginLeft;
      } else if (section.styles.margin) {
        styles.margin = section.styles.margin;
      }
    }
    
    // Width
    if (section.styles.width) styles.width = section.styles.width;
    if (section.styles.maxWidth) styles.maxWidth = section.styles.maxWidth;
    if (section.styles.minWidth) styles.minWidth = section.styles.minWidth;
    
    // Height - mobile defaults to auto if no overrides
    if (deviceType === 'mobile' && !section.styles?.responsive?.mobile?.height && !section.styles.height) {
      styles.height = 'auto';
    } else {
      if (section.styles.height) styles.height = section.styles.height;
      if (section.styles.minHeight) styles.minHeight = section.styles.minHeight;
      if (section.styles.maxHeight) styles.maxHeight = section.styles.maxHeight;
    }
    
  }
  
  // Merge responsive overrides FIRST, but preserve background styles
  // Exclude legacy spacing properties if device-aware spacing is present to prevent conflicts
  const stylesToMerge = { ...section.styles };
  if (marginByDevice || paddingByDevice) {
    // Remove legacy spacing properties when device-aware spacing is present
    delete stylesToMerge.paddingTop;
    delete stylesToMerge.paddingRight;
    delete stylesToMerge.paddingBottom;
    delete stylesToMerge.paddingLeft;
    delete stylesToMerge.padding;
    delete stylesToMerge.marginTop;
    delete stylesToMerge.marginRight;
    delete stylesToMerge.marginBottom;
    delete stylesToMerge.marginLeft;
    delete stylesToMerge.margin;
  }
  const mergedStyles = mergeResponsiveStyles(styles, stylesToMerge || {}, deviceType);
  
  // Apply sticky positioning AFTER responsive merge to ensure it's not overridden
  if (section.styles?.stickyPosition && section.styles.stickyPosition !== 'none') {
    mergedStyles.zIndex = '45'; // Ensure sticky elements stay above content but below overlays
    
    if (section.styles.stickyPosition === 'top') {
      // Use sticky positioning for top (works reliably)
      mergedStyles.position = 'sticky';
      mergedStyles.top = section.styles.stickyOffset || '0px';
      // Clear any conflicting bottom property
      delete mergedStyles.bottom;
    } else if (section.styles.stickyPosition === 'bottom') {
      if (isPreviewMode) {
        // In preview mode, use fixed positioning relative to viewport
        mergedStyles.position = 'fixed';
        mergedStyles.bottom = section.styles.stickyOffset || '0px';
        mergedStyles.left = '0';
        mergedStyles.right = '0';
        mergedStyles.width = '100%';
        // Clear any conflicting top property
        delete mergedStyles.top;
        // Ensure the element has a minimum height for visibility
        if (!mergedStyles.minHeight) {
          mergedStyles.minHeight = '60px';
        }
      } else {
        // In editor mode, use absolute positioning relative to canvas container
        mergedStyles.position = 'absolute';
        mergedStyles.bottom = section.styles.stickyOffset || '0px';
        mergedStyles.left = '0';
        mergedStyles.right = '0';
        mergedStyles.width = '100%';
        // Clear any conflicting top property
        delete mergedStyles.top;
        // Ensure the element has a minimum height for visibility
        if (!mergedStyles.minHeight) {
          mergedStyles.minHeight = '60px';
        }
      }
    }
  }
  
  // Apply background styles AFTER responsive merge to ensure they're not overwritten
  const backgroundStyles = buildBackgroundStyles({
    backgroundImage: section.styles?.backgroundImage,
    backgroundColor: section.styles?.backgroundColor,
    backgroundGradient: section.styles?.backgroundGradient,
    backgroundOpacity: section.styles?.backgroundOpacity,
    backgroundImageMode: section.styles?.backgroundImageMode,
    responsive: section.styles?.responsive,
    deviceType
  });
  
  // Merge background styles on top of responsive styles
  Object.assign(mergedStyles, backgroundStyles);
  
  // Custom width - handle tablet/mobile responsively
  if (section.customWidth) {
    if (deviceType === 'tablet' || deviceType === 'mobile') {
      mergedStyles.maxWidth = section.customWidth;
      mergedStyles.width = '100%';
    } else {
      mergedStyles.width = section.customWidth;
    }
  }
  
  // Auto-center sections when width is less than 100% and no explicit horizontal margins
  const hasExplicitHorizontalMargin = mergedStyles.marginLeft || mergedStyles.marginRight;
  const responsiveWidth = section.styles?.responsive?.[deviceType]?.width;
  
  // For tablet/mobile, check the effective width (maxWidth when custom width is applied)
  const effectiveWidth = (deviceType === 'tablet' || deviceType === 'mobile') && section.customWidth 
    ? mergedStyles.maxWidth 
    : mergedStyles.width || responsiveWidth || section.customWidth;
  
  if (effectiveWidth && !hasExplicitHorizontalMargin) {
    if (effectiveWidth !== '100%' && !effectiveWidth.includes('100%')) {
      mergedStyles.marginLeft = 'auto';
      mergedStyles.marginRight = 'auto';
    }
  }

  // Add positioning for dividers
  if (section.styles?.topDivider?.enabled || section.styles?.bottomDivider?.enabled) {
    mergedStyles.position = 'relative';
    mergedStyles.overflow = 'hidden';
  }

  return mergedStyles;
};

export const renderRowStyles = (row: PageBuilderRow, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  // Device-aware spacing styles - check for new responsive spacing first (moved outside if block for scope)
  const marginByDevice = row.styles?.marginByDevice as ResponsiveSpacing | undefined;
  const paddingByDevice = row.styles?.paddingByDevice as ResponsiveSpacing | undefined;
  
  if (row.styles) {
    // Background styles will be applied after responsive merge
    
    // Box shadow styles
    if (row.styles.boxShadow && row.styles.boxShadow !== 'none') {
      styles.boxShadow = row.styles.boxShadow;
    }
    
    // Border styles
    if (row.styles.borderWidth) styles.borderWidth = row.styles.borderWidth;
    if (row.styles.borderStyle) styles.borderStyle = row.styles.borderStyle;
    if (row.styles.borderColor) styles.borderColor = row.styles.borderColor;
    if (row.styles.borderRadius) styles.borderRadius = row.styles.borderRadius;
    
    if (marginByDevice || paddingByDevice) {
      // Use device-aware spacing
      applyDeviceAwareSpacing(styles, marginByDevice, paddingByDevice, deviceType);
    } else {
      // Fallback to legacy spacing styles - prioritize individual properties over shorthand to prevent conflicts
      if (row.styles.paddingTop || row.styles.paddingRight || row.styles.paddingBottom || row.styles.paddingLeft) {
        if (row.styles.paddingTop) styles.paddingTop = row.styles.paddingTop;
        if (row.styles.paddingRight) styles.paddingRight = row.styles.paddingRight;
        if (row.styles.paddingBottom) styles.paddingBottom = row.styles.paddingBottom;
        if (row.styles.paddingLeft) styles.paddingLeft = row.styles.paddingLeft;
      } else if (row.styles.padding) {
        styles.padding = row.styles.padding;
      }
      
      if (row.styles.marginTop || row.styles.marginRight || row.styles.marginBottom || row.styles.marginLeft) {
        if (row.styles.marginTop) styles.marginTop = row.styles.marginTop;
        if (row.styles.marginRight) styles.marginRight = row.styles.marginRight;
        if (row.styles.marginBottom) styles.marginBottom = row.styles.marginBottom;
        if (row.styles.marginLeft) styles.marginLeft = row.styles.marginLeft;
      } else if (row.styles.margin) {
        styles.margin = row.styles.margin;
      }
    }
    
    // Width
    if (row.styles.maxWidth) styles.maxWidth = row.styles.maxWidth;
    if (row.styles.minWidth) styles.minWidth = row.styles.minWidth;
    if (row.styles.width) styles.width = row.styles.width;
  }
  
  // Custom width - handle tablet/mobile responsively
  if (row.customWidth) {
    if (deviceType === 'tablet' || deviceType === 'mobile') {
      styles.maxWidth = row.customWidth;
      styles.width = '100%';
    } else {
      styles.width = row.customWidth;
    }
  }
  
  // Merge responsive overrides FIRST
  // Exclude legacy spacing properties if device-aware spacing is present to prevent conflicts
  const stylesToMerge = { ...row.styles };
  if (marginByDevice || paddingByDevice) {
    // Remove legacy spacing properties when device-aware spacing is present
    delete stylesToMerge.paddingTop;
    delete stylesToMerge.paddingRight;
    delete stylesToMerge.paddingBottom;
    delete stylesToMerge.paddingLeft;
    delete stylesToMerge.padding;
    delete stylesToMerge.marginTop;
    delete stylesToMerge.marginRight;
    delete stylesToMerge.marginBottom;
    delete stylesToMerge.marginLeft;
    delete stylesToMerge.margin;
  }
  const merged = mergeResponsiveStyles(styles, stylesToMerge || {}, deviceType);
  
  // Apply background styles AFTER responsive merge
  const backgroundStyles = buildBackgroundStyles({
    backgroundImage: row.styles?.backgroundImage,
    backgroundColor: row.styles?.backgroundColor,
    backgroundGradient: row.styles?.backgroundGradient,
    backgroundOpacity: row.styles?.backgroundOpacity,
    backgroundImageMode: row.styles?.backgroundImageMode,
    responsive: row.styles?.responsive,
    deviceType
  });
  
  // Merge background styles on top
  Object.assign(merged, backgroundStyles);
  
  // Auto-center rows when width is less than 100% and no explicit horizontal margins  
  const hasExplicitHorizontalMargin = merged.marginLeft || merged.marginRight;
  const responsiveWidth = row.styles?.responsive?.[deviceType]?.width;
  
  // For tablet/mobile, check the effective width (maxWidth when custom width is applied)
  const effectiveWidth = (deviceType === 'tablet' || deviceType === 'mobile') && row.customWidth 
    ? merged.maxWidth 
    : merged.width || responsiveWidth || row.customWidth;
  
  if (effectiveWidth && !hasExplicitHorizontalMargin) {
    if (effectiveWidth !== '100%' && !effectiveWidth.includes('100%')) {
      merged.marginLeft = 'auto';
      merged.marginRight = 'auto';
    }
  }

  return merged;
};

export const renderColumnStyles = (column: PageBuilderColumn, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  // Device-aware spacing styles - check for new responsive spacing first (moved outside if block for scope)
  const marginByDevice = column.styles?.marginByDevice as ResponsiveSpacing | undefined;
  const paddingByDevice = column.styles?.paddingByDevice as ResponsiveSpacing | undefined;
  
  if (column.styles) {
    // Background styles will be applied after responsive merge
    
    // Box shadow styles
    if (column.styles.boxShadow && column.styles.boxShadow !== 'none') {
      styles.boxShadow = column.styles.boxShadow;
    }
    
    // Border styles
    if (column.styles.borderWidth) styles.borderWidth = column.styles.borderWidth;
    if (column.styles.borderStyle) styles.borderStyle = column.styles.borderStyle;
    if (column.styles.borderColor) styles.borderColor = column.styles.borderColor;
    if (column.styles.borderRadius) styles.borderRadius = column.styles.borderRadius;
    
    // Content alignment styles - enable flexbox when alignment is set
    if (column.styles.contentAlignment || column.styles.contentJustification || column.styles.contentDirection) {
      styles.display = 'flex';
      styles.flexDirection = column.styles.contentDirection || 'column';
      
      if (column.styles.contentAlignment) {
        // For column direction: alignItems controls vertical alignment
        // For row direction: alignItems controls horizontal alignment
        styles.alignItems = column.styles.contentAlignment;
      }
      
      if (column.styles.contentJustification) {
        // For column direction: justifyContent controls horizontal alignment
        // For row direction: justifyContent controls vertical alignment
        styles.justifyContent = column.styles.contentJustification;
      }
      
      if (column.styles.contentGap) {
        styles.gap = column.styles.contentGap;
      }
    }
    
    if (marginByDevice || paddingByDevice) {
      // Use device-aware spacing
      applyDeviceAwareSpacing(styles, marginByDevice, paddingByDevice, deviceType);
    } else {
      // Fallback to legacy spacing styles - prioritize individual properties over shorthand to prevent conflicts
      if (column.styles.paddingTop || column.styles.paddingRight || column.styles.paddingBottom || column.styles.paddingLeft) {
        if (column.styles.paddingTop) styles.paddingTop = column.styles.paddingTop;
        if (column.styles.paddingRight) styles.paddingRight = column.styles.paddingRight;
        if (column.styles.paddingBottom) styles.paddingBottom = column.styles.paddingBottom;
        if (column.styles.paddingLeft) styles.paddingLeft = column.styles.paddingLeft;
      } else if (column.styles.padding) {
        styles.padding = column.styles.padding;
      }
      
      if (column.styles.marginTop || column.styles.marginRight || column.styles.marginBottom || column.styles.marginLeft) {
        if (column.styles.marginTop) styles.marginTop = column.styles.marginTop;
        if (column.styles.marginRight) styles.marginRight = column.styles.marginRight;
        if (column.styles.marginBottom) styles.marginBottom = column.styles.marginBottom;
        if (column.styles.marginLeft) styles.marginLeft = column.styles.marginLeft;
      } else if (column.styles.margin) {
        styles.margin = column.styles.margin;
      }
    }
    
    // Width - handle horizontal margins by adjusting width
    if (column.styles.maxWidth) styles.maxWidth = column.styles.maxWidth;
    if (column.styles.minWidth) styles.minWidth = column.styles.minWidth;
    if (column.styles.width) styles.width = column.styles.width;
    
    // If column has horizontal margins, calculate width to accommodate them
    const hasHorizontalMargins = column.styles.marginLeft || column.styles.marginRight;
    if (hasHorizontalMargins && !column.styles.width) {
      const leftMargin = column.styles.marginLeft || '0px';
      const rightMargin = column.styles.marginRight || '0px';
      styles.width = `calc(100% - (${leftMargin} + ${rightMargin}))`;
    }
  }
  
  // Merge responsive overrides FIRST
  // Exclude legacy spacing properties if device-aware spacing is present to prevent conflicts
  const stylesToMerge = { ...column.styles };
  if (marginByDevice || paddingByDevice) {
    // Remove legacy spacing properties when device-aware spacing is present
    delete stylesToMerge.paddingTop;
    delete stylesToMerge.paddingRight;
    delete stylesToMerge.paddingBottom;
    delete stylesToMerge.paddingLeft;
    delete stylesToMerge.padding;
    delete stylesToMerge.marginTop;
    delete stylesToMerge.marginRight;
    delete stylesToMerge.marginBottom;
    delete stylesToMerge.marginLeft;
    delete stylesToMerge.margin;
  }
  const merged = mergeResponsiveStyles(styles, stylesToMerge || {}, deviceType);
  
  // Apply background styles AFTER responsive merge
  const backgroundStyles = buildBackgroundStyles({
    backgroundImage: column.styles?.backgroundImage,
    backgroundColor: column.styles?.backgroundColor,
    backgroundGradient: column.styles?.backgroundGradient,
    backgroundOpacity: column.styles?.backgroundOpacity,
    backgroundImageMode: column.styles?.backgroundImageMode,
    responsive: column.styles?.responsive,
    deviceType
  });
  
  // Merge background styles on top
  Object.assign(merged, backgroundStyles);
  
  // Auto-center columns when width is set and no explicit horizontal margins
  const hasExplicitHorizontalMargin = merged.marginLeft || merged.marginRight || column.styles?.marginLeft || column.styles?.marginRight;
  const responsiveWidth = column.styles?.responsive?.[deviceType]?.width;
  
  // For tablet/mobile, check the effective width (maxWidth when custom width is applied)  
  const effectiveWidth = (deviceType === 'tablet' || deviceType === 'mobile') && column.customWidth 
    ? merged.maxWidth 
    : merged.width || responsiveWidth || column.customWidth;
  
  if (effectiveWidth && !hasExplicitHorizontalMargin) {
    if (effectiveWidth !== '100%' && !effectiveWidth.includes('100%')) {
      merged.justifySelf = 'center';
    }
  }
  
  return merged;
};

export const renderElementStyles = (element: PageBuilderElement, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (element.styles) {
    // Dimensions
    if (element.styles.width) styles.width = element.styles.width;
    if (element.styles.height) styles.height = element.styles.height;
    if (element.styles.maxWidth) styles.maxWidth = element.styles.maxWidth;
    if (element.styles.minWidth) styles.minWidth = element.styles.minWidth;
    if (element.styles.maxHeight) styles.maxHeight = element.styles.maxHeight;
    if (element.styles.minHeight) styles.minHeight = element.styles.minHeight;
    
    // Background styles
    if (element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = element.styles.backgroundColor;
    }
    if (element.styles.backgroundImage) {
      styles.backgroundImage = `url(${element.styles.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    
    // Border styles
    if (element.styles.borderWidth) styles.borderWidth = element.styles.borderWidth;
    if (element.styles.borderColor) styles.borderColor = element.styles.borderColor;
    if (element.styles.borderStyle) styles.borderStyle = element.styles.borderStyle;
    if (element.styles.borderRadius) styles.borderRadius = element.styles.borderRadius;
    
    // Effects
    if (element.styles.opacity !== undefined) styles.opacity = element.styles.opacity;
    if (element.styles.boxShadow && element.styles.boxShadow !== 'none') {
      styles.boxShadow = element.styles.boxShadow;
    }
    
    // Device-aware spacing styles - ONLY apply padding, margins are handled by ElementRenderer wrapper
    const paddingByDevice = element.styles?.paddingByDevice as ResponsiveSpacing | undefined;
    
    if (paddingByDevice) {
      // Use device-aware padding
      const padding = getDeviceAwareSpacing(paddingByDevice, deviceType);
      if (padding.top > 0) styles.paddingTop = `${padding.top}px`;
      if (padding.right > 0) styles.paddingRight = `${padding.right}px`;
      if (padding.bottom > 0) styles.paddingBottom = `${padding.bottom}px`;
      if (padding.left > 0) styles.paddingLeft = `${padding.left}px`;
    } else {
      // Fallback to legacy padding styles
      if (element.styles.paddingTop || element.styles.paddingRight || element.styles.paddingBottom || element.styles.paddingLeft) {
        if (element.styles.paddingTop) styles.paddingTop = element.styles.paddingTop;
        if (element.styles.paddingRight) styles.paddingRight = element.styles.paddingRight;
        if (element.styles.paddingBottom) styles.paddingBottom = element.styles.paddingBottom;
        if (element.styles.paddingLeft) styles.paddingLeft = element.styles.paddingLeft;
      } else if (element.styles.padding) {
        styles.padding = element.styles.padding;
      }
    }
    
  // NOTE: Margins are intentionally excluded here since they're handled by ElementRenderer wrapper
  // This prevents double application of margins
  
  // Typography
  if (element.styles.color) styles.color = element.styles.color;
    if (element.styles.fontSize) styles.fontSize = element.styles.fontSize;
    if (element.styles.lineHeight) styles.lineHeight = element.styles.lineHeight;
    if (element.styles.textAlign) styles.textAlign = element.styles.textAlign;
    if (element.styles.fontWeight) styles.fontWeight = element.styles.fontWeight;
    if (element.styles.fontFamily) styles.fontFamily = element.styles.fontFamily;
    
    // Media-specific properties
    if (element.styles.objectFit) styles.objectFit = element.styles.objectFit;
  }
  
  // Merge responsive overrides but exclude margins to prevent double application
  const merged = mergeResponsiveStyles(styles, element.styles, deviceType);
  
  // CRITICAL: Remove any margins that might have been added by responsive merge or base styles
  // Margins are ONLY handled by ElementRenderer wrapper to prevent double application
  delete merged.marginTop;
  delete merged.marginRight;  
  delete merged.marginBottom;
  delete merged.marginLeft;
  delete merged.margin;
  
  // Also remove any shorthand margin that might exist
  if (merged.margin !== undefined) delete merged.margin;
  
  return merged;
};

// Check if element has user-defined background or shadow
export const hasUserBackground = (styles?: any): boolean => {
  return !!(
    (styles?.backgroundColor && styles.backgroundColor !== 'transparent') ||
    styles?.backgroundGradient ||
    styles?.backgroundImage
  );
};

export const hasUserShadow = (styles?: any): boolean => {
  return !!(styles?.boxShadow && styles.boxShadow !== 'none');
};
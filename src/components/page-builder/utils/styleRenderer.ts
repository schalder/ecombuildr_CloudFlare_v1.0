import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement, BackgroundImageMode } from '../types';
import { mergeResponsiveStyles } from './responsiveStyles';
import { applyColorOpacity, applyGradientOpacity } from './backgroundOpacity';

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
export const renderSectionStyles = (section: PageBuilderSection, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (section.styles) {
    const opacity = section.styles.backgroundOpacity ?? 1;
    
    // Layered background support: combine color/gradient with image
    const backgroundLayers: string[] = [];
    
    // Add color/gradient layer with opacity (top layer)
    if (section.styles.backgroundGradient) {
      backgroundLayers.push(applyGradientOpacity(section.styles.backgroundGradient, opacity));
    } else if (section.styles.backgroundColor && section.styles.backgroundColor !== 'transparent') {
      // For solid colors with background image, create a linear gradient overlay to ensure transparency works
      if (section.styles.backgroundImage && opacity < 1) {
        const colorWithOpacity = applyColorOpacity(section.styles.backgroundColor, opacity);
        backgroundLayers.push(`linear-gradient(${colorWithOpacity}, ${colorWithOpacity})`);
      } else {
        backgroundLayers.push(applyColorOpacity(section.styles.backgroundColor, opacity));
      }
    }
    
    // Add image layer (bottom layer)
    if (section.styles.backgroundImage) {
      backgroundLayers.push(`url(${section.styles.backgroundImage})`);
      
      // Get responsive background image mode
      const responsiveImageMode = section.styles?.responsive?.[deviceType]?.backgroundImageMode || section.styles.backgroundImageMode;
      const imageProps = getBackgroundImageProperties(responsiveImageMode, deviceType);
      
      Object.assign(styles, imageProps);
    }
    
    // Apply combined background
    if (backgroundLayers.length > 0) {
      styles.background = backgroundLayers.join(', ');
    }
    
    // Box shadow styles
    if (section.styles.boxShadow && section.styles.boxShadow !== 'none') {
      styles.boxShadow = section.styles.boxShadow;
    }
    
    // Border styles
    if (section.styles.borderWidth) {
      const borderStyle = section.styles.borderStyle || 'solid';
      styles.border = `${section.styles.borderWidth} ${borderStyle} ${section.styles.borderColor || '#000000'}`;
    }
    if (section.styles.borderRadius) styles.borderRadius = section.styles.borderRadius;
    
    // Spacing styles - prioritize individual properties over shorthand to prevent conflicts
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
  
  // Custom width
  if (section.customWidth) {
    styles.width = section.customWidth;
  }
  
  // Auto-center sections when width is less than 100% and no explicit horizontal margins
  const hasExplicitHorizontalMargin = styles.marginLeft || styles.marginRight || section.styles?.marginLeft || section.styles?.marginRight;
  const responsiveWidth = section.styles?.responsive?.[deviceType]?.width;
  const hasCustomWidth = section.customWidth || responsiveWidth;
  
  if (hasCustomWidth && !hasExplicitHorizontalMargin) {
    const widthValue = responsiveWidth || section.customWidth;
    if (widthValue && widthValue !== '100%' && !widthValue.includes('100%')) {
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
    }
  }

  // Merge responsive overrides
  const merged = mergeResponsiveStyles(styles, section.styles, deviceType);
  return merged;
};

export const renderRowStyles = (row: PageBuilderRow, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (row.styles) {
    const opacity = row.styles.backgroundOpacity ?? 1;
    
    // Layered background support: combine color/gradient with image
    const backgroundLayers: string[] = [];
    
    // Add color/gradient layer with opacity (top layer)
    if (row.styles.backgroundGradient) {
      backgroundLayers.push(applyGradientOpacity(row.styles.backgroundGradient, opacity));
    } else if (row.styles.backgroundColor && row.styles.backgroundColor !== 'transparent') {
      // For solid colors with background image, create a linear gradient overlay to ensure transparency works
      if (row.styles.backgroundImage && opacity < 1) {
        const colorWithOpacity = applyColorOpacity(row.styles.backgroundColor, opacity);
        backgroundLayers.push(`linear-gradient(${colorWithOpacity}, ${colorWithOpacity})`);
      } else {
        backgroundLayers.push(applyColorOpacity(row.styles.backgroundColor, opacity));
      }
    }
    
    // Add image layer (bottom layer)
    if (row.styles.backgroundImage) {
      backgroundLayers.push(`url(${row.styles.backgroundImage})`);
      
      // Get responsive background image mode
      const responsiveImageMode = row.styles?.responsive?.[deviceType]?.backgroundImageMode || row.styles.backgroundImageMode;
      const imageProps = getBackgroundImageProperties(responsiveImageMode, deviceType);
      
      Object.assign(styles, imageProps);
    }
    
    // Apply combined background
    if (backgroundLayers.length > 0) {
      styles.background = backgroundLayers.join(', ');
    }
    
    // Box shadow styles
    if (row.styles.boxShadow && row.styles.boxShadow !== 'none') {
      styles.boxShadow = row.styles.boxShadow;
    }
    
    // Border styles
    if (row.styles.borderWidth) {
      const borderStyle = row.styles.borderStyle || 'solid';
      styles.border = `${row.styles.borderWidth} ${borderStyle} ${row.styles.borderColor || '#000000'}`;
    }
    if (row.styles.borderRadius) styles.borderRadius = row.styles.borderRadius;
    
    // Spacing styles - prioritize individual properties over shorthand to prevent conflicts
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
    
    // Width
    if (row.styles.maxWidth) styles.maxWidth = row.styles.maxWidth;
    if (row.styles.minWidth) styles.minWidth = row.styles.minWidth;
    if (row.styles.width) styles.width = row.styles.width;
  }
  
  // Custom width
  if (row.customWidth) {
    styles.width = row.customWidth;
  }
  
  // Auto-center rows when width is less than 100% and no explicit horizontal margins
  const hasExplicitHorizontalMargin = styles.marginLeft || styles.marginRight || row.styles?.marginLeft || row.styles?.marginRight;
  const responsiveWidth = row.styles?.responsive?.[deviceType]?.width;
  const hasCustomWidth = row.customWidth || responsiveWidth;
  
  if (hasCustomWidth && !hasExplicitHorizontalMargin) {
    const widthValue = responsiveWidth || row.customWidth;
    if (widthValue && widthValue !== '100%' && !widthValue.includes('100%')) {
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
    }
  }

  // Merge responsive overrides
  const merged = mergeResponsiveStyles(styles, row.styles, deviceType);
  return merged;
};

export const renderColumnStyles = (column: PageBuilderColumn, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (column.styles) {
    const opacity = column.styles.backgroundOpacity ?? 1;
    
    // Layered background support: combine color/gradient with image
    const backgroundLayers: string[] = [];
    
    // Add color/gradient layer with opacity (top layer)
    if (column.styles.backgroundGradient) {
      backgroundLayers.push(applyGradientOpacity(column.styles.backgroundGradient, opacity));
    } else if (column.styles.backgroundColor && column.styles.backgroundColor !== 'transparent') {
      // For solid colors with background image, create a linear gradient overlay to ensure transparency works
      if (column.styles.backgroundImage && opacity < 1) {
        const colorWithOpacity = applyColorOpacity(column.styles.backgroundColor, opacity);
        backgroundLayers.push(`linear-gradient(${colorWithOpacity}, ${colorWithOpacity})`);
      } else {
        backgroundLayers.push(applyColorOpacity(column.styles.backgroundColor, opacity));
      }
    }
    
    // Add image layer (bottom layer)
    if (column.styles.backgroundImage) {
      backgroundLayers.push(`url(${column.styles.backgroundImage})`);
      
      // Get responsive background image mode
      const responsiveImageMode = column.styles?.responsive?.[deviceType]?.backgroundImageMode || column.styles.backgroundImageMode;
      const imageProps = getBackgroundImageProperties(responsiveImageMode, deviceType);
      
      Object.assign(styles, imageProps);
    }
    
    // Apply combined background
    if (backgroundLayers.length > 0) {
      styles.background = backgroundLayers.join(', ');
    }
    
    // Box shadow styles
    if (column.styles.boxShadow && column.styles.boxShadow !== 'none') {
      styles.boxShadow = column.styles.boxShadow;
    }
    
    // Border styles
    if (column.styles.borderWidth) {
      const borderStyle = column.styles.borderStyle || 'solid';
      styles.border = `${column.styles.borderWidth} ${borderStyle} ${column.styles.borderColor || '#000000'}`;
    }
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
    
    // Spacing styles - prioritize individual properties over shorthand to prevent conflicts
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
    
    // Width
    if (column.styles.maxWidth) styles.maxWidth = column.styles.maxWidth;
    if (column.styles.minWidth) styles.minWidth = column.styles.minWidth;
    if (column.styles.width) styles.width = column.styles.width;
  }
  
  // Auto-center columns when width is set and no explicit horizontal margins
  const hasExplicitHorizontalMargin = styles.marginLeft || styles.marginRight || column.styles?.marginLeft || column.styles?.marginRight;
  const responsiveWidth = column.styles?.responsive?.[deviceType]?.width;
  const hasCustomWidth = column.customWidth || responsiveWidth;
  
  if (hasCustomWidth && !hasExplicitHorizontalMargin) {
    const widthValue = responsiveWidth || column.customWidth;
    if (widthValue && widthValue !== '100%' && !widthValue.includes('100%')) {
      styles.justifySelf = 'center';
    }
  }

  // Merge responsive overrides
  const merged = mergeResponsiveStyles(styles, column.styles, deviceType);
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
    
    // Spacing styles - prioritize individual properties over shorthand to prevent conflicts
    if (element.styles.paddingTop || element.styles.paddingRight || element.styles.paddingBottom || element.styles.paddingLeft) {
      if (element.styles.paddingTop) styles.paddingTop = element.styles.paddingTop;
      if (element.styles.paddingRight) styles.paddingRight = element.styles.paddingRight;
      if (element.styles.paddingBottom) styles.paddingBottom = element.styles.paddingBottom;
      if (element.styles.paddingLeft) styles.paddingLeft = element.styles.paddingLeft;
    } else if (element.styles.padding) {
      styles.padding = element.styles.padding;
    }
    
    if (element.styles.marginTop || element.styles.marginRight || element.styles.marginBottom || element.styles.marginLeft) {
      if (element.styles.marginTop) styles.marginTop = element.styles.marginTop;
      if (element.styles.marginRight) styles.marginRight = element.styles.marginRight;
      if (element.styles.marginBottom) styles.marginBottom = element.styles.marginBottom;
      if (element.styles.marginLeft) styles.marginLeft = element.styles.marginLeft;
    } else if (element.styles.margin) {
      styles.margin = element.styles.margin;
    }
    
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
  
  // Merge responsive overrides
  const merged = mergeResponsiveStyles(styles, element.styles, deviceType);
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
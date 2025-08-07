import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement } from '../types';

// Universal style renderer that creates pure inline styles
export const renderSectionStyles = (section: PageBuilderSection): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (section.styles) {
    // Background styles
    if (section.styles.backgroundColor && section.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = section.styles.backgroundColor;
    }
    
    if (section.styles.backgroundImage) {
      styles.backgroundImage = `url(${section.styles.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    
    // Box shadow styles
    if (section.styles.boxShadow && section.styles.boxShadow !== 'none') {
      styles.boxShadow = section.styles.boxShadow;
    }
    
    // Spacing styles
    if (section.styles.padding) styles.padding = section.styles.padding;
    if (section.styles.margin) styles.margin = section.styles.margin;
    if (section.styles.paddingTop) styles.paddingTop = section.styles.paddingTop;
    if (section.styles.paddingRight) styles.paddingRight = section.styles.paddingRight;
    if (section.styles.paddingBottom) styles.paddingBottom = section.styles.paddingBottom;
    if (section.styles.paddingLeft) styles.paddingLeft = section.styles.paddingLeft;
    if (section.styles.marginTop) styles.marginTop = section.styles.marginTop;
    if (section.styles.marginRight) styles.marginRight = section.styles.marginRight;
    if (section.styles.marginBottom) styles.marginBottom = section.styles.marginBottom;
    if (section.styles.marginLeft) styles.marginLeft = section.styles.marginLeft;
    
    // Width
    if (section.styles.maxWidth) styles.maxWidth = section.styles.maxWidth;
    if (section.styles.minWidth) styles.minWidth = section.styles.minWidth;
  }
  
  // Custom width
  if (section.customWidth) {
    styles.width = section.customWidth;
  }
  
  return styles;
};

export const renderRowStyles = (row: PageBuilderRow): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (row.styles) {
    // Background styles
    if (row.styles.backgroundColor && row.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = row.styles.backgroundColor;
    }
    
    if (row.styles.backgroundImage) {
      styles.backgroundImage = `url(${row.styles.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    
    // Box shadow styles
    if (row.styles.boxShadow && row.styles.boxShadow !== 'none') {
      styles.boxShadow = row.styles.boxShadow;
    }
    
    // Spacing styles
    if (row.styles.padding) styles.padding = row.styles.padding;
    if (row.styles.margin) styles.margin = row.styles.margin;
    if (row.styles.paddingTop) styles.paddingTop = row.styles.paddingTop;
    if (row.styles.paddingRight) styles.paddingRight = row.styles.paddingRight;
    if (row.styles.paddingBottom) styles.paddingBottom = row.styles.paddingBottom;
    if (row.styles.paddingLeft) styles.paddingLeft = row.styles.paddingLeft;
    if (row.styles.marginTop) styles.marginTop = row.styles.marginTop;
    if (row.styles.marginRight) styles.marginRight = row.styles.marginRight;
    if (row.styles.marginBottom) styles.marginBottom = row.styles.marginBottom;
    if (row.styles.marginLeft) styles.marginLeft = row.styles.marginLeft;
    
    // Width
    if (row.styles.maxWidth) styles.maxWidth = row.styles.maxWidth;
    if (row.styles.minWidth) styles.minWidth = row.styles.minWidth;
    if (row.styles.width) styles.width = row.styles.width;
  }
  
  // Custom width
  if (row.customWidth) {
    styles.width = row.customWidth;
  }
  
  return styles;
};

export const renderColumnStyles = (column: PageBuilderColumn): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (column.styles) {
    // Background styles
    if (column.styles.backgroundColor && column.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = column.styles.backgroundColor;
    }
    
    if (column.styles.backgroundImage) {
      styles.backgroundImage = `url(${column.styles.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    
    // Box shadow styles
    if (column.styles.boxShadow && column.styles.boxShadow !== 'none') {
      styles.boxShadow = column.styles.boxShadow;
    }
    
    // Spacing styles
    if (column.styles.padding) styles.padding = column.styles.padding;
    if (column.styles.margin) styles.margin = column.styles.margin;
    if (column.styles.paddingTop) styles.paddingTop = column.styles.paddingTop;
    if (column.styles.paddingRight) styles.paddingRight = column.styles.paddingRight;
    if (column.styles.paddingBottom) styles.paddingBottom = column.styles.paddingBottom;
    if (column.styles.paddingLeft) styles.paddingLeft = column.styles.paddingLeft;
    if (column.styles.marginTop) styles.marginTop = column.styles.marginTop;
    if (column.styles.marginRight) styles.marginRight = column.styles.marginRight;
    if (column.styles.marginBottom) styles.marginBottom = column.styles.marginBottom;
    if (column.styles.marginLeft) styles.marginLeft = column.styles.marginLeft;
    
    // Width
    if (column.styles.maxWidth) styles.maxWidth = column.styles.maxWidth;
    if (column.styles.minWidth) styles.minWidth = column.styles.minWidth;
    if (column.styles.width) styles.width = column.styles.width;
  }
  
  return styles;
};

export const renderElementStyles = (element: PageBuilderElement): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (element.styles) {
    // Background styles
    if (element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = element.styles.backgroundColor;
    }
    
    // Box shadow styles
    if (element.styles.boxShadow && element.styles.boxShadow !== 'none') {
      styles.boxShadow = element.styles.boxShadow;
    }
    
    // Spacing styles
    if (element.styles.padding) styles.padding = element.styles.padding;
    if (element.styles.margin) styles.margin = element.styles.margin;
    if (element.styles.paddingTop) styles.paddingTop = element.styles.paddingTop;
    if (element.styles.paddingRight) styles.paddingRight = element.styles.paddingRight;
    if (element.styles.paddingBottom) styles.paddingBottom = element.styles.paddingBottom;
    if (element.styles.paddingLeft) styles.paddingLeft = element.styles.paddingLeft;
    if (element.styles.marginTop) styles.marginTop = element.styles.marginTop;
    if (element.styles.marginRight) styles.marginRight = element.styles.marginRight;
    if (element.styles.marginBottom) styles.marginBottom = element.styles.marginBottom;
    if (element.styles.marginLeft) styles.marginLeft = element.styles.marginLeft;
    
    // Typography
    if (element.styles.color) styles.color = element.styles.color;
    if (element.styles.fontSize) styles.fontSize = element.styles.fontSize;
    if (element.styles.lineHeight) styles.lineHeight = element.styles.lineHeight;
    if (element.styles.textAlign) styles.textAlign = element.styles.textAlign;
  }
  
  return styles;
};

// Check if element has user-defined background or shadow
export const hasUserBackground = (styles?: any): boolean => {
  return !!(styles?.backgroundColor && styles.backgroundColor !== 'transparent');
};

export const hasUserShadow = (styles?: any): boolean => {
  return !!(styles?.boxShadow && styles.boxShadow !== 'none');
};
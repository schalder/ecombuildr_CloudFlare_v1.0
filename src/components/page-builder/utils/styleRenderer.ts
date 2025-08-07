import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement } from '../types';

// Universal style renderer that creates pure inline styles
export const renderSectionStyles = (section: PageBuilderSection): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (section.styles) {
    // Background with !important to override CSS classes
    if (section.styles.backgroundColor && section.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = `${section.styles.backgroundColor} !important`;
    }
    
    if (section.styles.backgroundImage) {
      styles.backgroundImage = `url(${section.styles.backgroundImage}) !important`;
      styles.backgroundSize = 'cover !important';
      styles.backgroundPosition = 'center !important';
      styles.backgroundRepeat = 'no-repeat !important';
    }
    
    // Box shadow with !important to override CSS classes
    if (section.styles.boxShadow && section.styles.boxShadow !== 'none') {
      styles.boxShadow = `${section.styles.boxShadow} !important`;
    }
    
    // Spacing with !important to override CSS classes
    if (section.styles.padding) styles.padding = `${section.styles.padding} !important`;
    if (section.styles.margin) styles.margin = `${section.styles.margin} !important`;
    if (section.styles.paddingTop) styles.paddingTop = `${section.styles.paddingTop} !important`;
    if (section.styles.paddingRight) styles.paddingRight = `${section.styles.paddingRight} !important`;
    if (section.styles.paddingBottom) styles.paddingBottom = `${section.styles.paddingBottom} !important`;
    if (section.styles.paddingLeft) styles.paddingLeft = `${section.styles.paddingLeft} !important`;
    if (section.styles.marginTop) styles.marginTop = `${section.styles.marginTop} !important`;
    if (section.styles.marginRight) styles.marginRight = `${section.styles.marginRight} !important`;
    if (section.styles.marginBottom) styles.marginBottom = `${section.styles.marginBottom} !important`;
    if (section.styles.marginLeft) styles.marginLeft = `${section.styles.marginLeft} !important`;
    
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
    // Background with !important to override CSS classes
    if (row.styles.backgroundColor && row.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = `${row.styles.backgroundColor} !important`;
    }
    
    if (row.styles.backgroundImage) {
      styles.backgroundImage = `url(${row.styles.backgroundImage}) !important`;
      styles.backgroundSize = 'cover !important';
      styles.backgroundPosition = 'center !important';
      styles.backgroundRepeat = 'no-repeat !important';
    }
    
    // Box shadow with !important to override CSS classes
    if (row.styles.boxShadow && row.styles.boxShadow !== 'none') {
      styles.boxShadow = `${row.styles.boxShadow} !important`;
    }
    
    // Spacing with !important to override CSS classes
    if (row.styles.padding) styles.padding = `${row.styles.padding} !important`;
    if (row.styles.margin) styles.margin = `${row.styles.margin} !important`;
    if (row.styles.paddingTop) styles.paddingTop = `${row.styles.paddingTop} !important`;
    if (row.styles.paddingRight) styles.paddingRight = `${row.styles.paddingRight} !important`;
    if (row.styles.paddingBottom) styles.paddingBottom = `${row.styles.paddingBottom} !important`;
    if (row.styles.paddingLeft) styles.paddingLeft = `${row.styles.paddingLeft} !important`;
    if (row.styles.marginTop) styles.marginTop = `${row.styles.marginTop} !important`;
    if (row.styles.marginRight) styles.marginRight = `${row.styles.marginRight} !important`;
    if (row.styles.marginBottom) styles.marginBottom = `${row.styles.marginBottom} !important`;
    if (row.styles.marginLeft) styles.marginLeft = `${row.styles.marginLeft} !important`;
    
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
    // Background with !important to override CSS classes
    if (column.styles.backgroundColor && column.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = `${column.styles.backgroundColor} !important`;
    }
    
    if (column.styles.backgroundImage) {
      styles.backgroundImage = `url(${column.styles.backgroundImage}) !important`;
      styles.backgroundSize = 'cover !important';
      styles.backgroundPosition = 'center !important';
      styles.backgroundRepeat = 'no-repeat !important';
    }
    
    // Box shadow with !important to override CSS classes
    if (column.styles.boxShadow && column.styles.boxShadow !== 'none') {
      styles.boxShadow = `${column.styles.boxShadow} !important`;
    }
    
    // Spacing with !important to override CSS classes
    if (column.styles.padding) styles.padding = `${column.styles.padding} !important`;
    if (column.styles.margin) styles.margin = `${column.styles.margin} !important`;
    if (column.styles.paddingTop) styles.paddingTop = `${column.styles.paddingTop} !important`;
    if (column.styles.paddingRight) styles.paddingRight = `${column.styles.paddingRight} !important`;
    if (column.styles.paddingBottom) styles.paddingBottom = `${column.styles.paddingBottom} !important`;
    if (column.styles.paddingLeft) styles.paddingLeft = `${column.styles.paddingLeft} !important`;
    if (column.styles.marginTop) styles.marginTop = `${column.styles.marginTop} !important`;
    if (column.styles.marginRight) styles.marginRight = `${column.styles.marginRight} !important`;
    if (column.styles.marginBottom) styles.marginBottom = `${column.styles.marginBottom} !important`;
    if (column.styles.marginLeft) styles.marginLeft = `${column.styles.marginLeft} !important`;
    
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
    // Background with !important to override CSS classes
    if (element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent') {
      styles.backgroundColor = `${element.styles.backgroundColor} !important`;
    }
    
    // Box shadow with !important to override CSS classes
    if (element.styles.boxShadow && element.styles.boxShadow !== 'none') {
      styles.boxShadow = `${element.styles.boxShadow} !important`;
    }
    
    // Spacing with !important to override CSS classes
    if (element.styles.padding) styles.padding = `${element.styles.padding} !important`;
    if (element.styles.margin) styles.margin = `${element.styles.margin} !important`;
    if (element.styles.paddingTop) styles.paddingTop = `${element.styles.paddingTop} !important`;
    if (element.styles.paddingRight) styles.paddingRight = `${element.styles.paddingRight} !important`;
    if (element.styles.paddingBottom) styles.paddingBottom = `${element.styles.paddingBottom} !important`;
    if (element.styles.paddingLeft) styles.paddingLeft = `${element.styles.paddingLeft} !important`;
    if (element.styles.marginTop) styles.marginTop = `${element.styles.marginTop} !important`;
    if (element.styles.marginRight) styles.marginRight = `${element.styles.marginRight} !important`;
    if (element.styles.marginBottom) styles.marginBottom = `${element.styles.marginBottom} !important`;
    if (element.styles.marginLeft) styles.marginLeft = `${element.styles.marginLeft} !important`;
    
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
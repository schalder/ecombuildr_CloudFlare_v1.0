// Utility functions for generating responsive CSS from element styles

export function generateResponsiveCSS(elementId: string, styles: any): string {
  if (!styles) return '';
  
  // Extract non-responsive base styles and responsive overrides
  const { responsive, ...nonResponsiveStyles } = styles;
  const { desktop = {}, tablet = {}, mobile = {} } = responsive || {};
  
  // Parse shorthand spacing in base styles
  const baseStyles = { ...nonResponsiveStyles };
  if (baseStyles.margin && typeof baseStyles.margin === 'string') {
    const parsed = parseShorthandSpacing(baseStyles.margin);
    if (parsed.top) baseStyles.marginTop = parsed.top;
    if (parsed.right) baseStyles.marginRight = parsed.right;
    if (parsed.bottom) baseStyles.marginBottom = parsed.bottom;
    if (parsed.left) baseStyles.marginLeft = parsed.left;
    delete baseStyles.margin;
  }
  if (baseStyles.padding && typeof baseStyles.padding === 'string') {
    const parsed = parseShorthandSpacing(baseStyles.padding);
    if (parsed.top) baseStyles.paddingTop = parsed.top;
    if (parsed.right) baseStyles.paddingRight = parsed.right;
    if (parsed.bottom) baseStyles.paddingBottom = parsed.bottom;
    if (parsed.left) baseStyles.paddingLeft = parsed.left;
    delete baseStyles.padding;
  }
  
  let css = '';
  
  // Merge base styles with desktop responsive overrides for default rule
  const { hoverColor: baseHoverColor, hoverBackgroundColor: baseHoverBg, ...restBase } = baseStyles;
  const { hoverColor: dHoverColor, hoverBackgroundColor: dHoverBg, ...restDesktop } = desktop as any;
  
  const mergedDefault = { ...restBase, ...restDesktop };
  const defaultProps = Object.entries(mergedDefault)
    .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
    .join('; ');

  // Default styles (base + desktop responsive) - Use higher specificity for storefront to prevent conflicts
  if (defaultProps) {
    css += `.storefront-page-content .element-${elementId}, .storefront .element-${elementId}, .element-${elementId} { ${defaultProps}; }`;
  }
  
  // Default hover styles (base hover + desktop hover)
  const finalHoverColor = dHoverColor || baseHoverColor;
  const finalHoverBg = dHoverBg || baseHoverBg;
  if (finalHoverColor || finalHoverBg) {
    const hoverPairs: string[] = [];
    if (finalHoverColor) hoverPairs.push(`color: ${finalHoverColor}`);
    if (finalHoverBg) hoverPairs.push(`background-color: ${finalHoverBg}`);
    css += `.storefront-page-content .element-${elementId}:hover, .storefront .element-${elementId}:hover, .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: color 0.2s ease, background-color 0.2s ease; }`;
  }
  
  // Tablet styles (768px to 1023px)
  if (Object.keys(tablet).length > 0) {
    const { hoverColor: tHoverColor, hoverBackgroundColor: tHoverBg, ...restTablet } = tablet as any;
    const tabletProps = Object.entries(restTablet)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (tabletProps || tHoverColor || tHoverBg) {
      css += `@media (min-width: 768px) and (max-width: 1023px) { `;
      if (tabletProps) css += `.storefront-page-content .element-${elementId}, .storefront .element-${elementId}, .element-${elementId} { ${tabletProps}; }`;
      if (tHoverColor || tHoverBg) {
        const hoverPairs: string[] = [];
        if (tHoverColor) hoverPairs.push(`color: ${tHoverColor}`);
        if (tHoverBg) hoverPairs.push(`background-color: ${tHoverBg}`);
        css += `.storefront-page-content .element-${elementId}:hover, .storefront .element-${elementId}:hover, .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: color 0.2s ease, background-color 0.2s ease; }`;
      }
      css += ` }`;
    }
    
    // Add forced tablet styles for builder preview
    if (tabletProps) {
      css += `.pb-tablet .storefront-page-content .element-${elementId}, .pb-tablet .storefront .element-${elementId}, .pb-tablet .element-${elementId} { ${tabletProps}; }`;
    }
    if (tHoverColor || tHoverBg) {
      const hoverPairs: string[] = [];
      if (tHoverColor) hoverPairs.push(`color: ${tHoverColor}`);
      if (tHoverBg) hoverPairs.push(`background-color: ${tHoverBg}`);
      css += `.pb-tablet .storefront-page-content .element-${elementId}:hover, .pb-tablet .storefront .element-${elementId}:hover, .pb-tablet .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: color 0.2s ease, background-color 0.2s ease; }`;
    }
  }
  
  // Mobile styles (max-width: 767px)
  if (Object.keys(mobile).length > 0) {
    const { hoverColor: mHoverColor, hoverBackgroundColor: mHoverBg, ...restMobile } = mobile as any;
    const mobileProps = Object.entries(restMobile)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (mobileProps || mHoverColor || mHoverBg) {
      css += `@media (max-width: 767px) { `;
      if (mobileProps) css += `.storefront-page-content .element-${elementId}, .storefront .element-${elementId}, .element-${elementId} { ${mobileProps}; }`;
      if (mHoverColor || mHoverBg) {
        const hoverPairs: string[] = [];
        if (mHoverColor) hoverPairs.push(`color: ${mHoverColor}`);
        if (mHoverBg) hoverPairs.push(`background-color: ${mHoverBg}`);
        css += `.storefront-page-content .element-${elementId}:hover, .storefront .element-${elementId}:hover, .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: color 0.2s ease, background-color 0.2s ease; }`;
      }
      css += ` }`;
    }
    
    // Add forced mobile styles for builder preview
    if (mobileProps) {
      css += `.pb-mobile .storefront-page-content .element-${elementId}, .pb-mobile .storefront .element-${elementId}, .pb-mobile .element-${elementId} { ${mobileProps}; }`;
    }
    if (mHoverColor || mHoverBg) {
      const hoverPairs: string[] = [];
      if (mHoverColor) hoverPairs.push(`color: ${mHoverColor}`);
      if (mHoverBg) hoverPairs.push(`background-color: ${mHoverBg}`);
      css += `.pb-mobile .storefront-page-content .element-${elementId}:hover, .pb-mobile .storefront .element-${elementId}:hover, .pb-mobile .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: color 0.2s ease, background-color 0.2s ease; }`;
    }
  }
  
  
  // Add image alignment CSS rules
  const imageAlignmentCSS = generateImageAlignmentCSS(elementId, styles);
  if (imageAlignmentCSS) {
    css += imageAlignmentCSS;
  }
  
  return css;
}

// Generate CSS for image alignment to ensure it works on live pages
function generateImageAlignmentCSS(elementId: string, styles: any): string {
  if (!styles || !styles.content) return '';
  
  const { alignment } = styles.content;
  if (!alignment) return '';
  
  let css = '';
  
  // Base alignment styles with higher specificity for storefront
  if (alignment === 'full') {
    css += `.storefront .element-${elementId}, .element-${elementId} { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }`;
  } else {
    switch (alignment) {
      case 'left':
        css += `.storefront .element-${elementId}, .element-${elementId} { margin-left: 0 !important; margin-right: auto !important; }`;
        break;
      case 'right':
        css += `.storefront .element-${elementId}, .element-${elementId} { margin-left: auto !important; margin-right: 0 !important; }`;
        break;
      case 'center':
      default:
        css += `.storefront .element-${elementId}, .element-${elementId} { margin-left: auto !important; margin-right: auto !important; }`;
        break;
    }
  }
  
  return css;
}

export function getSmartPadding(fontSize: string): string {
  const size = parseInt(fontSize.replace(/\D/g, ''));
  
  if (size <= 12) return '6px 12px';
  if (size <= 16) return '8px 16px';
  if (size <= 20) return '10px 20px';
  if (size <= 24) return '12px 24px';
  if (size <= 32) return '16px 32px';
  return '20px 40px';
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to parse shorthand margin/padding values
function parseShorthandSpacing(value: string): { top?: string; right?: string; bottom?: string; left?: string; } {
  if (!value || typeof value !== 'string') return {};
  
  const parts = value.trim().split(/\s+/);
  
  switch (parts.length) {
    case 1:
      // "10px" -> all sides
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2:
      // "10px 20px" -> top/bottom, left/right
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3:
      // "10px 20px 30px" -> top, left/right, bottom
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4:
      // "10px 20px 30px 40px" -> top, right, bottom, left
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default:
      return {};
  }
}

export function mergeResponsiveStyles(baseStyles: any, elementStyles: any, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): any {
  // Start with base styles
  let mergedStyles = { ...baseStyles };
  
  // Merge element styles (non-responsive defaults)
  if (elementStyles) {
    const { responsive, ...nonResponsiveStyles } = elementStyles;
    mergedStyles = { ...mergedStyles, ...nonResponsiveStyles };
    
    // Parse shorthand margin/padding in non-responsive styles
    if (mergedStyles.margin && typeof mergedStyles.margin === 'string') {
      const parsed = parseShorthandSpacing(mergedStyles.margin);
      if (parsed.top) mergedStyles.marginTop = parsed.top;
      if (parsed.right) mergedStyles.marginRight = parsed.right;
      if (parsed.bottom) mergedStyles.marginBottom = parsed.bottom;
      if (parsed.left) mergedStyles.marginLeft = parsed.left;
      delete mergedStyles.margin; // Remove shorthand to avoid conflicts
    }
    
    if (mergedStyles.padding && typeof mergedStyles.padding === 'string') {
      const parsed = parseShorthandSpacing(mergedStyles.padding);
      if (parsed.top) mergedStyles.paddingTop = parsed.top;
      if (parsed.right) mergedStyles.paddingRight = parsed.right;
      if (parsed.bottom) mergedStyles.paddingBottom = parsed.bottom;
      if (parsed.left) mergedStyles.paddingLeft = parsed.left;
      delete mergedStyles.padding; // Remove shorthand to avoid conflicts
    }
    
    // Enhanced responsive handling with proper inheritance
    if (responsive) {
      // Get all properties across all devices
      const allProperties = new Set([
        ...Object.keys(responsive.desktop || {}),
        ...Object.keys(responsive.tablet || {}),
        ...Object.keys(responsive.mobile || {})
      ]);
      
      // Apply inheritance logic for each property
      allProperties.forEach(property => {
        let effectiveValue;
        
        // Current device value
        const currentValue = responsive[deviceType]?.[property];
        if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
          effectiveValue = currentValue;
        }
        // Inheritance for mobile: tablet -> desktop
        else if (deviceType === 'mobile') {
          const tabletValue = responsive.tablet?.[property];
          if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
            effectiveValue = tabletValue;
          } else {
            const desktopValue = responsive.desktop?.[property];
            if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
              effectiveValue = desktopValue;
            }
          }
        }
        // Inheritance for tablet: desktop
        else if (deviceType === 'tablet') {
          const desktopValue = responsive.desktop?.[property];
          if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
            effectiveValue = desktopValue;
          }
        }
        
        if (effectiveValue !== undefined) {
          mergedStyles[property] = effectiveValue;
        }
      });
      
      // Parse shorthand margin/padding in responsive styles
      if (mergedStyles.margin && typeof mergedStyles.margin === 'string') {
        const parsed = parseShorthandSpacing(mergedStyles.margin);
        if (parsed.top) mergedStyles.marginTop = parsed.top;
        if (parsed.right) mergedStyles.marginRight = parsed.right;
        if (parsed.bottom) mergedStyles.marginBottom = parsed.bottom;
        if (parsed.left) mergedStyles.marginLeft = parsed.left;
        delete mergedStyles.margin; // Remove shorthand to avoid conflicts
      }
      
      if (mergedStyles.padding && typeof mergedStyles.padding === 'string') {
        const parsed = parseShorthandSpacing(mergedStyles.padding);
        if (parsed.top) mergedStyles.paddingTop = parsed.top;
        if (parsed.right) mergedStyles.paddingRight = parsed.right;
        if (parsed.bottom) mergedStyles.paddingBottom = parsed.bottom;
        if (parsed.left) mergedStyles.paddingLeft = parsed.left;
        delete mergedStyles.padding; // Remove shorthand to avoid conflicts
      }
    }
  }
  
  return mergedStyles;
}
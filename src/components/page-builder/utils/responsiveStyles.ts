// Utility functions for generating responsive CSS from element styles

export function generateResponsiveCSS(elementId: string, styles: any): string {
  if (!styles?.responsive) return '';
  
  const { desktop = {}, tablet = {}, mobile = {} } = styles.responsive;
  
  let css = '';
  
  // Desktop styles (default)
  if (Object.keys(desktop).length > 0) {
    const { hoverColor, hoverBackgroundColor, ...restDesktop } = desktop as any;
    const desktopProps = Object.entries(restDesktop)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');

    if (desktopProps) {
      css += `.element-${elementId} { ${desktopProps}; }`;
    }
    if (hoverColor || hoverBackgroundColor) {
      const hoverPairs: string[] = [];
      if (hoverColor) hoverPairs.push(`color: ${hoverColor} !important`);
      if (hoverBackgroundColor) hoverPairs.push(`background-color: ${hoverBackgroundColor} !important`);
      css += `.element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
    }
  }
  
  // Tablet styles (768px to 1023px)
  if (Object.keys(tablet).length > 0) {
    const { hoverColor: tHoverColor, hoverBackgroundColor: tHoverBg, ...restTablet } = tablet as any;
    const tabletProps = Object.entries(restTablet)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (tabletProps || tHoverColor || tHoverBg) {
      css += `@media (min-width: 768px) and (max-width: 1023px) { `;
      if (tabletProps) css += `.element-${elementId} { ${tabletProps}; }`;
      if (tHoverColor || tHoverBg) {
        const hoverPairs: string[] = [];
        if (tHoverColor) hoverPairs.push(`color: ${tHoverColor} !important`);
        if (tHoverBg) hoverPairs.push(`background-color: ${tHoverBg} !important`);
        css += `.element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      }
      css += ` }`;
    }
    
    // Add forced tablet styles for builder preview
    if (tabletProps) {
      css += `.pb-tablet .element-${elementId} { ${tabletProps}; }`;
    }
    if (tHoverColor || tHoverBg) {
      const hoverPairs: string[] = [];
      if (tHoverColor) hoverPairs.push(`color: ${tHoverColor} !important`);
      if (tHoverBg) hoverPairs.push(`background-color: ${tHoverBg} !important`);
      css += `.pb-tablet .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
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
      if (mobileProps) css += `.element-${elementId} { ${mobileProps}; }`;
      if (mHoverColor || mHoverBg) {
        const hoverPairs: string[] = [];
        if (mHoverColor) hoverPairs.push(`color: ${mHoverColor} !important`);
        if (mHoverBg) hoverPairs.push(`background-color: ${mHoverBg} !important`);
        css += `.element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      }
      css += ` }`;
    }
    
    // Add forced mobile styles for builder preview
    if (mobileProps) {
      css += `.pb-mobile .element-${elementId} { ${mobileProps}; }`;
    }
    if (mHoverColor || mHoverBg) {
      const hoverPairs: string[] = [];
      if (mHoverColor) hoverPairs.push(`color: ${mHoverColor} !important`);
      if (mHoverBg) hoverPairs.push(`background-color: ${mHoverBg} !important`);
      css += `.pb-mobile .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
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
    
    // If elementStyles has responsive overrides, merge them
    if (responsive) {
      let deviceStyles = responsive[deviceType] || {};
      
      // For tablet, fall back to desktop styles if no tablet-specific styles exist
      if (deviceType === 'tablet' && (!deviceStyles || Object.keys(deviceStyles).length === 0)) {
        deviceStyles = responsive.desktop || {};
      }
      
      // Deep merge: only override with explicitly defined values
      const cleanDeviceStyles = Object.fromEntries(
        Object.entries(deviceStyles).filter(([key, value]) => {
          return value !== undefined && value !== null && value !== '';
        })
      );
      
      mergedStyles = { ...mergedStyles, ...cleanDeviceStyles };
      
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
// Utility functions for generating responsive CSS from element styles

export function generateResponsiveCSS(elementId: string, styles: any): string {
  if (!styles?.responsive) return '';
  
  const { desktop = {}, mobile = {} } = styles.responsive;
  
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

export function mergeResponsiveStyles(baseStyles: any, elementStyles: any, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): any {
  // Start with base styles
  let mergedStyles = { ...baseStyles };
  
  // Merge element styles (non-responsive defaults)
  if (elementStyles) {
    const { responsive, ...nonResponsiveStyles } = elementStyles;
    mergedStyles = { ...mergedStyles, ...nonResponsiveStyles };
    
    // If elementStyles has responsive overrides, merge them
    if (responsive) {
      const key = deviceType === 'mobile' ? 'mobile' : 'desktop';
      const deviceStyles = responsive[key] || {};
      
      // Deep merge: only override with explicitly defined values
      const cleanDeviceStyles = Object.fromEntries(
        Object.entries(deviceStyles).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );
      
      mergedStyles = { ...mergedStyles, ...cleanDeviceStyles };
    }
  }
  
  return mergedStyles;
}
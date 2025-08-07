// Utility functions for generating responsive CSS from element styles

export function generateResponsiveCSS(elementId: string, styles: any): string {
  if (!styles?.responsive) return '';
  
  const { desktop = {}, mobile = {} } = styles.responsive;
  
  let css = '';
  
  // Desktop styles (default)
  if (Object.keys(desktop).length > 0) {
    const desktopProps = Object.entries(desktop)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (desktopProps) {
      css += `.element-${elementId} { ${desktopProps}; }`;
    }
  }
  
  // Mobile styles (max-width: 767px)
  if (Object.keys(mobile).length > 0) {
    const mobileProps = Object.entries(mobile)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (mobileProps) {
      css += `@media (max-width: 767px) { .element-${elementId} { ${mobileProps}; } }`;
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

export function mergeResponsiveStyles(baseStyles: any, responsiveStyles: any, deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'): any {
  if (!responsiveStyles?.responsive) return baseStyles;
  
  // We only store desktop/mobile overrides. Treat tablet as desktop for now.
  const key = deviceType === 'mobile' ? 'mobile' : 'desktop';
  const deviceStyles = responsiveStyles.responsive[key] || {};
  
  return {
    ...baseStyles,
    ...deviceStyles
  };
}
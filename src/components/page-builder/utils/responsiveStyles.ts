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
      // Force desktop styles in builder when desktop view is selected
      css += `.pb-desktop .element-${elementId} { ${desktopProps}; }`;
    }
    if (hoverColor || hoverBackgroundColor) {
      const hoverPairs: string[] = [];
      if (hoverColor) hoverPairs.push(`color: ${hoverColor} !important`);
      if (hoverBackgroundColor) hoverPairs.push(`background-color: ${hoverBackgroundColor} !important`);
      css += `.element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      css += `.pb-desktop .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
    }
  }
  
  // Tablet styles (max-width: 1023px)
  if (Object.keys(tablet).length > 0) {
    const { hoverColor: tHoverColor, hoverBackgroundColor: tHoverBg, ...restTablet } = tablet as any;
    const tabletProps = Object.entries(restTablet)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (tabletProps || tHoverColor || tHoverBg) {
      // Live site media query
      css += `@media (max-width: 1023px) { `;
      if (tabletProps) css += `.element-${elementId} { ${tabletProps}; }`;
      if (tHoverColor || tHoverBg) {
        const hoverPairs: string[] = [];
        if (tHoverColor) hoverPairs.push(`color: ${tHoverColor} !important`);
        if (tHoverBg) hoverPairs.push(`background-color: ${tHoverBg} !important`);
        css += `.element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      }
      css += ` }`;
      
      // Force tablet styles in builder when tablet view is selected
      if (tabletProps) css += `.pb-tablet .element-${elementId} { ${tabletProps}; }`;
      if (tHoverColor || tHoverBg) {
        const hoverPairs: string[] = [];
        if (tHoverColor) hoverPairs.push(`color: ${tHoverColor} !important`);
        if (tHoverBg) hoverPairs.push(`background-color: ${tHoverBg} !important`);
        css += `.pb-tablet .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      }
    }
  }
  
  // Mobile styles (max-width: 767px)
  if (Object.keys(mobile).length > 0) {
    const { hoverColor: mHoverColor, hoverBackgroundColor: mHoverBg, ...restMobile } = mobile as any;
    const mobileProps = Object.entries(restMobile)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value}`)
      .join('; ');
    
    if (mobileProps || mHoverColor || mHoverBg) {
      // Live site media query
      css += `@media (max-width: 767px) { `;
      if (mobileProps) css += `.element-${elementId} { ${mobileProps}; }`;
      if (mHoverColor || mHoverBg) {
        const hoverPairs: string[] = [];
        if (mHoverColor) hoverPairs.push(`color: ${mHoverColor} !important`);
        if (mHoverBg) hoverPairs.push(`background-color: ${mHoverBg} !important`);
        css += `.element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      }
      css += ` }`;
      
      // Force mobile styles in builder when mobile view is selected
      if (mobileProps) css += `.pb-mobile .element-${elementId} { ${mobileProps}; }`;
      if (mHoverColor || mHoverBg) {
        const hoverPairs: string[] = [];
        if (mHoverColor) hoverPairs.push(`color: ${mHoverColor} !important`);
        if (mHoverBg) hoverPairs.push(`background-color: ${mHoverBg} !important`);
        css += `.pb-mobile .element-${elementId}:hover { ${hoverPairs.join('; ')}; transition: all 0.2s ease; }`;
      }
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
      // Support tablet as a fallback between desktop and mobile
      let deviceStyles = {};
      
      if (deviceType === 'desktop') {
        deviceStyles = responsive.desktop || {};
      } else if (deviceType === 'tablet') {
        // For tablet, use tablet-specific styles, fallback to desktop, then mobile
        deviceStyles = responsive.tablet || responsive.desktop || responsive.mobile || {};
      } else if (deviceType === 'mobile') {
        deviceStyles = responsive.mobile || {};
      }
      
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
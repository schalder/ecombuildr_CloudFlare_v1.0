// Utility functions for handling background opacity correctly

/**
 * Converts a color to RGBA format with opacity
 */
export function applyColorOpacity(color: string, opacity: number = 1): string {
  if (!color || color === 'transparent') return color;
  
  // If already rgba, update alpha
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  
  // If rgb, convert to rgba
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Convert named colors to rgba (basic support)
  const namedColors: Record<string, string> = {
    'red': '255, 0, 0',
    'blue': '0, 0, 255',
    'green': '0, 128, 0',
    'yellow': '255, 255, 0',
    'black': '0, 0, 0',
    'white': '255, 255, 255',
    'gray': '128, 128, 128',
    'grey': '128, 128, 128',
  };
  
  const colorKey = color.toLowerCase();
  if (namedColors[colorKey]) {
    return `rgba(${namedColors[colorKey]}, ${opacity})`;
  }
  
  // Fallback: return original color
  return color;
}

/**
 * Applies opacity to all colors in a gradient string
 */
export function applyGradientOpacity(gradient: string, opacity: number = 1): string {
  if (!gradient || opacity === 1) return gradient;
  
  // Match color values in the gradient (hex, rgb, rgba, hsl, named colors)
  const colorRegex = /(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-zA-Z]+)/g;
  
  return gradient.replace(colorRegex, (match) => {
    // Skip non-color keywords like 'linear', 'radial', 'deg', percentages, etc.
    const skipKeywords = [
      'linear', 'radial', 'conic', 'repeating', 'deg', 'rad', 'grad', 'turn',
      'from', 'to', 'at', 'center', 'top', 'bottom', 'left', 'right',
      'circle', 'ellipse', 'closest-side', 'closest-corner', 'farthest-side', 'farthest-corner'
    ];
    
    if (skipKeywords.some(keyword => match.includes(keyword)) || 
        match.includes('%') || 
        /^\d+$/.test(match)) {
      return match;
    }
    
    return applyColorOpacity(match, opacity);
  });
}

/**
 * Generates CSS for background image with opacity using pseudo-element
 */
export function generateBackgroundImageOpacityCSS(elementId: string, imageUrl: string, opacity: number = 1): string {
  if (opacity === 1) return '';
  
  return `
    #${elementId}::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url(${imageUrl});
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: ${opacity};
      pointer-events: none;
      z-index: -1;
    }
    
    #${elementId} {
      position: relative;
    }
  `;
}
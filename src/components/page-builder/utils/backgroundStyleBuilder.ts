import { applyColorOpacity, applyGradientOpacity } from './backgroundOpacity';

export interface BackgroundConfig {
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundOpacity?: number;
  backgroundImageMode?: string;
  responsive?: {
    desktop?: any;
    mobile?: any;
  };
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export function buildBackgroundStyles(config: BackgroundConfig): React.CSSProperties {
  const {
    backgroundImage,
    backgroundColor,
    backgroundGradient,
    backgroundOpacity = 1,
    backgroundImageMode = 'full-center',
    responsive,
    deviceType = 'desktop'
  } = config;

  const deviceKey = deviceType === 'mobile' ? 'mobile' : 'desktop';
  const deviceOverrides = responsive?.[deviceKey] || {};
  
  // Helper function to extract actual color value (handles both string and object formats)
  const extractColorValue = (colorData: any): string | undefined => {
    if (typeof colorData === 'string') return colorData;
    if (colorData && typeof colorData === 'object') {
      // Handle {_type: "undefined", value: "undefined"} or {value: "#000000"} formats
      if (colorData.value && colorData.value !== 'undefined') return colorData.value;
      if (colorData.color) return colorData.color;
    }
    return undefined;
  };
  
  // Helper function to extract gradient value (handles both string and object formats)
  const extractGradientValue = (gradientData: any): string | undefined => {
    if (typeof gradientData === 'string') return gradientData;
    if (gradientData && typeof gradientData === 'object') {
      if (gradientData.value && gradientData.value !== 'undefined') return gradientData.value;
      if (gradientData.gradient) return gradientData.gradient;
    }
    return undefined;
  };
  
  // Merge with device-specific overrides, handling object formats
  const finalImage = deviceOverrides.backgroundImage ?? backgroundImage;
  const finalColor = extractColorValue(deviceOverrides.backgroundColor) ?? extractColorValue(backgroundColor);
  const finalGradient = extractGradientValue(deviceOverrides.backgroundGradient) ?? extractGradientValue(backgroundGradient);
  const finalOpacity = deviceOverrides.backgroundOpacity ?? backgroundOpacity;
  const finalMode = deviceOverrides.backgroundImageMode ?? backgroundImageMode;

  const styles: React.CSSProperties = {};

  // Check if we have a valid overlay (color or gradient)
  const hasValidOverlay = (finalGradient && finalGradient.trim() !== '') || 
                         (finalColor && finalColor !== 'transparent' && finalColor.trim() !== '');
  
  // Check if we have a valid image
  const hasValidImage = finalImage && finalImage.trim() !== '';

  // If we only have a color overlay and no image/gradient, use backgroundColor directly
  if (!hasValidImage && !finalGradient && finalColor && finalColor !== 'transparent' && finalColor.trim() !== '') {
    styles.backgroundColor = applyColorOpacity(finalColor, finalOpacity);
    return styles;
  }

  // Build layered backgrounds for complex scenarios
  const backgroundLayers: string[] = [];
  const backgroundSizes: string[] = [];
  const backgroundPositions: string[] = [];
  const backgroundRepeats: string[] = [];
  const backgroundAttachments: string[] = [];

  // Layer 1: Overlay (if exists)
  if (hasValidOverlay) {
    if (finalGradient && finalGradient.trim() !== '') {
      backgroundLayers.push(applyGradientOpacity(finalGradient, finalOpacity));
    } else if (finalColor && finalColor !== 'transparent' && finalColor.trim() !== '') {
      // Convert solid color to gradient for proper layering
      const colorWithOpacity = applyColorOpacity(finalColor, finalOpacity);
      backgroundLayers.push(`linear-gradient(${colorWithOpacity}, ${colorWithOpacity})`);
    }
    backgroundSizes.push('100% 100%');
    backgroundPositions.push('0 0');
    backgroundRepeats.push('no-repeat');
    backgroundAttachments.push('scroll');
  }

  // Layer 2: Image (if exists)
  if (hasValidImage) {
    backgroundLayers.push(`url(${finalImage})`);
    
    // Handle background modes
    switch (finalMode) {
      case 'full-center':
        backgroundSizes.push('cover');
        backgroundPositions.push('center');
        backgroundRepeats.push('no-repeat');
        backgroundAttachments.push('scroll');
        break;
      case 'parallax':
        backgroundSizes.push('cover');
        backgroundPositions.push('center');
        backgroundRepeats.push('no-repeat');
        // Parallax only on desktop to avoid mobile/tablet jank
        backgroundAttachments.push(deviceType === 'desktop' ? 'fixed' : 'scroll');
        break;
      case 'fill-width':
        backgroundSizes.push('100% auto');
        backgroundPositions.push('center top');
        backgroundRepeats.push('no-repeat');
        backgroundAttachments.push('scroll');
        break;
      case 'no-repeat':
        backgroundSizes.push('auto');
        backgroundPositions.push('center');
        backgroundRepeats.push('no-repeat');
        backgroundAttachments.push('scroll');
        break;
      case 'repeat':
        backgroundSizes.push('auto');
        backgroundPositions.push('0 0');
        backgroundRepeats.push('repeat');
        backgroundAttachments.push('scroll');
        break;
      default:
        backgroundSizes.push('cover');
        backgroundPositions.push('center');
        backgroundRepeats.push('no-repeat');
        backgroundAttachments.push('scroll');
    }
  }

  // Apply layered background properties (no shorthand)
  if (backgroundLayers.length > 0) {
    styles.backgroundImage = backgroundLayers.join(', ');
    styles.backgroundSize = backgroundSizes.join(', ');
    styles.backgroundPosition = backgroundPositions.join(', ');
    styles.backgroundRepeat = backgroundRepeats.join(', ');
    styles.backgroundAttachment = backgroundAttachments.join(', ');
  }

  return styles;
}
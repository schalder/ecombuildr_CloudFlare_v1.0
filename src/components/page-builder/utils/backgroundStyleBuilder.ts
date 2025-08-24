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

  console.log('🎨 Background Builder Input:', {
    backgroundImage,
    backgroundColor,
    backgroundGradient,
    backgroundImageMode,
    deviceType,
    responsive
  });

  // Get responsive overrides for current device (tablet uses desktop)
  const deviceKey = deviceType === 'mobile' ? 'mobile' : 'desktop';
  const deviceOverrides = responsive?.[deviceKey] || {};
  
  // Merge with device-specific overrides
  const finalImage = deviceOverrides.backgroundImage ?? backgroundImage;
  const finalColor = deviceOverrides.backgroundColor ?? backgroundColor;
  const finalGradient = deviceOverrides.backgroundGradient ?? backgroundGradient;
  const finalOpacity = deviceOverrides.backgroundOpacity ?? backgroundOpacity;
  const finalMode = deviceOverrides.backgroundImageMode ?? backgroundImageMode;

  const styles: React.CSSProperties = {};

  // Check if we have a valid overlay (color or gradient)
  const hasValidOverlay = (finalGradient && finalGradient.trim() !== '') || 
                         (finalColor && finalColor !== 'transparent' && finalColor.trim() !== '');
  
  // Check if we have a valid image
  const hasValidImage = finalImage && finalImage.trim() !== '';

  console.log('🖼️ Background Processing:', {
    finalImage,
    hasValidImage,
    finalColor,
    hasValidOverlay,
    finalMode
  });

  // Build layered backgrounds
  const backgroundLayers: string[] = [];
  const backgroundSizes: string[] = [];
  const backgroundPositions: string[] = [];
  const backgroundRepeats: string[] = [];
  const backgroundAttachments: string[] = [];

  // Layer 1: Overlay (if exists)
  if (hasValidOverlay) {
    if (finalGradient) {
      backgroundLayers.push(applyGradientOpacity(finalGradient, finalOpacity));
    } else if (finalColor) {
      backgroundLayers.push(applyColorOpacity(finalColor, finalOpacity));
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

  console.log('🎯 Final Background Styles:', styles);

  return styles;
}
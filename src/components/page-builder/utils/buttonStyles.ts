import { PageBuilderElement } from '../types';

export interface ButtonStyleConfig {
  backgroundColor?: string;
  backgroundImage?: string;
  color?: string;
  hoverBackgroundColor?: string;
  hoverBackgroundImage?: string;
  hoverColor?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  width?: string;
}

export const getButtonStyles = (
  element: PageBuilderElement, 
  deviceType: 'desktop' | 'mobile' = 'desktop'
): ButtonStyleConfig => {
  const baseStyles = element.styles || {};
  const responsiveStyles = baseStyles.responsive?.[deviceType] || {};
  
  // Simple priority: responsive overrides base
  const getStyle = (prop: string) => responsiveStyles[prop] || baseStyles[prop];
  
  return {
    backgroundColor: getStyle('backgroundColor'),
    backgroundImage: getStyle('backgroundImage'),
    color: getStyle('color') || '#ffffff',
    hoverBackgroundColor: getStyle('hoverBackgroundColor'),
    hoverBackgroundImage: getStyle('hoverBackgroundImage'),
    hoverColor: getStyle('hoverColor'),
    fontSize: getStyle('fontSize') || '16px',
    fontWeight: getStyle('fontWeight') || 'normal',
    padding: getStyle('padding') || '12px 24px',
    borderRadius: getStyle('borderRadius') || '6px',
    borderWidth: getStyle('borderWidth'),
    borderColor: getStyle('borderColor'),
    width: getStyle('width'),
  };
};

export const applyButtonStyles = (config: ButtonStyleConfig): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  // Background - gradient takes priority over solid
  if (config.backgroundImage?.includes('linear-gradient')) {
    styles.backgroundImage = config.backgroundImage;
  } else if (config.backgroundColor) {
    styles.backgroundColor = config.backgroundColor;
  } else {
    styles.backgroundColor = 'hsl(142 76% 36%)'; // Default green
  }
  
  // Text
  if (config.color) styles.color = config.color;
  if (config.fontSize) styles.fontSize = config.fontSize;
  if (config.fontWeight) styles.fontWeight = config.fontWeight;
  
  // Layout
  if (config.padding) styles.padding = config.padding;
  if (config.width) styles.width = config.width;
  
  // Border
  if (config.borderRadius) styles.borderRadius = config.borderRadius;
  if (config.borderWidth) {
    styles.borderWidth = config.borderWidth;
    styles.borderStyle = 'solid';
    styles.borderColor = config.borderColor || '#e5e7eb';
  }
  
  return styles;
};

export const generateButtonHoverCSS = (
  elementId: string, 
  config: ButtonStyleConfig
): string => {
  const hoverStyles: string[] = [];
  
  // Hover background - gradient takes priority over solid
  if (config.hoverBackgroundImage?.includes('linear-gradient')) {
    hoverStyles.push(`background-image: ${config.hoverBackgroundImage} !important`);
    hoverStyles.push(`background-color: transparent !important`);
  } else if (config.hoverBackgroundColor) {
    hoverStyles.push(`background-color: ${config.hoverBackgroundColor} !important`);
    hoverStyles.push(`background-image: none !important`);
  }
  
  // Hover text color
  if (config.hoverColor) {
    hoverStyles.push(`color: ${config.hoverColor} !important`);
  }
  
  return hoverStyles.length > 0 
    ? `.element-${elementId}:hover { ${hoverStyles.join('; ')}; }`
    : '';
};
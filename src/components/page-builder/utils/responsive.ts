// Responsive utility functions for the page builder

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Device viewport dimensions for preview
export const DEVICE_DIMENSIONS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 }
} as const;

// Breakpoint values (matching Tailwind CSS defaults)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

// Get responsive container classes based on device type
export function getResponsiveContainerClasses(deviceType: DeviceType): string {
  switch (deviceType) {
    case 'mobile':
      return 'max-w-sm mx-auto';
    case 'tablet':
      return 'max-w-3xl mx-auto';
    case 'desktop':
    default:
      return 'max-w-full';
  }
}

// Get device-specific styles for preview mode
export function getDevicePreviewStyles(deviceType: DeviceType): React.CSSProperties {
  const dimensions = DEVICE_DIMENSIONS[deviceType];
  
  if (deviceType === 'desktop') {
    return {
      width: '100%',
      height: '100%',
      minHeight: '100vh'
    };
  }
  
  return {
    width: `${dimensions.width}px`,
    maxWidth: `${dimensions.width}px`,
    minHeight: `${dimensions.height}px`,
    margin: '0 auto',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  };
}

// Check if a column should be hidden on current device
export function isColumnHidden(
  column: { responsive?: any },
  deviceType: DeviceType
): boolean {
  return column.responsive?.[deviceType]?.hidden === true;
}

// Get column classes with responsive behavior
export function getColumnResponsiveClasses(
  column: { responsive?: any },
  deviceType: DeviceType
): string {
  const baseClasses = 'w-full transition-all duration-200';
  
  if (isColumnHidden(column, deviceType)) {
    return `${baseClasses} hidden`;
  }
  
  return baseClasses;
}
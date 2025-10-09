// Device type constants
export const DEVICE_TYPES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile'
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

// Breakpoint constants
export const BREAKPOINTS = {
  DESKTOP: 1024,
  TABLET: 768
} as const;

/**
 * Get the current device type based on window width
 * @returns DeviceType - 'desktop', 'tablet', or 'mobile'
 */
export const getCurrentDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return DEVICE_TYPES.DESKTOP;
  }

  const width = window.innerWidth;

  if (width >= BREAKPOINTS.DESKTOP) {
    return DEVICE_TYPES.DESKTOP;
  } else if (width >= BREAKPOINTS.TABLET) {
    return DEVICE_TYPES.TABLET;
  } else {
    return DEVICE_TYPES.MOBILE;
  }
};

/**
 * Check if an element should be visible on the current device
 * @param visibility - Element visibility settings
 * @param currentDevice - Current device type (optional, will detect if not provided)
 * @returns boolean - Whether the element should be visible
 */
export const isElementVisible = (
  visibility?: { desktop: boolean; tablet: boolean; mobile: boolean },
  currentDevice?: DeviceType
): boolean => {
  // Default to visible if no visibility settings
  if (!visibility) {
    return true;
  }

  const device = currentDevice || getCurrentDeviceType();
  return visibility[device] ?? true;
};

/**
 * Get CSS classes for hiding elements based on device type
 * @param visibility - Element visibility settings
 * @returns string - CSS classes to apply
 */
export const getVisibilityClasses = (
  visibility?: { desktop: boolean; tablet: boolean; mobile: boolean }
): string => {
  if (!visibility) {
    return '';
  }

  const classes: string[] = [];

  if (!visibility.desktop) {
    classes.push('hidden lg:block');
  }
  if (!visibility.tablet) {
    classes.push('hidden md:block lg:hidden');
  }
  if (!visibility.mobile) {
    classes.push('block md:hidden');
  }

  return classes.join(' ');
};

/**
 * Get inline styles for hiding elements based on device type
 * @param visibility - Element visibility settings
 * @param currentDevice - Current device type (optional, will detect if not provided)
 * @returns React.CSSProperties - Styles to apply
 */
export const getVisibilityStyles = (
  visibility?: { desktop: boolean; tablet: boolean; mobile: boolean },
  currentDevice?: DeviceType
): React.CSSProperties => {
  const device = currentDevice || getCurrentDeviceType();
  const isVisible = isElementVisible(visibility, device);

  return {
    display: isVisible ? 'block' : 'none'
  };
};

/**
 * Hook to get current device type with resize listener
 * @returns DeviceType - Current device type
 */
export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(getCurrentDeviceType);

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType(getCurrentDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

// Import React for the hook
import React from 'react';

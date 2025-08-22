// Development-only logger utility
// Gates debug/info logs to development environment only

const isDevelopment = import.meta.env.DEV;

export const logger = {
  // Always show errors and warnings
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  
  // Gate debug and info logs to development only
  debug: isDevelopment ? console.debug.bind(console) : () => {},
  info: isDevelopment ? console.info.bind(console) : () => {},
  log: isDevelopment ? console.log.bind(console) : () => {},
};

// Helper to check if we're in a dashboard/builder route
export const isDashboardRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.includes('/dashboard') || path.includes('/builder') || path.includes('/page-builder');
};

// Helper to check if tracking should be disabled
export const shouldDisableTracking = (): boolean => {
  return isDashboardRoute() || import.meta.env.VITE_DISABLE_TRACKING === 'true';
};
import { useEffect } from 'react';

/**
 * Hook to defer initialization of non-critical features until after initial render
 */
export const useDeferredInit = (callback: () => void | (() => void), delay = 0) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback);
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(callback, 16); // ~1 frame
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [callback, delay]);
};
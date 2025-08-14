import { useEffect } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';

interface PixelManagerProps {
  children: React.ReactNode;
}

export const PixelManager: React.FC<PixelManagerProps> = ({ children }) => {
  const { trackPageView } = usePixelTracking();

  // Track page view on mount and route changes
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Track page view on location change (for SPAs)
  useEffect(() => {
    const handleLocationChange = () => {
      // Small delay to ensure the page has updated
      setTimeout(() => {
        trackPageView();
      }, 100);
    };

    // Listen to history changes (back/forward)
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen to pushState and replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return <>{children}</>;
};
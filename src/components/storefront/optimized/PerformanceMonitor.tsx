import { useEffect } from 'react';

interface PerformanceMonitorProps {
  page: string;
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  page, 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitor LCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`[${page}] LCP: ${entry.startTime.toFixed(2)}ms`);
        }
        if (entry.entryType === 'first-input') {
          console.log(`[${page}] FID: ${(entry as any).processingStart - entry.startTime}ms`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    } catch (e) {
      // Fallback for older browsers
      console.log(`[${page}] Performance monitoring not supported`);
    }

    // Log bundle analysis
    const logBundleInfo = () => {
      const scripts = document.querySelectorAll('script[src]');
      console.log(`[${page}] Script count: ${scripts.length}`);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        console.log(`[${page}] Connection: ${connection.effectiveType}, RTT: ${connection.rtt}ms`);
      }
    };

    // Run after page load
    if (document.readyState === 'complete') {
      logBundleInfo();
    } else {
      window.addEventListener('load', logBundleInfo, { once: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [page, enabled]);

  return null;
};
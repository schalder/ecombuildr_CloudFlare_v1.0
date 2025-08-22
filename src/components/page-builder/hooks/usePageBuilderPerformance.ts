import { useCallback, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentMounts: number;
  componentUnmounts: number;
  lastRenderTime: number;
}

export const usePageBuilderPerformance = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    componentMounts: 0,
    componentUnmounts: 0,
    lastRenderTime: 0,
  });

  const renderStartTime = useRef<number>(0);

  // Track component lifecycle
  useEffect(() => {
    metricsRef.current.componentMounts += 1;
    

    return () => {
      metricsRef.current.componentUnmounts += 1;
      
    };
  }, [componentName]);

  // Track render performance
  const trackRenderStart = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const trackRenderEnd = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      metricsRef.current.lastRenderTime = renderTime;
      
      if (renderTime > 16) { // > 1 frame at 60fps
        console.warn(`🐌 ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
      
      renderStartTime.current = 0;
    }
  }, [componentName]);

  // Track state changes that might cause re-renders
  const trackStateChange = useCallback((stateName: string, oldValue: any, newValue: any) => {
    if (oldValue !== newValue) {
      
    }
  }, [componentName]);

  return {
    trackRenderStart,
    trackRenderEnd,
    trackStateChange,
    metrics: metricsRef.current,
  };
};
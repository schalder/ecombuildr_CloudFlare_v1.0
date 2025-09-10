import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

let isWebVitalsInitialized = false;

export const useWebVitals = (websiteId?: string, funnelId?: string) => {
  useEffect(() => {
    if (isWebVitalsInitialized) return;
    
    // Only track in production and on actual domains
    if (process.env.NODE_ENV !== 'production') return;
    if (window.location.hostname === 'localhost') return;
    
    const trackMetric = async (metric: WebVitalsMetric) => {
      try {
        // Log to console for now since we don't have web_vitals table yet
        console.log('Web Vitals Metric:', {
          website_id: websiteId,
          funnel_id: funnelId,
          metric_name: metric.name,
          metric_value: metric.value,
          url: window.location.href
        });
      } catch (error) {
        console.warn('Failed to track web vitals:', error);
      }
    };

    // Dynamically import web-vitals to avoid bundling in development
    import('web-vitals').then((webVitals) => {
      if (webVitals.onCLS) webVitals.onCLS(trackMetric);
      if (webVitals.onINP) webVitals.onINP(trackMetric);
      if (webVitals.onFCP) webVitals.onFCP(trackMetric);
      if (webVitals.onLCP) webVitals.onLCP(trackMetric);
      if (webVitals.onTTFB) webVitals.onTTFB(trackMetric);
      
      isWebVitalsInitialized = true;
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
  }, [websiteId, funnelId]);
};
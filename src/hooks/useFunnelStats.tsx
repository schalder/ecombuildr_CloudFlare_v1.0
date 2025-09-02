import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FunnelAnalytics {
  totalPageViews: number;
  totalUniqueVisitors: number;
  averageConversionRate: number;
  stepAnalytics: Array<{ 
    step_id: string;
    step_title: string;
    step_type: string;
    page_views: number; 
    unique_visitors: number;
    conversion_rate: number;
  }>;
  trafficSources: Array<{ source: string; visitors: number; }>;
  conversionFunnel: Array<{
    step: string;
    visitors: number;
    conversions: number;
    dropoff_rate: number;
  }>;
}

interface FunnelStats {
  totalSteps: number;
  publishedSteps: number;
  totalOrders: number;
  totalRevenue: number;
  analytics: FunnelAnalytics;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  funnelUrl: string;
}

interface FunnelStatsHookReturn {
  stats: FunnelStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFunnelStats(funnelId: string): FunnelStatsHookReturn {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get funnel basic info
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', funnelId)
        .single();

      if (funnelError) throw funnelError;

      // Get funnel steps count
      const { data: steps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('id, title, step_type, is_published, slug')
        .eq('funnel_id', funnelId);

      if (stepsError) throw stepsError;

      // Get orders filtered by funnel
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total')
        .eq('funnel_id', funnelId);

      if (ordersError && ordersError.code !== 'PGRST116') throw ordersError;

      // Get pixel events for analytics using funnel_id in event_data
      const { data: pixelEvents } = await supabase
        .from('pixel_events')
        .select('event_type, page_url, session_id, referrer, event_data, created_at')
        .contains('event_data', { funnel_id: funnelId })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      console.log('Fetched pixel events for funnel:', pixelEvents?.length, 'funnel_id:', funnelId);

      // Process pixel events for analytics
      const totalPageViews = pixelEvents?.filter(e => e.event_type === 'PageView').length || 0;
      const totalUniqueVisitors = new Set(pixelEvents?.filter(e => e.event_type === 'PageView').map(e => e.session_id)).size;
      
      console.log('Total page views:', totalPageViews, 'Total unique visitors:', totalUniqueVisitors);
      
      // Step analytics with accurate conversion tracking using step slug
      const stepAnalytics = (steps || []).map((step, index) => {
        // Match events by step slug for more reliable tracking
        const stepEvents = pixelEvents?.filter(e => 
          e.event_type === 'PageView' && 
          ((e.event_data as any)?.step_slug === step.slug || e.page_url?.includes(`/${step.slug}`))
        ) || [];
        
        const stepViews = stepEvents.length;
        const stepUniqueVisitors = new Set(stepEvents.map(e => e.session_id)).size;
        
        // Calculate conversions: next step views for progression, total orders for final step
        let stepConversions = 0;
        if (index === steps.length - 1) {
          // Final step: conversions are actual orders
          stepConversions = orders?.length || 0;
        } else {
          // Other steps: conversions are unique visitors to the next step
          const nextStep = steps[index + 1];
          const nextStepEvents = pixelEvents?.filter(e => 
            e.event_type === 'PageView' && 
            ((e.event_data as any)?.step_slug === nextStep.slug || e.page_url?.includes(`/${nextStep.slug}`))
          ) || [];
          stepConversions = new Set(nextStepEvents.map(e => e.session_id)).size;
        }
        
        const conversionRate = stepUniqueVisitors > 0 ? (stepConversions / stepUniqueVisitors) * 100 : 0;

        console.log(`Step ${step.title}: ${stepViews} views, ${stepUniqueVisitors} visitors, ${conversionRate.toFixed(1)}% conversion`);

        return {
          step_id: step.id,
          step_title: step.title,
          step_type: step.step_type,
          page_views: stepViews,
          unique_visitors: stepUniqueVisitors,
          conversion_rate: Math.round(conversionRate * 100) / 100
        };
      });

      // Traffic sources analysis - normalize referrer domains
      const sourceStats = pixelEvents?.reduce((acc, event) => {
        let source = 'direct';
        if (event.referrer && event.referrer !== '') {
          try {
            const url = new URL(event.referrer);
            source = url.hostname.replace('www.', '');
          } catch {
            source = event.referrer;
          }
        }
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const trafficSources = Object.entries(sourceStats)
        .map(([source, visitors]) => ({ source, visitors }))
        .sort((a, b) => b.visitors - a.visitors);


      // Conversion funnel analysis
      const conversionFunnel = (steps || []).map((step, index) => {
        const stepData = stepAnalytics[index];
        const stepViews = stepData?.unique_visitors || 0;
        const stepConversions = Math.round((stepData?.conversion_rate || 0) * stepViews / 100);
        const dropoffRate = stepViews > 0 ? ((stepViews - stepConversions) / stepViews) * 100 : 0;

        return {
          step: step.title,
          visitors: stepViews,
          conversions: stepConversions,
          dropoff_rate: Math.round(dropoffRate * 100) / 100
        };
      });

      // Calculate basic stats
      const totalSteps = steps?.length || 0;
      const publishedSteps = steps?.filter(s => s.is_published).length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Overall conversion rate
      const averageConversionRate = totalUniqueVisitors > 0 ? (totalOrders / totalUniqueVisitors) * 100 : 0;

      setStats({
        totalSteps,
        publishedSteps,
        totalOrders,
        totalRevenue,
        analytics: {
          totalPageViews,
          totalUniqueVisitors,
          averageConversionRate: Math.round(averageConversionRate * 100) / 100,
          stepAnalytics,
          trafficSources,
          conversionFunnel,
        },
        isActive: funnel.is_active,
        isPublished: funnel.is_published,
        createdAt: funnel.created_at,
        updatedAt: funnel.updated_at,
        funnelUrl: `https://lovable.app/funnel/${funnel.slug}`,
      });

    } catch (err: any) {
      console.error('Error fetching funnel stats:', err);
      setError(err.message || 'Failed to fetch funnel statistics');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch funnel statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (funnelId) {
      fetchStats();
    }
  }, [funnelId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
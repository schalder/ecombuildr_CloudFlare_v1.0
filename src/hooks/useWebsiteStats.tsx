import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebsiteAnalytics {
  totalPageViews: number;
  totalUniqueVisitors: number;
  averageBounceRate: number;
  averageSessionDuration: number;
  topPages: Array<{ path: string; views: number; title: string; }>;
  trafficSources: Array<{ source: string; visitors: number; }>;
  deviceBreakdown: Array<{ device: string; visitors: number; }>;
  conversionRate: number;
  pagePerformance: Array<{ 
    path: string; 
    title: string;
    views: number; 
    bounce_rate: number; 
    avg_time: number;
  }>;
}

interface WebsiteStats {
  website: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    url: string;
    is_active: boolean;
    is_published: boolean;
    created_at: string;
    updated_at: string;
  };
  metrics: {
    pages: number;
    form_submissions: number;
    newsletter_signups: number;
  };
  revenue: {
    total_orders: number;
    total_revenue: number;
  };
  analytics: WebsiteAnalytics;
}

interface WebsiteStatsHookReturn {
  stats: WebsiteStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWebsiteStats(websiteId: string): WebsiteStatsHookReturn {
  const [stats, setStats] = useState<WebsiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch website data and basic counts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const [websiteRes, pagesRes, ordersRes, pixelEventsRes] = await Promise.all([
        supabase.from('websites').select('*').eq('id', websiteId).single(),
        supabase.from('website_pages').select('id').eq('website_id', websiteId).eq('is_published', true),
        supabase.from('orders').select('id, total, status, created_at').eq('website_id', websiteId),
        supabase.from('pixel_events')
          .select('*')
          .eq('website_id', websiteId)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
      ]);

      if (websiteRes.error || !websiteRes.data) {
        throw new Error(websiteRes.error?.message || 'Website not found');
      }

      const website = websiteRes.data;
      const pages = pagesRes.data || [];
      const orders = ordersRes.data || [];
      const pixelEvents = pixelEventsRes.data || [];

      // Process pixel events analytics (last 30 days)
      const pageViewEvents = pixelEvents.filter(e => e.event_type === 'PageView' || e.event_type === 'page_view');
      const totalPageViews = pageViewEvents.length;
      
      // Calculate unique visitors from unique session_ids
      const uniqueSessions = new Set(pageViewEvents.map(e => e.session_id).filter(Boolean));
      const totalUniqueVisitors = uniqueSessions.size;
      
      // Calculate bounce rate (sessions with only 1 page view)
      const sessionViewCounts = pageViewEvents.reduce((acc: Record<string, number>, event) => {
        const sessionId = event.session_id || 'unknown';
        acc[sessionId] = (acc[sessionId] || 0) + 1;
        return acc;
      }, {});
      const singlePageSessions = Object.values(sessionViewCounts).filter(count => count === 1).length;
      const avgBounceRate = totalUniqueVisitors > 0 ? (singlePageSessions / totalUniqueVisitors) * 100 : 0;
      
      // Estimate session duration (simplified)
      const avgSessionDuration = 120; // Default 2 minutes

      // Group by referrer for traffic sources
      const trafficSources = pageViewEvents.reduce((acc: Record<string, number>, event) => {
        let source = 'Direct';
        if (event.referrer && event.referrer.includes('google')) source = 'Google';
        else if (event.referrer && event.referrer.includes('facebook')) source = 'Facebook';
        else if (event.utm_source) source = event.utm_source;
        else if (event.referrer) source = 'Other';
        
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Device breakdown from user agents
      const deviceBreakdown = pageViewEvents.reduce((acc: Record<string, number>, event) => {
        let device = 'desktop';
        const userAgent = event.user_agent || '';
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) device = 'mobile';
        else if (/Tablet|iPad/.test(userAgent)) device = 'tablet';
        
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {});

      // Top pages from page URLs
      const pageCounts = pageViewEvents.reduce((acc: Record<string, number>, event) => {
        const url = new URL(event.page_url || window.location.href);
        const path = url.pathname;
        acc[path] = (acc[path] || 0) + 1;
        return acc;
      }, {});
      
      const topPages = Object.entries(pageCounts)
        .map(([path, views]) => ({
          path,
          views,
          title: path === '/' ? 'Homepage' : path.replace('/', '').replace('-', ' ')
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Page performance
      const pagePerformance = topPages.map(page => ({
        path: page.path,
        title: page.title,
        views: page.views,
        bounce_rate: avgBounceRate,
        avg_time: avgSessionDuration,
      }));

      // Get store and domain info for URL construction
      const [storeRes, domainRes] = await Promise.all([
        supabase
          .from('stores')
          .select('slug, settings')
          .eq('id', website.store_id)
          .single(),
        supabase
          .from('domain_connections')
          .select(`
            custom_domains (domain)
          `)
          .eq('content_type', 'website')
          .eq('content_id', websiteId)
          .maybeSingle()
      ]);

      const store = storeRes.data;
      
      // Build website URL properly
      let websiteUrl = '';
      const customDomain = (domainRes.data?.custom_domains as any)?.domain;
      
      if (customDomain) {
        websiteUrl = `https://${customDomain}`;
      } else if (website.domain) {
        websiteUrl = `https://${website.domain}`;
      } else if (store?.slug && website.slug) {
        websiteUrl = `https://${website.slug}.${store.slug}.lovable.app`;
      } else {
        websiteUrl = `https://${website.slug}.demo-store.app`;
      }

      const stats: WebsiteStats = {
        website: {
          id: website.id,
          name: website.name,
          slug: website.slug,
          description: website.description,
          url: websiteUrl,
          is_active: website.is_active,
          is_published: website.is_published,
          created_at: website.created_at,
          updated_at: website.updated_at,
        },
        metrics: {
          pages: pages.length,
          form_submissions: 0, // Will be implemented later when form_submissions have website_id
          newsletter_signups: 0, // Will be implemented later when newsletter_subscribers have website_id  
        },
        revenue: {
          total_orders: orders.length,
          total_revenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
        },
        analytics: {
          totalPageViews,
          totalUniqueVisitors,
          averageBounceRate: Math.round(avgBounceRate * 100) / 100,
          averageSessionDuration: Math.round(avgSessionDuration),
          topPages,
          trafficSources: Object.entries(trafficSources)
            .map(([source, visitors]) => ({ source, visitors }))
            .sort((a, b) => b.visitors - a.visitors),
          deviceBreakdown: Object.entries(deviceBreakdown)
            .map(([device, visitors]) => ({ device, visitors })),
          conversionRate: totalUniqueVisitors > 0 ? Math.round((orders.length / totalUniqueVisitors) * 10000) / 100 : 0,
          pagePerformance,
        },
      };

      setStats(stats);

    } catch (err: any) {
      console.error('Error fetching website stats:', err);
      setError(err.message || 'Failed to fetch website statistics');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch website statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (websiteId) {
      fetchStats();
    }
  }, [websiteId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
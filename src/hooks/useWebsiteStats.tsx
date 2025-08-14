import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebsiteAnalytics {
  totalPageViews: number;
  totalUniqueVisitors: number;
  averageBounceRate: number;
  averageSessionDuration: number;
  topPages: Array<{ page_id: string | null; page_views: number; unique_visitors: number; }>;
  trafficSources: Array<{ source: string; visitors: number; }>;
  deviceBreakdown: Array<{ device: string; visitors: number; }>;
  conversionRate: number;
  pagePerformance: Array<{ 
    pageType: string; 
    pageViews: number; 
    uniqueVisitors: number; 
    bounceRate: number; 
  }>;
}

interface WebsiteStats {
  // Basic website metrics
  totalPages: number;
  publishedPages: number;
  totalFormSubmissions: number;
  totalNewsletterSignups: number;
  
  // Revenue metrics (orders that came through this website)
  totalOrders: number;
  totalRevenue: number;
  
  // Advanced analytics
  analytics: WebsiteAnalytics;
  
  // Website status
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  websiteUrl: string;
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

      // Get website basic info
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (websiteError) throw websiteError;

      // Get website pages count
      const { data: pages, error: pagesError } = await supabase
        .from('website_pages')
        .select('id, is_published')
        .eq('website_id', websiteId);

      if (pagesError) throw pagesError;

      // Get form submissions count
      const { data: formSubmissions, error: formError } = await supabase
        .from('form_submissions')
        .select('id')
        .eq('store_id', website.store_id);

      if (formError && formError.code !== 'PGRST116') throw formError;

      // Get newsletter signups count
      const { data: newsletters, error: newsletterError } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('store_id', website.store_id)
        .eq('status', 'active');

      if (newsletterError && newsletterError.code !== 'PGRST116') throw newsletterError;

      // Get orders (basic count and revenue)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', website.store_id);

      if (ordersError && ordersError.code !== 'PGRST116') throw ordersError;

      // Get store info for domain construction
      const { data: store } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', website.store_id)
        .single();

      // Get connected domain info
      const { data: domainConnection } = await supabase
        .from('domain_connections')
        .select(`
          custom_domains (domain)
        `)
        .eq('content_type', 'website')
        .eq('content_id', websiteId)
        .maybeSingle();

      // Build proper website URL
      const customDomain = (domainConnection?.custom_domains as any)?.domain;
      const websiteUrl = customDomain 
        ? `https://${customDomain}` 
        : `https://${website.slug}.${store?.slug}.lovable.app`;

      // Get website analytics data
      const { data: analyticsData } = await supabase
        .from('website_analytics')
        .select('*')
        .eq('website_id', websiteId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 30 days

      // Process analytics data
      const totalPageViews = analyticsData?.reduce((sum, row) => sum + (row.page_views || 0), 0) || 0;
      const totalUniqueVisitors = analyticsData?.reduce((sum, row) => sum + (row.unique_visitors || 0), 0) || 0;
      const averageBounceRate = analyticsData?.length > 0 
        ? analyticsData.reduce((sum, row) => sum + (row.bounce_rate || 0), 0) / analyticsData.length 
        : 0;
      const averageSessionDuration = analyticsData?.length > 0 
        ? analyticsData.reduce((sum, row) => sum + (row.avg_session_duration || 0), 0) / analyticsData.length 
        : 0;
      
      // Top pages
      const pageStats = analyticsData?.reduce((acc, row) => {
        const key = row.page_id || 'homepage';
        if (!acc[key]) {
          acc[key] = { page_id: row.page_id, page_views: 0, unique_visitors: 0 };
        }
        acc[key].page_views += row.page_views || 0;
        acc[key].unique_visitors += row.unique_visitors || 0;
        return acc;
      }, {} as Record<string, any>) || {};
      
      const topPages = Object.values(pageStats)
        .sort((a: any, b: any) => b.page_views - a.page_views)
        .slice(0, 5);

      // Traffic sources
      const sourceStats = analyticsData?.reduce((acc, row) => {
        const source = row.referrer_source || 'direct';
        acc[source] = (acc[source] || 0) + (row.unique_visitors || 0);
        return acc;
      }, {} as Record<string, number>) || {};
      
      const trafficSources = Object.entries(sourceStats)
        .map(([source, visitors]) => ({ source, visitors }))
        .sort((a, b) => b.visitors - a.visitors);

      // Device breakdown
      const deviceStats = analyticsData?.reduce((acc, row) => {
        const device = row.device_type || 'desktop';
        acc[device] = (acc[device] || 0) + (row.unique_visitors || 0);
        return acc;
      }, {} as Record<string, number>) || {};
      
      const deviceBreakdown = Object.entries(deviceStats)
        .map(([device, visitors]) => ({ device, visitors }));

      // Page performance by type (simplified based on available data)
      const pageTypeStats = analyticsData?.reduce((acc, row) => {
        // Use page_id to determine page type (simplified categorization)
        let pageType = 'homepage';
        if (row.page_id && row.page_id !== null) {
          // If we have a page_id, it's a custom page
          pageType = 'custom pages';
        }
        
        if (!acc[pageType]) {
          acc[pageType] = { pageViews: 0, uniqueVisitors: 0, bounceRateSum: 0, count: 0 };
        }
        acc[pageType].pageViews += row.page_views || 0;
        acc[pageType].uniqueVisitors += row.unique_visitors || 0;
        acc[pageType].bounceRateSum += row.bounce_rate || 0;
        acc[pageType].count += 1;
        return acc;
      }, {} as Record<string, any>) || {};
      
      const pagePerformance = Object.entries(pageTypeStats).map(([pageType, stats]) => ({
        pageType,
        pageViews: stats.pageViews,
        uniqueVisitors: stats.uniqueVisitors,
        bounceRate: Math.round((stats.bounceRateSum / stats.count) * 100) / 100,
      })).sort((a, b) => b.pageViews - a.pageViews);

      // Calculate basic stats first
      const totalPages = pages?.length || 0;
      const publishedPages = pages?.filter(p => p.is_published).length || 0;
      const totalFormSubmissions = formSubmissions?.length || 0;
      const totalNewsletterSignups = newsletters?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Conversion rate (orders / unique visitors * 100)
      const conversionRate = totalUniqueVisitors > 0 ? (totalOrders / totalUniqueVisitors) * 100 : 0;

      setStats({
        totalPages,
        publishedPages,
        totalFormSubmissions,
        totalNewsletterSignups,
        totalOrders,
        totalRevenue,
        analytics: {
          totalPageViews,
          totalUniqueVisitors,
          averageBounceRate: Math.round(averageBounceRate * 100) / 100,
          averageSessionDuration: Math.round(averageSessionDuration),
          topPages,
          trafficSources,
          deviceBreakdown,
          conversionRate: Math.round(conversionRate * 100) / 100,
          pagePerformance,
        },
        isActive: website.is_active,
        isPublished: website.is_published,
        createdAt: website.created_at,
        updatedAt: website.updated_at,
        websiteUrl,
      });

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
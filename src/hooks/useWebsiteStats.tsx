import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebsiteStats {
  // Basic website metrics
  totalPages: number;
  publishedPages: number;
  totalFormSubmissions: number;
  totalNewsletterSignups: number;
  
  // Revenue metrics (orders that came through this website)
  totalOrders: number;
  totalRevenue: number;
  
  // Website status
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  connectedDomain?: string;
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

      // Get connected domain info
      const { data: domainConnection } = await supabase
        .from('domain_connections')
        .select(`
          custom_domains (domain)
        `)
        .eq('content_type', 'website')
        .eq('content_id', websiteId)
        .maybeSingle();

      const connectedDomain = (domainConnection?.custom_domains as any)?.domain || website.canonical_domain;

      // Calculate stats
      const totalPages = pages?.length || 0;
      const publishedPages = pages?.filter(p => p.is_published).length || 0;
      const totalFormSubmissions = formSubmissions?.length || 0;
      const totalNewsletterSignups = newsletters?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      setStats({
        totalPages,
        publishedPages,
        totalFormSubmissions,
        totalNewsletterSignups,
        totalOrders,
        totalRevenue,
        isActive: website.is_active,
        isPublished: website.is_published,
        createdAt: website.created_at,
        updatedAt: website.updated_at,
        connectedDomain,
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
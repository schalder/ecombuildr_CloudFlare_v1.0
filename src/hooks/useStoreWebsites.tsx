import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Website {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  connected_domain: string | null;
  facebook_pixel_id: string | null;
  is_published: boolean;
  is_active: boolean;
}

export const useStoreWebsites = (storeId: string) => {
  const { user } = useAuth();

  const {
    data: websites = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['storeWebsites', storeId],
    queryFn: async () => {
      if (!user || !storeId) return [];

      // First get websites
      const { data: websiteData, error: websiteError } = await supabase
        .from('websites')
        .select('id, name, slug, domain, facebook_pixel_id, is_published, is_active')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at');

      if (websiteError) throw websiteError;

      // Get domain connections for each website
      const websiteIds = (websiteData || []).map(w => w.id);
      
      if (websiteIds.length === 0) return [];

      const { data: domainConnections, error: domainError } = await supabase
        .from('domain_connections')
        .select(`
          content_id,
          custom_domains!inner(domain, is_verified, dns_configured)
        `)
        .eq('content_type', 'website')
        .in('content_id', websiteIds)
        .eq('custom_domains.is_verified', true)
        .eq('custom_domains.dns_configured', true);

      if (domainError) throw domainError;

      // Create a map of website_id to connected_domain
      const domainMap: Record<string, string> = {};
      (domainConnections || []).forEach(connection => {
        const domain = (connection.custom_domains as any)?.domain;
        if (domain) {
          domainMap[connection.content_id] = domain;
        }
      });

      // Transform the data to include connected_domain
      const websites = (websiteData || []).map(website => ({
        ...website,
        connected_domain: domainMap[website.id] || null
      }));

      
      return websites as Website[];
    },
    enabled: !!(user && storeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  return {
    websites,
    loading,
    error,
    refetch
  };
};

// Export the interface for external use
export type { Website };
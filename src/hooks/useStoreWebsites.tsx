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

      // Then get connected domains for this store
      const { data: domainData, error: domainError } = await supabase
        .from('custom_domains')
        .select('domain')
        .eq('store_id', storeId)
        .eq('is_verified', true)
        .eq('dns_configured', true)
        .limit(1);

      if (domainError) throw domainError;

      // Transform the data to include connected_domain
      const websites = (websiteData || []).map(website => ({
        ...website,
        connected_domain: domainData?.[0]?.domain || null
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
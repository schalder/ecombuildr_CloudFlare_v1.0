import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Funnel {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  canonical_domain: string | null;
  is_published: boolean;
  is_active: boolean;
}

export const useStoreFunnels = (storeId: string) => {
  const { user } = useAuth();

  const {
    data: funnels = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['storeFunnels', storeId],
    queryFn: async () => {
      if (!user || !storeId) return [];

      const { data, error } = await supabase
        .from('funnels')
        .select('id, name, slug, domain, canonical_domain, is_published, is_active')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return (data || []) as Funnel[];
    },
    enabled: !!(user && storeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  return {
    funnels,
    loading,
    error,
    refetch
  };
};

// Export the interface for external use
export type { Funnel };
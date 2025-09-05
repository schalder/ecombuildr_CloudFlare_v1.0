import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Collection {
  id: string;
  website_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_published: boolean;
  show_on_products_page: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useCollections = (websiteId?: string) => {
  const { user } = useAuth();

  const {
    data: collections = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['collections', websiteId],
    queryFn: async () => {
      if (!user) return [];

      let query = (supabase as any).from('collections').select('*');
      
      if (websiteId) {
        query = query.eq('website_id', websiteId);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Collection[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  return {
    collections,
    loading,
    error,
    refetch
  };
};

export type { Collection };
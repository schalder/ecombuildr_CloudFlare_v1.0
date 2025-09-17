import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from './useUserStore';
import { useStore } from '@/contexts/StoreContext';

/**
 * Hook to fetch and manage course currency settings
 */
export const useCourseCurrency = () => {
  const { store: userStore } = useUserStore();
  const { store: publicStore } = useStore();

  const activeStoreId = userStore?.id || publicStore?.id || null;

  const { data: currency = 'USD', isLoading } = useQuery({
    queryKey: ['course-currency', activeStoreId],
    queryFn: async () => {
      if (!activeStoreId) return 'USD';
      
      const { data, error } = await supabase
        .from('stores')
        .select('course_currency')
        .eq('id', activeStoreId)
        .single();

      if (error) {
        console.error('Error fetching course currency:', error);
        return 'USD';
      }
      
      return data?.course_currency || 'USD';
    },
    enabled: !!activeStoreId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    currency,
    isLoading,
  };
};
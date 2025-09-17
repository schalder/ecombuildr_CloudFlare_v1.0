import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from './useUserStore';

/**
 * Hook to fetch and manage course currency settings
 */
export const useCourseCurrency = () => {
  const { store: userStore } = useUserStore();

  const { data: currency = 'USD', isLoading } = useQuery({
    queryKey: ['course-currency', userStore?.id],
    queryFn: async () => {
      if (!userStore?.id) return 'USD';
      
      const { data, error } = await supabase
        .from('stores')
        .select('course_currency')
        .eq('id', userStore.id)
        .single();

      if (error) {
        console.error('Error fetching course currency:', error);
        return 'USD';
      }
      
      return data?.course_currency || 'USD';
    },
    enabled: !!userStore?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    currency,
    isLoading,
  };
};
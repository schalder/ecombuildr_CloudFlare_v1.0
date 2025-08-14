import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Funnel {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_published: boolean;
  is_active: boolean;
}

export const useStoreFunnels = (storeId: string) => {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFunnels = async () => {
    if (!user || !storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('funnels')
        .select('id, name, slug, domain, is_published, is_active')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;

      setFunnels(data || []);
    } catch (err: any) {
      console.error('Failed to fetch funnels:', err);
      setError(err.message || 'Failed to fetch funnels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnels();

    // Set up real-time subscription for funnels updates
    if (user && storeId) {
      const channel = supabase
        .channel('funnels-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'funnels',
            filter: `store_id=eq.${storeId}`
          },
          (payload) => {
            console.log('Funnels real-time update:', payload);
            fetchFunnels(); // Refetch to maintain filter and order
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, storeId]);

  return { funnels, loading, error, refetch: fetchFunnels };
};
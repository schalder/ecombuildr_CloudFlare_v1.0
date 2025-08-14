import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Website {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  facebook_pixel_id: string | null;
  is_published: boolean;
  is_active: boolean;
}

export const useStoreWebsites = (storeId: string) => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWebsites = async () => {
    if (!user || !storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('websites')
        .select('id, name, slug, domain, facebook_pixel_id, is_published, is_active')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;

      setWebsites(data || []);
    } catch (err: any) {
      console.error('Failed to fetch websites:', err);
      setError(err.message || 'Failed to fetch websites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();

    // Set up real-time subscription for websites updates
    if (user && storeId) {
      const channel = supabase
        .channel('websites-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'websites',
            filter: `store_id=eq.${storeId}`
          },
          (payload) => {
            console.log('Websites real-time update:', payload);
            fetchWebsites(); // Refetch to maintain filter and order
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, storeId]);

  return { websites, loading, error, refetch: fetchWebsites };
};
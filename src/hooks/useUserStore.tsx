import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  domain: string | null;
  theme_id?: string | null;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  facebook_pixel_id?: string | null;
  google_analytics_id?: string | null;
  google_ads_id?: string | null;
}

export const useUserStore = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchUserStore = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user store:', error);
        setError(error.message);
        return;
      }

      setStore(data);
      
      // If no store exists, redirect to store creation
      if (!data && window.location.pathname.startsWith('/dashboard') && !window.location.pathname.includes('/stores/create')) {
        navigate('/dashboard/stores/create');
      }
    } catch (err) {
      console.error('Error in fetchUserStore:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (storeData: { name: string; slug: string; [key: string]: any }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: storeData.name,
          slug: storeData.slug,
          owner_id: user.id,
          ...storeData,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setStore(data as Store);
      return data as Store;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  };

  const updateStore = async (updates: Partial<Store>) => {
    if (!store || !user) {
      throw new Error('No store found or user not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', store.id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setStore(data as Store);
      return data as Store;
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserStore();

    // Set up real-time subscription for store updates
    if (user) {
      const channel = supabase
        .channel('user-store-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stores',
            filter: `owner_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Store real-time update:', payload);
            if (payload.eventType === 'UPDATE' && payload.new) {
              setStore(payload.new as Store);
            } else if (payload.eventType === 'DELETE') {
              setStore(null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    store,
    loading,
    error,
    refetch: fetchUserStore,
    createStore,
    updateStore,
  };
};
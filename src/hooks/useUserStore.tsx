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
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const MAX_RETRIES = 3;
  const DEBOUNCE_TIME = 5000; // 5 seconds

  const fetchUserStore = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent concurrent requests and debounce
    const now = Date.now();
    if (loading || (now - lastFetchTime < DEBOUNCE_TIME)) {
      return;
    }

    // Stop retrying after max retries
    if (retryCount >= MAX_RETRIES) {
      setError('Maximum retries exceeded. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLastFetchTime(now);
      setError(null);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user store:', error);
        
        // Don't set error state if it's a network issue and we can retry
        if (error.message.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Retry after a delay
          setTimeout(() => {
            fetchUserStore();
          }, 2000 * (retryCount + 1)); // Exponential backoff
          return;
        } else {
          setError(error.message);
          return;
        }
      }

      setStore(data);
      // Reset retry count on success
      setRetryCount(0);
      // Store creation will now happen automatically when needed (creating websites/funnels)
    } catch (err) {
      console.error('Error in fetchUserStore:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Don't set error state if it's a network issue and we can retry
      if (errorMessage.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Retry after a delay
        setTimeout(() => {
          fetchUserStore();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (storeData: { name: string; slug: string; [key: string]: any }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Ensure user profile exists first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
      }

      // Create profile if it doesn't exist
      if (!profile) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          });

        if (createProfileError && !createProfileError.message.includes('duplicate key')) {
          console.error('Error creating profile:', createProfileError);
        }
      }

      // Try to create the store
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

  // Auto-create store when needed (for websites/funnels)
  const ensureStore = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (store) {
      return store;
    }

    // Create default store silently
    const defaultStore = {
      name: `${user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}'s Store`,
      slug: `store-${user.id.slice(0, 8)}`,
      description: 'My online store'
    };

    return await createStore(defaultStore);
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
    if (user) {
      fetchUserStore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Disable realtime subscription temporarily to fix WebSocket issues  
  // useEffect(() => {
  //   if (!user || !store) return;

  //   let channel: any = null;
    
  //   try {
  //     channel = supabase
  //       .channel(`user-store-${user.id}`)
  //       .on(
  //         'postgres_changes',
  //         {
  //           event: '*',
  //           schema: 'public',
  //           table: 'stores',
  //           filter: `owner_id=eq.${user.id}`
  //         },
  //         (payload) => {
  //           console.log('Store real-time update:', payload);
  //           if (payload.eventType === 'UPDATE' && payload.new) {
  //             setStore(payload.new as Store);
  //           } else if (payload.eventType === 'DELETE') {
  //             setStore(null);
  //           }
  //         }
  //       )
  //       .subscribe();
  //   } catch (error) {
  //     console.warn('Failed to set up realtime subscription:', error);
  //   }

  //   return () => {
  //     if (channel) {
  //       try {
  //         supabase.removeChannel(channel);
  //       } catch (error) {
  //         console.warn('Failed to cleanup realtime subscription:', error);
  //       }
  //     }
  //   };
  // }, [user, store?.id]);

  return {
    store,
    loading,
    error,
    refetch: fetchUserStore,
    createStore,
    updateStore,
    ensureStore,
  };
};
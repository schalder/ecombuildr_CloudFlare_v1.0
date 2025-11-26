import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: store,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['userStore', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  const createStoreMutation = useMutation({
    mutationFn: async (storeData: { name: string; slug: string; [key: string]: any }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

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

      if (error) throw error;
      return data as Store;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userStore', user?.id], data);
    },
  });

  const createStore = (storeData: { name: string; slug: string; [key: string]: any }) => {
    return createStoreMutation.mutateAsync(storeData);
  };

  // Auto-create store when needed (for websites/funnels)
  const ensureStore = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // ALWAYS check database first (not just cache) to prevent race conditions
    // This ensures we don't create duplicate stores if multiple requests happen simultaneously
    const { data: existingStore, error: queryError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (queryError) {
      console.error('Error querying store:', queryError);
      throw queryError;
    }

    // If store exists, return it and update cache
    if (existingStore) {
      queryClient.setQueryData(['userStore', user.id], existingStore);
      return existingStore;
    }

    // Generate unique slug using full UUID (without dashes) to prevent collisions
    // Using full UUID ensures uniqueness even if multiple users sign up simultaneously
    const baseSlug = `store-${user.id.replace(/-/g, '')}`;
    
    // Check if slug exists and generate unique one if needed (shouldn't happen with full UUID, but safety check)
    let slug = baseSlug;
    let attempts = 0;
    while (attempts < 3) {
      const { data: existing } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!existing) break;
      
      // Generate unique suffix if slug exists (should be extremely rare with full UUID)
      slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
      attempts++;
    }

    try {
      const newStore = await createStore({
        name: `${user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}'s Store`,
        slug: slug,
        description: 'My online store'
      });
      
      return newStore;
    } catch (error: any) {
      // If store was created by another concurrent request, fetch and return it
      if (error.code === '23505' && error.message.includes('stores_slug_key')) {
        // Check again if store exists now (might have been created by another request)
        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (store) {
          queryClient.setQueryData(['userStore', user.id], store);
          return store;
        }
      }
      
      // If it's a different duplicate error, also check for existing store
      if (error.code === '23505') {
        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (store) {
          queryClient.setQueryData(['userStore', user.id], store);
          return store;
        }
      }
      
      throw error;
    }
  };

  const updateStoreMutation = useMutation({
    mutationFn: async (updates: Partial<Store>) => {
      if (!store || !user) {
        throw new Error('No store found or user not authenticated');
      }

      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', store.id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userStore', user?.id], data);
    },
  });

  const updateStore = (updates: Partial<Store>) => {
    return updateStoreMutation.mutateAsync(updates);
  };


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
    refetch,
    createStore,
    updateStore,
    ensureStore,
  };
};
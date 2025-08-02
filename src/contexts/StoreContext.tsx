import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  domain?: string;
  settings: any;
  is_active: boolean;
}

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  error: string | null;
  loadStore: (slug: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStore = useCallback(async (slug: string) => {
    // Prevent loading the same store multiple times
    if (store?.slug === slug && !error && !loading) {
      console.log('Store already loaded:', slug);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading store with slug:', slug);
      
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, is_active, settings')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Store query result:', { data, error });

      if (error) {
        console.error('Store query error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Store not found or is inactive');
      }
      
      setStore(data);
    } catch (err: any) {
      console.error('Store loading error:', err);
      setError(err.message || 'Failed to load store');
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [store?.slug, error]);

  return (
    <StoreContext.Provider value={{
      store,
      loading,
      error,
      loadStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const loadStore = async (slug: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from('stores')
        .select('id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, is_active, settings')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Store not found or is inactive');
        }
        throw error;
      }
      setStore(data);
    } catch (err: any) {
      console.error('Store loading error:', err);
      setError(err.message || 'Failed to load store');
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

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
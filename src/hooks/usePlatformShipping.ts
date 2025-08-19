import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PlatformShippingAccount {
  id: string;
  provider: string;
  api_key: string;
  secret_key: string;
  webhook_token: string | null;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePlatformShipping = (options: { enabled?: boolean } = { enabled: false }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PlatformShippingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!user || !options.enabled) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_shipping_accounts')
        .select('*')
        .order('provider');

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching platform shipping accounts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (provider: string, updates: { api_key: string; secret_key: string; webhook_token?: string | null; is_active: boolean; settings?: any }) => {
    try {
      const { error } = await supabase
        .from('platform_shipping_accounts')
        .upsert({
          provider,
          api_key: updates.api_key,
          secret_key: updates.secret_key,
          webhook_token: updates.webhook_token || null,
          is_active: updates.is_active,
          settings: updates.settings || {},
        });

      if (error) throw error;
      
      await fetchAccounts();
      return true;
    } catch (err) {
      console.error('Error updating platform shipping account:', err);
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('platform_shipping_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchAccounts();
      return true;
    } catch (err) {
      console.error('Error deleting platform shipping account:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (options.enabled) {
      fetchAccounts();
    }
  }, [user, options.enabled]);

  return {
    accounts,
    loading,
    error,
    updateAccount,
    deleteAccount,
    refetch: fetchAccounts,
  };
};
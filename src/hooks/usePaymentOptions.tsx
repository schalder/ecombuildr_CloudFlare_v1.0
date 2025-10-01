
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PaymentOption {
  id: string;
  provider: string;
  display_name: string | null;
  is_enabled: boolean;
  account_number: string | null;
  instructions: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const usePaymentOptions = (options: { enabled?: boolean } = { enabled: false }) => {
  const { user } = useAuth();
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentOptions = async () => {
    if (!user || !options.enabled) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_payment_options')
        .select('*')
        .order('provider');

      if (error) throw error;
      
      // Parse JSON account_number for ebpay to populate form fields
      const normalized = (data || []).map((row: any) => {
        if (row.provider === 'ebpay' && row.account_number && typeof row.account_number === 'string') {
          try {
            return { ...row, account_number: JSON.parse(row.account_number) };
          } catch {
            return row;
          }
        }
        return row;
      });
      
      setPaymentOptions(normalized);
    } catch (err) {
      console.error('Error fetching payment options:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentOption = async (provider: string, updates: Partial<PaymentOption>) => {
    try {
      const payload: any = {
        provider,
        updated_by: user?.id,
        ...updates,
      };

      // Stringify account_number object for ebpay as DB expects text
      if (provider === 'ebpay' && payload.account_number && typeof payload.account_number === 'object') {
        payload.account_number = JSON.stringify(payload.account_number);
      }

      const { error } = await supabase
        .from('platform_payment_options')
        .upsert(payload, {
          onConflict: 'provider',
          ignoreDuplicates: false,
        });

      if (error) throw error;

      // Refresh the list
      await fetchPaymentOptions();
      return true;
    } catch (err: any) {
      // Fallback: if upsert conflicts (409/23505), perform explicit UPDATE by provider
      if (err?.code === '23505') {
        const updateData: any = { ...updates, updated_by: user?.id };
        if (provider === 'ebpay' && updateData.account_number && typeof updateData.account_number === 'object') {
          updateData.account_number = JSON.stringify(updateData.account_number);
        }
        const { error: updErr } = await supabase
          .from('platform_payment_options')
          .update(updateData)
          .eq('provider', provider);
        if (updErr) {
          console.error('Error updating payment option after conflict:', updErr);
          throw updErr;
        }
        await fetchPaymentOptions();
        return true;
      }
      console.error('Error updating payment option:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (options.enabled) {
      fetchPaymentOptions();
    }
  }, [user, options.enabled]);

  return {
    paymentOptions,
    loading,
    error,
    updatePaymentOption,
    refetch: fetchPaymentOptions,
  };
};

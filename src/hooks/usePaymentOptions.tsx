
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
      // Fallback path: try UPDATE by provider first, then INSERT if no row
      const sanitized: any = { ...updates, updated_by: user?.id };
      delete sanitized.id;
      delete sanitized.created_at;
      delete sanitized.updated_at;
      if (provider === 'ebpay' && sanitized.account_number && typeof sanitized.account_number === 'object') {
        sanitized.account_number = JSON.stringify(sanitized.account_number);
      }

      const { data: updData, error: updErr } = await supabase
        .from('platform_payment_options')
        .update(sanitized)
        .eq('provider', provider)
        .select('id');

      if (updErr) {
        console.error('Direct UPDATE failed:', updErr);
      }

      if (!updErr && updData && updData.length > 0) {
        await fetchPaymentOptions();
        return true;
      }

      // If no rows updated, try INSERT (will fail only if true duplicate race)
      const insertPayload: any = {
        provider,
        updated_by: user?.id,
        ...sanitized,
      };
      const { error: insErr } = await supabase
        .from('platform_payment_options')
        .insert(insertPayload);
      if (insErr) {
        console.error('Insert after update fallback failed:', insErr);
        throw insErr;
      }
      await fetchPaymentOptions();
      return true;
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

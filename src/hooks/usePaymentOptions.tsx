
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
      
      // Parse account_number for ebpay from JSON string to object
      const processedData = (data || []).map(row => {
        if (row.provider === 'ebpay' && typeof row.account_number === 'string') {
          try {
            return { ...row, account_number: JSON.parse(row.account_number) };
          } catch {
            return row;
          }
        }
        return row;
      });
      
      setPaymentOptions(processedData);
    } catch (err) {
      console.error('Error fetching payment options:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentOption = async (provider: string, updates: Partial<PaymentOption>) => {
    try {
      // Build clean payload - strip id, created_at, updated_at
      const { id, created_at, updated_at, ...cleanUpdates } = updates as any;
      
      // Prepare payload for updates (do not include provider in UPDATE to avoid constraint noise)
      const updatePayload: any = {
        updated_by: user?.id,
        ...cleanUpdates,
      };

      // For ebpay, stringify account_number if it's an object
      if (provider === 'ebpay' && updatePayload.account_number && typeof updatePayload.account_number === 'object') {
        updatePayload.account_number = JSON.stringify(updatePayload.account_number);
      }

      // 1) Try UPDATE first (idempotent, avoids 409s)
      const { data: updatedRows, error: updateError } = await supabase
        .from('platform_payment_options')
        .update(updatePayload)
        .eq('provider', provider)
        .select('provider');

      if (updateError) throw updateError;

      if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        await fetchPaymentOptions();
        return true;
      }

      // 2) If no row was updated, INSERT new
      const insertPayload: any = {
        provider,
        updated_by: user?.id,
        ...cleanUpdates,
      };
      if (provider === 'ebpay' && insertPayload.account_number && typeof insertPayload.account_number === 'object') {
        insertPayload.account_number = JSON.stringify(insertPayload.account_number);
      }

      const { error: insertError } = await supabase
        .from('platform_payment_options')
        .insert(insertPayload);

      if (insertError) {
        // Handle race: if someone else inserted meanwhile, retry UPDATE once
        if ((insertError as any).code === '23505') {
          const { error: retryError } = await supabase
            .from('platform_payment_options')
            .update(updatePayload)
            .eq('provider', provider);
          if (retryError) throw retryError;
        } else {
          throw insertError;
        }
      }

      await fetchPaymentOptions();
      return true;
    } catch (err) {
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

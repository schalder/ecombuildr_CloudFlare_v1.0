import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WhatsAppAccount {
  id: string;
  store_id: string;
  phone_number: string;
  phone_number_id?: string;
  business_account_id?: string;
  access_token?: string;
  webhook_verify_token?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WhatsAppMessage {
  id: string;
  notification_id: string;
  store_id: string;
  recipient_phone: string;
  message_text: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  whatsapp_message_id?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  send_at: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppNotifications() {
  const { user } = useAuth();
  const [whatsappAccount, setWhatsappAccount] = useState<WhatsAppAccount | null>(null);
  const [messageQueue, setMessageQueue] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWhatsAppAccount = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's store first
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (!store) {
        setWhatsappAccount(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('whatsapp_business_accounts')
        .select('*')
        .eq('store_id', store.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setWhatsappAccount(data);
    } catch (error) {
      console.error('Error fetching WhatsApp account:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageQueue = async () => {
    if (!user) return;
    
    try {
      // Get user's store first
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (!store) {
        setMessageQueue([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('whatsapp_message_queue')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setMessageQueue(data || []);
    } catch (error) {
      console.error('Error fetching message queue:', error);
    }
  };

  const setupWhatsAppAccount = async (accountData: {
    phone_number: string;
    phone_number_id?: string;
    business_account_id?: string;
    access_token?: string;
    webhook_verify_token?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Get user's store first
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (!store) throw new Error('Store not found');

      const { data, error } = await supabase
        .from('whatsapp_business_accounts')
        .upsert({
          store_id: store.id,
          ...accountData,
          is_active: true,
          is_verified: !!accountData.phone_number_id && !!accountData.access_token,
        })
        .select()
        .single();

      if (error) throw error;

      setWhatsappAccount(data);
      return data;
    } catch (error) {
      console.error('Error setting up WhatsApp account:', error);
      throw error;
    }
  };

  const updateWhatsAppAccount = async (updates: Partial<WhatsAppAccount>) => {
    if (!whatsappAccount) throw new Error('No WhatsApp account to update');
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_business_accounts')
        .update(updates)
        .eq('id', whatsappAccount.id)
        .select()
        .single();

      if (error) throw error;

      setWhatsappAccount(data);
      return data;
    } catch (error) {
      console.error('Error updating WhatsApp account:', error);
      throw error;
    }
  };

  const triggerMessageProcessing = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp');
      
      if (error) throw error;
      
      // Refresh message queue after processing
      await fetchMessageQueue();
      
      return data;
    } catch (error) {
      console.error('Error triggering message processing:', error);
      throw error;
    }
  };

  const testWhatsAppMessage = async (message: string) => {
    if (!whatsappAccount || !whatsappAccount.is_verified) {
      throw new Error('WhatsApp account not verified');
    }

    try {
      // Create a test notification which will trigger the queue
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!store) throw new Error('Store not found');

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          store_id: store.id,
          type: 'test',
          title: 'Test Notification',
          message: message,
          metadata: { test: true },
          delivery_method: 'whatsapp',
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger message processing
      await triggerMessageProcessing();
      
      return data;
    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  };

  // Set up real-time subscription for message queue updates
  useEffect(() => {
    if (!user || !whatsappAccount) return;

    const channel = supabase
      .channel('whatsapp-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_message_queue',
          filter: `store_id=eq.${whatsappAccount.store_id}`,
        },
        () => {
          fetchMessageQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, whatsappAccount]);

  useEffect(() => {
    fetchWhatsAppAccount();
  }, [user]);

  useEffect(() => {
    if (whatsappAccount) {
      fetchMessageQueue();
    }
  }, [whatsappAccount]);

  return {
    whatsappAccount,
    messageQueue,
    loading,
    setupWhatsAppAccount,
    updateWhatsAppAccount,
    triggerMessageProcessing,
    testWhatsAppMessage,
    refetch: fetchWhatsAppAccount,
  };
}
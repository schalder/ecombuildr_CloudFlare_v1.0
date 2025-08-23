
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmailNotificationSettings {
  new_orders: boolean;
  low_stock: boolean;
  payment_received: boolean;
  order_cancelled: boolean;
}

export function useEmailNotifications(storeId?: string) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmailNotificationSettings>({
    new_orders: true,
    low_stock: true,
    payment_received: true,
    order_cancelled: true,
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    if (!user || !storeId) return;

    try {
      // Get settings from store metadata or create default
      const { data: store, error } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;

      const emailSettings = store?.settings as any;
      if (emailSettings?.email_notifications) {
        setSettings(emailSettings.email_notifications);
      }
    } catch (error) {
      console.error('Error fetching email notification settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<EmailNotificationSettings>) => {
    if (!user || !storeId) return;

    setLoading(true);
    try {
      // First fetch current store settings to avoid overwriting other settings
      const { data: currentStore, error: fetchError } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .eq('owner_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (currentStore?.settings as any) || {};
      const currentEmailSettings = currentSettings.email_notifications || {};
      const updatedEmailSettings = { ...currentEmailSettings, ...newSettings };

      // Deep merge the settings
      const updatedSettings = {
        ...(typeof currentSettings === 'object' ? currentSettings : {}),
        email_notifications: updatedEmailSettings
      };

      const { error } = await supabase
        .from('stores')
        .update({ settings: updatedSettings })
        .eq('id', storeId)
        .eq('owner_id', user.id);

      if (error) throw error;

      setSettings(updatedEmailSettings);
      return { success: true };
    } catch (error) {
      console.error('Error updating email notification settings:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const triggerOrderNotification = async (orderId: string, websiteId?: string) => {
    if (!user || !storeId) return;

    try {
      const { error } = await supabase.functions.invoke('send-order-email', {
        body: {
          order_id: orderId,
          store_id: storeId,
          website_id: websiteId,
          event_type: 'new_order'
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending order notification:', error);
      return { success: false, error };
    }
  };

  const sendTestEmail = async (testEmail?: string, useDebugMode = false) => {
    if (!user || !storeId) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          store_id: storeId,
          event_type: 'test',
          test_email: testEmail,
          use_debug: useDebugMode
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message || 'Failed to send test email');
      }

      if (data?.error) {
        console.error('Function returned error:', data);
        throw new Error(data.details || data.error);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending test email:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user, storeId]);

  return {
    settings,
    loading,
    updateSettings,
    triggerOrderNotification,
    sendTestEmail,
    refetch: fetchSettings,
  };
}


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

      const emailSettings = store?.settings?.email_notifications;
      if (emailSettings) {
        setSettings(emailSettings);
      }
    } catch (error) {
      console.error('Error fetching email notification settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<EmailNotificationSettings>) => {
    if (!user || !storeId) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('stores')
        .update({
          settings: {
            email_notifications: updatedSettings
          }
        })
        .eq('id', storeId)
        .eq('owner_id', user.id);

      if (error) throw error;

      setSettings(updatedSettings);
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
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending order notification:', error);
      return { success: false, error };
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
    refetch: fetchSettings,
  };
}


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const isBasicSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    // Enhanced detection for iOS PWA vs Safari browser
    const isIOSPWA = (window.navigator as any).standalone === true;
    const isIOSBrowser = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // For iOS, only support in PWA mode (added to home screen)
    if (isIOSBrowser && !isIOSPWA) {
      setIsSupported(false);
    } else {
      setIsSupported(isBasicSupported);
    }
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check for existing subscription
    if (isSupported && user) {
      checkExistingSubscription();
    }
  }, [isSupported, user]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('Push notifications enabled!');
      return true;
    } else if (result === 'denied') {
      toast.error('Push notifications were blocked. Please enable them in your browser settings.');
      return false;
    }

    return false;
  };

  const subscribe = async (storeId?: string) => {
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return false;
    }

    setLoading(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get VAPID public key
      console.log('🔑 Getting VAPID public key...');
      const { data: vapidResponse, error: vapidError } = await supabase.functions.invoke('get-vapid-public-key');
      
      if (vapidError) {
        console.error('❌ VAPID key fetch error:', vapidError);
        toast.error('Failed to get notification keys. Please try again.');
        throw new Error('Failed to get VAPID public key: ' + vapidError.message);
      }
      
      if (!vapidResponse?.publicKey) {
        console.error('❌ No public key in response:', vapidResponse);
        toast.error('Invalid notification configuration. Please contact support.');
        throw new Error('No public key returned from server');
      }
      
      console.log('✅ VAPID public key received');

      // Convert VAPID key if needed (handle both base64 and Uint8Array formats)
      let applicationServerKey: BufferSource;
      if (typeof vapidResponse.publicKey === 'string') {
        applicationServerKey = new Uint8Array(
          atob(vapidResponse.publicKey.replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(char => char.charCodeAt(0))
        );
      } else {
        applicationServerKey = vapidResponse.publicKey;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Save subscription to database - use correct column names based on actual schema
      const subscriptionObject = pushSubscription.toJSON();
      const { error: saveError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          store_id: storeId || null,
          endpoint: subscriptionObject.endpoint!,
          p256dh: subscriptionObject.keys!.p256dh!,
          auth: subscriptionObject.keys!.auth!,
          device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 
                  navigator.userAgent.includes('Firefox') ? 'firefox' : 
                  navigator.userAgent.includes('Safari') ? 'safari' : 'other',
          platform: navigator.platform,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false
        });

      // Also ensure any inactive subscriptions with same endpoint are reactivated
      await supabase
        .from('push_subscriptions')
        .update({ is_active: true, last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('endpoint', subscriptionObject.endpoint!);

      if (saveError) {
        throw saveError;
      }

      setSubscription(pushSubscription);
      toast.success('Push notifications enabled successfully!');
      return true;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user || !subscription) return false;

    setLoading(true);
    try {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from database
      const subscriptionObject = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscriptionObject.endpoint!);

      if (error) {
        throw error;
      }

      setSubscription(null);
      toast.success('Push notifications disabled');
      return true;

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to disable push notifications');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test notification function
  const sendTestNotification = async () => {
    if (!subscription || loading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-push');
      
      if (error) {
        console.error('Error sending test notification:', error);
        toast.error('Failed to send test notification');
        return;
      }

      // Check if notifications were actually delivered
      if (data?.delivered > 0) {
        toast.success(`Test notification sent successfully! Delivered to ${data.delivered} device(s).`);
      } else {
        const firstError = data?.results?.[0]?.error || 'Unknown delivery error';
        console.error('Test notification delivery failed:', data);
        
        toast.error(`Test notification failed to deliver: ${firstError}`);
        
        // If delivery failed, might need to re-subscribe
        const firstResult = data?.results?.[0];
        if (firstResult?.status === 404 || firstResult?.status === 410 || firstResult?.status === 413) {
          toast.error('Push subscription expired. Please re-enable notifications.');
          setSubscription(null);
        }
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    loading,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
    sendTestNotification,
  };
}

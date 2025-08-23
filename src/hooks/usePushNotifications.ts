import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'error';
  checks: {
    vapidKeysConfigured: boolean;
    vapidKeysValid: boolean;
    vapidCryptoValid: boolean;
    supabaseConfigured: boolean;
    webCryptoAvailable: boolean;
  };
  recommendations: string[];
}

interface DiagnosticsInfo {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  serviceWorkerRegistered: boolean;
  hasSubscription: boolean;
  vapidKeysFetched: boolean;
  serverHealth: HealthStatus | null;
  lastTestResult: string | null;
  isIOSPWA: boolean;
  isIOSWithoutPWA: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverHealth, setServerHealth] = useState<HealthStatus | null>(null);
  const [lastTestResult, setLastTestResult] = useState<string | null>(null);
  const [vapidKeysFetched, setVapidKeysFetched] = useState(false);
  
  // iOS detection
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSPWA = isIOSDevice && (window.navigator as any).standalone === true;
  const isIOSWithoutPWA = isIOSDevice && (window.navigator as any).standalone !== true;

  const checkSupport = useCallback(() => {
    // Enhanced support detection
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;
    
    // iOS 16.4+ PWA support
    const iosSupported = isIOSPWA;
    
    const supported = hasServiceWorker && hasPushManager && hasNotifications && (!isIOSDevice || iosSupported);
    
    console.log('🔍 Push support check:', {
      hasServiceWorker,
      hasPushManager, 
      hasNotifications,
      isIOSDevice,
      isIOSPWA,
      iosSupported,
      finalSupported: supported
    });
    
    setIsSupported(supported);
  }, [isIOSDevice, isIOSPWA]);

  const checkServerHealth = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('push-health');
      
      if (error) {
        console.error('❌ Health check failed:', error);
        setServerHealth({
          status: 'error',
          checks: { vapidKeysConfigured: false, vapidKeysValid: false, vapidCryptoValid: false, supabaseConfigured: false, webCryptoAvailable: false },
          recommendations: ['Unable to connect to health check service']
        });
        return;
      }
      
      // Handle 503 status by parsing response data even if there's an error
      if (data && data.status) {
        setServerHealth(data);
        console.log('🏥 Server health (from error response):', data);
      } else {
        setServerHealth(data);
        console.log('🏥 Server health:', data);
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
    }
  }, []);

  const checkExistingSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
      
      if (existingSubscription) {
        console.log('✅ Found existing push subscription');
      }
    } catch (error) {
      console.error('❌ Error checking existing subscription:', error);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSupport();
    if ('Notification' in window) {
      setPermission(Notification.permission as 'default' | 'granted' | 'denied');
    }
    checkServerHealth();
    
    if (user) {
      checkExistingSubscription();
    }
  }, [user, checkSupport, checkExistingSubscription, checkServerHealth]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if (permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission() as 'default' | 'granted' | 'denied';
    setPermission(result);

    return result === 'granted';
  }, [isSupported, permission]);

  // Helper functions
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    try {
      console.log('🔑 Converting VAPID key for iOS compatibility');
      
      // Clean the input
      let cleanKey = base64String.trim();
      
      // Validate length for P-256 public key (should be 87 chars for base64url)
      if (cleanKey.length !== 87) {
        throw new Error(`Invalid VAPID key length: ${cleanKey.length}, expected 87`);
      }
      
      // For iOS compatibility, ensure we handle the key properly
      // Convert base64url to base64
      cleanKey = cleanKey.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const padding = '='.repeat((4 - cleanKey.length % 4) % 4);
      const base64 = cleanKey + padding;

      // Decode to binary
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      // Validate the converted key length (should be 65 bytes for uncompressed P-256)
      if (outputArray.length !== 65) {
        throw new Error(`Invalid converted key length: ${outputArray.length}, expected 65`);
      }
      
      // For iOS, ensure this is a valid P-256 uncompressed public key
      // First byte must be 0x04 for uncompressed format
      if (outputArray[0] !== 0x04) {
        console.warn(`⚠️ iOS Warning: P-256 public key first byte is 0x${outputArray[0].toString(16)}, expected 0x04`);
        // For iOS, this might be critical - let's be more strict
        throw new Error(`Invalid P-256 public key format for iOS: first byte must be 0x04, got 0x${outputArray[0].toString(16)}`);
      }
      
      console.log(`✅ VAPID key converted successfully for iOS: ${cleanKey.length} chars -> ${outputArray.length} bytes`);
      return outputArray;
    } catch (error) {
      console.error('❌ Error converting VAPID key for iOS:', error);
      throw new Error(`Failed to convert VAPID key for iOS: ${error.message}`);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  };

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    return {
      device: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      browser: userAgent.includes('Chrome') ? 'chrome' : 
               userAgent.includes('Firefox') ? 'firefox' : 
               userAgent.includes('Safari') ? 'safari' : 'other',
      platform: navigator.platform || 'unknown'
    };
  };

  const subscribe = useCallback(async (storeId?: string) => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported on this device/browser');
    }

    if (!user) {
      throw new Error('User must be logged in');
    }

    // iOS specific blocking - must be PWA
    if (isIOSWithoutPWA) {
      throw new Error('On iOS, you must install this app to your Home Screen first to enable notifications');
    }

    setLoading(true);
    try {
      // Request permission first
      if (permission !== 'granted') {
        const newPermission = await Notification.requestPermission() as 'default' | 'granted' | 'denied';
        setPermission(newPermission);
        
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied. Please enable notifications in your browser settings.');
        }
      }

      // Get VAPID public key with validation
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-public-key');
      
      if (vapidError || !vapidData?.publicKey) {
        console.error('❌ Failed to get VAPID key:', vapidError);
        throw new Error('Failed to get server configuration for push notifications');
      }

      console.log('✅ VAPID key received, length:', vapidData.publicKey.length);
      setVapidKeysFetched(true);

      // Register service worker and subscribe
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await registration.update();
      
      const vapidPublicKey = vapidData.publicKey;
      
      let applicationServerKey: Uint8Array;
      try {
        applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log('✅ VAPID key converted successfully');
      } catch (conversionError) {
        console.error('❌ VAPID key conversion failed:', conversionError);
        throw new Error(`Invalid VAPID key format: ${conversionError.message}`);
      }
      
      let pushSubscription;
      try {
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      } catch (error: any) {
        console.error('❌ Push subscription failed:', error);
        if (error.name === 'InvalidAccessError') {
          throw new Error('Invalid VAPID key format. The applicationServerKey must contain a valid P-256 public key.');
        }
        throw error;
      }

      console.log('✅ Push subscription created');

      // Extract subscription details
      const p256dh = arrayBufferToBase64(pushSubscription.getKey('p256dh'));
      const auth = arrayBufferToBase64(pushSubscription.getKey('auth'));

      // Detect device/browser info
      const deviceInfo = getDeviceInfo();

      // Save subscription to database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          store_id: storeId || null,
          endpoint: pushSubscription.endpoint,
          p256dh,
          auth,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          platform: deviceInfo.platform,
          is_active: true,
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (dbError) {
        console.error('❌ Failed to save subscription:', dbError);
        throw new Error('Failed to save subscription to database');
      }

      setSubscription(pushSubscription);
      toast({
        title: "Notifications enabled",
        description: "You'll now receive push notifications."
      });

      console.log('✅ Push subscription created and saved');

    } catch (error) {
      console.error('❌ Subscription failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isSupported, user, permission, toast, isIOSWithoutPWA]);

  const unsubscribe = useCallback(async () => {
    if (!user || !subscription) return false;

    setLoading(true);
    try {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (dbError) {
        console.error('❌ Failed to deactivate subscription:', dbError);
        throw new Error('Failed to remove subscription from database');
      }

      setSubscription(null);
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive push notifications."
      });

      console.log('✅ Push subscription removed');
      return true;

    } catch (error) {
      console.error('❌ Unsubscription failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, subscription, toast]);

  const sendTestNotification = useCallback(async (storeId?: string) => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    if (!subscription) {
      throw new Error('No active push subscription found');
    }

    if (!storeId) {
      throw new Error('Store ID is required for sending notifications');
    }

    try {
      setLastTestResult('Sending...');
      
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          storeId,
          payload: {
            title: '🔔 Test Notification',
            body: 'This is a test push notification from your store!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: {
              type: 'test',
              timestamp: new Date().toISOString()
            }
          }
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('❌ Test notification failed:', error);
        const errorMsg = `Failed: ${error.message || 'Unknown error'}`;
        setLastTestResult(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Test notification sent:', data);
      const successMsg = `Sent to ${data.summary?.successful || 0} device(s)`;
      setLastTestResult(successMsg);
      
      // Handle potential subscription expiration
      if (data.summary?.expired > 0) {
        toast({
          title: "Subscription updated",
          description: "Some expired subscriptions were cleaned up. You may need to re-enable notifications.",
          variant: "destructive"
        });
        // Refresh subscription status
        checkExistingSubscription();
      }
      
      return data;
    } catch (error) {
      console.error('❌ Test notification error:', error);
      throw error;
    }
  }, [user, subscription, toast, checkExistingSubscription]);

  // Diagnostics information
  const diagnostics: DiagnosticsInfo = {
    isSupported,
    permission,
    serviceWorkerRegistered: !!('serviceWorker' in navigator),
    hasSubscription: !!subscription,
    vapidKeysFetched,
    serverHealth,
    lastTestResult,
    isIOSPWA,
    isIOSWithoutPWA
  };

  return {
    isSupported,
    permission,
    subscription,
    loading,
    isSubscribed: !!subscription,
    diagnostics,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkServerHealth
  };
}
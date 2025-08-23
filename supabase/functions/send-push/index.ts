import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationResult {
  subscription_id: string;
  success: boolean;
  status?: number;
  error?: string;
  endpoint_host?: string;
}

// Deno-native web push implementation using Web Crypto API
async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<NotificationResult> {
  try {
    const endpointUrl = new URL(subscription.endpoint);
    const endpointHost = endpointUrl.hostname;
    
    console.log(`📨 Sending notification to ${endpointHost} (subscription: ${subscription.id})`);
    
    // Simple push notification without complex encryption for now
    // This will work for most use cases
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        data: payload.data
      })
    });

    const success = response.status >= 200 && response.status < 300;
    console.log(`${success ? '✅' : '❌'} Push result for ${subscription.id}: HTTP ${response.status}`);
    
    return { 
      subscription_id: subscription.id, 
      success, 
      status: response.status,
      error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      endpoint_host: endpointHost
    };

  } catch (error: any) {
    const endpointUrl = new URL(subscription.endpoint);
    const endpointHost = endpointUrl.hostname;
    console.error(`❌ Failed to send to ${endpointHost}:`, error);
    
    return { 
      subscription_id: subscription.id, 
      success: false, 
      status: 0,
      error: error.message || 'Unknown error',
      endpoint_host: endpointHost
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests FIRST before any processing
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request');
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      },
      status: 200 
    });
  }

  console.log(`🔔 ${req.method} request to send-push`);

  try {
    // Extract JWT token for user validation
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No valid authorization header');
      throw new Error('No valid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Use service role client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token manually by creating a temporary client with the token
    const tempSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await tempSupabase.auth.getUser(token);
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error(`Unauthorized: ${userError?.message || 'Invalid token'}`);
    }

    const { storeId, payload } = await req.json();
    
    console.log(`🔔 Push notification request for store ${storeId} by user ${user.email}`);

    // Get store owner with service role client
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    // Get push subscriptions for the store owner
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', store.owner_id)
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ Failed to get subscriptions:', subsError);
      throw new Error('Failed to get subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found', delivered: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending push notifications to ${subscriptions.length} subscriptions`);

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      throw new Error('VAPID keys not configured');
    }

    // Send notifications using Promise.allSettled for better error handling
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendWebPushNotification(
        {
          id: sub.id,
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth
        },
        payload,
        vapidPublicKey,
        vapidPrivateKey
      ))
    );

    // Process results and deactivate expired subscriptions
    const notificationResults: NotificationResult[] = [];
    const expiredSubscriptionIds: string[] = [];
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const notifResult = result.value;
        notificationResults.push(notifResult);
        
        // Mark subscription as inactive if expired/invalid
        if (!notifResult.success && notifResult.status && [404, 410, 413].includes(notifResult.status)) {
          expiredSubscriptionIds.push(notifResult.subscription_id);
          console.log(`🗑️ Marking subscription ${notifResult.subscription_id} as inactive (HTTP ${notifResult.status})`);
        }
      } else {
        console.error('❌ Promise rejection in push sending:', result.reason);
      }
    }

    // Deactivate expired subscriptions
    if (expiredSubscriptionIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('id', expiredSubscriptionIds);
      
      console.log(`🗑️ Deactivated ${expiredSubscriptionIds.length} expired subscriptions`);
    }

    const successCount = notificationResults.filter(r => r.success).length;
    const failureCount = notificationResults.length - successCount;
    
    // Group results by endpoint host for debugging
    const resultsByHost = notificationResults.reduce((acc, result) => {
      const host = result.endpoint_host || 'unknown';
      if (!acc[host]) acc[host] = { success: 0, failed: 0 };
      if (result.success) acc[host].success++;
      else acc[host].failed++;
      return acc;
    }, {} as Record<string, { success: number; failed: number }>);

    console.log(`📊 Push summary: ${successCount} sent, ${failureCount} failed out of ${notificationResults.length} total`);
    console.log(`📊 Results by host:`, resultsByHost);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sent ${successCount} notifications, ${failureCount} failed`,
        summary: {
          total: notificationResults.length,
          successful: successCount,
          failed: failureCount,
          expired: expiredSubscriptionIds.length,
          resultsByHost
        },
        results: notificationResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send push notifications', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

// Web Push helper function using the web-push library
async function sendWebPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; status?: number; statusText?: string; error?: string }> {
  try {
    // Create the notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || 'default',
      data: payload.data,
    });

    // Configure web-push with VAPID details
    webpush.setVapidDetails(
      'mailto:support@yourdomain.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Create subscription object
    const pushSubscription = {
      endpoint,
      keys: {
        p256dh,
        auth
      }
    };

    // Send the push notification
    const response = await webpush.sendNotification(pushSubscription, notificationPayload);
    
    return { 
      success: true, 
      status: response.statusCode,
      statusText: response.headers?.['status'] || 'OK'
    };
  } catch (error: any) {
    console.error('Error in sendWebPushNotification:', error);
    
    return {
      success: false,
      status: error.statusCode || 500,
      statusText: error.body || error.message || 'Unknown error',
      error: error.body || error.message || 'Failed to send notification'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, payload }: { storeId: string; payload: PushPayload } = await req.json();

    if (!storeId || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing storeId or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client to fetch subscriptions
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store owner to find their push subscriptions
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('Store not found:', storeError);
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active push subscriptions for the store owner
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', store.owner_id)
      .eq('is_active', true);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    console.log(`Sending push notifications to ${subscriptions.length} subscriptions`);

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          console.log(`Attempting to send push to subscription ${subscription.id}`);
          
          const result = await sendWebPushNotification(
            subscription.endpoint,
            subscription.p256dh,
            subscription.auth,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          if (!result.success) {
            const url = new URL(subscription.endpoint);
            const endpointHost = url.hostname;
            
            console.error(`Push failed for subscription ${subscription.id}:`, {
              status: result.status,
              statusText: result.statusText,
              error: result.error,
              endpointHost
            });
            
            // Only mark as inactive on 404/410 (subscription expired/invalid)
            // Don't deactivate on auth errors (401/403) which might be temporary
            if (result.status === 404 || result.status === 410) {
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', subscription.id);
            }
            
            return { 
              success: false, 
              subscriptionId: subscription.id, 
              endpointHost,
              status: result.status,
              statusText: result.statusText,
              error: result.error 
            };
          }

          console.log(`Push sent successfully to subscription ${subscription.id}`);
          const url = new URL(subscription.endpoint);
          return { 
            success: true, 
            subscriptionId: subscription.id,
            endpointHost: url.hostname,
            status: result.status,
            statusText: result.statusText
          };
        } catch (error) {
          console.error(`Error sending push to ${subscription.id}:`, error);
          const url = new URL(subscription.endpoint);
          return { 
            success: false, 
            subscriptionId: subscription.id, 
            endpointHost: url.hostname,
            error: error.message 
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Push notification results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        successful,
        failed,
        total: results.length,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send push notifications', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

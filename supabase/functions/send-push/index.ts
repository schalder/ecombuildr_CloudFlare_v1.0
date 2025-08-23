
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

// Helper function to convert VAPID key from base64url to Uint8Array
function base64UrlToUint8Array(base64UrlString: string): Uint8Array {
  const padding = '='.repeat((4 - base64UrlString.length % 4) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

// Web Push helper function
async function sendWebPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // Create the payload
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || 'default',
    data: payload.data,
  });

  // For now, send a simple request to the push service endpoint
  // This is a simplified version - in production you'd want full Web Push encryption
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400', // 24 hours
    },
    body: notificationPayload,
  });

  return response;
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

    // Send push notifications to all subscriptions using Web Push
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          console.log(`Attempting to send push to subscription ${subscription.id}`);
          
          const response = await sendWebPushNotification(
            subscription.endpoint,
            subscription.p256dh,
            subscription.auth,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Push failed for subscription ${subscription.id}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            
            // Only mark as inactive if it's a client error (4xx)
            if (response.status >= 400 && response.status < 500) {
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', subscription.id);
            }
            
            return { success: false, subscriptionId: subscription.id, error: `${response.status}: ${errorText}` };
          }

          console.log(`Push sent successfully to subscription ${subscription.id}`);
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error(`Error sending push to ${subscription.id}:`, error);
          return { success: false, subscriptionId: subscription.id, error: error.message };
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

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

interface PushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationResult {
  subscriptionId: string;
  success: boolean;
  status?: number;
  error?: string;
  endpointHost?: string;
}

// VAPID key utilities using Web Crypto API (Deno native)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToUrlBase64(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(array)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateVAPIDHeaders(
  audience: string,
  subject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ Authorization: string; 'Crypto-Key': string }> {
  const vapidPrivateKeyUint8Array = urlBase64ToUint8Array(vapidPrivateKey);
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'raw',
    vapidPrivateKeyUint8Array,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: subject
  };

  const encodedHeader = uint8ArrayToUrlBase64(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = uint8ArrayToUrlBase64(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = uint8ArrayToUrlBase64(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${encodedSignature}`;

  return {
    'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
    'Crypto-Key': `p256ecdsa=${vapidPublicKey}`
  };
}

async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<NotificationResult> {
  try {
    const endpointUrl = new URL(subscription.endpoint);
    const endpointHost = endpointUrl.hostname;
    const audience = `${endpointUrl.protocol}//${endpointUrl.hostname}`;
    
    console.log(`📨 Sending notification to ${endpointHost} (subscription: ${subscription.id})`);
    
    // Generate VAPID headers
    const vapidHeaders = await generateVAPIDHeaders(
      audience,
      'mailto:admin@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Send the notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        ...vapidHeaders,
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Urgency': 'normal'
      },
      body: JSON.stringify(payload)
    });

    console.log(`✅ Push sent to ${endpointHost}, status: ${response.status}`);
    
    return { 
      subscriptionId: subscription.id, 
      success: response.ok, 
      status: response.status,
      endpointHost 
    };

  } catch (error: any) {
    const endpointHost = new URL(subscription.endpoint).hostname;
    console.error(`❌ Failed to send to ${endpointHost}:`, error);
    
    return { 
      subscriptionId: subscription.id, 
      success: false, 
      status: 0,
      error: error.message || 'Unknown error',
      endpointHost
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT token for user validation
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    const { data: { user }, error: userError } = await tempSupabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error('Unauthorized');
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
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        payload,
        vapidPublicKey,
        vapidPrivateKey
      ))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Deactivate subscriptions that returned 404/410/413 (subscription expired/invalid)
    const failedSubscriptionIds = results
      .filter(r => r.status === 'fulfilled' && !r.value.success && 
               (r.value.status === 404 || r.value.status === 410 || r.value.status === 413))
      .map(r => (r as any).value.subscriptionId);

    if (failedSubscriptionIds.length > 0) {
      console.log(`🗑️ Deactivating ${failedSubscriptionIds.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('id', failedSubscriptionIds);
    }

    console.log(`📊 Push notification results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent', 
        delivered: successful, 
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' })
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
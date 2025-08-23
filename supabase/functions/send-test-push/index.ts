import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Real Web Push notification sending
async function sendWebPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  try {
    // Set VAPID details
    webpush.setVapidDetails(
      'mailto:support@yourdomain.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Prepare subscription object for web-push
    const subscription = {
      endpoint: endpoint,
      keys: {
        p256dh: p256dh,
        auth: auth
      }
    };

    console.log(`📤 Sending real push notification to: ${endpoint.substring(0, 50)}...`);
    
    // Send the notification
    const result = await webpush.sendNotification(subscription, payload);
    
    console.log(`✅ Push notification sent successfully`);
    return { 
      success: true, 
      status: result.statusCode || 200,
      headers: result.headers 
    };
    
  } catch (error) {
    console.error('❌ Push send error:', error);
    
    // Handle specific web push errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { 
        success: false, 
        error: 'Subscription expired or invalid',
        shouldDeactivate: true,
        statusCode: error.statusCode
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Unknown push error',
      statusCode: error.statusCode || 500
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔑 Authenticating user');
    
    // Extract JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Create service role client for all operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      throw new Error('Invalid token - no user ID found');
    }

    console.log(`✅ User ID extracted: ${userId}`);

    // Get user's first store
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', userId)
      .limit(1);

    if (storeError || !stores || stores.length === 0) {
      console.error('❌ No stores found for user');
      throw new Error('No stores found for user');
    }

    const store = stores[0];
    console.log(`📍 Using store: ${store.name} (${store.id})`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ Failed to get subscriptions:', subsError);
      throw new Error('Failed to get subscriptions');
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions for user`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No active push subscriptions found',
          message: 'Please enable push notifications first'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send test notification to each subscription
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    const notificationPayload = JSON.stringify({
      title: '🔔 Test Notification',
      body: 'Your push notifications are working perfectly!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        store_id: store.id,
        url: '/' // URL to open when notification is clicked
      }
    });

    for (const subscription of subscriptions) {
      try {
        console.log(`📤 Sending to subscription ${subscription.id}`);
        
        const result = await sendWebPushNotification(
          subscription.endpoint,
          subscription.p256dh,
          subscription.auth,
          notificationPayload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (result.success) {
          successCount++;
          console.log(`✅ Notification sent to subscription ${subscription.id}`);
          results.push({ 
            subscriptionId: subscription.id,
            status: 'success',
            device: subscription.device || 'unknown',
            statusCode: result.status
          });
        } else {
          errorCount++;
          console.log(`❌ Failed to send to subscription ${subscription.id}: ${result.error}`);
          
          // Deactivate expired subscriptions
          if (result.shouldDeactivate) {
            console.log(`🗑️ Deactivating expired subscription ${subscription.id}`);
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }
          
          results.push({ 
            subscriptionId: subscription.id,
            status: 'failed',
            error: result.error,
            device: subscription.device || 'unknown',
            statusCode: result.statusCode
          });
        }

      } catch (error) {
        console.error(`❌ Failed to send to subscription ${subscription.id}:`, error);
        errorCount++;
        results.push({ 
          subscriptionId: subscription.id,
          status: 'failed',
          error: error.message,
          device: subscription.device || 'unknown'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Test notification completed',
        summary: {
          successful: successCount,
          failed: errorCount,
          total: subscriptions.length
        },
        results,
        instructions: {
          mobile: 'On mobile, notifications appear in the notification shade/center',
          desktop: 'On desktop, notifications appear as system notifications',
          ios: 'On iOS, ensure the app is installed as PWA (Add to Home Screen)'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-test-push:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send test notification', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
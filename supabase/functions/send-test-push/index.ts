import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service role client for all operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from JWT token manually
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

    // Send test notification directly
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    let successCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      try {
        const notificationPayload = {
          title: '🔔 Test Notification',
          body: 'Your push notifications are working perfectly!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            store_id: store.id
          }
        };

        const pushRequest = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        // Use web-push library equivalent for Deno
        const webPushUrl = 'https://deno.land/x/web_push@0.0.6/mod.ts';
        const { sendNotification } = await import(webPushUrl);

        const options = {
          vapidDetails: {
            subject: 'mailto:test@example.com',
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey
          }
        };

        await sendNotification(pushRequest, JSON.stringify(notificationPayload), options);
        successCount++;
        console.log(`✅ Notification sent to subscription ${subscription.id}`);

      } catch (error) {
        console.error(`❌ Failed to send to subscription ${subscription.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Test notification completed',
        summary: {
          successful: successCount,
          failed: errorCount,
          total: subscriptions.length
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
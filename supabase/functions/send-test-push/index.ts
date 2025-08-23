import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request for send-test-push');
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      },
      status: 200 
    });
  }

  console.log(`🔔 ${req.method} request to send-test-push`);

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

    // Verify JWT token
    const tempSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await tempSupabase.auth.getUser(token);
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error(`Unauthorized: ${userError?.message || 'Invalid token'}`);
    }

    console.log(`🔔 Test push notification request by user ${user.email}`);

    // Get user's first store
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    if (storeError || !stores || stores.length === 0) {
      console.error('❌ No stores found for user');
      throw new Error('No stores found for user');
    }

    const storeId = stores[0].id;

    // Get push subscriptions for the user
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ Failed to get subscriptions:', subsError);
      throw new Error('Failed to get subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No active subscriptions found', 
          summary: { total: 0, successful: 0, failed: 0, expired: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending test push to ${subscriptions.length} subscriptions`);

    // Create test payload
    const testPayload = {
      title: '🔔 Test Notification',
      body: 'This is a test push notification from your store!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    };

    // Send test notifications to each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          console.log(`📨 Sending test to subscription ${sub.id}`);
          
          // Simple test notification without complex encryption
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
            },
            body: JSON.stringify(testPayload)
          });

          const success = response.status >= 200 && response.status < 300;
          console.log(`${success ? '✅' : '❌'} Test result for ${sub.id}: HTTP ${response.status}`);
          
          return { 
            subscription_id: sub.id, 
            success, 
            status: response.status,
            error: success ? undefined : `HTTP ${response.status}`,
          };
        } catch (error: any) {
          console.error(`❌ Test failed for ${sub.id}:`, error);
          return { 
            subscription_id: sub.id, 
            success: false, 
            status: 0,
            error: error.message,
          };
        }
      })
    );

    // Process results
    const testResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const successCount = testResults.filter(r => r.success).length;
    const failureCount = testResults.length - successCount;

    console.log(`📊 Test summary: ${successCount} sent, ${failureCount} failed out of ${testResults.length} total`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Test sent to ${successCount} devices, ${failureCount} failed`,
        summary: {
          total: testResults.length,
          successful: successCount,
          failed: failureCount,
          expired: 0,
        },
        results: testResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error sending test push notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send test push notifications', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
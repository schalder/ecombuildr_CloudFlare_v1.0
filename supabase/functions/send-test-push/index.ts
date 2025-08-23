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
    console.log('🔑 Authenticating user with JWT token');
    
    // Extract JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user with anon client
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log(`✅ User authenticated: ${user.email}`);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's first store
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', user.id)
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
      .select('id, endpoint, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ Failed to get subscriptions:', subsError);
      throw new Error('Failed to get subscriptions');
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions for user`);
    
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`Subscription ${index + 1}: {
  id: "${sub.id}",
  endpoint: "${sub.endpoint.substring(0, 50)}...",
  is_active: ${sub.is_active},
  created_at: "${sub.created_at}"
}`);
      });
    }

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

    // Send test notification via send-push function
    const testPayload = {
      title: '🔔 Test Notification',
      body: 'Your push notifications are working perfectly!',
      icon: '/favicon.ico',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        store_id: store.id
      }
    };

    console.log('📤 Calling send-push function...');

    const { data: pushResult, error: pushError } = await supabase.functions.invoke('send-push', {
      body: {
        storeId: store.id,
        payload: testPayload
      },
      headers: {
        Authorization: authHeader
      }
    });

    if (pushError) {
      console.error('❌ Error sending test push:', pushError);
      throw new Error(`Failed to send test notification: ${pushError.message}`);
    }

    console.log('✅ Test notification sent successfully');

    return new Response(
      JSON.stringify({ 
        message: 'Test notification sent successfully',
        result: pushResult
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
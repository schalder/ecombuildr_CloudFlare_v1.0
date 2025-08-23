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
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔑 Creating Supabase client with auth header');
    
    // Create Supabase client with service role to bypass auth issues
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // First, create a client to validate the user token
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ User authenticated: ${user.email}`);

    // Now use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's stores (we'll use the first one for the test)
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', user.id)
      .limit(1);

    if (storesError || !stores || stores.length === 0) {
      console.error('❌ No stores found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'No stores found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const store = stores[0];
    console.log(`📍 Using store: ${store.name} (${store.id})`);

    // Get user's push subscriptions for diagnostics
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    console.log(`Found ${subscriptions?.length || 0} push subscriptions for user`);
    
    if (subscriptions) {
      subscriptions.forEach((sub, index) => {
        console.log(`Subscription ${index + 1}:`, {
          id: sub.id,
          endpoint: sub.endpoint?.substring(0, 50) + '...',
          is_active: sub.is_active,
          created_at: sub.created_at
        });
      });
    }

    // Call the send-push function using service role
    const { data: pushResult, error: pushError } = await supabase.functions.invoke('send-push', {
      body: {
        storeId: store.id,
        payload: {
          title: '🔔 Test Notification',
          body: `This is a test notification for ${store.name}. Push notifications are working!`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test',
          data: {
            type: 'test',
            storeId: store.id,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    if (pushError) {
      console.error('❌ Error sending test push:', pushError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send test notification', 
          details: pushError.message,
          successful: 0,
          failed: subscriptions?.length || 0,
          subscriptions: subscriptions?.map(sub => ({
            id: sub.id,
            endpoint: sub.endpoint?.substring(0, 50) + '...',
            is_active: sub.is_active
          })) || []
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract detailed results from push response
    const successful = pushResult?.delivered || pushResult?.successful || 0;
    const failed = pushResult?.failed || 0;
    const results = pushResult?.results || pushResult?.details || [];

    console.log(`📊 Test notification results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: successful > 0 ? 'Test notification sent successfully' : 'Test notification failed to deliver',
        store: store.name,
        delivered: successful,
        failed,
        total: successful + failed,
        subscriptions: subscriptions?.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint?.substring(0, 50) + '...',
          is_active: sub.is_active,
          created_at: sub.created_at
        })) || [],
        results: Array.isArray(results) ? results.map((result: any) => ({
          success: result.success,
          endpointHost: result.endpointHost,
          status: result.status,
          error: result.error
        })) : []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-test-push function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send test notification', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
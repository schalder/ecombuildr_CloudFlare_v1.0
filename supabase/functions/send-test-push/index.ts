import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's stores (we'll use the first one for the test)
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', user.id)
      .limit(1);

    if (storesError || !stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No stores found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const store = stores[0];

    // Get user's push subscriptions for diagnostics
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

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

    // Call the send-push function
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
      console.error('Error sending test push:', pushError);
      return new Response(
        JSON.stringify({ error: 'Failed to send test notification', details: pushError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Test notification sent successfully',
        store: store.name,
        result: pushResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-test-push function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send test notification', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
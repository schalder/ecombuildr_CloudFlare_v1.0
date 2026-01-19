import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      store_id,
      website_id,
      funnel_id,
      event_id,
      event_data,
      browser_context,
    } = await req.json();

    if (!store_id || !event_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: store_id and event_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pixel config from website or funnel
    let pixel_id: string | null = null;
    let access_token: string | null = null;
    let test_event_code: string | null = null;

    // Try website first
    if (website_id) {
      const { data: website, error } = await supabase
        .from('websites')
        .select('facebook_pixel_id, facebook_access_token, facebook_test_event_code, facebook_server_side_enabled')
        .eq('id', website_id)
        .single();

      if (!error && website?.facebook_server_side_enabled && website?.facebook_pixel_id && website?.facebook_access_token) {
        pixel_id = website.facebook_pixel_id;
        access_token = website.facebook_access_token;
        test_event_code = website.facebook_test_event_code;
      }
    }

    // Try funnel if website didn't work
    if (!pixel_id && funnel_id) {
      const { data: funnel, error } = await supabase
        .from('funnels')
        .select('settings')
        .eq('id', funnel_id)
        .single();

      if (!error && funnel?.settings) {
        const settings = funnel.settings as any;
        if (settings.facebook_server_side_enabled && settings.facebook_pixel_id && settings.facebook_access_token) {
          pixel_id = settings.facebook_pixel_id;
          access_token = settings.facebook_access_token;
          test_event_code = settings.facebook_test_event_code || null;
        }
      }
    }

    if (!pixel_id || !access_token) {
      return new Response(
        JSON.stringify({ error: 'Facebook pixel not configured or server-side tracking not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call send-facebook-event edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-facebook-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        pixel_id,
        access_token,
        event_name: 'InitiateCheckout',
        event_data: event_data || {},
        user_data: {},
        browser_context: browser_context || {},
        event_id,
        event_time: Math.floor(Date.now() / 1000),
        test_event_code: test_event_code || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error calling send-facebook-event:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send event to Facebook', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-initiate-checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsletterSubscription {
  store_id: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { store_id, email }: NewsletterSubscription = await req.json();

    if (!store_id || !email) {
      return new Response(
        JSON.stringify({ error: 'Store ID and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use UPSERT to handle existing subscriptions without pre-SELECT (reduces RLS noise)
    const { data: subscription, error: upsertError } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        store_id,
        email: email.toLowerCase(),
        status: 'active',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null
      }, {
        onConflict: 'store_id,email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting newsletter subscription:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to subscribe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Newsletter subscription processed successfully:', subscription.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully subscribed to newsletter',
        subscription_id: subscription.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in subscribe-newsletter function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
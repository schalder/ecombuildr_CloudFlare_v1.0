import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookEvent {
  event_name: string;
  event_time: number;
  user_data: {
    em?: string[];
    ph?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_category?: string;
    content_type?: string;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price: number;
    }>;
    order_id?: string;
  };
  event_source_url?: string;
  action_source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      pixel_id,
      access_token,
      event_name,
      user_data,
      custom_data,
      event_source_url,
    } = await req.json()

    console.log('Facebook CAPI Event:', {
      pixel_id,
      event_name,
      user_data,
      custom_data
    })

    // Validate required fields
    if (!pixel_id || !access_token || !event_name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: pixel_id, access_token, event_name' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash email and phone for privacy
    const hashData = async (data: string): Promise<string> => {
      const encoder = new TextEncoder()
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data.toLowerCase().trim()))
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // Process user data
    const processedUserData: any = { ...user_data }
    if (user_data.em) {
      processedUserData.em = await Promise.all(
        user_data.em.map(email => hashData(email))
      )
    }
    if (user_data.ph) {
      processedUserData.ph = await Promise.all(
        user_data.ph.map(phone => hashData(phone.replace(/[^\d]/g, '')))
      )
    }

    // Prepare Facebook CAPI event
    const fbEvent: FacebookEvent = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      user_data: processedUserData,
      action_source: 'website',
      event_source_url,
    }

    if (custom_data) {
      fbEvent.custom_data = custom_data
    }

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pixel_id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          data: [fbEvent],
          test_event_code: Deno.env.get('FB_TEST_EVENT_CODE'), // Optional test event code
        }),
      }
    )

    const fbResult = await fbResponse.json()

    if (!fbResponse.ok) {
      console.error('Facebook CAPI Error:', fbResult)
      return new Response(
        JSON.stringify({ error: 'Failed to send event to Facebook', details: fbResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Facebook CAPI Success:', fbResult)

    return new Response(
      JSON.stringify({ success: true, facebook_response: fbResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in facebook-capi-events function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
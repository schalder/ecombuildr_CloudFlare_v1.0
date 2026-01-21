import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash function for user identifiers (SHA256) - same as Facebook
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Map event types to TikTok event names
function mapEventTypeToTikTok(eventType: string): string {
  const eventMap: Record<string, string> = {
    'PageView': 'PageView',
    'ViewContent': 'ViewContent',
    'AddToCart': 'AddToCart',
    'InitiateCheckout': 'InitiateCheckout',
    'Purchase': 'CompletePayment',
    'Search': 'Search',
    'AddPaymentInfo': 'AddPaymentInfo',
  };
  return eventMap[eventType] || eventType;
}

// Build TikTok Events API payload
async function buildTikTokPayload(
  pixelId: string,
  eventName: string,
  eventData: any,
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  },
  browserContext?: {
    ttclid?: string;
    client_user_agent?: string;
    client_ip_address?: string;
    event_source_url?: string;
  },
  eventId?: string,
  eventTime?: number,
  testEventCode?: string
): Promise<any> {
  // Hash user identifiers if available
  const properties: any = {
    event_id: eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: eventTime ? new Date(eventTime).toISOString() : new Date().toISOString(),
  };

  // Add user properties (hashed)
  const user: any = {};
  if (userData.email) {
    user.email = await hashValue(userData.email);
  }
  if (userData.phone) {
    const cleanPhone = userData.phone.replace(/\D/g, '');
    if (cleanPhone) {
      user.phone_number = await hashValue(cleanPhone);
    }
  }
  if (userData.firstName) {
    user.first_name = await hashValue(userData.firstName);
  }
  if (userData.lastName) {
    user.last_name = await hashValue(userData.lastName);
  }
  if (userData.city) {
    user.city = await hashValue(userData.city);
  }
  if (userData.state) {
    user.state = await hashValue(userData.state);
  }
  if (userData.zipCode) {
    user.zipcode = await hashValue(userData.zipCode);
  }
  if (userData.country) {
    user.country_code = await hashValue(userData.country);
  }

  // Add browser context
  if (browserContext) {
    if (browserContext.ttclid) {
      properties.ttclid = browserContext.ttclid;
    }
    if (browserContext.client_user_agent) {
      properties.user_agent = browserContext.client_user_agent;
    }
    if (browserContext.client_ip_address) {
      properties.ip = browserContext.client_ip_address;
    }
    if (browserContext.event_source_url) {
      properties.url = browserContext.event_source_url;
    }
  }

  // Add event properties
  if (eventData.value !== undefined) {
    properties.value = eventData.value;
  }
  if (eventData.currency) {
    properties.currency = eventData.currency;
  }
  if (eventData.contents && Array.isArray(eventData.contents)) {
    properties.contents = eventData.contents.map((item: any) => ({
      content_id: item.id || item.item_id,
      content_name: item.name || item.item_name,
      content_type: item.type || 'product',
      price: item.price || 0,
      quantity: item.quantity || 1,
    }));
  }
  if (eventData.content_ids && Array.isArray(eventData.content_ids)) {
    properties.content_id = eventData.content_ids[0]; // TikTok uses single content_id
  }
  if (eventData.content_name) {
    properties.content_name = eventData.content_name;
  }
  if (eventData.content_type) {
    properties.content_type = eventData.content_type;
  }

  // Build final payload
  const payload: any = {
    pixel_code: pixelId,
    event: eventName,
    timestamp: properties.timestamp,
    event_id: properties.event_id,
    properties: properties,
  };

  // Add user if we have any user data
  if (Object.keys(user).length > 0) {
    payload.user = user;
  }

  // Add test event code if provided
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  return payload;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      pixel_id,
      access_token,
      event_name,
      event_data,
      user_data,
      browser_context,
      event_id,
      event_time,
      test_event_code,
    } = await req.json();

    // Validate required fields
    if (!pixel_id || !access_token || !event_name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: pixel_id, access_token, and event_name are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-client-ip') ||
                     null;

    // Add client_ip_address to browser_context if not already present
    const enhancedBrowserContext = {
      ...browser_context,
      client_ip_address: browser_context?.client_ip_address || clientIp,
    };

    // Map event name to TikTok event name
    const tiktokEventName = mapEventTypeToTikTok(event_name);

    // Build TikTok payload
    const payload = await buildTikTokPayload(
      pixel_id,
      tiktokEventName,
      event_data || {},
      user_data || {},
      enhancedBrowserContext,
      event_id,
      event_time,
      test_event_code
    );

    // Send to TikTok Events API
    const tiktokUrl = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
    const response = await fetch(tiktokUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': access_token, // TikTok uses Access-Token header
      },
      body: JSON.stringify({
        events: [payload], // TikTok expects events array
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('TikTok API Error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: 'TikTok API error',
          details: responseData,
          status: response.status 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        data: responseData,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending TikTok event:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

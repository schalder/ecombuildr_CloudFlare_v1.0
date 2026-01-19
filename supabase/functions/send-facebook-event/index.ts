import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash function for user identifiers (SHA256)
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate if user data has sufficient information for Facebook matching
// Facebook requires at least one of these combinations:
// 1. Email (em)
// 2. Phone (ph)
// 3. First name + Last name (fn + ln)
// 4. City + State + Zip + Country (ct + st + zp + country)
function hasSufficientUserData(userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): boolean {
  // Check for email
  if (userData.email && userData.email.trim()) return true;
  
  // Check for phone
  if (userData.phone && userData.phone.trim()) return true;
  
  // Check for first name + last name
  if (userData.firstName && userData.lastName && 
      userData.firstName.trim() && userData.lastName.trim()) return true;
  
  // Check for city + state + zip + country
  if (userData.city && userData.state && userData.zipCode && userData.country &&
      userData.city.trim() && userData.state.trim() && 
      userData.zipCode.trim() && userData.country.trim()) return true;
  
  return false;
}

// Map event types to Facebook event names
function mapEventTypeToFacebook(eventType: string): string {
  const eventMap: Record<string, string> = {
    'PageView': 'PageView',
    'ViewContent': 'ViewContent',
    'AddToCart': 'AddToCart',
    'InitiateCheckout': 'InitiateCheckout',
    'Purchase': 'Purchase',
    'Search': 'Search',
    'AddPaymentInfo': 'AddPaymentInfo',
  };
  return eventMap[eventType] || eventType;
}

// Build Facebook Conversions API payload
async function buildFacebookPayload(
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
    fbp?: string;
    fbc?: string;
    client_user_agent?: string;
    event_source_url?: string;
  },
  eventId?: string,
  eventTime?: number,
  testEventCode?: string
): Promise<any> {
  // ✅ REMOVED: Strict validation that blocks events
  // ✅ NEW: Log warning but continue processing (PII is optional, not required)
  const hasUserPII = hasSufficientUserData(userData);
  if (!hasUserPII) {
    console.warn(`[CAPI] Event ${eventName} has insufficient user PII - will use browser context for matching`);
  }

  const hashedUserData: any = {};

  // Hash user identifiers if available (OPTIONAL, not required)
  if (userData.email) {
    hashedUserData.em = await hashValue(userData.email);
  }
  if (userData.phone) {
    // Remove non-numeric characters for phone hashing
    const cleanPhone = userData.phone.replace(/\D/g, '');
    if (cleanPhone) {
      hashedUserData.ph = await hashValue(cleanPhone);
    }
  }
  if (userData.firstName) {
    hashedUserData.fn = await hashValue(userData.firstName);
  }
  if (userData.lastName) {
    hashedUserData.ln = await hashValue(userData.lastName);
  }
  if (userData.city) {
    hashedUserData.ct = await hashValue(userData.city);
  }
  if (userData.state) {
    hashedUserData.st = await hashValue(userData.state);
  }
  if (userData.zipCode) {
    hashedUserData.zp = await hashValue(userData.zipCode);
  }
  if (userData.country) {
    hashedUserData.country = await hashValue(userData.country);
  }

  // ✅ ADD: Browser context fields (for matching when PII is missing)
  if (browserContext) {
    if (browserContext.fbp) {
      hashedUserData.fbp = browserContext.fbp;
    }
    if (browserContext.fbc) {
      hashedUserData.fbc = browserContext.fbc;
    }
    // ❌ REMOVED: client_user_agent should NOT be in user_data
    // Facebook doesn't accept client_user_agent as a user_data parameter
    // It should be at the event level instead
  }

  // Build event data
  const event: any = {
    event_name: eventName,
    event_time: eventTime || Math.floor(Date.now() / 1000),
    user_data: hashedUserData,
    action_source: 'website',
  };

  // ✅ ADD: event_source_url at event level (if available)
  if (browserContext?.event_source_url) {
    event.event_source_url = browserContext.event_source_url;
  }

  // ✅ ADD: client_user_agent at event level (if available)
  // Facebook requires client_user_agent at event level, not in user_data
  if (browserContext?.client_user_agent) {
    event.client_user_agent = browserContext.client_user_agent;
  }

  // Add event_id for deduplication (REQUIRED for proper deduplication)
  if (eventId) {
    event.event_id = eventId;
  } else {
    // Generate fallback event_id if not provided (shouldn't happen, but safety)
    console.warn(`[CAPI] Event ${eventName} missing event_id - generating fallback`);
    event.event_id = `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Add custom data for ecommerce events
  if (eventName === 'Purchase' || eventName === 'AddToCart' || eventName === 'InitiateCheckout' || eventName === 'ViewContent') {
    const customData: any = {};
    
    if (eventData.value !== undefined) {
      customData.value = eventData.value;
    }
    if (eventData.currency) {
      customData.currency = eventData.currency;
    }
    
    // Add content IDs and contents
    if (eventData.content_ids && Array.isArray(eventData.content_ids)) {
      customData.content_ids = eventData.content_ids;
    }
    if (eventData.contents && Array.isArray(eventData.contents)) {
      customData.contents = eventData.contents.map((item: any) => ({
        id: item.id || item.item_id,
        quantity: item.quantity || 1,
        // ✅ FIX: Include item_price (now available in contents array)
        item_price: item.price || item.item_price || undefined, // Only include if available
      })).filter((item: any) => item.item_price !== undefined || item.id); // Filter out invalid items
    }
    
    if (eventData.content_name) {
      customData.content_name = eventData.content_name;
    }
    if (eventData.content_type) {
      customData.content_type = eventData.content_type;
    }
    if (eventData.num_items !== undefined) {
      customData.num_items = eventData.num_items;
    }

    if (Object.keys(customData).length > 0) {
      event.custom_data = customData;
    }
  }

  // Build final payload
  const payload: any = {
    data: [event],
    access_token: '', // Will be set by caller
  };

  // Add test event code if provided
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  // ✅ ALWAYS return payload (never null)
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
      browser_context, // ✅ NEW: Extract browser context
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

    // Map event name to Facebook event name
    const facebookEventName = mapEventTypeToFacebook(event_name);

    // ✅ Build Facebook payload - ALWAYS send (never null)
    const payload = await buildFacebookPayload(
      pixel_id,
      facebookEventName,
      event_data || {},
      user_data || {},
      browser_context || {}, // ✅ Pass browser context
      event_id,
      event_time,
      test_event_code
    );

    // ✅ REMOVED: Null check - payload is always returned now

    // Set access token
    payload.access_token = access_token;

    // Send to Facebook Conversions API
    const facebookUrl = `https://graph.facebook.com/v18.0/${pixel_id}/events`;
    const response = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Facebook API Error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: 'Facebook API error',
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
        events_received: responseData.events_received || 0,
        messages: responseData.messages || [],
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending Facebook event:', error);
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


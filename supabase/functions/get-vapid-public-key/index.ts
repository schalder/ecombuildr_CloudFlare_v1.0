import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate VAPID public key format
function validateVapidPublicKey(key: string): boolean {
  try {
    // Remove any whitespace
    const cleanKey = key.trim();
    
    // Should be base64url encoded, typically 87 characters for P-256
    if (cleanKey.length !== 87) {
      console.error(`❌ Invalid VAPID public key length: ${cleanKey.length}, expected 87`);
      return false;
    }
    
    // Should only contain base64url characters
    if (!/^[A-Za-z0-9_-]+$/.test(cleanKey)) {
      console.error('❌ Invalid VAPID public key format: contains invalid characters');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error validating VAPID public key:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!vapidPublicKey) {
      console.error('❌ VAPID_PUBLIC_KEY not configured in environment variables');
      throw new Error('VAPID public key not configured');
    }

    // Validate the key format
    if (!validateVapidPublicKey(vapidPublicKey)) {
      console.error('❌ VAPID_PUBLIC_KEY is not in correct format');
      throw new Error('VAPID public key format is invalid');
    }

    console.log('✅ Returning validated VAPID_PUBLIC_KEY');

    return new Response(
      JSON.stringify({ publicKey: vapidPublicKey.trim() }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get VAPID public key', 
        details: error.message,
        help: 'Please ensure VAPID_PUBLIC_KEY is a valid base64url-encoded P-256 public key (87 characters)'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
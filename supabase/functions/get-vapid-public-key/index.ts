import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate and convert VAPID public key
function validateAndConvertVapidKey(key: string): string | null {
  try {
    const cleanKey = key.trim();
    console.log(`🔍 Validating VAPID key: length=${cleanKey.length}, first10=${cleanKey.substring(0, 10)}`);
    
    // Try to convert to see if it's valid
    try {
      // Handle different possible formats
      let base64Key = cleanKey;
      
      // If it looks like base64url (contains - or _), convert to base64
      if (cleanKey.includes('-') || cleanKey.includes('_')) {
        base64Key = cleanKey.replace(/-/g, '+').replace(/_/g, '/');
      }
      
      // Add padding if needed
      const padding = '='.repeat((4 - base64Key.length % 4) % 4);
      base64Key = base64Key + padding;
      
      // Try to decode
      const binaryData = atob(base64Key);
      
      // P-256 public key should be 65 bytes (uncompressed format)
      if (binaryData.length !== 65) {
        console.error(`❌ Invalid key length after decoding: ${binaryData.length}, expected 65`);
        return null;
      }
      
      // Check first byte should be 0x04 for uncompressed P-256 public key
      if (binaryData.charCodeAt(0) !== 0x04) {
        console.error(`❌ Invalid P-256 key format: first byte is 0x${binaryData.charCodeAt(0).toString(16)}, expected 0x04`);
        return null;
      }
      
      // Convert back to base64url for client
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      // Encode as base64url
      const base64 = btoa(String.fromCharCode(...uint8Array));
      const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      console.log(`✅ Key validated and converted: input=${cleanKey.length}chars, output=${base64url.length}chars`);
      return base64url;
      
    } catch (decodeError) {
      console.error('❌ Failed to decode VAPID key:', decodeError);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error validating VAPID public key:', error);
    return null;
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

    // Validate and convert the key
    const validatedKey = validateAndConvertVapidKey(vapidPublicKey);
    if (!validatedKey) {
      console.error('❌ VAPID_PUBLIC_KEY is not in correct format');
      throw new Error('VAPID public key format is invalid');
    }

    console.log('✅ Returning validated VAPID_PUBLIC_KEY');

    return new Response(
      JSON.stringify({ publicKey: validatedKey }),
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
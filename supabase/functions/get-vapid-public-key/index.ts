
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    // If public key not found, derive it from private key
    if (!vapidPublicKey) {
      console.log('🔄 VAPID_PUBLIC_KEY not found, deriving from private key');
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
      
      if (!vapidPrivateKey) {
        throw new Error('Neither VAPID_PUBLIC_KEY nor VAPID_PRIVATE_KEY configured');
      }
      
      try {
        // Decode base64url private key
        const base64urlDecode = (str: string): Uint8Array => {
          const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
          const padding = '='.repeat((4 - base64.length % 4) % 4);
          return new Uint8Array(Array.from(atob(base64 + padding), c => c.charCodeAt(0)));
        };
        
        const privateKeyBytes = base64urlDecode(vapidPrivateKey);
        
        // Import private key for ECDSA
        const privateKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyBytes,
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign']
        );
        
        // Export the public key in raw format
        const publicKeyBuffer = await crypto.subtle.exportKey('raw', privateKey);
        
        // Convert to base64url for client use
        const publicKeyBytes = new Uint8Array(publicKeyBuffer);
        vapidPublicKey = btoa(String.fromCharCode(...publicKeyBytes))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        
        console.log('✅ Public key derived successfully from private key');
      } catch (derivationError) {
        console.error('❌ Failed to derive public key:', derivationError);
        throw new Error('Failed to derive public key from private key');
      }
    } else {
      console.log('✅ Using configured VAPID_PUBLIC_KEY');
    }

    return new Response(
      JSON.stringify({ publicKey: vapidPublicKey }),
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
      JSON.stringify({ error: 'Failed to get VAPID public key' }),
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

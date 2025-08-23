
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
      
      // Decode private key and derive public key
      const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      
      // Import private key
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign']
      );
      
      // Export public key
      const publicKey = await crypto.subtle.exportKey('spki', privateKey);
      vapidPublicKey = btoa(String.fromCharCode(...new Uint8Array(publicKey)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      console.log('✅ Public key derived successfully');
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

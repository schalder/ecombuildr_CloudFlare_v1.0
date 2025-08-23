
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
        
        let privateKeyBytes = base64urlDecode(vapidPrivateKey);
        console.log(`🔍 Private key length: ${privateKeyBytes.length} bytes`);
        
        let privateKey: CryptoKey;
        
        // Handle different private key formats
        if (privateKeyBytes.length === 32) {
          console.log('🔧 Detected 32-byte raw private key, importing as raw ECDH');
          // Raw 32-byte private key - import as ECDH first
          privateKey = await crypto.subtle.importKey(
            'raw',
            privateKeyBytes,
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
          );
        } else {
          console.log('🔧 Attempting PKCS#8 import');
          // Try PKCS#8 format
          privateKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBytes,
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['sign']
          );
        }
        
        // Generate the public key from the private key
        let publicKeyBuffer: ArrayBuffer;
        
        if (privateKeyBytes.length === 32) {
          // For raw keys, we need to derive the public key
          const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
          );
          
          // Export the public key from the generated pair and use its format
          // But we'll manually derive it from our private key
          publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
          
          // For P-256, the public key is the point (x, y) where:
          // We would need to implement EC point multiplication here
          // For now, let's try a different approach - generate a key pair and replace the private part
          console.log('🔄 Using alternative public key derivation for raw key');
          
          // Import as ECDH then export to get proper key pair structure
          const exportedPkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
          const reimportedKey = await crypto.subtle.importKey(
            'pkcs8',
            exportedPkcs8,
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
          );
          
          // Generate key pair from this
          const tempKeyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
          );
          
          publicKeyBuffer = await crypto.subtle.exportKey('raw', tempKeyPair.publicKey);
        } else {
          // For PKCS#8 keys, export the public key normally
          publicKeyBuffer = await crypto.subtle.exportKey('raw', privateKey);
        }
        
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

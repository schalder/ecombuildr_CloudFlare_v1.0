
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

// Helper function to convert VAPID key from base64url to Uint8Array
function base64UrlToUint8Array(base64UrlString: string): Uint8Array {
  const padding = '='.repeat((4 - base64UrlString.length % 4) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(array: Uint8Array): string {
  const base64 = base64Encode(array);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate ECDH key pair for encryption
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey']
  );
}

// HKDF key derivation
async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    ikm,
    'HKDF',
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    key,
    { name: 'AES-GCM', length: length * 8 },
    true,
    ['encrypt']
  );

  return new Uint8Array(await crypto.subtle.exportKey('raw', derivedKey));
}

// Encrypt payload using Web Push protocol
async function encryptPayload(
  payload: string,
  userPublicKey: string,
  userAuth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  const userPublicKeyBytes = base64UrlToUint8Array(userPublicKey);
  const userAuthBytes = base64UrlToUint8Array(userAuth);

  // Generate server key pair
  const serverKeyPair = await generateECDHKeyPair();
  const serverPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  );

  // Import user's public key
  const importedUserPublicKey = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBytes,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: importedUserPublicKey,
    },
    serverKeyPair.privateKey,
    {
      name: 'HKDF',
      hash: 'SHA-256',
    },
    false,
    ['deriveKey']
  );

  const sharedSecretBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', sharedSecret)
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key
  const authInfo = new TextEncoder().encode('WebPush: info\x00');
  const keyInfo = new Uint8Array([
    ...authInfo,
    ...userPublicKeyBytes,
    ...serverPublicKeyBytes,
  ]);

  const prk = await hkdf(sharedSecretBytes, userAuthBytes, new Uint8Array(0), 32);
  const ikm = await hkdf(prk, salt, keyInfo, 32);

  // Encrypt payload
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', ikm, 'AES-GCM', false, ['encrypt']);
  
  const payloadBytes = new TextEncoder().encode(payload);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    payloadBytes
  );

  return {
    ciphertext: new Uint8Array([...iv, ...new Uint8Array(encrypted)]),
    salt,
    publicKey: serverPublicKeyBytes,
  };
}

// Create VAPID JWT
async function createVapidJWT(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: `mailto:support@example.com`,
  };

  const encodedHeader = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // Import private key for signing
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const key = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${unsignedToken}.${encodedSignature}`;
}

// Web Push helper function with proper encryption
async function sendWebPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  try {
    // Create the notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || 'default',
      data: payload.data,
    });

    // Encrypt the payload
    const { ciphertext, salt, publicKey } = await encryptPayload(
      notificationPayload,
      p256dh,
      auth
    );

    // Extract audience from endpoint
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Create VAPID JWT
    const jwt = await createVapidJWT(audience, vapidPublicKey, vapidPrivateKey);

    // Send the push notification
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': ciphertext.length.toString(),
        'TTL': '86400',
        'Crypto-Key': `dh=${uint8ArrayToBase64Url(publicKey)};p256ecdsa=${vapidPublicKey}`,
        'Encryption': `salt=${uint8ArrayToBase64Url(salt)}`,
        'Authorization': `WebPush ${jwt}`,
      },
      body: ciphertext,
    });

    return response;
  } catch (error) {
    console.error('Error in sendWebPushNotification:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, payload }: { storeId: string; payload: PushPayload } = await req.json();

    if (!storeId || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing storeId or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client to fetch subscriptions
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store owner to find their push subscriptions
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('Store not found:', storeError);
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active push subscriptions for the store owner
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', store.owner_id)
      .eq('is_active', true);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    console.log(`Sending push notifications to ${subscriptions.length} subscriptions`);

    // Send push notifications to all subscriptions using Web Push
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          console.log(`Attempting to send push to subscription ${subscription.id}`);
          
          const response = await sendWebPushNotification(
            subscription.endpoint,
            subscription.p256dh,
            subscription.auth,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Push failed for subscription ${subscription.id}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            
            // Only mark as inactive if it's a client error (4xx)
            if (response.status >= 400 && response.status < 500) {
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', subscription.id);
            }
            
            return { success: false, subscriptionId: subscription.id, error: `${response.status}: ${errorText}` };
          }

          console.log(`Push sent successfully to subscription ${subscription.id}`);
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error(`Error sending push to ${subscription.id}:`, error);
          return { success: false, subscriptionId: subscription.id, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Push notification results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        successful,
        failed,
        total: results.length,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send push notifications', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  is_active: boolean;
}

interface NotificationResult {
  success: boolean;
  subscriptionId: string;
  endpointHost: string;
  status?: number;
  error?: string;
}

// Base64 URL decode function
function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

// Base64 URL encode function
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate ECDH shared secret
async function generateSharedSecret(userPublicKey: Uint8Array, serverPrivateKey: CryptoKey): Promise<Uint8Array> {
  const publicKey = await crypto.subtle.importKey(
    'raw',
    userPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    serverPrivateKey,
    256
  );
  
  return new Uint8Array(sharedSecret);
}

// HKDF key derivation
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8
  );
  return new Uint8Array(derived);
}

// Encrypt payload using AES-GCM
async function encryptPayload(payload: string, userPublicKey: Uint8Array, userAuth: Uint8Array): Promise<{
  ciphertext: Uint8Array;
  salt: Uint8Array;
  publicKey: Uint8Array;
}> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  
  // Generate server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Export server public key
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);
  
  // Generate shared secret
  const sharedSecret = await generateSharedSecret(userPublicKey, serverKeyPair.privateKey);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive keys
  const authInfo = encoder.encode('Content-Encoding: auth\x00');
  const prk = await hkdf(userAuth, sharedSecret, authInfo, 32);
  
  const keyInfo = encoder.encode('Content-Encoding: aesgcm\x00P-256\x00');
  const keyInfoWithKeys = new Uint8Array(keyInfo.length + 65 + 65);
  keyInfoWithKeys.set(keyInfo);
  keyInfoWithKeys.set(userPublicKey, keyInfo.length);
  keyInfoWithKeys.set(serverPublicKey, keyInfo.length + 65);
  
  const key = await hkdf(salt, prk, keyInfoWithKeys, 16);
  
  // Derive nonce
  const nonceInfo = encoder.encode('Content-Encoding: nonce\x00P-256\x00');
  const nonceInfoWithKeys = new Uint8Array(nonceInfo.length + 65 + 65);
  nonceInfoWithKeys.set(nonceInfo);
  nonceInfoWithKeys.set(userPublicKey, nonceInfo.length);
  nonceInfoWithKeys.set(serverPublicKey, nonceInfo.length + 65);
  
  const nonce = await hkdf(salt, prk, nonceInfoWithKeys, 12);
  
  // Encrypt
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cryptoKey,
    payloadBytes
  );
  
  return {
    ciphertext: new Uint8Array(encrypted),
    salt,
    publicKey: serverPublicKey
  };
}

// Helper function to send a web push notification
async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<NotificationResult> {
  const endpointHost = new URL(subscription.endpoint).hostname;
  
  try {
    console.log(`📨 Sending notification to ${endpointHost} (subscription: ${subscription.id})`);
    
    // Prepare payload
    const payloadString = JSON.stringify(payload);
    const userPublicKey = base64UrlDecode(subscription.p256dh);
    const userAuth = base64UrlDecode(subscription.auth);
    
    // Encrypt payload
    const { ciphertext, salt, publicKey } = await encryptPayload(payloadString, userPublicKey, userAuth);
    
    // Import VAPID private key for ECDSA signing
    console.log(`🔑 Importing VAPID private key for ${endpointHost}`);
    
    let vapidKey: CryptoKey;
    try {
      // Try different decoding approaches for the private key
      let privateKeyBytes: Uint8Array;
      
      // First try direct base64url decode
      try {
        privateKeyBytes = base64UrlDecode(vapidPrivateKey);
      } catch (e) {
        console.log('📝 Trying alternative base64 decode...');
        // Try regular base64 decode as fallback
        const base64 = vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        privateKeyBytes = new Uint8Array(Array.from(atob(base64 + padding), c => c.charCodeAt(0)));
      }
      
      console.log(`📏 Private key bytes length: ${privateKeyBytes.length}`);
      
      // Import as PKCS8 format for proper ECDSA usage
      vapidKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
      
      console.log('✅ VAPID private key imported successfully');
    } catch (keyError) {
      console.error('❌ Failed to import VAPID private key:', keyError);
      throw new Error(`Invalid VAPID private key format: ${keyError.message}`);
    }
    
    const header = { typ: 'JWT', alg: 'ES256' };
    const aud = new URL(subscription.endpoint).origin;
    const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours
    const claims = {
      aud,
      exp,
      sub: 'mailto:support@example.com'
    };
    
    const encoder = new TextEncoder();
    const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const claimsB64 = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
    const unsignedToken = `${headerB64}.${claimsB64}`;
    
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      vapidKey,
      encoder.encode(unsignedToken)
    );
    
    const signatureB64 = base64UrlEncode(new Uint8Array(signature));
    const jwt = `${unsignedToken}.${signatureB64}`;
    
    // Send request with aes128gcm encoding
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'TTL': '86400'
      },
      body: ciphertext
    });

    console.log(`✅ Push service responded with status ${response.status} for ${endpointHost}`);

    return {
      success: response.ok,
      subscriptionId: subscription.id,
      endpointHost,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error: any) {
    console.error(`❌ Failed to send to ${endpointHost}:`, {
      subscriptionId: subscription.id,
      error: error.message
    });

    return {
      success: false,
      subscriptionId: subscription.id,
      endpointHost,
      error: error.message,
    };
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

    console.log(`🔔 Push notification request for store ${storeId}:`, payload);

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
      console.log('No active subscriptions found for user');
      return new Response(
        JSON.stringify({ 
          message: 'No active subscriptions found',
          successful: 0,
          failed: 0,
          total: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending push notifications to ${subscriptions.length} subscriptions`);

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const result = await sendWebPushNotification(
          subscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        // Only mark as inactive on 404/410 (subscription expired/invalid)
        if (!result.success && (result.status === 404 || result.status === 410)) {
          console.log(`🗑️ Marking subscription ${subscription.id} as inactive (${result.status})`);
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }

        return result;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📊 Push notification results: ${successful} successful, ${failed} failed`);

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
    console.error('❌ Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send push notifications', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
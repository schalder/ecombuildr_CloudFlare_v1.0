import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

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
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationResult {
  subscriptionId: string;
  success: boolean;
  error?: string;
}

// Simple base64url encoding/decoding
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  return new Uint8Array(Array.from(atob(base64 + padding), c => c.charCodeAt(0)));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Convert raw 32-byte private key to PKCS#8 format
function rawKeyToPKCS8(rawKey: Uint8Array): Uint8Array {
  // PKCS#8 wrapper for P-256 private key (simplified version)
  const prefix = new Uint8Array([
    0x30, 0x67, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x4d, 0x30, 0x4b, 0x02, 0x01, 0x01, 0x04, 0x20
  ]);
  
  const suffix = new Uint8Array([
    0xa1, 0x24, 0x03, 0x22, 0x00, 0x04
  ]);
  
  // For now, use a minimal valid structure without the public key part
  const result = new Uint8Array(prefix.length + rawKey.length + 2);
  let offset = 0;
  
  result.set(prefix, offset);
  offset += prefix.length;
  result.set(rawKey, offset);
  
  return result;
}

async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<NotificationResult> {
  try {
    console.log(`📨 Sending notification to ${new URL(subscription.endpoint).hostname} (subscription: ${subscription.id})`);
    
    // Prepare the payload
    const payloadString = JSON.stringify(payload);
    const payloadBuffer = new TextEncoder().encode(payloadString);
    
    // Get subscriber's public key and auth
    const subscriberPublicKey = base64UrlDecode(subscription.keys.p256dh);
    const subscriberAuth = base64UrlDecode(subscription.keys.auth);
    
    // Generate ephemeral key pair for encryption
    const ephemeralKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );
    
    // Derive shared secret
    const userPublicKeyForECDH = await crypto.subtle.importKey(
      'raw',
      subscriberPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: userPublicKeyForECDH },
      ephemeralKeyPair.privateKey,
      256
    );
    
    // Simple encryption using AES-GCM
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Use the shared secret directly as key material (simplified)
    const keyMaterial = new Uint8Array(sharedSecret).slice(0, 32);
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      payloadBuffer
    );
    
    // Get ephemeral public key
    const ephemeralPublicKey = await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);
    
    // Prepare VAPID JWT
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 24 * 60 * 60; // 24 hours
    const audience = new URL(subscription.endpoint).origin;
    
    const vapidHeader = {
      typ: 'JWT',
      alg: 'ES256'
    };
    
    const vapidPayload = {
      aud: audience,
      exp: exp,
      sub: 'mailto:admin@example.com'
    };
    
    // Encode JWT parts
    const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(vapidHeader)));
    const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(vapidPayload)));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    
    // Import VAPID private key for signing
    console.log(`🔑 Importing VAPID private key for ${new URL(subscription.endpoint).hostname}`);
    
    let privateKeyBytes = base64UrlDecode(vapidPrivateKey);
    console.log(`📏 Private key bytes length: ${privateKeyBytes.length}`);
    
    // Handle different key formats
    if (privateKeyBytes.length === 32) {
      console.log('🔧 Converting 32-byte raw key to PKCS#8 format');
      // For raw keys, we'll import them directly as ECDSA keys
      const privateKey = await crypto.subtle.importKey(
        'raw',
        privateKeyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
      
      // Sign the JWT
      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        privateKey,
        new TextEncoder().encode(unsignedToken)
      );
      
      const encodedSignature = base64UrlEncode(new Uint8Array(signature));
      const jwt = `${unsignedToken}.${encodedSignature}`;
      
      // Prepare the request body (simple concatenation for basic encryption)
      const body = new Uint8Array(salt.length + ephemeralPublicKey.byteLength + encrypted.byteLength);
      body.set(salt, 0);
      body.set(new Uint8Array(ephemeralPublicKey), salt.length);
      body.set(new Uint8Array(encrypted), salt.length + ephemeralPublicKey.byteLength);
      
      // Send the push notification
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
          'TTL': '86400'
        },
        body
      });
      
      if (response.ok) {
        console.log(`✅ Successfully sent to ${new URL(subscription.endpoint).hostname}`);
        return { subscriptionId: subscription.id, success: true };
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to send (${response.status}): ${errorText}`);
        return { 
          subscriptionId: subscription.id, 
          success: false, 
          error: `HTTP ${response.status}: ${errorText}` 
        };
      }
    } else {
      // For PKCS#8 or other formats, try importing directly
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
      
      // Sign the JWT
      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        privateKey,
        new TextEncoder().encode(unsignedToken)
      );
      
      const encodedSignature = base64UrlEncode(new Uint8Array(signature));
      const jwt = `${unsignedToken}.${encodedSignature}`;
      
      // Prepare the request body
      const body = new Uint8Array(salt.length + ephemeralPublicKey.byteLength + encrypted.byteLength);
      body.set(salt, 0);
      body.set(new Uint8Array(ephemeralPublicKey), salt.length);
      body.set(new Uint8Array(encrypted), salt.length + ephemeralPublicKey.byteLength);
      
      // Send the push notification
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
          'TTL': '86400'
        },
        body
      });
      
      if (response.ok) {
        console.log(`✅ Successfully sent to ${new URL(subscription.endpoint).hostname}`);
        return { subscriptionId: subscription.id, success: true };
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to send (${response.status}): ${errorText}`);
        return { 
          subscriptionId: subscription.id, 
          success: false, 
          error: `HTTP ${response.status}: ${errorText}` 
        };
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to send to ${new URL(subscription.endpoint).hostname}:`, error);
    return { 
      subscriptionId: subscription.id, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { storeId, payload } = await req.json();
    
    console.log(`🔔 Push notification request for store ${storeId}:`, JSON.stringify(payload, null, 2));

    // Get store owner
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    // Get push subscriptions for the store owner
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', store.owner_id)
      .eq('is_active', true);

    if (subsError) {
      throw new Error('Failed to get subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found', delivered: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending push notifications to ${subscriptions.length} subscriptions`);

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendWebPushNotification(
        {
          id: sub.id,
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        },
        payload,
        vapidPublicKey,
        vapidPrivateKey
      ))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Deactivate subscriptions that returned 404/410 (subscription expired)
    const failedSubscriptionIds = results
      .filter(r => r.status === 'fulfilled' && !r.value.success && 
               (r.value.error?.includes('404') || r.value.error?.includes('410')))
      .map(r => (r as any).value.subscriptionId);

    if (failedSubscriptionIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('id', failedSubscriptionIds);
    }

    console.log(`📊 Push notification results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent', 
        delivered: successful, 
        failed,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' })
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
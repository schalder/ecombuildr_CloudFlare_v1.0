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
    console.log('🏥 Push notification health check started');

    // Check VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    const vapidKeysConfigured = !!(vapidPublicKey && vapidPrivateKey);
    console.log(`🔑 VAPID keys configured: ${vapidKeysConfigured}`);

    // Check Supabase environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey);
    console.log(`🗄️ Supabase configured: ${supabaseConfigured}`);

    // Test Web Crypto API availability
    let webCryptoAvailable = false;
    try {
      await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
      webCryptoAvailable = true;
    } catch (error) {
      console.error('❌ Web Crypto API test failed:', error);
    }
    console.log(`🔐 Web Crypto API available: ${webCryptoAvailable}`);

    // Test VAPID key format and cryptographic validity
    let vapidKeysValid = false;
    let vapidCryptoValid = false;
    
    if (vapidKeysConfigured) {
      try {
        // Basic format validation
        const publicKeyValid = vapidPublicKey.length === 87 && /^[A-Za-z0-9_-]+$/.test(vapidPublicKey);
        const privateKeyValid = vapidPrivateKey.length === 43 && /^[A-Za-z0-9_-]+$/.test(vapidPrivateKey);
        vapidKeysValid = publicKeyValid && privateKeyValid;
        console.log(`🔍 VAPID key format validation: ${vapidKeysValid}`);
        
        // Test cryptographic import and signing
        if (vapidKeysValid && webCryptoAvailable) {
          try {
            // Helper function for key conversion
            function urlBase64ToUint8Array(base64String: string): Uint8Array {
              const padding = '='.repeat((4 - base64String.length % 4) % 4);
              const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

              const rawData = atob(base64);
              const outputArray = new Uint8Array(rawData.length);

              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              return outputArray;
            }
            
            // Convert keys to proper format
            const privateKeyBytes = urlBase64ToUint8Array(vapidPrivateKey);
            
            // Test private key import (use 'raw' format for VAPID keys, not PKCS8)
            const privateKey = await crypto.subtle.importKey(
              'raw',
              privateKeyBytes,
              { name: 'ECDSA', namedCurve: 'P-256' },
              false,
              ['sign']
            );
            
            // Test signing operation
            const testData = new TextEncoder().encode('health-check');
            const signature = await crypto.subtle.sign(
              { name: 'ECDSA', hash: 'SHA-256' },
              privateKey,
              testData
            );
            
            vapidCryptoValid = signature.byteLength > 0;
            console.log(`🔐 VAPID cryptographic test: ${vapidCryptoValid}`);
            
          } catch (cryptoError) {
            console.error('❌ VAPID cryptographic test failed:', cryptoError);
            vapidCryptoValid = false;
          }
        }
      } catch (error) {
        console.error('❌ VAPID key validation failed:', error);
      }
    }

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        vapidKeysConfigured,
        vapidKeysValid,
        vapidCryptoValid,
        supabaseConfigured,
        webCryptoAvailable
      },
      environment: {
        deno: Deno.version.deno,
        runtime: 'supabase-edge'
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on check results
    if (!vapidKeysConfigured) {
      healthStatus.recommendations.push('Configure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase secrets');
    } else if (!vapidKeysValid) {
      healthStatus.recommendations.push('VAPID keys appear to be in wrong format - should be base64url encoded');
    } else if (!vapidCryptoValid) {
      healthStatus.recommendations.push('VAPID keys failed cryptographic validation - may be corrupted or wrong format');
    }
    
    if (!supabaseConfigured) {
      healthStatus.recommendations.push('Ensure all Supabase environment variables are configured');
    }
    
    if (!webCryptoAvailable) {
      healthStatus.recommendations.push('Web Crypto API unavailable - check Deno environment');
    }

    const allChecksPass = Object.values(healthStatus.checks).every(check => check);
    if (!allChecksPass) {
      healthStatus.status = 'unhealthy';
    }

    console.log(`📊 Health check result: ${healthStatus.status}`);

    return new Response(
      JSON.stringify(healthStatus),
      { 
        status: allChecksPass ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
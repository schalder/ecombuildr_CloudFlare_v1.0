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

    // Test VAPID key format if available
    let vapidKeysValid = false;
    if (vapidKeysConfigured) {
      try {
        // Basic format validation
        const publicKeyValid = vapidPublicKey.length === 87 && /^[A-Za-z0-9_-]+$/.test(vapidPublicKey);
        const privateKeyValid = vapidPrivateKey.length === 43 && /^[A-Za-z0-9_-]+$/.test(vapidPrivateKey);
        vapidKeysValid = publicKeyValid && privateKeyValid;
        console.log(`🔍 VAPID key format validation: ${vapidKeysValid}`);
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
        supabaseConfigured,
        webCryptoAvailable
      },
      environment: {
        deno: Deno.version.deno,
        runtime: 'supabase-edge'
      }
    };

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
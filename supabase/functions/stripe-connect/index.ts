// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface StripeConnectInitiateRequest {
  storeId: string;
}

interface StripeConnectCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

// Simple encryption/decryption using Web Crypto API
// Note: In production, consider using Supabase Vault for better security
async function encryptToken(token: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const keyData = encoder.encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Stripe Connect credentials from environment
    const STRIPE_CLIENT_ID = Deno.env.get('STRIPE_CONNECT_CLIENT_ID');
    const STRIPE_CLIENT_SECRET = Deno.env.get('STRIPE_CONNECT_CLIENT_SECRET');
    const ENCRYPTION_KEY = Deno.env.get('STRIPE_ENCRYPTION_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || 'default-key-32-chars-long!!';

    if (!STRIPE_CLIENT_ID || !STRIPE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stripe Connect not configured. Please set STRIPE_CONNECT_CLIENT_ID and STRIPE_CONNECT_CLIENT_SECRET environment variables.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle OAuth callback
    if (req.method === 'GET' && path.includes('/callback')) {
      const params: StripeConnectCallbackQuery = Object.fromEntries(url.searchParams);
      
      if (params.error) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: params.error_description || params.error 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!params.code || !params.state) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing authorization code or state' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Extract storeId from state
      const storeId = params.state;

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: STRIPE_CLIENT_ID,
          client_secret: STRIPE_CLIENT_SECRET,
          code: params.code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Stripe token exchange error:', errorData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorData.error_description || 'Failed to exchange authorization code' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token, stripe_user_id, stripe_publishable_key } = tokenData;

      // Get account information from Stripe
      const accountResponse = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      let accountEmail = '';
      let accountName = '';
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        accountEmail = accountData.email || '';
        accountName = accountData.business_profile?.name || accountData.display_name || '';
      }

      // Encrypt tokens before storing
      const encryptedAccessToken = await encryptToken(access_token, ENCRYPTION_KEY);
      const encryptedRefreshToken = refresh_token ? await encryptToken(refresh_token, ENCRYPTION_KEY) : '';

      // Get current store settings
      const { data: currentStore, error: storeError } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single();

      if (storeError) {
        throw new Error('Store not found');
      }

      const currentSettings = (currentStore?.settings as Record<string, any>) || {};
      
      // Update payment settings with Stripe configuration
      const updatedSettings = {
        ...currentSettings,
        payment: {
          ...(currentSettings.payment || {}),
          stripe: {
            enabled: currentSettings.payment?.stripe?.enabled || false,
            stripe_account_id: stripe_user_id,
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
            account_email: accountEmail,
            account_name: accountName,
            publishable_key: stripe_publishable_key,
            is_live: currentSettings.payment?.stripe?.is_live || false,
          },
        },
        // Also maintain backward compatibility
        stripe: {
          enabled: currentSettings.payment?.stripe?.enabled || false,
          stripe_account_id: stripe_user_id,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          account_email: accountEmail,
          account_name: accountName,
          publishable_key: stripe_publishable_key,
          is_live: currentSettings.payment?.stripe?.is_live || false,
        },
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('stores')
        .update({ settings: updatedSettings })
        .eq('id', storeId);

      if (updateError) {
        throw new Error(`Failed to save Stripe configuration: ${updateError.message}`);
      }

      // Redirect to success page (frontend will handle this)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Stripe account connected successfully',
          account_email: accountEmail,
          account_name: accountName,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle OAuth initiation
    if (req.method === 'POST') {
      const { storeId }: StripeConnectInitiateRequest = await req.json();

      if (!storeId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'storeId is required' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verify store exists
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .single();

      if (storeError || !store) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Store not found' 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Generate OAuth URL
      const redirectUri = `${url.origin}/functions/v1/stripe-connect/callback`;
      const state = storeId; // Use storeId as state for verification
      
      const oauthUrl = new URL('https://connect.stripe.com/oauth/authorize');
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('client_id', STRIPE_CLIENT_ID);
      oauthUrl.searchParams.set('redirect_uri', redirectUri);
      oauthUrl.searchParams.set('scope', 'read_write');
      oauthUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({
          success: true,
          oauth_url: oauthUrl.toString(),
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Stripe Connect error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


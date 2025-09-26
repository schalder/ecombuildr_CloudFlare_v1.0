// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Profile {
  id: string;
  account_status: string;
  subscription_plan: string;
  trial_expires_at: string | null;
  subscription_expires_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting account enforcement check...');

    // Get all profiles that might need enforcement
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, account_status, subscription_plan, trial_expires_at, subscription_expires_at')
      .in('account_status', ['trial', 'active']);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles to check`);

    const now = new Date();
    let enforcedCount = 0;

    for (const profile of profiles || []) {
      let needsEnforcement = false;

      // Check trial users
      if (profile.account_status === 'trial' && profile.trial_expires_at) {
        const trialExpiry = new Date(profile.trial_expires_at);
        const graceEnd = new Date(trialExpiry.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days grace
        
        if (now > graceEnd) {
          needsEnforcement = true;
          console.log(`Trial user ${profile.id} needs enforcement - grace period ended`);
        }
      }

      // Check active users with expired subscriptions
      if (profile.account_status === 'active' && profile.subscription_expires_at) {
        const subscriptionExpiry = new Date(profile.subscription_expires_at);
        const graceEnd = new Date(subscriptionExpiry.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days grace
        
        if (now > graceEnd) {
          needsEnforcement = true;
          console.log(`Active user ${profile.id} needs enforcement - subscription grace period ended`);
        }
      }

      if (needsEnforcement) {
        // Set account to read-only
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({ account_status: 'read_only' })
          .eq('id', profile.id);

        if (profileUpdateError) {
          console.error(`Error updating profile ${profile.id}:`, profileUpdateError);
          continue;
        }

        // Make all websites private
        const { error: websitesError } = await supabaseClient
          .from('websites')
          .update({ is_active: false })
          .in('store_id', [
            // Get store IDs for this user
            await supabaseClient
              .from('stores')
              .select('id')
              .eq('owner_id', profile.id)
              .then(result => result.data?.map(store => store.id) || [])
          ].flat());

        if (websitesError) {
          console.error(`Error updating websites for user ${profile.id}:`, websitesError);
        }

        // Make all funnels private
        const { error: funnelsError } = await supabaseClient
          .from('funnels')
          .update({ is_active: false })
          .in('store_id', [
            // Get store IDs for this user
            await supabaseClient
              .from('stores')
              .select('id')
              .eq('owner_id', profile.id)
              .then(result => result.data?.map(store => store.id) || [])
          ].flat());

        if (funnelsError) {
          console.error(`Error updating funnels for user ${profile.id}:`, funnelsError);
        }

        enforcedCount++;
        console.log(`Successfully enforced read-only for user ${profile.id}`);
      }
    }

    console.log(`Account enforcement completed. Enforced ${enforcedCount} accounts.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Account enforcement completed. Enforced ${enforcedCount} accounts.`,
        enforcedCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Account enforcement error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Account enforcement failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
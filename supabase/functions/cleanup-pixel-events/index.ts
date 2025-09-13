import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let retentionDays = 90; // Default retention period

    // Check if request has custom retention days
    if (req.method === 'POST') {
      const body = await req.json();
      if (body.retentionDays && typeof body.retentionDays === 'number') {
        retentionDays = Math.max(1, Math.min(365, body.retentionDays)); // Between 1-365 days
      }
    }

    console.log(`Starting pixel events cleanup with ${retentionDays} days retention`);

    // Call the database function to cleanup old pixel events
    const { data, error } = await supabase.rpc('cleanup_old_pixel_events', {
      retention_days: retentionDays
    });

    if (error) {
      console.error('Error calling cleanup function:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }

    const deletedCount = data || 0;
    
    console.log(`Cleanup completed successfully. Deleted ${deletedCount} old pixel events.`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        retentionDays,
        message: `Successfully cleaned up ${deletedCount} pixel events older than ${retentionDays} days`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in cleanup-pixel-events function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to cleanup pixel events'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
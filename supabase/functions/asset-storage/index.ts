// Asset storage and serving function for static HTML pages
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      // Store assets from build process
      const { fileName, content, contentType } = await req.json();
      
      console.log(`📦 Storing asset: ${fileName}`);

      // Store in assets table
      const { error } = await supabase
        .from('assets')
        .upsert({
          file_name: fileName,
          content: content,
          content_type: contentType,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing asset:', error);
        return new Response(JSON.stringify({ error: 'Failed to store asset' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET') {
      // Serve assets
      const fileName = pathname.split('/').pop();
      
      if (!fileName) {
        return new Response('Asset not found', { 
          status: 404,
          headers: corsHeaders 
        });
      }

      console.log(`📦 Serving asset: ${fileName}`);

      // Get asset from database
      const { data: asset, error } = await supabase
        .from('assets')
        .select('content, content_type')
        .eq('file_name', fileName)
        .single();

      if (error || !asset) {
        console.log(`Asset not found: ${fileName}`);
        return new Response('Asset not found', { 
          status: 404,
          headers: corsHeaders 
        });
      }

      // Determine content type
      let contentType = asset.content_type || 'application/octet-stream';
      if (fileName.endsWith('.css')) {
        contentType = 'text/css';
      } else if (fileName.endsWith('.js')) {
        contentType = 'application/javascript';
      }

      return new Response(asset.content, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1 year cache for assets
        }
      });
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Error in asset-storage function:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
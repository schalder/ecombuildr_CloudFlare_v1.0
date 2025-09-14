import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('🔍 HTML serve request:', {
      url: req.url,
      userAgent: req.headers.get('user-agent')?.substring(0, 100)
    });

    const url = new URL(req.url);
    const domain = url.searchParams.get('domain') || req.headers.get('host');
    const path = url.searchParams.get('path') || '/';

    if (!domain) {
      console.error('❌ No domain provided');
      return new Response('Domain required', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find HTML snapshot for this domain and path
    console.log('🔍 Looking for HTML snapshot:', { domain, path });

    // First try with custom domain
    let { data: htmlSnapshot } = await supabase
      .from('html_snapshots')
      .select('html_content')
      .eq('custom_domain', domain)
      .limit(1)
      .maybeSingle();

    // If not found and domain looks like a custom domain, try to find the associated content
    if (!htmlSnapshot && domain !== 'fhqwacmokbtbspkxjixf.supabase.co') {
      console.log('🔍 Searching for content by domain:', domain);
      
      // Try to find website/funnel by domain
      const { data: websiteData } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', domain)
        .eq('is_published', true)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const { data: funnelData } = await supabase
        .from('funnels')
        .select('id')
        .eq('domain', domain)
        .eq('is_published', true)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (websiteData) {
        const { data } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_id', websiteData.id)
          .eq('content_type', 'website')
          .eq('custom_domain', domain)
          .limit(1)
          .maybeSingle();
        htmlSnapshot = data;
      } else if (funnelData) {
        const { data } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_id', funnelData.id)
          .eq('content_type', 'funnel')
          .eq('custom_domain', domain)
          .limit(1)
          .maybeSingle();
        htmlSnapshot = data;
      }
    }

    // If still not found, try default (no custom domain) snapshots
    if (!htmlSnapshot) {
      console.log('🔍 Trying default snapshots without custom domain');
      
      const { data } = await supabase
        .from('html_snapshots')
        .select('html_content')
        .is('custom_domain', null)
        .limit(1)
        .maybeSingle();
      htmlSnapshot = data;
    }

    if (htmlSnapshot?.html_content) {
      console.log('✅ Found HTML snapshot, serving static content');
      
      return new Response(htmlSnapshot.html_content, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300, s-maxage=3600'
        }
      });
    }

    console.log('❌ No HTML snapshot found, falling back to SPA');
    
    // Fallback: redirect to SPA
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://${domain}/index.html`
      }
    });

  } catch (error) {
    console.error('❌ Error serving HTML:', error);
    
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
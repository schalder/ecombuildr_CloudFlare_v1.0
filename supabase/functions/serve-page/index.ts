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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const domain = req.headers.get('host') || url.hostname;
    const path = url.pathname;

    console.log(`🌐 Serving request for domain: ${domain}, path: ${path}`);

    // Try to find HTML snapshot for this domain and path
    let contentType: string;
    let contentId: string | null = null;
    let customDomain: string | null = null;

    // First, check if this is a custom domain
    const { data: domainData } = await supabase
      .from('custom_domains')
      .select(`
        domain,
        store_id,
        is_verified,
        dns_configured
      `)
      .eq('domain', domain)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .single();

    if (domainData) {
      customDomain = domain;
      console.log(`📍 Found custom domain: ${domain}`);

      // Check for domain connections to find the content
      const { data: connectionData } = await supabase
        .from('domain_connections')
        .select('content_type, content_id')
        .eq('custom_domain', domain)
        .single();

      if (connectionData) {
        contentType = connectionData.content_type;
        contentId = connectionData.content_id;
        console.log(`🔗 Found domain connection: ${contentType}/${contentId}`);
      } else {
        // No specific connection, fall back to React app
        console.log(`❌ No domain connection found for ${domain}`);
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `https://681a2e99-80e9-42b8-b8d3-dc8717d4c55a.sandbox.lovable.dev${path}`,
          }
        });
      }
    } else {
      // System domain - determine content type based on path
      console.log(`🏠 System domain request: ${domain}${path}`);

      // For system domains, we need to look up the content based on path
      // This is more complex as we need to parse the URL structure
      
      // Check if this is a website page request
      const pathSegments = path.split('/').filter(Boolean);
      
      if (pathSegments.length >= 2 && pathSegments[0] === 'site') {
        // Format: /site/{websiteId}/{pageSlug?}
        const websiteId = pathSegments[1];
        const pageSlug = pathSegments[2] || '';
        
        if (pageSlug) {
          // This is a specific website page
          const { data: pageData } = await supabase
            .from('website_pages')
            .select('id')
            .eq('website_id', websiteId)
            .eq('slug', pageSlug)
            .eq('is_published', true)
            .single();

          if (pageData) {
            contentType = 'website_page';
            contentId = pageData.id;
          }
        } else {
          // This is the website homepage
          const { data: pageData } = await supabase
            .from('website_pages')
            .select('id')
            .eq('website_id', websiteId)
            .eq('is_homepage', true)
            .eq('is_published', true)
            .single();

          if (pageData) {
            contentType = 'website_page';
            contentId = pageData.id;
          } else {
            // Fall back to website-level snapshot
            contentType = 'website';
            contentId = websiteId;
          }
        }
      } else if (pathSegments.length >= 2 && pathSegments[0] === 'funnel') {
        // Format: /funnel/{funnelId}/{stepSlug?}
        const funnelId = pathSegments[1];
        const stepSlug = pathSegments[2] || '';
        
        if (stepSlug && stepSlug !== 'home') {
          // This is a specific funnel step
          const { data: stepData } = await supabase
            .from('funnel_steps')
            .select('id')
            .eq('funnel_id', funnelId)
            .eq('slug', stepSlug)
            .eq('is_published', true)
            .single();

          if (stepData) {
            contentType = 'funnel_step';
            contentId = stepData.id;
          }
        } else {
          // This is the funnel homepage
          const { data: stepData } = await supabase
            .from('funnel_steps')
            .select('id')
            .eq('funnel_id', funnelId)
            .eq('is_homepage', true)
            .eq('is_published', true)
            .single();

          if (stepData) {
            contentType = 'funnel_step';
            contentId = stepData.id;
          } else {
            // Fall back to funnel-level snapshot
            contentType = 'funnel';
            contentId = funnelId;
          }
        }
      }
    }

    // If we found content, try to get the HTML snapshot
    if (contentId && contentType) {
      console.log(`🔍 Looking for HTML snapshot: ${contentType}/${contentId}`);
      
      const { data: htmlSnapshot } = await supabase
        .from('html_snapshots')
        .select('html_content')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('custom_domain', customDomain)
        .single();

      if (htmlSnapshot?.html_content) {
        console.log(`✅ Found HTML snapshot, serving pre-generated HTML`);
        
        return new Response(htmlSnapshot.html_content, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
          }
        });
      } else {
        console.log(`❌ No HTML snapshot found for ${contentType}/${contentId}`);
      }
    }

    // Fall back to React app
    console.log(`🔄 Falling back to React app`);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://681a2e99-80e9-42b8-b8d3-dc8717d4c55a.sandbox.lovable.dev${path}`,
      }
    });

  } catch (error) {
    console.error('❌ Error in serve-page function:', error);
    
    // Fall back to React app on error
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://681a2e99-80e9-42b8-b8d3-dc8717d4c55a.sandbox.lovable.dev${req.url.replace(req.url.split('/')[2], '681a2e99-80e9-42b8-b8d3-dc8717d4c55a.sandbox.lovable.dev')}`,
      }
    });
  }
});
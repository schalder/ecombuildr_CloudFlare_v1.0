import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const domain = url.searchParams.get('domain') || url.hostname;
    const path = url.searchParams.get('path') || url.pathname;
    
    console.log(`🚀 Serving static page for ${domain}${path}`);

    // Check if this is a website or funnel page
    let contentType = '';
    let contentId = '';
    let customDomain = '';

    // Parse the path to determine content type
    if (path.startsWith('/w/')) {
      // Website page: /w/{website-slug}/{page-slug}
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        const websiteSlug = pathParts[1];
        const pageSlug = pathParts[2] || '';
        
        // Find website by slug
        const { data: website } = await supabase
          .from('websites')
          .select('id, store_id')
          .eq('slug', websiteSlug)
          .eq('is_published', true)
          .eq('is_active', true)
          .single();

        if (website) {
          // Find page by slug
          const { data: page } = await supabase
            .from('website_pages')
            .select('id')
            .eq('website_id', website.id)
            .eq('slug', pageSlug)
            .eq('is_published', true)
            .single();

          if (page) {
            contentType = 'website_page';
            contentId = page.id;
          }
        }
      }
    } else if (path.startsWith('/f/')) {
      // Funnel step: /f/{funnel-slug}/{step-slug}
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        const funnelSlug = pathParts[1];
        const stepSlug = pathParts[2] || '';
        
        // Find funnel by slug
        const { data: funnel } = await supabase
          .from('funnels')
          .select('id, store_id')
          .eq('slug', funnelSlug)
          .eq('is_published', true)
          .eq('is_active', true)
          .single();

        if (funnel) {
          // Find step by slug
          const { data: step } = await supabase
            .from('funnel_steps')
            .select('id')
            .eq('funnel_id', funnel.id)
            .eq('slug', stepSlug)
            .eq('is_published', true)
            .single();

          if (step) {
            contentType = 'funnel_step';
            contentId = step.id;
          }
        }
      }
    } else {
      // Check for custom domain routing
      if (domain !== 'localhost' && !domain.includes('ecombuildr.com')) {
        // This is a custom domain - find associated content
        const { data: domainConnection } = await supabase
          .from('domain_connections')
          .select('content_type, content_id, custom_domain')
          .eq('custom_domain', domain)
          .eq('is_active', true)
          .single();

        if (domainConnection) {
          contentType = domainConnection.content_type;
          contentId = domainConnection.content_id;
          customDomain = domainConnection.custom_domain;
        }
      }
    }

    if (!contentType || !contentId) {
      return new Response('Page not found', { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    // Try to get existing HTML snapshot
    console.log(`📄 Looking for HTML snapshot: ${contentType}:${contentId}`);
    
    let query = supabase
      .from('html_snapshots')
      .select('html_content, generated_at')
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (customDomain) {
      query = query.eq('custom_domain', customDomain);
    } else {
      query = query.is('custom_domain', null);
    }

    const { data: snapshot } = await query.single();

    if (snapshot && snapshot.html_content) {
      console.log(`✅ Serving cached HTML snapshot (generated: ${snapshot.generated_at})`);
      
      return new Response(snapshot.html_content, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        }
      });
    }

    // If no snapshot exists, generate one on-the-fly
    console.log(`🔄 No snapshot found, generating HTML on-the-fly`);
    
    // Call the html-snapshot function to generate HTML
    const { data: generateResult, error: generateError } = await supabase.functions.invoke('html-snapshot', {
      body: {
        contentType,
        contentId,
        customDomain: customDomain || undefined
      }
    });

    if (generateError) {
      console.error('❌ Error generating HTML:', generateError);
      return new Response('Error generating page', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    // Try to fetch the newly generated HTML
    const { data: newSnapshot } = await query.single();
    
    if (newSnapshot && newSnapshot.html_content) {
      console.log(`✅ Serving newly generated HTML`);
      
      return new Response(newSnapshot.html_content, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        }
      });
    }

    // Fallback if generation failed
    return new Response('Page temporarily unavailable', { 
      status: 503, 
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('❌ Error in serve-static-page:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  }
})
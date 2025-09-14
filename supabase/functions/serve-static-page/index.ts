import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Handle both GET params and POST body
    let domain, path, contentType, contentId;
    
    if (req.method === 'POST') {
      const body = await req.json();
      domain = body.domain;
      path = body.path;
      contentType = body.contentType;
      contentId = body.contentId;
    } else {
      const url = new URL(req.url);
      domain = url.searchParams.get('domain') || url.hostname;
      path = url.searchParams.get('path') || url.pathname;
    }
    
    console.log(`🚀 Serving static page for ${domain}${path}`);

    // If contentType and contentId are provided directly, use them
    if (!contentType || !contentId) {
      // Determine content type and ID based on domain and path
      contentType = 'website_page';
      contentId = null;

      // First, try to find domain connections
      const { data: connections, error: connectionsError } = await supabase
        .from('domain_connections')
        .select(`
          content_type,
          content_id,
          path_pattern
        `)
        .eq('domain', domain)
        .order('created_at', { ascending: false });

      if (!connectionsError && connections && connections.length > 0) {
        // Find the best matching connection
        for (const connection of connections) {
          if (connection.path_pattern === '/' && path === '/') {
            contentType = connection.content_type;
            contentId = connection.content_id;
            break;
          } else if (connection.path_pattern && path.startsWith(connection.path_pattern)) {
            contentType = connection.content_type;
            contentId = connection.content_id;
            break;
          }
        }
      }

      // If no domain connection found, try to find by website/page structure
      if (!contentId) {
        // First check if this domain has a verified custom domain
        const { data: domainData } = await supabase
          .from('custom_domains')
          .select('store_id')
          .eq('domain', domain)
          .eq('is_verified', true)
          .single();

        if (domainData) {
          // Find website for this store
          const { data: websiteData } = await supabase
            .from('websites')
            .select('id, is_published, is_active')
            .eq('store_id', domainData.store_id)
            .eq('is_published', true)
            .eq('is_active', true)
            .single();

          if (websiteData) {
            if (path === '/') {
              // Homepage - find homepage or use website itself
              const { data: homepageData } = await supabase
                .from('website_pages')
                .select('id')
                .eq('website_id', websiteData.id)
                .eq('is_homepage', true)
                .eq('is_published', true)
                .single();

              if (homepageData) {
                contentType = 'website_page';
                contentId = homepageData.id;
              } else {
                contentType = 'website';
                contentId = websiteData.id;
              }
            } else {
              // Try to find specific page by slug
              const slug = path.startsWith('/') ? path.slice(1) : path;
              const { data: pageData } = await supabase
                .from('website_pages')
                .select('id')
                .eq('website_id', websiteData.id)
                .eq('slug', slug)
                .eq('is_published', true)
                .single();

              if (pageData) {
                contentType = 'website_page';
                contentId = pageData.id;
              }
            }
          }
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
    
    // Build primary snapshot query (domain-scoped when available)
    let snapshot: any = null;
    let snapshotError: any = null;

    if (customDomain) {
      const { data, error } = await supabase
        .from('html_snapshots')
        .select('html_content, generated_at')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('custom_domain', customDomain)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      snapshot = data; snapshotError = error;
    } else {
      const { data, error } = await supabase
        .from('html_snapshots')
        .select('html_content, generated_at')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .is('custom_domain', null)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      snapshot = data; snapshotError = error;
    }

    if (snapshotError && snapshotError.code !== 'PGRST116') {
      console.error('❌ Error querying domain-scoped HTML snapshots:', snapshotError);
    }

    // Fallback: try generic snapshot (custom_domain IS NULL) if none found for this domain
    if ((!snapshot || !snapshot.html_content) && customDomain) {
      console.log('🔄 No domain-scoped snapshot found, trying generic snapshot fallback');
      const { data: fallbackSnapshot, error: fallbackError } = await supabase
        .from('html_snapshots')
        .select('html_content, generated_at')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .is('custom_domain', null)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError && fallbackError.code !== 'PGRST116') {
        console.error('❌ Error querying generic HTML snapshots:', fallbackError);
      }

      if (fallbackSnapshot) {
        snapshot = fallbackSnapshot;
        console.log(`✅ Found generic snapshot fallback (generated: ${snapshot.generated_at})`);
      }
    }

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

    // Re-query the latest snapshot after generation
    let newSnapshot: any = null;
    if (customDomain) {
      const { data } = await supabase
        .from('html_snapshots')
        .select('html_content, generated_at')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('custom_domain', customDomain)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      newSnapshot = data;
    } else {
      const { data } = await supabase
        .from('html_snapshots')
        .select('html_content, generated_at')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .is('custom_domain', null)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      newSnapshot = data;
    }
    
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
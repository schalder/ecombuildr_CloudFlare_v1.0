import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
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

    const url = new URL(req.url);
    const hostname = url.hostname;
    const path = url.pathname;
    
    console.log(`🌐 Domain Router: ${hostname}${path}`);

    // Skip admin/dashboard routes - these should go to the React SPA
    const isAdminRoute = path.includes('/dashboard') || 
                        path.includes('/admin') || 
                        path.includes('/builder') || 
                        path.includes('/edit') ||
                        path.startsWith('/api/');

    if (isAdminRoute) {
      console.log(`⚡ Admin route detected, redirecting to SPA`);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://id-preview--681a2e99-80e9-42b8-b8d3-dc8717d4c55a.lovable.app${path}${url.search}`,
        },
      });
    }

    // Check if this is a custom domain
    const { data: domainData, error: domainError } = await supabase
      .from('custom_domains')
      .select(`
        id,
        domain,
        store_id,
        is_verified,
        dns_configured
      `)
      .eq('domain', hostname)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .single();

    if (domainError || !domainData) {
      console.log(`❌ Domain not found or not verified: ${hostname}`);
      return new Response('Domain not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    console.log(`✅ Verified custom domain: ${hostname} -> Store: ${domainData.store_id}`);

    // Check for domain connections to specific content
    const { data: connections, error: connectionsError } = await supabase
      .from('domain_connections')
      .select(`
        content_type,
        content_id,
        path_pattern
      `)
      .eq('domain', hostname)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('Error fetching domain connections:', connectionsError);
    }

    let contentType = 'website';
    let contentId = null;

    // Find matching content based on path
    if (connections && connections.length > 0) {
      for (const connection of connections) {
        // Simple path matching - could be enhanced with regex
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

    // If no specific content mapping, try to find default website/funnel
    if (!contentId) {
      // Try to find a website for this store
      const { data: websiteData } = await supabase
        .from('websites')
        .select('id, name, is_published, is_active')
        .eq('store_id', domainData.store_id)
        .eq('is_published', true)
        .eq('is_active', true)
        .single();

      if (websiteData) {
        contentType = 'website';
        contentId = websiteData.id;
        
        // For non-root paths, try to find a specific page
        if (path !== '/') {
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
        } else {
          // For root path, try to find homepage
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
          }
        }
      }
    }

    if (!contentId) {
      console.log(`❌ No content found for ${hostname}${path}`);
      return new Response('Page not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    console.log(`📄 Serving content: ${contentType}:${contentId} for ${hostname}${path}`);

    // Call the serve-static-page function to get the HTML
    const staticPageResponse = await supabase.functions.invoke('serve-static-page', {
      body: {
        domain: hostname,
        path: path,
        contentType,
        contentId
      }
    });

    if (staticPageResponse.error) {
      console.error('Error from serve-static-page:', staticPageResponse.error);
      return new Response('Internal server error', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Return the HTML directly
    if (staticPageResponse.data && typeof staticPageResponse.data === 'string') {
      return new Response(staticPageResponse.data, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
        },
      });
    }

    // Fallback
    return new Response('Page not found', { 
      status: 404,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Domain Router Error:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
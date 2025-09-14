// Simplified serve-page function - now just serves pre-generated self-contained HTML snapshots
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
    let domain = req.headers.get('host') || url.hostname;
    
    // Get original path from query params or fallback to pathname
    const prefix = url.searchParams.get('prefix');
    const splat = url.searchParams.get('splat');
    const path = prefix && splat ? `/${prefix}/${splat}` : url.pathname;

    // Clean up domain to remove edge function hostnames
    if (domain.includes('supabase.co') || domain.includes('edge-runtime')) {
      domain = 'ecombuildr.com';
    }

    // Handle asset requests (CSS, JS files from /assets/)
    if (path.startsWith('/assets/')) {
      console.log(`📦 Proxying asset request to asset-storage function: ${path}`);
      
      // Proxy to asset-storage function to maintain same-origin
      const assetUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/asset-storage${path}`;
      
      try {
        const assetResponse = await fetch(assetUrl);
        const assetBody = await assetResponse.text();
        
        return new Response(assetBody, {
          status: assetResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': assetResponse.headers.get('Content-Type') || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
            'ETag': assetResponse.headers.get('ETag') || '',
          }
        });
      } catch (error) {
        console.error(`❌ Error proxying asset: ${error}`);
        return new Response('Asset not found', { 
          status: 404,
          headers: corsHeaders 
        });
      }
    }

    console.log(`📄 Serving HTML snapshot for domain: ${domain}, path: ${path}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    let contentType: string = '';
    let contentId: string | null = null;
    let customDomain: string | null = null;

    // Check if this is a custom domain
    if (!domain.includes('ecombuildr.com') && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
      customDomain = domain;
      
      // Get custom domain configuration
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

          // Resolve path within the connected content for custom domains
          const pathSegments = path.split('/').filter(Boolean);
          const firstSegment = pathSegments[0] || '';

          if (contentType === 'website' && contentId) {
            // If a slug is present, try to resolve to a specific website page
            if (firstSegment && firstSegment !== 'home') {
              const { data: pageData } = await supabase
                .from('website_pages')
                .select('id')
                .eq('website_id', contentId)
                .eq('slug', firstSegment)
                .eq('is_published', true)
                .maybeSingle();

              if (pageData?.id) {
                contentType = 'website_page';
                contentId = pageData.id;
                console.log(`🧭 Resolved custom domain slug to website_page/${contentId}`);
              }
            }

            // If still pointing to website, try homepage
            if (contentType === 'website') {
              const { data: homePage } = await supabase
                .from('website_pages')
                .select('id')
                .eq('website_id', contentId)
                .eq('is_homepage', true)
                .eq('is_published', true)
                .maybeSingle();

              if (homePage?.id) {
                contentType = 'website_page';
                contentId = homePage.id;
                console.log(`🏠 Using website homepage website_page/${contentId}`);
              }
            }
          } else if (contentType === 'funnel' && contentId) {
            if (firstSegment && firstSegment !== 'home') {
              const { data: stepData } = await supabase
                .from('funnel_steps')
                .select('id')
                .eq('funnel_id', contentId)
                .eq('slug', firstSegment)
                .eq('is_published', true)
                .maybeSingle();

              if (stepData?.id) {
                contentType = 'funnel_step';
                contentId = stepData.id;
                console.log(`🧭 Resolved custom domain slug to funnel_step/${contentId}`);
              }
            }

            if (contentType === 'funnel') {
              const { data: homeStep } = await supabase
                .from('funnel_steps')
                .select('id')
                .eq('funnel_id', contentId)
                .eq('is_homepage', true)
                .eq('is_published', true)
                .maybeSingle();

              if (homeStep?.id) {
                contentType = 'funnel_step';
                contentId = homeStep.id;
                console.log(`🏠 Using funnel homepage funnel_step/${contentId}`);
              }
            }
          }
        }
      }
    } else {
      // System domain - determine content type based on path
      console.log(`🏠 System domain request: ${domain}${path}`);

      const pathSegments = path.split('/').filter(Boolean);
      
      if (pathSegments.length >= 2 && pathSegments[0] === 'site') {
        // Format: /site/{websiteIdOrSlug}/{pageSlug?}
        const websiteIdentifier = pathSegments[1];
        const pageSlug = pathSegments[2] || '';
        
        console.log(`🔍 Resolving website: ${websiteIdentifier}, page slug: ${pageSlug}`);
        
        // Check if identifier is UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteIdentifier);
        let websiteId: string = '';
        
        if (isUUID) {
          websiteId = websiteIdentifier;
          console.log(`📋 Using website ID: ${websiteId}`);
        } else {
          // Resolve website by slug
          const { data: websiteData } = await supabase
            .from('websites')
            .select('id')
            .eq('slug', websiteIdentifier)
            .eq('is_published', true)
            .eq('is_active', true)
            .maybeSingle();
            
          if (websiteData?.id) {
            websiteId = websiteData.id;
            console.log(`✅ Resolved website slug "${websiteIdentifier}" to ID: ${websiteId}`);
          }
        }
        
        if (websiteId) {
          if (pageSlug && pageSlug !== 'home') {
            // This is a specific website page
            const { data: pageData } = await supabase
              .from('website_pages')
              .select('id')
              .eq('website_id', websiteId)
              .eq('slug', pageSlug)
              .eq('is_published', true)
              .maybeSingle();

            if (pageData?.id) {
              contentType = 'website_page';
              contentId = pageData.id;
              console.log(`✅ Found website page: ${pageSlug} -> ${contentId}`);
            }
          } else {
            // This is the website homepage
            const { data: pageData } = await supabase
              .from('website_pages')
              .select('id')
              .eq('website_id', websiteId)
              .eq('is_homepage', true)
              .eq('is_published', true)
              .maybeSingle();

            if (pageData?.id) {
              contentType = 'website_page';
              contentId = pageData.id;
              console.log(`✅ Found website homepage: ${contentId}`);
            }
          }
        }
      }
    }

    // Lookup self-contained HTML snapshot
    if (contentType && contentId) {
      console.log(`🔍 Looking for self-contained HTML snapshot: ${contentType}/${contentId}`);
      
      let htmlContent: string | null = null;

      // Try custom domain-specific snapshot first
      if (customDomain) {
        const { data: domainSnapshot } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('custom_domain', customDomain)
          .maybeSingle();

        if (domainSnapshot?.html_content) {
          htmlContent = domainSnapshot.html_content;
          console.log(`✅ Serving domain-specific self-contained HTML for ${contentType}/${contentId} on ${customDomain}`);
        }
      }

      // Fallback to default snapshot (no custom domain)
      if (!htmlContent) {
        const { data: defaultSnapshot } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .is('custom_domain', null)
          .maybeSingle();

        if (defaultSnapshot?.html_content) {
          htmlContent = defaultSnapshot.html_content;
          console.log(`✅ Serving default self-contained HTML for ${contentType}/${contentId}`);
        }
      }

      if (htmlContent) {
        return new Response(htmlContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
          }
        });
      } else {
        console.log(`❌ No self-contained HTML snapshot found for ${contentType}/${contentId} (domain: ${customDomain ?? 'default'})`);
      }
    }

    // 404 fallback with potential hydration for preview URLs
    const isPreviewUrl = path.startsWith('/website/') || path.startsWith('/funnel/');
    
    const notFoundHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Page Not Found</title>
  <meta name="description" content="The page you are looking for does not exist.">
  <meta name="robots" content="noindex, nofollow">
  
  <style>
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      margin: 0; 
      background: #f8fafc; 
    }
    .container { 
      text-align: center; 
      max-width: 500px; 
      padding: 2rem; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    }
    h1 { 
      color: #dc2626; 
      margin-bottom: 1rem; 
      font-size: 2rem; 
    }
    p { 
      color: #64748b; 
      margin-bottom: 1.5rem; 
      line-height: 1.6; 
    }
    a { 
      color: #3b82f6; 
      text-decoration: none; 
      background: #3b82f6; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 8px; 
      font-weight: 500; 
      display: inline-block; 
    }
    a:hover { 
      background: #2563eb; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist${isPreviewUrl ? ' or hasn\'t been published yet.' : '.'}</p>
    ${isPreviewUrl ? '<p>If this is a preview URL, the page may need to be published first.</p>' : ''}
    <a href="/">Go Home</a>
  </div>
  
  ${isPreviewUrl ? `
  <script>
    // For preview URLs, try to redirect to the React app after a delay
    if (window.location.pathname.startsWith('/website/') || window.location.pathname.startsWith('/funnel/')) {
      setTimeout(() => {
        window.location.href = 'https://ecombuildr.com' + window.location.pathname;
      }, 3000);
    }
  </script>
  ` : ''}
</body>
</html>`;

    return new Response(notFoundHTML, {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      }
    });

  } catch (error) {
    console.error('❌ Error in serve-page function:', error);
    
    // Fall back to React app on error
    const url = new URL(req.url);
    const prefix = url.searchParams.get('prefix');
    const splat = url.searchParams.get('splat');
    const originalPath = prefix && splat ? `/${prefix}/${splat}` : url.pathname;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://ecombuildr.com${originalPath}`,
      }
    });
  }
});
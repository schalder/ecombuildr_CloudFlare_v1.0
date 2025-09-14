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
    let domain = req.headers.get('host') || url.hostname;
    
    // Get original path from query params or fallback to pathname
    const prefix = url.searchParams.get('prefix');
    const splat = url.searchParams.get('splat');
    const path = prefix && splat ? `/${prefix}/${splat}` : url.pathname;

    // Clean up domain to remove edge function hostnames
    if (domain.includes('supabase.co') || domain.includes('edge-runtime')) {
      domain = 'ecombuildr.com';
    }

    console.log(`🌐 Serving request for domain: ${domain}, original path: ${path}, reconstructed from prefix: ${prefix}, splat: ${splat}`);

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
      } else {
        // No specific connection, fall back to React app with original path
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
        // Format: /site/{websiteIdOrSlug}/{pageSlug?}
        const websiteIdentifier = pathSegments[1];
        const pageSlug = pathSegments[2] || '';
        
        console.log(`🔍 Resolving website: ${websiteIdentifier}, page slug: ${pageSlug}`);
        
        // Check if identifier is UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteIdentifier);
        let websiteId: string;
        
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
            
          if (!websiteData?.id) {
            console.log(`❌ Website not found by slug: ${websiteIdentifier}`);
            contentType = '';
            contentId = null;
          } else {
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
            } else {
              console.log(`❌ Website page not found: ${pageSlug} in website ${websiteId}`);
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
            } else {
              // Fall back to website-level snapshot
              contentType = 'website';
              contentId = websiteId;
              console.log(`📄 Falling back to website-level snapshot: ${websiteId}`);
            }
          }
        }
      } else if (pathSegments.length >= 2 && pathSegments[0] === 'funnel') {
        // Format: /funnel/{funnelIdOrSlug}/{stepSlug?}
        const funnelIdentifier = pathSegments[1];
        const stepSlug = pathSegments[2] || '';
        
        console.log(`🔍 Resolving funnel: ${funnelIdentifier}, step slug: ${stepSlug}`);
        
        // Check if identifier is UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(funnelIdentifier);
        let funnelId: string;
        
        if (isUUID) {
          funnelId = funnelIdentifier;
          console.log(`📋 Using funnel ID: ${funnelId}`);
        } else {
          // Resolve funnel by slug
          const { data: funnelData } = await supabase
            .from('funnels')
            .select('id')
            .eq('slug', funnelIdentifier)
            .eq('is_published', true)
            .eq('is_active', true)
            .maybeSingle();
            
          if (!funnelData?.id) {
            console.log(`❌ Funnel not found by slug: ${funnelIdentifier}`);
            contentType = '';
            contentId = null;
          } else {
            funnelId = funnelData.id;
            console.log(`✅ Resolved funnel slug "${funnelIdentifier}" to ID: ${funnelId}`);
          }
        }
        
        if (funnelId) {
          if (stepSlug && stepSlug !== 'home') {
            // This is a specific funnel step
            const { data: stepData } = await supabase
              .from('funnel_steps')
              .select('id')
              .eq('funnel_id', funnelId)
              .eq('slug', stepSlug)
              .eq('is_published', true)
              .maybeSingle();

            if (stepData?.id) {
              contentType = 'funnel_step';
              contentId = stepData.id;
              console.log(`✅ Found funnel step: ${stepSlug} -> ${contentId}`);
            } else {
              console.log(`❌ Funnel step not found: ${stepSlug} in funnel ${funnelId}`);
            }
          } else {
            // This is the funnel homepage
            const { data: stepData } = await supabase
              .from('funnel_steps')
              .select('id')
              .eq('funnel_id', funnelId)
              .eq('is_homepage', true)
              .eq('is_published', true)
              .maybeSingle();

            if (stepData?.id) {
              contentType = 'funnel_step';
              contentId = stepData.id;
              console.log(`✅ Found funnel homepage: ${contentId}`);
            } else {
              // Fall back to funnel-level snapshot
              contentType = 'funnel';
              contentId = funnelId;
              console.log(`📄 Falling back to funnel-level snapshot: ${funnelId}`);
            }
          }
        }
      }
    }

    // If we found content, try to get the HTML snapshot
    if (contentId && contentType) {
      console.log(`🔍 Looking for HTML snapshot: ${contentType}/${contentId}`);
      
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
          console.log(`✅ Serving domain-specific snapshot for ${contentType}/${contentId} on ${customDomain}`);
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
          console.log(`✅ Serving default snapshot for ${contentType}/${contentId}`);
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
        console.log(`❌ No HTML snapshot found for ${contentType}/${contentId} (domain: ${customDomain ?? 'default'})`);
      }
    }

    // Return 404 HTML when no content is found
    console.log(`🔄 No content found, returning 404`);
    const canonicalUrl = `https://${domain}${path}`;
    const notFoundHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
  <meta name="description" content="The page you are looking for does not exist.">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="404 - Page Not Found">
  <meta property="og:description" content="The page you are looking for does not exist.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="404 - Page Not Found">
  <meta name="twitter:description" content="The page you are looking for does not exist.">
  
  <!-- Hydration bridge script for React SPA -->
  <script>
    window.__STATIC_HYDRATION_DATA__ = {
      contentType: '404',
      domain: '${domain}',
      path: '${path}'
    };
  </script>
</head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <h1 style="color: #dc2626; margin-bottom: 20px;">404 - Page Not Found</h1>
    <p style="color: #666; margin-bottom: 30px;">The page you are looking for does not exist or has been moved.</p>
    <a href="/" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Go Home</a>
  </div>
  
  <!-- Hydration script that loads the React SPA -->
  <script>
    (function() {
      var script = document.createElement('script');
      script.type = 'module';
      script.src = '/src/main.tsx';
      script.onload = function() {
        // The React app will take over from here
        console.log('React app loaded for 404 page');
      };
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>`;
    
    return new Response(notFoundHtml, {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      }
    });

  } catch (error) {
    console.error('❌ Error in serve-page function:', error);
    
    // Fall back to React app on error with original path
    const url = new URL(req.url);
    const prefix = url.searchParams.get('prefix');
    const splat = url.searchParams.get('splat');
    const originalPath = prefix && splat ? `/${prefix}/${splat}` : url.pathname;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://681a2e99-80e9-42b8-b8d3-dc8717d4c55a.sandbox.lovable.dev${originalPath}`,
      }
    });
  }
});
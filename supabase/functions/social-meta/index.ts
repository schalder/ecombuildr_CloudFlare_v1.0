import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

interface SEOData {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  robots?: string;
  siteName?: string;
  url: string;
}

// Extract meaningful description from page content
function extractContentDescription(content: any, maxLength: number = 155): string {
  if (!content) return '';
  
  try {
    // Handle JSON content with sections
    if (content.sections && Array.isArray(content.sections)) {
      for (const section of content.sections) {
        if (section.content?.text) {
          const text = section.content.text
            .replace(/<[^>]*>/g, '') // Strip HTML
            .replace(/\s+/g, ' ')
            .trim();
          if (text.length > 20) {
            return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
          }
        }
        if (section.content?.subtitle) {
          const text = section.content.subtitle.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          if (text.length > 20) {
            return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
          }
        }
      }
    }
  } catch (e) {
    console.error('Error extracting content description:', e);
  }
  
  return '';
}

// Normalize image URL to absolute
function normalizeImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined;
  
  // If already absolute, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If relative, make absolute (assuming Supabase storage or similar)
  return imageUrl.startsWith('/') ? `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}${imageUrl}` : imageUrl;
}

// Resolve SEO data from database based on URL
async function resolveSEOData(url: string): Promise<SEOData | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const pathname = urlObj.pathname;

    console.log('Resolving SEO for:', { domain, pathname });

    // Check if this is a custom domain
    const { data: customDomain } = await supabase
      .from('custom_domains')
      .select('id, store_id, domain')
      .eq('domain', domain)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .maybeSingle();

    let storeId: string | null = null;
    let websiteId: string | null = null;
    let funnelId: string | null = null;

    if (customDomain) {
      storeId = customDomain.store_id;

      // Check domain connections to find what content is mapped
      const { data: domainConnection } = await supabase
        .from('domain_connections')
        .select('content_type, content_id, is_homepage')
        .eq('domain_id', customDomain.id)
        .or(`path.eq.${pathname},is_homepage.eq.true`)
        .order('is_homepage', { ascending: true }) // Prefer specific path over homepage
        .limit(1)
        .maybeSingle();

      if (domainConnection) {
        if (domainConnection.content_type === 'website') {
          websiteId = domainConnection.content_id;
        } else if (domainConnection.content_type === 'funnel') {
          funnelId = domainConnection.content_id;
        } else if (domainConnection.content_type === 'website_page') {
          // Fetch the website page directly
          const { data: page } = await supabase
            .from('website_pages')
            .select('id, title, seo_title, seo_description, og_image, canonical_url, meta_robots, website_id, content')
            .eq('id', domainConnection.content_id)
            .eq('is_published', true)
            .maybeSingle();

          if (page) {
            const { data: website } = await supabase
              .from('websites')
              .select('name, settings')
              .eq('id', page.website_id)
              .maybeSingle();

            return {
              title: page.seo_title || page.title,
              description: page.seo_description || extractContentDescription(page.content) || `Visit ${page.title}`,
              image: normalizeImageUrl(page.og_image),
              canonical: page.canonical_url || url,
              robots: page.meta_robots || 'index, follow',
              siteName: website?.name,
              url
            };
          }
        } else if (domainConnection.content_type === 'funnel_step') {
          // Fetch the funnel step directly
          const { data: step } = await supabase
            .from('funnel_steps')
            .select('id, title, seo_title, seo_description, social_image_url, og_image, canonical_url, meta_robots, funnel_id, content')
            .eq('id', domainConnection.content_id)
            .eq('is_published', true)
            .maybeSingle();

          if (step) {
            const { data: funnel } = await supabase
              .from('funnels')
              .select('name, settings')
              .eq('id', step.funnel_id)
              .maybeSingle();

            return {
              title: step.seo_title || step.title,
              description: step.seo_description || extractContentDescription(step.content) || `Visit ${step.title}`,
              image: normalizeImageUrl(step.social_image_url || step.og_image),
              canonical: step.canonical_url || url,
              robots: step.meta_robots || 'index, follow',
              siteName: funnel?.name,
              url
            };
          }
        }
      }
    } else {
      // System domain - extract IDs from path
      // Patterns: /websites/:websiteId/:pageSlug, /funnels/:funnelId/:stepSlug
      const pathParts = pathname.split('/').filter(Boolean);
      
      if (pathParts[0] === 'websites' && pathParts.length >= 2) {
        websiteId = pathParts[1];
      } else if (pathParts[0] === 'funnels' && pathParts.length >= 2) {
        funnelId = pathParts[1];
      }
    }

    // If we found a website, fetch page SEO
    if (websiteId) {
      const pageSlug = pathname.split('/').pop() || '';
      
      const { data: page } = await supabase
        .from('website_pages')
        .select('id, title, seo_title, seo_description, og_image, canonical_url, meta_robots, website_id, content, is_homepage')
        .eq('website_id', websiteId)
        .eq('is_published', true)
        .or(pageSlug ? `slug.eq.${pageSlug},is_homepage.eq.true` : 'is_homepage.eq.true')
        .order('is_homepage', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (page) {
        const { data: website } = await supabase
          .from('websites')
          .select('name, settings')
          .eq('id', page.website_id)
          .maybeSingle();

        return {
          title: page.seo_title || page.title,
          description: page.seo_description || extractContentDescription(page.content) || `Visit ${page.title}`,
          image: normalizeImageUrl(page.og_image),
          canonical: page.canonical_url || url,
          robots: page.meta_robots || 'index, follow',
          siteName: website?.name,
          url
        };
      }
    }

    // If we found a funnel, fetch step SEO
    if (funnelId) {
      const stepSlug = pathname.split('/').pop() || '';
      
      const { data: step } = await supabase
        .from('funnel_steps')
        .select('id, title, seo_title, seo_description, social_image_url, og_image, canonical_url, meta_robots, funnel_id, content')
        .eq('funnel_id', funnelId)
        .eq('is_published', true)
        .or(stepSlug ? `slug.eq.${stepSlug},step_order.eq.1` : 'step_order.eq.1')
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (step) {
        const { data: funnel } = await supabase
          .from('funnels')
          .select('name, settings')
          .eq('id', step.funnel_id)
          .maybeSingle();

        return {
          title: step.seo_title || step.title,
          description: step.seo_description || extractContentDescription(step.content) || `Visit ${step.title}`,
          image: normalizeImageUrl(step.social_image_url || step.og_image),
          canonical: step.canonical_url || url,
          robots: step.meta_robots || 'index, follow',
          siteName: funnel?.name,
          url
        };
      }
    }

    // Fallback: not found
    return null;
  } catch (error) {
    console.error('Error resolving SEO data:', error);
    return null;
  }
}

// Generate SEO HTML for social crawlers
function generateSEOHTML(seo: SEOData): string {
  const title = seo.title || 'Page';
  const description = seo.description || '';
  const image = seo.image || '';
  const canonical = seo.canonical || seo.url;
  const robots = seo.robots || 'index, follow';
  const siteName = seo.siteName || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonical}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  ${image ? `<meta property="og:image" content="${image}">` : ''}
  ${siteName ? `<meta property="og:site_name" content="${siteName}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${image ? `<meta name="twitter:image" content="${image}">` : ''}
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${seo.url}">
  <script>window.location.href="${seo.url}";</script>
</head>
<body>
  <p>Redirecting to <a href="${seo.url}">${title}</a>...</p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Resolve SEO data
    const seoData = await resolveSEOData(targetUrl);

    if (!seoData) {
      // Return a basic not-found preview
      const notFoundHTML = generateSEOHTML({
        title: 'Page Not Found',
        description: 'The requested page could not be found.',
        url: targetUrl,
        robots: 'noindex, nofollow'
      });

      return new Response(notFoundHTML, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    // Return SEO-optimized HTML
    const html = generateSEOHTML(seoData);

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error in social-meta function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

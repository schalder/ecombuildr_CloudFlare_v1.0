import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot', 'DiscordBot',
  'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 'Googlebot', 'Bingbot', 'Slurp',
  'DuckDuckBot', 'Baiduspider', 'YandexBot', 'Pinterestbot', 'Applebot', 'ia_archiver',
  'facebook', 'meta'
];

function isSocialCrawler(userAgent: string): boolean {
  return SOCIAL_CRAWLERS.some(crawler => userAgent.toLowerCase().includes(crawler.toLowerCase()));
}

// Helper function to resolve SEO data based on domain and pathname
async function resolveSEOData(supabase: any, domain: string, pathname: string): Promise<any | null> {
  try {
    // 1. Find custom domain
    const { data: customDomain, error: domainError } = await supabase
      .from('custom_domains')
      .select('id, domain')
      .eq('domain', domain)
      .maybeSingle();

    if (domainError) console.error('Error fetching custom domain:', domainError);
    if (!customDomain) {
      console.log('No custom domain found for:', domain);
      return null;
    }

    // 2. Find domain connection
    const { data: connections, error: connectionError } = await supabase
      .from('domain_connections')
      .select('content_type, content_id, store_id, path, is_homepage')
      .eq('domain_id', customDomain.id);

    if (connectionError) console.error('Error fetching domain connections:', connectionError);
    if (!connections || connections.length === 0) {
      console.log('No domain connection found for:', domain);
      return null;
    }

    let connection = null;
    const normalizedPath = pathname === '/' ? '' : pathname.replace(/^\//, '');

    // Try to find an exact path match first
    connection = connections.find((c: any) => c.path === normalizedPath);

    // If no exact path match, try to find the homepage connection for the root path
    if (!connection && normalizedPath === '') {
      connection = connections.find((c: any) => c.is_homepage === true);
    }
    
    // Fallback to any connection if no specific match found for the root path
    if (!connection && normalizedPath === '') {
        connection = connections[0];
    }

    if (!connection) {
        console.log('No suitable domain connection found for path:', pathname);
        return null;
    }

    const { content_type, content_id, store_id } = connection;

    // Fetch store for favicon
    let storeFaviconUrl: string | undefined;
    if (store_id) {
      const { data: store, error: storeFetchError } = await supabase
        .from('stores')
        .select('favicon_url')
        .eq('id', store_id)
        .maybeSingle();
      if (storeFetchError) console.error('Error fetching store for favicon:', storeFetchError);
      storeFaviconUrl = store?.favicon_url;
    }

    let seoData: any = null;
    switch (content_type) {
      case 'website':
        seoData = await resolveWebsiteSEO(supabase, content_id, pathname, domain);
        break;
      case 'funnel':
        seoData = await resolveFunnelSEO(supabase, content_id, pathname, domain);
        break;
      case 'course_area':
        seoData = await resolveCourseAreaSEO(supabase, store_id, domain);
        break;
      default:
        console.log('Unknown content type:', content_type);
        return null;
    }

    if (seoData && !seoData.favicon_url) {
        seoData.favicon_url = storeFaviconUrl;
    }

    return seoData;

  } catch (error) {
    console.error('Error resolving SEO data:', error);
    return null;
  }
}

// Helper function to resolve website SEO data
async function resolveWebsiteSEO(supabase: any, websiteId: string, pathname: string, domain: string): Promise<any | null> {
  try {
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id, name, description, seo_title, seo_description, og_image, seo_keywords, meta_robots, settings')
      .eq('id', websiteId)
      .maybeSingle();

    if (websiteError) console.error('Error fetching website:', websiteError);
    if (!website) return null;

    let pageData: any = null;
    const normalizedPath = pathname === '/' ? '' : pathname.replace(/^\//, '');

    if (normalizedPath === '') {
      // Root path, get homepage
      const { data: homepage } = await supabase
        .from('website_pages')
        .select('title, seo_title, seo_description, og_image, seo_keywords, meta_robots, canonical_url, is_published')
        .eq('website_id', website.id)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();
      pageData = homepage;
    } else {
      // Specific page path
      const { data: page } = await supabase
        .from('website_pages')
        .select('title, seo_title, seo_description, og_image, seo_keywords, meta_robots, canonical_url, is_published')
        .eq('website_id', website.id)
        .eq('slug', normalizedPath)
        .eq('is_published', true)
        .maybeSingle();
      pageData = page;
    }

    let seoData: any = {
      title: website.seo_title || website.name,
      description: website.seo_description || website.description,
      og_image: website.og_image,
      keywords: website.seo_keywords,
      canonical_url: `https://${domain}${pathname}`,
      robots: website.meta_robots || 'index, follow',
      site_name: website.name,
      favicon_url: website.settings?.favicon_url
    };

    if (pageData) {
      seoData = {
        title: pageData.seo_title || pageData.title || seoData.title,
        description: pageData.seo_description || seoData.description,
        og_image: pageData.og_image || seoData.og_image,
        keywords: pageData.seo_keywords || seoData.keywords,
        canonical_url: pageData.canonical_url || seoData.canonical_url,
        robots: pageData.meta_robots || seoData.robots,
        site_name: seoData.site_name,
        favicon_url: seoData.favicon_url
      };
    }
    return seoData;
  } catch (error) {
    console.error('Error resolving website SEO:', error);
    return null;
  }
}

// Helper function to resolve funnel SEO data
async function resolveFunnelSEO(supabase: any, funnelId: string, pathname: string, domain: string): Promise<any | null> {
  try {
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name, description, seo_title, seo_description, og_image, seo_keywords, meta_robots, settings')
      .eq('id', funnelId)
      .maybeSingle();

    if (funnelError) console.error('Error fetching funnel:', funnelError);
    if (!funnel) return null;

    let stepData: any = null;
    const normalizedPath = pathname === '/' ? '' : pathname.replace(/^\//, '');

    if (normalizedPath === '') {
      // Root path, get first step
      const { data: firstStep } = await supabase
        .from('funnel_steps')
        .select('title, seo_title, seo_description, og_image, seo_keywords, meta_robots, canonical_url, is_published')
        .eq('funnel_id', funnel.id)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      stepData = firstStep;
    } else {
      // Specific step path
      const { data: step } = await supabase
        .from('funnel_steps')
        .select('title, seo_title, seo_description, og_image, seo_keywords, meta_robots, canonical_url, is_published')
        .eq('funnel_id', funnel.id)
        .eq('slug', normalizedPath)
        .eq('is_published', true)
        .maybeSingle();
      stepData = step;
    }

    let seoData: any = {
      title: funnel.seo_title || funnel.name,
      description: funnel.seo_description || funnel.description,
      og_image: funnel.og_image,
      keywords: funnel.seo_keywords,
      canonical_url: `https://${domain}${pathname}`,
      robots: funnel.meta_robots || 'index, follow',
      site_name: funnel.name,
      favicon_url: funnel.settings?.favicon_url
    };

    if (stepData) {
      seoData = {
        title: stepData.seo_title || stepData.title || seoData.title,
        description: stepData.seo_description || seoData.description,
        og_image: stepData.og_image || seoData.og_image,
        keywords: stepData.seo_keywords || seoData.keywords,
        canonical_url: stepData.canonical_url || seoData.canonical_url,
        robots: stepData.meta_robots || seoData.robots,
        site_name: seoData.site_name,
        favicon_url: seoData.favicon_url
      };
    }
    return seoData;
  } catch (error) {
    console.error('Error resolving funnel SEO:', error);
    return null;
  }
}

// Helper function to resolve course area SEO data
async function resolveCourseAreaSEO(supabase: any, storeId: string, domain: string): Promise<any | null> {
  try {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name, favicon_url')
      .eq('id', storeId)
      .maybeSingle();

    if (storeError) console.error('Error fetching store for course area:', storeError);

    return {
      title: `${store?.name || 'EcomBuildr'} Course Area`,
      description: `Access your courses and learning materials on ${store?.name || 'EcomBuildr'}`,
      og_image: undefined,
      keywords: ['courses', 'learning', 'education'],
      canonical_url: `https://${domain}/courses`,
      robots: 'index, follow',
      site_name: `${store?.name || 'EcomBuildr'} Course Area`,
      favicon_url: store?.favicon_url
    };
  } catch (error) {
    console.error('Error resolving course area SEO:', error);
    return null;
  }
}

function generateHTML(seoData: any): string {
  const keywordsString = Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords || '';
  const ogImage = seoData.og_image || 'https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png';
  const favicon = seoData.favicon_url || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO Meta Tags -->
  <title>${seoData.title}</title>
  <meta name="description" content="${seoData.description}" />
  ${keywordsString ? `<meta name="keywords" content="${keywordsString}" />` : ''}
  <meta name="robots" content="${seoData.robots}" />
  <link rel="canonical" href="${seoData.canonical_url}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${seoData.title}" />
  <meta property="og:description" content="${seoData.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${seoData.canonical_url}" />
  ${seoData.site_name ? `<meta property="og:site_name" content="${seoData.site_name}" />` : ''}
  <meta property="og:image" content="${ogImage}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${seoData.title}" />
  <meta name="twitter:description" content="${seoData.description}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <!-- Favicon -->
  ${favicon ? `<link rel="icon" href="${favicon}" />` : ''}
  
  <!-- Theme -->
  <meta name="theme-color" content="#10B981" />
  
  <!-- Font Awesome -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkfT9l64lZ7P6Q5GxynwL97N6hCk9JQ3aP9JQv4dZ6b8x0zJQZQYShCw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
  
  <script type="module" src="/src/main.tsx"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
}

export default async function handler(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Check if this is a social crawler
    const isSocialCrawler = isSocialCrawler(userAgent);

    // Check if this is a custom domain (not our main domains)
    const isCustomDomain = !host.includes('ecombuildr.com') && 
                          !host.includes('localhost') && 
                          !host.includes('lovable.dev') &&
                          !host.includes('lovable.app') &&
                          !host.includes('lovableproject.com');

    if (!isSocialCrawler || !isCustomDomain) {
      // For non-crawlers or non-custom domains, fetch and serve the main app
      try {
        const mainAppUrl = `https://f-commerce-builder-git-main-schalder.vercel.app${pathname}${url.search}`;
        const response = await fetch(mainAppUrl);
        const html = await response.text();
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      } catch (error) {
        console.error('Error fetching main app:', error);
        return new NextResponse('Error loading page', { status: 500 });
      }
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve SEO data for custom domain
    const seoData = await resolveSEOData(supabase, host, pathname);

    if (seoData) {
      const html = generateHTML(seoData);
      return new NextResponse(html, {
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=300' // 5 minutes cache
        }
      });
    }

    // Fallback to generic EcomBuildr SEO if no custom data found
    const defaultSEO = {
      title: 'EcomBuildr - Build Beautiful Online Stores & Funnels',
      description: 'Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features.',
      og_image: 'https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png',
      keywords: ['website builder', 'ecommerce', 'online store', 'sales funnel', 'drag and drop'],
      canonical_url: `https://${host}`,
      robots: 'index, follow',
      site_name: 'EcomBuildr',
      favicon_url: undefined
    };
    const html = generateHTML(defaultSEO);
    return new NextResponse(html, {
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error: any) {
    console.error('SEO Handler Error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  runtime: 'edge',
};

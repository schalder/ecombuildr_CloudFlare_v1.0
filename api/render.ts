// Primary Vercel Edge Function - handles all traffic and decides bot vs user routing
export const config = {
  runtime: 'edge',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

// Social crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit',
  'facebookbot',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'discordbot',
  'telegrambot',
  'slackbot',
  'skypeuripreview',
  'googlebot',
  'bingbot',
  'baiduspider',
  'yandex',
  'duckduckbot',
  'slurp',
  'ia_archiver',
  'semrushbot',
  'ahrefsbot',
  'dotbot',
  'bot',
  'crawler',
  'spider',
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some((crawler) => ua.includes(crawler));
}

// Extract description from content
function extractContentDescription(content: any, maxLength: number = 155): string {
  if (!content) return '';
  
  if (typeof content === 'string') {
    return content.substring(0, maxLength);
  }
  
  if (content.sections && Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (section.content?.text) {
        return section.content.text.substring(0, maxLength);
      }
      if (section.content?.subtitle) {
        return section.content.subtitle.substring(0, maxLength);
      }
    }
  }
  
  return '';
}

// Normalize image URL
function normalizeImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `https://${imageUrl}`;
}

// SEO data structure
interface SEOData {
  title: string;
  description: string;
  image?: string;
  url: string;
  site_name: string;
  type?: string;
  canonical?: string;
  robots?: string;
  language?: string;
  source?: string;
  debug?: any;
}

// Resolve SEO data from Supabase
async function resolveSEOData(hostname: string, pathname: string): Promise<SEOData | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const cleanPath = pathname === '/' ? '' : pathname.replace(/^\//, '').replace(/\/$/, '');
  
  console.log(`[SEO] Resolving: ${hostname}${pathname}`);

  // Check for custom domain first
  const { data: domainData } = await supabase
    .from('custom_domains')
    .select('id, domain, is_verified, content_type, content_id')
    .eq('domain', hostname)
    .eq('is_verified', true)
    .single();

  if (domainData) {
    console.log(`[SEO] Custom domain found: ${domainData.content_type} - ${domainData.content_id}`);
    
    if (domainData.content_type === 'website') {
      // Homepage
      if (!cleanPath) {
        const { data: website } = await supabase
          .from('websites')
          .select('id, name, description, logo_url, seo_title, seo_description, seo_keywords, og_image')
          .eq('id', domainData.content_id)
          .single();

        if (website) {
          return {
            title: website.seo_title || website.name,
            description: website.seo_description || website.description || `Welcome to ${website.name}`,
            image: normalizeImageUrl(website.og_image || website.logo_url),
            url: `https://${hostname}`,
            site_name: website.name,
            type: 'website',
            source: 'website_homepage',
          };
        }
      }
      
      // Website page
      const { data: page } = await supabase
        .from('website_pages')
        .select('id, title, slug, seo_title, seo_description, seo_keywords, og_image, content')
        .eq('website_id', domainData.content_id)
        .eq('slug', cleanPath)
        .eq('is_published', true)
        .single();

      if (page) {
        const { data: website } = await supabase
          .from('websites')
          .select('name, logo_url')
          .eq('id', domainData.content_id)
          .single();

        return {
          title: page.seo_title || page.title,
          description: page.seo_description || extractContentDescription(page.content),
          image: normalizeImageUrl(page.og_image || website?.logo_url),
          url: `https://${hostname}/${cleanPath}`,
          site_name: website?.name || hostname,
          type: 'article',
          source: 'website_page',
        };
      }
    } else if (domainData.content_type === 'funnel') {
      // Funnel landing page
      if (!cleanPath) {
        const { data: funnel } = await supabase
          .from('funnels')
          .select('id, name, description, seo_title, seo_description, og_image')
          .eq('id', domainData.content_id)
          .single();

        if (funnel) {
          return {
            title: funnel.seo_title || funnel.name,
            description: funnel.seo_description || funnel.description || `Welcome to ${funnel.name}`,
            image: normalizeImageUrl(funnel.og_image),
            url: `https://${hostname}`,
            site_name: funnel.name,
            type: 'website',
            source: 'funnel_landing',
          };
        }
      }
      
      // Funnel step
      const { data: step } = await supabase
        .from('funnel_steps')
        .select('id, title, slug, seo_title, seo_description, og_image, content')
        .eq('funnel_id', domainData.content_id)
        .eq('slug', cleanPath)
        .single();

      if (step) {
        const { data: funnel } = await supabase
          .from('funnels')
          .select('name')
          .eq('id', domainData.content_id)
          .single();

        return {
          title: step.seo_title || step.title,
          description: step.seo_description || extractContentDescription(step.content),
          image: normalizeImageUrl(step.og_image),
          url: `https://${hostname}/${cleanPath}`,
          site_name: funnel?.name || hostname,
          type: 'article',
          source: 'funnel_step',
        };
      }
    }
  }

  console.log(`[SEO] No data found for ${hostname}${pathname}`);
  return null;
}

// Generate HTML with SEO meta tags
function generateHTML(seo: SEOData, url: string): string {
  const ogImage = seo.image || '';
  const description = seo.description || '';
  
  return `<!DOCTYPE html>
<html lang="${seo.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${seo.title}</title>
  <meta name="title" content="${seo.title}">
  <meta name="description" content="${description}">
  ${seo.robots ? `<meta name="robots" content="${seo.robots}">` : ''}
  ${seo.canonical ? `<link rel="canonical" href="${seo.canonical}">` : ''}
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${seo.type || 'website'}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${seo.title}">
  <meta property="og:description" content="${description}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  <meta property="og:site_name" content="${seo.site_name}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${seo.title}">
  <meta property="twitter:description" content="${description}">
  ${ogImage ? `<meta property="twitter:image" content="${ogImage}">` : ''}
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "${seo.site_name}",
    "url": "${url}",
    "description": "${description}"
  }
  </script>
</head>
<body>
  <h1>${seo.title}</h1>
  <p>${description}</p>
  <noscript>
    <p>This page requires JavaScript to run properly. Please enable JavaScript in your browser.</p>
  </noscript>
</body>
</html>`;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { hostname, pathname } = url;
  const userAgent = request.headers.get('user-agent') || '';
  const traceId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  console.log(`[${traceId}] 🌐 Request: ${hostname}${pathname} | UA: ${userAgent.substring(0, 80)}`);
  
  // Check if this is a bot
  const isBot = isSocialCrawler(userAgent);
  
  console.log(`[${traceId}] Bot detected: ${isBot}`);
  
  // If bot, resolve SEO and return HTML
  if (isBot) {
    try {
      const seoData = await resolveSEOData(hostname, pathname);
      
      if (seoData) {
        console.log(`[${traceId}] ✅ SEO resolved: ${seoData.source}`);
        const html = generateHTML(seoData, url.toString());
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-SEO-Handler': 'vercel-edge-render',
            'X-SEO-Source': seoData.source || 'unknown',
            'X-Trace-Id': traceId,
          },
        });
      }
      
      // No SEO data found, serve fallback HTML
      console.log(`[${traceId}] ⚠️ No SEO data found, serving fallback`);
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hostname}</title>
  <meta name="description" content="Welcome to ${hostname}">
</head>
<body>
  <h1>Welcome to ${hostname}</h1>
</body>
</html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-SEO-Handler': 'vercel-edge-render',
            'X-SEO-Source': 'fallback',
            'X-Trace-Id': traceId,
          },
        }
      );
    } catch (error) {
      console.error(`[${traceId}] ❌ Error resolving SEO:`, error);
      
      // Return error HTML for bots
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
</head>
<body>
  <h1>Error loading page</h1>
  <p>Please try again later.</p>
</body>
</html>`,
        {
          status: 500,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-SEO-Handler': 'vercel-edge-render',
            'X-SEO-Source': 'error',
            'X-Trace-Id': traceId,
          },
        }
      );
    }
  }
  
  // Regular users: serve the SPA (index.html)
  console.log(`[${traceId}] 👤 Regular user, serving SPA`);
  
  try {
    const indexUrl = new URL('/index.html', url.origin);
    const indexResponse = await fetch(indexUrl.toString());
    
    return new Response(indexResponse.body, {
      status: indexResponse.status,
      headers: {
        ...Object.fromEntries(indexResponse.headers),
        'X-Trace-Id': traceId,
      },
    });
  } catch (error) {
    console.error(`[${traceId}] ❌ Error fetching index.html:`, error);
    
    return new Response('Error loading application', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'X-Trace-Id': traceId,
      },
    });
  }
}

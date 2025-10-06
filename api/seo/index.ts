import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Helper function to detect social crawlers
function isSocialCrawler(userAgent: string): boolean {
  const socialBots = [
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'slackbot',
    'discordbot',
    'googlebot',
    'bingbot',
    'yandexbot',
    'baiduspider',
    'duckduckbot',
    'applebot',
    'crawler',
    'spider',
    'bot'
  ];
  
  const ua = userAgent.toLowerCase();
  return socialBots.some(bot => ua.includes(bot));
}

// Helper function to extract content description from HTML
function extractContentDescription(content: string): string {
  if (!content) return '';
  
  // Remove HTML tags
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Take first 160 characters
  const description = textContent.substring(0, 160).trim();
  
  // Add ellipsis if truncated
  return description.length < textContent.length ? description + '...' : description;
}

// Helper function to normalize image URLs
function normalizeImageUrl(imageUrl: string | null, domain: string): string {
  if (!imageUrl) return '';
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL, make it absolute
  if (imageUrl.startsWith('/')) {
    return `https://${domain}${imageUrl}`;
  }
  
  // Otherwise, assume it's a relative path
  return `https://${domain}/${imageUrl}`;
}

// SEO Data interface
interface SEOData {
  title: string;
  description: string;
  og_image?: string;
  keywords: string[];
  canonical: string;
  robots: string;
  site_name: string;
  source: string;
}

// Helper function to resolve website homepage SEO
async function resolveWebsiteHomepageSEO(websiteId: string, domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`🏠 Website homepage SEO resolution for: ${websiteId}`);
    
    // Get website data
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, seo_title, seo_description, og_image, seo_keywords')
      .eq('id', websiteId)
      .eq('is_active', true)
      .eq('is_published', true)
      .maybeSingle();
    
    if (!website) {
      console.log('❌ Website not found');
      return null;
    }
    
    console.log(`✅ Found website: ${website.name}`);
    
    // Get homepage data (page with is_homepage = true)
    const { data: homepage } = await supabase
      .from('website_pages')
      .select('id, title, seo_title, seo_description, og_image, seo_keywords, content')
      .eq('website_id', websiteId)
      .eq('is_homepage', true)
      .eq('is_published', true)
      .maybeSingle();
    
    if (!homepage) {
      console.log('❌ Homepage not found');
      return null;
    }
    
    console.log(`✅ Found homepage: ${homepage.title}`);
    
    // Build SEO data
    const title = homepage.seo_title || homepage.title || website.name;
    const description = homepage.seo_description || extractContentDescription(homepage.content) || website.seo_description || `Visit ${website.name}`;
    const image = normalizeImageUrl(homepage.og_image || website.og_image, domain);
    const keywords = homepage.seo_keywords || website.seo_keywords || [];
    const canonical = `https://${domain}${path}`;
    
    return {
      title,
      description,
      og_image: image,
      keywords: Array.isArray(keywords) ? keywords : [],
      canonical,
      robots: 'index, follow',
      site_name: website.name,
      source: 'website_homepage'
    };
    
  } catch (error) {
    console.error('❌ Website homepage SEO resolution error:', error);
    return null;
  }
}

// Main SEO data resolution
async function resolveSEOData(domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`🔍 Resolving SEO for ${domain}${path}`);

    // Normalize domain variants
    const apexDomain = domain.replace(/^www\./, '');
    const domainVariants = [domain, apexDomain, `www.${apexDomain}`];
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');

    // Custom domain handling
    console.log(`🌐 Custom domain detected - using domain connections`);

    // Step 1: Find custom domain mapping
    const { data: customDomain } = await supabase
      .from('custom_domains')
      .select('id, domain, store_id')
      .in('domain', domainVariants)
      .maybeSingle();

    if (!customDomain) {
      console.log('❌ No custom domain found');
      return null;
    }

    console.log(`✅ Found custom domain: ${customDomain.domain} -> store ${customDomain.store_id}`);

    // Step 2: Find website connection
    const { data: connections } = await supabase
      .from('domain_connections')
      .select('content_type, content_id')
      .eq('domain_id', customDomain.id);

    const websiteConnection = connections?.find(c => c.content_type === 'website');

    let websiteId: string | null = null;

    if (websiteConnection) {
      websiteId = websiteConnection.content_id;
      console.log(`✅ Found website connection: ${websiteId}`);
    }

    // If no connections found, fallback to store content
    if (!websiteConnection) {
      console.log('⚠️ No domain connections found. Falling back to store content');

      // Try to find website by domain match
      const { data: storeWebsites } = await supabase
        .from('websites')
        .select('id, domain')
        .eq('store_id', customDomain.store_id)
        .eq('is_active', true)
        .eq('is_published', true);

      if (storeWebsites && storeWebsites.length > 0) {
        const exactMatch = storeWebsites.find(w => w.domain && w.domain.replace(/^www\./, '') === apexDomain);
        websiteId = exactMatch?.id || storeWebsites[0].id;
        console.log(`📦 Using store website fallback: ${websiteId}`);
      }
    }

    if (!websiteId) {
      console.log('❌ No website ID available');
      return null;
    }

    // Use the helper function for website SEO resolution
    return await resolveWebsiteHomepageSEO(websiteId, domain, path);

  } catch (error) {
    console.error('❌ SEO resolution error:', error);
    return null;
  }
}

// Generate complete HTML for crawlers
function generateHTML(seo: SEOData, url: string): string {
  const title = seo.title;
  const description = seo.description;
  const image = seo.og_image || '';
  const canonical = seo.canonical;
  const siteName = seo.site_name;
  const robots = seo.robots;
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.join(', ') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#10B981" />

  <title>${title}</title>
  <meta name="description" content="${description}" />
  ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
  <meta name="robots" content="${robots}" />
  <meta name="author" content="${siteName}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
  ${image ? `<meta property="og:image:type" content="image/png" />` : ''}
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${canonical}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${description}" />
  ${image ? `<meta property="twitter:image" content="${image}" />` : ''}

  <!-- Performance optimizations -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://fhqwacmokbtbspkxjixf.supabase.co" />
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

  <!-- Critical resource hints -->
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
  <link rel="preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />

  <!-- Critical CSS for image optimization -->
  <style>
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .image-container { position: relative; overflow: hidden; background-color: hsl(var(--muted)); }
    .image-container::before { content: ''; display: block; width: 100%; height: 0; padding-bottom: var(--aspect-ratio, 56.25%); }
    .image-container img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; -o-object-fit: cover; object-fit: cover; transition: opacity 0.3s ease; }
    .loading-shimmer { background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.1) 50%, hsl(var(--muted)) 75%); background-size: 200% 100%; animation: shimmer 2s infinite; }
    picture { display: block; width: 100%; height: 100%; }
    img[width][height] { aspect-ratio: attr(width) / attr(height); }
  </style>

  <!-- Font Awesome for icon lists -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
</head>
<body>
  <div id="root">
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
      <h1 style="margin-bottom: 1rem; color: #333;">${title}</h1>
      <p style="color: #666; text-align: center; max-width: 600px;">${description}</p>
      ${image ? `<img src="${image}" alt="${title}" style="max-width: 100%; height: auto; margin-top: 2rem; border-radius: 8px;" />` : ''}
    </div>
  </div>

  <!-- Load the React app -->
  <script type="module" crossorigin src="/assets/index-BP6koOer.js"></script>
  <link rel="modulepreload" crossorigin href="/assets/react-vendor-CeYc4tiK.js">
  <link rel="modulepreload" crossorigin href="/assets/chart-vendor-Bfzb-huE.js">
  <link rel="modulepreload" crossorigin href="/assets/ui-libs-COW4yPD2.js">
  <link rel="modulepreload" crossorigin href="/assets/ui-vendor-CCE0z0LV.js">
  <link rel="modulepreload" crossorigin href="/assets/page-builder-YQoEA8C7.js">
  <link rel="modulepreload" crossorigin href="/assets/date-vendor-CQ923hJe.js">
  <link rel="modulepreload" crossorigin href="/assets/form-vendor-CzNr-oSg.js">
  <link rel="stylesheet" crossorigin href="/assets/index-CZB-H0bA.css">
</body>
</html>`;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const domain = url.hostname;
  const pathname = url.pathname;
  const traceId = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

  console.log(`[${traceId}] 🌐 SEO EDGE FUNCTION TRIGGERED: ${domain}${pathname} | UA: ${userAgent.substring(0, 80)}`);

  // Detect if this is a custom domain (not ecombuildr.com or localhost)
  const isCustomDomain = !domain.includes('ecombuildr.com') &&
                        !domain.includes('localhost') &&
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');

  // Check if this is a social crawler
  const isSocialBot = isSocialCrawler(userAgent);

  console.log(`🔍 Domain: ${domain} | Custom: ${isCustomDomain} | Social Bot: ${isSocialBot}`);

  // For custom domains, provide SEO for ALL visitors
  if (isCustomDomain) {
    console.log(`🌐 Custom domain request - generating SEO HTML for ${isSocialBot ? 'social crawler' : 'regular visitor'}`);

    try {
      const seoData = await resolveSEOData(domain, pathname);

      if (!seoData) {
        console.log(`[${traceId}] ❌ No SEO data found - rendering minimal fallback`);
        const minimal = {
          title: domain,
          description: `Preview of ${domain}`,
          og_image: undefined,
          keywords: [],
          canonical: `https://${domain}${pathname}`,
          robots: 'noindex, nofollow',
          site_name: 'EcomBuildr Preview',
          source: 'edge_function_minimal_fallback'
        };
        return new Response(generateHTML(minimal, url.toString()), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      console.log(`[${traceId}] ✅ SEO data resolved: ${seoData.title}`);
      return new Response(generateHTML(seoData, url.toString()), {
        headers: {
          'Content-Type': 'text/html',
          'X-SEO-Source': seoData.source,
          'X-SEO-Website': seoData.site_name,
          'X-SEO-Page': seoData.title,
          'X-SEO-Domain': domain,
          'X-SEO-Path': pathname,
        },
      });

    } catch (error) {
      console.error('💥 SEO Handler error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // For system domains, return 404 to let Vercel handle routing
  console.log('🏠 System domain - returning 404 to let Vercel handle routing');
  return new Response('Not Found', { status: 404 });
}

export const config = {
  runtime: 'edge',
};

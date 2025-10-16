import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache for the HTML template
let htmlTemplateCache: string | null = null;
let templateCacheTime = 0;
const TEMPLATE_CACHE_TTL = 60000; // 1 minute

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
  'facebookplatform', 'Facebot', 'FacebookBot', 'Googlebot', 'Bingbot',
  'bot', 'crawler', 'spider', 'baiduspider', 'yandex', 'duckduckbot',
  'slurp', 'ia_archiver', 'semrushbot', 'ahrefsbot', 'dotbot',
  'pinterestbot', 'applebot', 'yahoobot'
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

interface SEOData {
  title: string;
  description: string;
  og_image?: string;
  keywords?: string[];
  canonical: string;
  robots: string;
  site_name: string;
  source?: string;
}

// Get HTML template with caching
async function getHTMLTemplate(baseUrl: string): Promise<string> {
  const now = Date.now();
  
  if (htmlTemplateCache && (now - templateCacheTime) < TEMPLATE_CACHE_TTL) {
    return htmlTemplateCache;
  }
  
  try {
    // Use a different approach - construct the template directly
    // This avoids circular dependency issues
    const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Placeholder SEO Meta Tags (replaced by SSR for bots) -->
    <title>__PAGE_TITLE__</title>
    <meta name="description" content="__PAGE_DESCRIPTION__" />
    <meta name="keywords" content="__PAGE_KEYWORDS__" />
    <meta name="robots" content="__PAGE_ROBOTS__" />
    <meta name="author" content="__PAGE_AUTHOR__" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="__PAGE_URL__" />
    <meta property="og:title" content="__PAGE_TITLE__" />
    <meta property="og:description" content="__PAGE_DESCRIPTION__" />
    <meta property="og:image" content="__PAGE_IMAGE__" />
    <meta property="og:image:secure_url" content="__PAGE_IMAGE__" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="__SITE_NAME__" />
    <meta property="og:locale" content="__PAGE_LOCALE__" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="__PAGE_URL__" />
    <meta name="twitter:title" content="__PAGE_TITLE__" />
    <meta name="twitter:description" content="__PAGE_DESCRIPTION__" />
    <meta name="twitter:image" content="__PAGE_IMAGE__" />
    <meta name="twitter:image:alt" content="__PAGE_TITLE__" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="__PAGE_URL__" />
    
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
      .image-container img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease; }
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
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    htmlTemplateCache = template;
    templateCacheTime = now;
    
    return htmlTemplateCache;
  } catch (error) {
    console.error('Error creating HTML template:', error);
    
    // Fallback to minimal template if anything fails
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>__PAGE_TITLE__</title>
  <meta name="description" content="__PAGE_DESCRIPTION__" />
  <meta property="og:title" content="__PAGE_TITLE__" />
  <meta property="og:description" content="__PAGE_DESCRIPTION__" />
  <meta property="og:image" content="__PAGE_IMAGE__" />
  <link rel="canonical" href="__PAGE_URL__" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
  }
}

// Replace placeholders in HTML template
function replacePlaceholders(template: string, seo: SEOData): string {
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const image = seo.og_image || '';
  const canonical = seo.canonical;
  const siteName = escapeHtml(seo.site_name);
  const robots = seo.robots;
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.map(k => escapeHtml(k)).join(', ') : '';
  const languageCode = 'en';
  const author = siteName;
  const locale = 'en_US';

  return template
    .replace(/__PAGE_TITLE__/g, title)
    .replace(/__PAGE_DESCRIPTION__/g, description)
    .replace(/__PAGE_KEYWORDS__/g, keywords)
    .replace(/__PAGE_ROBOTS__/g, robots)
    .replace(/__PAGE_AUTHOR__/g, author)
    .replace(/__PAGE_URL__/g, canonical)
    .replace(/__PAGE_IMAGE__/g, image)
    .replace(/__SITE_NAME__/g, siteName)
    .replace(/__PAGE_LOCALE__/g, locale)
    .replace(/<html lang="en">/g, `<html lang="${languageCode}">`);
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Resolve SEO data from database
async function resolveSEOData(hostname: string, pathname: string): Promise<SEOData | null> {
  try {
    // For now, return basic SEO data
    // This can be expanded to query the database based on hostname and pathname
    const basicSEO: SEOData = {
      title: 'EcomBuildr - Build Your E-commerce Empire',
      description: 'Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required.',
      og_image: 'https://get.ecombuildr.com/hero-ecommerce.jpg',
      keywords: ['ecommerce', 'website builder', 'sales funnel'],
      canonical: `https://${hostname}${pathname}`,
      robots: 'index, follow',
      site_name: 'EcomBuildr',
      source: 'basic_fallback'
    };
    
    return basicSEO;
  } catch (error) {
    console.error('Error resolving SEO data:', error);
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Get actual hostname from x-forwarded-host header (Vercel sets this)
  const hostname = request.headers.get('x-forwarded-host') || 'localhost';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
  // Construct base URL for fetching template
  const baseUrl = `${protocol}://${hostname}`;
  
  // Get original path from query param (set by vercel.json rewrite)
  let pathname = '/';
  try {
    // Try to parse the URL safely
    const url = new URL(request.url);
    pathname = url.searchParams.get('path') || '/';
  } catch (error) {
    // If URL parsing fails, try to extract path from the URL string manually
    const urlString = request.url;
    const pathMatch = urlString.match(/[?&]path=([^&]*)/);
    if (pathMatch) {
      pathname = decodeURIComponent(pathMatch[1]) || '/';
    }
  }
  
  const traceId = Math.random().toString(36).slice(2);
  console.log(`[${traceId}] 🔍 SEO Handler - ${hostname}${pathname} | UA: ${userAgent.substring(0, 50)}...`);
  
  try {
    console.log(`[${traceId}] 📝 Getting HTML template...`);
    // Fetch the HTML template
    const htmlTemplate = await getHTMLTemplate(baseUrl);
    console.log(`[${traceId}] ✅ HTML template obtained (${htmlTemplate.length} chars)`);
    
    // Check if this is a social media crawler
    const isBot = isSocialCrawler(userAgent);
    console.log(`[${traceId}] 🤖 Bot detected: ${isBot}`);
    
    if (isBot) {
      console.log(`[${traceId}] 🤖 Bot detected - serving SEO HTML`);
      
      // Resolve SEO data from database
      const seoData = await resolveSEOData(hostname, pathname);
      
      if (!seoData) {
        console.log(`[${traceId}] ⚠️ No SEO data found - serving template as-is`);
        return new Response(htmlTemplate, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'X-Trace-Id': traceId,
          },
        });
      }
      
      console.log(`[${traceId}] ✅ SEO resolved via ${seoData.source}: ${seoData.title}`);
      
      // Replace placeholders with actual SEO data
      const html = replacePlaceholders(htmlTemplate, seoData);
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Trace-Id': traceId,
          'X-SEO-Source': seoData.source || 'unknown',
          'X-User-Type': 'bot'
        },
      });
    }
    
    // For regular users, serve the template as-is (React will hydrate)
    console.log(`[${traceId}] 👤 Regular user - serving SPA template`);
    return new Response(htmlTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'X-Trace-Id': traceId,
        'X-User-Type': 'regular'
      },
    });

  } catch (error) {
    console.error(`[${traceId}] 💥 SEO Handler error:`, error);
    
    // On error, return a basic template
    const basicTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EcomBuildr - Build Your E-commerce Empire</title>
  <meta name="description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required." />
  <meta property="og:title" content="EcomBuildr - Build Your E-commerce Empire" />
  <meta property="og:description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required." />
  <meta property="og:image" content="https://get.ecombuildr.com/hero-ecommerce.jpg" />
  <link rel="canonical" href="https://${hostname}${pathname}" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
    
    return new Response(basicTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Trace-Id': traceId,
        'X-Error': 'SEO-processing-failed'
      },
    });
  }
}
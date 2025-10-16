import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateHTML(seo: any, url: string): string {
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const image = seo.og_image || '';
  const canonical = seo.canonical;
  const siteName = escapeHtml(seo.site_name);
  const robots = seo.robots;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="${robots}" />
  <meta name="author" content="${siteName}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image || ''}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
  
  <!-- Additional SEO -->
  <link rel="canonical" href="${canonical}" />
</head>
<body>
  <div id="root">
    <header>
      <h1>${title}</h1>
    </header>
    <main>
      <p>${description}</p>
      <p>Loading content...</p>
    </main>
  </div>
  <script>
    // Redirect to React app after a short delay for crawlers that execute JS
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  </script>
</body>
</html>`;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    console.log('🚀 SEO API handler started');
    
    // Get actual hostname from x-forwarded-host header (Vercel sets this)
    const hostname = request.headers.get('x-forwarded-host') || 'get.ecombuildr.com';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    // Construct full URL for proper URL parsing
    const fullUrl = `${protocol}://${hostname}${request.url}`;
    console.log('🔗 Full URL:', fullUrl);
    
    const url = new URL(fullUrl);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Get original path from query param (set by vercel.json rewrite)
    const originalPath = url.searchParams.get('path') || url.pathname;
    const pathname = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;
    
    console.log(`🌐 Request: ${hostname}${pathname} | UA: ${userAgent.substring(0, 50)}`);
    
    // Check if this is a social crawler
    const isSocialBot = isSocialCrawler(userAgent);
    console.log(`🤖 Is social bot: ${isSocialBot}`);
    
    if (isSocialBot) {
      console.log('🤖 Social crawler detected - generating SEO HTML');
      
      // Special case for get.ecombuildr.com marketing site
      if (hostname === 'get.ecombuildr.com') {
        const seoData = {
          title: 'EcomBuildr - Build Your E-commerce Empire',
          description: 'Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required. Start your online business today with our powerful drag-and-drop builder.',
          og_image: 'https://get.ecombuildr.com/hero-ecommerce.jpg',
          canonical: `https://${hostname}${pathname}`,
          robots: 'index, follow',
          site_name: 'EcomBuildr'
        };
        
        const html = generateHTML(seoData, url.toString());
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': html.length.toString(),
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-SEO-Source': 'marketing_site'
          },
        });
      }
      
      // For other domains, return basic SEO
      const seoData = {
        title: `${hostname} - Website`,
        description: `Visit ${hostname} for more information`,
        og_image: '',
        canonical: `https://${hostname}${pathname}`,
        robots: 'index, follow',
        site_name: hostname
      };
      
      const html = generateHTML(seoData, url.toString());
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': html.length.toString(),
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-SEO-Source': 'basic_seo'
        },
      });
    }
    
    // Regular users get the SPA
    console.log('👤 Regular user - serving SPA HTML');
    
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loading...</title>
  <meta name="robots" content="noindex, nofollow" />
</head>
<body>
  <div id="root"></div>
  <script>
    // Redirect to React app
    window.location.reload();
  </script>
</body>
</html>`, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'X-User-Type': 'regular'
      },
    });
    
  } catch (error) {
    console.error('💥 SEO API Error:', error);
    
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Error</title>
</head>
<body>
  <h1>Error</h1>
  <p>Something went wrong: ${error.message}</p>
</body>
</html>`, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Error': 'true'
      },
    });
  }
}

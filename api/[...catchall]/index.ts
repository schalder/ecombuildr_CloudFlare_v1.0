export default async function handler(request: Request): Promise<Response> {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Get actual hostname from x-forwarded-host header (Vercel sets this)
  const hostname = request.headers.get('x-forwarded-host') || 'localhost';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
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
    // Check if this is a social media crawler
    const isBot = userAgent.toLowerCase().includes('facebookexternalhit') || 
                  userAgent.toLowerCase().includes('twitterbot') || 
                  userAgent.toLowerCase().includes('googlebot');
    
    console.log(`[${traceId}] 🤖 Bot detected: ${isBot}`);
    
    if (isBot) {
      console.log(`[${traceId}] 🤖 Bot detected - serving SEO HTML`);
      
      // Return basic SEO HTML for bots
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EcomBuildr - Build Your E-commerce Empire</title>
  <meta name="description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required." />
  <meta name="keywords" content="ecommerce, website builder, sales funnel" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="EcomBuildr" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://${hostname}${pathname}" />
  <meta property="og:title" content="EcomBuildr - Build Your E-commerce Empire" />
  <meta property="og:description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required." />
  <meta property="og:image" content="https://get.ecombuildr.com/hero-ecommerce.jpg" />
  <meta property="og:image:secure_url" content="https://get.ecombuildr.com/hero-ecommerce.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="EcomBuildr" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://${hostname}${pathname}" />
  <meta name="twitter:title" content="EcomBuildr - Build Your E-commerce Empire" />
  <meta name="twitter:description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required." />
  <meta name="twitter:image" content="https://get.ecombuildr.com/hero-ecommerce.jpg" />
  <meta name="twitter:image:alt" content="EcomBuildr - Build Your E-commerce Empire" />
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://${hostname}${pathname}" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Trace-Id': traceId,
          'X-SEO-Source': 'basic_fallback',
          'X-User-Type': 'bot'
        },
      });
    }
    
    // For regular users, serve the template as-is (React will hydrate)
    console.log(`[${traceId}] 👤 Regular user - serving SPA template`);
    const htmlTemplate = `<!DOCTYPE html>
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
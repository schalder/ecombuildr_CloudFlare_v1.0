import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate HTML with SEO data
function generateHTML(seoData: any, url: string): string {
  const title = seoData.title || 'Loading...';
  const description = seoData.description || 'Loading...';
  const image = seoData.image || '';
  const siteName = seoData.siteName || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Dynamic SEO Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
    
    <!-- React App Loading -->
    <script type="module" crossorigin src="/assets/index-DQVr3UU1.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/react-vendor-CeYc4tiK.js">
    <link rel="modulepreload" crossorigin href="/assets/chart-vendor-Bfzb-huE.js">
    <link rel="modulepreload" crossorigin href="/assets/ui-libs-COW4yPD2.js">
    <link rel="modulepreload" crossorigin href="/assets/ui-vendor-CCE0z0LV.js">
    <link rel="modulepreload" crossorigin href="/assets/page-builder-YQoEA8C7.js">
    <link rel="modulepreload" crossorigin href="/assets/date-vendor-CQ923hJe.js">
    <link rel="modulepreload" crossorigin href="/assets/form-vendor-CzNr-oSg.js">
    <link rel="stylesheet" crossorigin href="/assets/index-CZB-H0bA.css">
</head>
<body>
  <div id="root">
      <!-- Fallback content while React loads -->
      <div style="padding: 20px; text-align: center; font-family: Inter, sans-serif;">
    <h1>${title}</h1>
    <p>${description}</p>
        <p>Loading...</p>
      </div>
    </div>
    <script>
      console.log('Server-side SEO loaded - React app will take over');
    </script>
</body>
</html>`;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.hostname;
  const pathname = url.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  
  console.log(`🌐 Request: ${domain}${pathname} | User-Agent: ${userAgent}`);
  
  // Detect if this is a custom domain
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');
  
  console.log(`🔍 Domain detection: ${domain} -> Custom: ${isCustomDomain}`);
  
  // For custom domains, serve dynamic HTML with SEO
  if (isCustomDomain) {
    console.log(`🏠 Custom domain detected - generating dynamic HTML with SEO`);
    
    try {
      // Fetch custom domain data
      const { data: customDomains } = await supabase
        .from('custom_domains')
        .select('id,domain,store_id')
        .eq('domain', domain)
        .maybeSingle();
      
      if (!customDomains) {
        console.log('❌ No custom domain found');
        const html = generateHTML({
          title: domain,
          description: `Welcome to ${domain}`,
          siteName: domain
        }, url.toString());
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Served-By': 'dynamic-html-fallback'
          },
        });
      }
      
      // Fetch website data
      const { data: websites } = await supabase
        .from('websites')
        .select('id,name,settings')
        .eq('store_id', customDomains.store_id)
        .eq('is_active', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (!websites) {
        console.log('❌ No website found');
        const html = generateHTML({
          title: domain,
          description: `Welcome to ${domain}`,
          siteName: domain
        }, url.toString());
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Served-By': 'dynamic-html-fallback'
          },
        });
      }
      
      console.log(`✅ Website data loaded: ${websites.name}`);
      
      // Generate SEO data
      const seoData = {
        title: websites.name,
        description: `Welcome to ${websites.name} - Your trusted online store for quality products`,
        siteName: websites.name,
        image: websites.settings?.favicon_url || ''
      };
      
      const html = generateHTML(seoData, url.toString());
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Served-By': 'dynamic-html',
          'X-SEO-Title': seoData.title,
          'X-SEO-Description': seoData.description
        },
      });

    } catch (error) {
      console.error('💥 SEO Handler error:', error);
      const html = generateHTML({
        title: domain,
        description: `Welcome to ${domain}`,
        siteName: domain
      }, url.toString());
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'X-Served-By': 'dynamic-html-error'
        },
      });
    }
  }
  
  // For system domains, serve the standard React app
  console.log('🏢 System domain - serving eComBuildr React app');
  
  const systemHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- eComBuildr App SEO Meta Tags -->
    <title>EcomBuildr - Build Beautiful Online Stores & Funnels</title>
    <meta name="description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://ecombuildr.com/" />
    <meta property="og:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />
    <meta property="og:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />
    <meta property="og:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />
    <meta property="og:site_name" content="EcomBuildr" />
    <meta property="og:locale" content="en_US" />
    
    <!-- React App Loading -->
    <script type="module" crossorigin src="/assets/index-DQVr3UU1.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/react-vendor-CeYc4tiK.js">
    <link rel="modulepreload" crossorigin href="/assets/chart-vendor-Bfzb-huE.js">
    <link rel="modulepreload" crossorigin href="/assets/ui-libs-COW4yPD2.js">
    <link rel="modulepreload" crossorigin href="/assets/ui-vendor-CCE0z0LV.js">
    <link rel="modulepreload" crossorigin href="/assets/page-builder-YQoEA8C7.js">
    <link rel="modulepreload" crossorigin href="/assets/date-vendor-CQ923hJe.js">
    <link rel="modulepreload" crossorigin href="/assets/form-vendor-CzNr-oSg.js">
    <link rel="stylesheet" crossorigin href="/assets/index-CZB-H0bA.css">
  </head>
  <body>
    <div id="root">
      <!-- Fallback content while React loads -->
      <div style="padding: 20px; text-align: center; font-family: Inter, sans-serif;">
        <h1>EcomBuildr - Build Beautiful Online Stores & Funnels</h1>
        <p>Create stunning websites, online stores, and sales funnels with EcomBuildr.</p>
        <p>Loading...</p>
      </div>
    </div>
    <script>
      console.log('eComBuildr app loading...');
    </script>
  </body>
</html>`;
  
  return new Response(systemHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
      'X-Served-By': 'system-app'
    },
  });
}

export const config = {
  runtime: 'edge',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog',
];

function isSocialCrawler(userAgent: string): boolean {
  return SOCIAL_CRAWLERS.some(crawler => userAgent.includes(crawler));
}

// Helper function to resolve website SEO data
async function resolveWebsiteSEO(websiteId: string, pathname: string): Promise<any> {
  try {
    const { data: website } = await supabase
      .from('websites')
      .select('name, description')
      .eq('id', websiteId)
      .single();

    if (!website) return null;

    if (pathname === '/' || pathname === '') {
      return {
        title: website.name || 'Website',
        description: website.description || `Visit ${website.name}`,
        og_image: undefined,
        keywords: ['website', 'online store'],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}`,
        robots: 'index, follow',
        site_name: website.name || 'Website',
        source: 'website_root'
      };
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const pageSlug = pathSegments[pathSegments.length - 1];

    const { data: page } = await supabase
      .from('website_pages')
      .select('id, title, seo_title, seo_description, og_image, slug, is_published')
      .eq('website_id', websiteId)
      .eq('slug', pageSlug)
      .eq('is_published', true)
      .single();

    if (page) {
      return {
        title: page.seo_title || page.title || `${website.name} - ${pageSlug}`,
        description: page.seo_description || `Visit ${page.title || pageSlug} on ${website.name}`,
        og_image: page.og_image || undefined,
        keywords: ['website', 'page', pageSlug],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}${pathname}`,
        robots: 'index, follow',
        site_name: website.name || 'Website',
        source: 'website_page'
      };
    }
    return null;
  } catch (error) {
    console.error('Error resolving website SEO:', error);
    return null;
  }
}

// Helper function to resolve funnel SEO data
async function resolveFunnelSEO(funnelId: string, pathname: string): Promise<any> {
  try {
    const { data: funnel } = await supabase
      .from('funnels')
      .select('name, description, seo_title, seo_description, og_image')
      .eq('id', funnelId)
      .single();

    if (!funnel) return null;

    if (pathname === '/' || pathname === '') {
      return {
        title: funnel.seo_title || funnel.name || 'Sales Funnel',
        description: funnel.seo_description || funnel.description || `Visit ${funnel.name}`,
        og_image: funnel.og_image || undefined,
        keywords: ['sales funnel', 'marketing'],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}`,
        robots: 'index, follow',
        site_name: funnel.name || 'Sales Funnel',
        source: 'funnel_root'
      };
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const stepSlug = pathSegments[pathSegments.length - 1];

    const { data: step } = await supabase
      .from('funnel_steps')
      .select('id, title, seo_title, seo_description, og_image, slug, is_published')
      .eq('funnel_id', funnelId)
      .eq('slug', stepSlug)
      .eq('is_published', true)
      .single();

    if (step) {
      return {
        title: step.seo_title || step.title || `${funnel.name} - ${stepSlug}`,
        description: step.seo_description || `Visit ${step.title || stepSlug} on ${funnel.name}`,
        og_image: step.og_image || funnel.og_image || undefined,
        keywords: ['sales funnel', 'step', stepSlug],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}${pathname}`,
        robots: 'index, follow',
        site_name: funnel.name || 'Sales Funnel',
        source: 'funnel_step'
      };
    }
    return null;
  } catch (error) {
    console.error('Error resolving funnel SEO:', error);
    return null;
  }
}

// Main function to resolve SEO data based on domain and pathname
async function resolveSEOData(domain: string, pathname: string): Promise<any> {
  try {
    // Get domain connection info by joining custom_domains and domain_connections
    const { data: customDomains } = await supabase
      .from('custom_domains')
      .select('id, domain')
      .eq('domain', domain)
      .single();

    if (!customDomains) {
      console.log('No custom domain found for:', domain);
      return null;
    }

    console.log('Found custom domain:', customDomains);

    // Get domain connections for this domain
    const { data: domainConnections } = await supabase
      .from('domain_connections')
      .select('content_type, content_id, store_id, is_homepage')
      .eq('domain_id', customDomains.id);

    if (!domainConnections || domainConnections.length === 0) {
      console.log('No domain connections found for:', domain);
      return null;
    }

    // For root path, find the homepage connection
    if (pathname === '/' || pathname === '') {
      const homepageConnection = domainConnections.find(conn => conn.is_homepage);
      if (homepageConnection) {
        console.log('Found homepage connection:', homepageConnection);
        return await resolveByContentType(homepageConnection, pathname);
      }
    }

    // For other paths, try to find matching content type
    // For now, prioritize website over funnel
    const websiteConnection = domainConnections.find(conn => conn.content_type === 'website');
    if (websiteConnection) {
      console.log('Found website connection:', websiteConnection);
      return await resolveByContentType(websiteConnection, pathname);
    }

    const funnelConnection = domainConnections.find(conn => conn.content_type === 'funnel');
    if (funnelConnection) {
      console.log('Found funnel connection:', funnelConnection);
      return await resolveByContentType(funnelConnection, pathname);
    }

    console.log('No suitable connection found');
    return null;
  } catch (error) {
    console.error('Error resolving SEO data:', error);
    return null;
  }
}

// Helper function to resolve by content type
async function resolveByContentType(connection: any, pathname: string): Promise<any> {
  switch (connection.content_type) {
    case 'website':
      return await resolveWebsiteSEO(connection.content_id, pathname);
    case 'funnel':
      return await resolveFunnelSEO(connection.content_id, pathname);
    case 'course_area':
      return {
        title: 'Course Area - EcomBuildr',
        description: 'Access your courses and learning materials on EcomBuildr',
        og_image: undefined,
        keywords: ['courses', 'learning', 'education'],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}`,
        robots: 'index, follow',
        site_name: 'EcomBuildr Course Area',
        source: 'course_area'
      };
    default:
      console.log('Unknown content type:', connection.content_type);
      return null;
  }
}

// Generate HTML with dynamic SEO
function generateHTML(seoData: any, originalHTML: string): string {
  if (!seoData) {
    return originalHTML;
  }

  console.log('Generating HTML with SEO data:', seoData);

  // Replace title
  let html = originalHTML.replace(
    /<title>.*?<\/title>/,
    `<title>${seoData.title}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${seoData.description}" />`
  );

  // Replace og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${seoData.title}" />`
  );

  // Replace og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${seoData.description}" />`
  );

  // Replace og:site_name
  html = html.replace(
    /<meta property="og:site_name" content="[^"]*" \/>/,
    `<meta property="og:site_name" content="${seoData.site_name}" />`
  );

  // Replace og:image if available
  if (seoData.og_image) {
    html = html.replace(
      /<meta property="og:image" content="[^"]*" \/>/,
      `<meta property="og:image" content="${seoData.og_image}" />`
    );
  }

  // Replace twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${seoData.title}" />`
  );

  // Replace twitter:description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${seoData.description}" />`
  );

  // Replace twitter:image if available
  if (seoData.og_image) {
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*" \/>/,
      `<meta name="twitter:image" content="${seoData.og_image}" />`
    );
  }

  return html;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const domain = url.hostname;
  const pathname = url.pathname;

  console.log('Edge Function called:', { domain, pathname, userAgent });

  // Check if this is a social crawler
  if (!isSocialCrawler(userAgent)) {
    console.log('Not a social crawler, serving original HTML');
    // Return the original static HTML
    const originalHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#10B981" />
    
    <!-- Fallback SEO Meta Tags (overridden by dynamic content) -->
    <title>EcomBuildr - Build Beautiful Online Stores & Funnels</title>
    <meta name="description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                                    
    <meta name="keywords" content="website builder, ecommerce, online store, sales funnel, drag and drop" />                                                    
    <meta name="author" content="EcomBuildr" />
    
    <!-- Fallback Open Graph Meta Tags -->
    <meta property="og:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                 
    <meta property="og:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                             
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                    
    <meta property="og:site_name" content="EcomBuildr" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Fallback Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                
    <meta name="twitter:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                            
    <meta name="twitter:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                   
    
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
    
    <!-- Social crawlers are handled by Netlify Edge Function (social-meta) -->
    <!-- Client-side SEO is managed by individual pages/components -->
    
    <!-- Dynamic SEO tags are managed in code per-page via setSEO function -->
    <!-- Favicon is set dynamically per website/funnel in setSEO() function -->
    <!-- Font Awesome for icon lists -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"                                                                          
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
      <script type="module" crossorigin src="/assets/index-o9LdkRia.js"></script>                                                                               
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
    <div id="root"></div>
  </body>
</html>`;
    
    return new Response(originalHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  console.log('Social crawler detected, generating dynamic SEO');

  // Check if this is a custom domain
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');

  if (!isCustomDomain) {
    console.log('Not a custom domain, serving original HTML');
    // Return the original static HTML
    const originalHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#10B981" />
    
    <!-- Fallback SEO Meta Tags (overridden by dynamic content) -->
    <title>EcomBuildr - Build Beautiful Online Stores & Funnels</title>
    <meta name="description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                                    
    <meta name="keywords" content="website builder, ecommerce, online store, sales funnel, drag and drop" />                                                    
    <meta name="author" content="EcomBuildr" />
    
    <!-- Fallback Open Graph Meta Tags -->
    <meta property="og:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                 
    <meta property="og:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                             
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                    
    <meta property="og:site_name" content="EcomBuildr" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Fallback Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                
    <meta name="twitter:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                            
    <meta name="twitter:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                   
    
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
    
    <!-- Social crawlers are handled by Netlify Edge Function (social-meta) -->
    <!-- Client-side SEO is managed by individual pages/components -->
    
    <!-- Dynamic SEO tags are managed in code per-page via setSEO function -->
    <!-- Favicon is set dynamically per website/funnel in setSEO() function -->
    <!-- Font Awesome for icon lists -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"                                                                          
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
      <script type="module" crossorigin src="/assets/index-o9LdkRia.js"></script>                                                                               
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
    <div id="root"></div>
  </body>
</html>`;
    
    return new Response(originalHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const seoData = await resolveSEOData(domain, pathname);
    if (seoData) {
      console.log('Returning SEO data:', seoData);
      
      // Generate HTML with dynamic SEO
      const originalHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#10B981" />
    
    <!-- Fallback SEO Meta Tags (overridden by dynamic content) -->
    <title>EcomBuildr - Build Beautiful Online Stores & Funnels</title>
    <meta name="description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                                    
    <meta name="keywords" content="website builder, ecommerce, online store, sales funnel, drag and drop" />                                                    
    <meta name="author" content="EcomBuildr" />
    
    <!-- Fallback Open Graph Meta Tags -->
    <meta property="og:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                 
    <meta property="og:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                             
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                    
    <meta property="og:site_name" content="EcomBuildr" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Fallback Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                
    <meta name="twitter:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                            
    <meta name="twitter:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                   
    
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
    
    <!-- Social crawlers are handled by Netlify Edge Function (social-meta) -->
    <!-- Client-side SEO is managed by individual pages/components -->
    
    <!-- Dynamic SEO tags are managed in code per-page via setSEO function -->
    <!-- Favicon is set dynamically per website/funnel in setSEO() function -->
    <!-- Font Awesome for icon lists -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"                                                                          
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
      <script type="module" crossorigin src="/assets/index-o9LdkRia.js"></script>                                                                               
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
    <div id="root"></div>
  </body>
</html>`;
      
      const dynamicHTML = generateHTML(seoData, originalHTML);
      
      return new Response(dynamicHTML, {
        headers: { 
          'Content-Type': 'text/html',
          'X-SEO-Source': seoData.source,
          'X-SEO-Title': seoData.title,
          'X-SEO-Description': seoData.description
        },
      });
    }
    
    console.log('No SEO data found, serving original HTML');
    // Return the original static HTML
    const originalHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#10B981" />
    
    <!-- Fallback SEO Meta Tags (overridden by dynamic content) -->
    <title>EcomBuildr - Build Beautiful Online Stores & Funnels</title>
    <meta name="description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                                    
    <meta name="keywords" content="website builder, ecommerce, online store, sales funnel, drag and drop" />                                                    
    <meta name="author" content="EcomBuildr" />
    
    <!-- Fallback Open Graph Meta Tags -->
    <meta property="og:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                 
    <meta property="og:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                             
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                    
    <meta property="og:site_name" content="EcomBuildr" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Fallback Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />                                                                
    <meta name="twitter:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />                                            
    <meta name="twitter:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />                                   
    
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
    
    <!-- Social crawlers are handled by Netlify Edge Function (social-meta) -->
    <!-- Client-side SEO is managed by individual pages/components -->
    
    <!-- Dynamic SEO tags are managed in code per-page via setSEO function -->
    <!-- Favicon is set dynamically per website/funnel in setSEO() function -->
    <!-- Font Awesome for icon lists -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"                                                                          
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
      <script type="module" crossorigin src="/assets/index-o9LdkRia.js"></script>                                                                               
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
    <div id="root"></div>
  </body>
</html>`;
    
    return new Response(originalHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

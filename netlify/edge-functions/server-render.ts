// Netlify Edge Function for server-side rendering
// This handles custom domains and serves dynamic HTML with SEO

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server-side PageBuilder renderer (simplified for Netlify Edge)
function renderPageBuilderToHTML(data: any): string {
  if (!data || !data.sections || data.sections.length === 0) {
    return '<div class="text-center py-12"><p class="text-muted-foreground">This page is still being set up.</p></div>';
  }
  
  const sectionsHTML = data.sections.map((section: any) => {
    const rowsHTML = section.rows?.map((row: any) => {
      const columnsHTML = row.columns?.map((column: any) => {
        const elementsHTML = column.elements?.map((element: any) => {
          switch (element.type) {
            case 'heading':
              const level = element.content?.level || 'h2';
              return `<${level}>${element.content?.text || ''}</${level}>`;
            case 'text':
              return `<p>${element.content?.text || ''}</p>`;
            case 'image':
              const src = element.content?.src || '';
              const alt = element.content?.alt || '';
              return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto;" />`;
            case 'button':
              const buttonText = element.content?.text || 'Button';
              const buttonUrl = element.content?.url || '#';
              return `<a href="${buttonUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">${buttonText}</a>`;
            default:
              return `<div>${element.content?.text || ''}</div>`;
          }
        }).join('');
        return `<div style="flex: 1; padding: 10px;">${elementsHTML}</div>`;
      }).join('');
      return `<div style="display: flex; flex-wrap: wrap;">${columnsHTML}</div>`;
    }).join('');
    return `<section style="padding: 20px 0;">${rowsHTML}</section>`;
  }).join('');
  
  return `<div class="page-builder-content">${sectionsHTML}</div>`;
}

// Generate SEO meta tags
function generateSEOTags(page: any, website: any, url: string): string {
  const title = page.seo_title || page.title || website.name || 'Page';
  const description = page.seo_description || `Welcome to ${website.name}`;
  const image = page.social_image_url || page.og_image || website.settings?.favicon_url || '';
  
  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="${escapeHtml(website.name)}" />
    <meta property="og:locale" content="en_US" />
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(url)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
  `;
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

// Get page data based on pathname
async function getPageData(websiteId: string, pathname: string) {
  try {
    if (pathname === '/') {
      // Homepage
      const { data: page, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', websiteId)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return { page, type: 'homepage' };
    } else {
      // Other pages
      const slug = pathname.substring(1); // Remove leading slash
      const { data: page, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', websiteId)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return { page, type: 'page' };
    }
  } catch (error) {
    console.error('Error fetching page data:', error);
    return { page: null, type: 'page' };
  }
}

// Get website data
async function getWebsiteData(storeId: string) {
  try {
    const { data: website, error } = await supabase
      .from('websites')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .eq('is_published', true)
      .maybeSingle();
    
    if (error) throw error;
    return website;
  } catch (error) {
    console.error('Error fetching website data:', error);
    return null;
  }
}

export default async (request: Request) => {
  const url = new URL(request.url);
  const domain = url.hostname;
  const pathname = url.pathname;
  
  console.log(`🌐 Netlify Edge Function: ${domain}${pathname}`);
  
  // Detect if this is a custom domain
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');
  
  if (!isCustomDomain) {
    // For system domains, let Netlify serve the normal SPA
    return;
  }
  
  console.log(`🏠 Custom domain detected: ${domain}`);
  
  try {
    // Fetch custom domain data
    const { data: customDomains } = await supabase
      .from('custom_domains')
      .select('id,domain,store_id')
      .eq('domain', domain)
      .maybeSingle();
    
    if (!customDomains) {
      console.log('❌ No custom domain found');
      return;
    }
    
    // Fetch website data
    const website = await getWebsiteData(customDomains.store_id);
    
    if (!website) {
      console.log('❌ No website found');
      return;
    }
    
    console.log(`✅ Website data loaded: ${website.name}`);
    
    // Get page data based on pathname
    const { page, type } = await getPageData(website.id, pathname);
    
    if (!page) {
      console.log(`❌ No page found for path: ${pathname}`);
      return;
    }
    
    console.log(`✅ Page data loaded: ${page.title} (${type})`);
    
    // Convert page content to HTML
    const pageContent = renderPageBuilderToHTML(page.content);
    
    // Generate SEO meta tags
    const seoTags = generateSEOTags(page, website, url.toString());
    
    // Generate complete HTML
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${seoTags}
    
    <!-- React App Loading -->
    <script type="module" crossorigin src="/assets/index-BhcPvrKL.js"></script>
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
      <!-- Server-side rendered content -->
      ${pageContent}
      
      <!-- Fallback content while React loads -->
      <div style="padding: 20px; text-align: center; font-family: Inter, sans-serif;">
        <p>Loading interactive features...</p>
      </div>
    </div>
    
    <script>
      console.log('Netlify Edge Function: Server-side rendered page loaded - React app will take over');
    </script>
  </body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Served-By': 'netlify-edge-function',
        'X-Page-Title': page.title,
        'X-Page-Type': type
      },
    });
    
  } catch (error) {
    console.error('💥 Netlify Edge Function error:', error);
    return;
  }
};

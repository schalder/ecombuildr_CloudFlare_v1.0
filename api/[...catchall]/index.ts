import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simplified approach: Always serve dynamic HTML for custom domains

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

// Extract meaningful description from page content
function extractContentDescription(content: any, maxLength: number = 155): string {
  if (!content) return '';
  
  try {
    let textContent = '';
    
    if (typeof content === 'string') {
      textContent = content;
    } else if (content.sections && Array.isArray(content.sections)) {
      textContent = content.sections
        .map((section: any) => {
          if (section.type === 'text' || section.type === 'paragraph' || section.type === 'heading') {
            return section.content || section.text || '';
          }
          if (section.blocks && Array.isArray(section.blocks)) {
            return section.blocks
              .map((block: any) => block.content || block.text || '')
              .join(' ');
          }
          return '';
        })
        .join(' ');
    }
    
    // Strip HTML and clean up
    const cleaned = textContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleaned) return '';
    
    // Split into sentences and build description
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return '';
    
    let result = sentences[0].trim();
    let currentLength = result.length;
    
    // Add more sentences if they fit
    for (let i = 1; i < sentences.length && currentLength < maxLength - 20; i++) {
      const nextSentence = sentences[i].trim();
      if (currentLength + nextSentence.length + 2 <= maxLength) {
        result += '. ' + nextSentence;
        currentLength = result.length;
      } else {
        break;
      }
    }
    
    // Ensure proper ending
    if (!result.match(/[.!?]$/)) {
      result += '.';
    }
    
    return result.length > maxLength ? result.substring(0, maxLength - 3) + '...' : result;
  } catch (error) {
    console.warn('Error extracting content description:', error);
    return '';
  }
}

// Ensure image URL is absolute and valid
function normalizeImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl || typeof imageUrl !== 'string') return undefined;
  
  const trimmed = imageUrl.trim();
  if (!trimmed) return undefined;
  
  // Must be absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  return undefined;
}

// Main SEO data resolution
async function resolveSEOData(domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`🔍 Resolving SEO for ${domain}${path}`);
    
    // Normalize domain variants
    const apexDomain = domain.replace(/^www\./, '');
    const domainVariants = [domain, apexDomain, `www.${apexDomain}`];
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
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
    
    // Step 2: Find website mapping via domain_connections
    const { data: websiteConnection } = await supabase
      .from('domain_connections')
      .select('content_type, content_id')
      .eq('domain_id', customDomain.id)
      .eq('content_type', 'website')
      .maybeSingle();
    
    let websiteId: string | null = null;
    
    if (websiteConnection) {
      websiteId = websiteConnection.content_id;
      console.log(`✅ Found website connection: ${websiteId}`);
    } else {
      console.log('⚠️ No website connection found for domain. Falling back to store websites');
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
      console.log('❌ No website resolved after fallback');
      return null;
    }
    
    // Step 3: Get website data
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, description, settings')
      .eq('id', websiteId)
      .maybeSingle();
    
    if (!website) {
      console.log('❌ Website not found');
      return null;
    }
    
    // Get website-level SEO from settings JSON
    const ws: any = (website as any).settings || {};
    const websiteSeoTitle: string | undefined = (ws.seo && ws.seo.title) || undefined;
    const websiteSeoDescription: string = (ws.seo && ws.seo.description) || (website as any).description || `Welcome to ${website.name}`;
    const websiteImage = normalizeImageUrl(
      (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
      (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
      ws.favicon
    );

    // Step 4: Route-specific resolution
    
    // Root path - use homepage page SEO
    if (!cleanPath) {
      // First try to find the homepage page
      const { data: homepagePage } = await supabase
        .from('website_pages')
        .select(`
          id, title, slug,
          seo_title, seo_description, og_image, social_image_url, preview_image_url,
          seo_keywords, canonical_url, meta_robots, meta_author, language_code,
          custom_meta_tags, content
        `)
        .eq('website_id', websiteId)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (homepagePage) {
        const contentDesc = extractContentDescription(homepagePage.content);
        
        // ✅ PRIORITIZE HOMEPAGE PAGE SEO - Only fallback to page title if SEO title is empty
        const title = (homepagePage.seo_title && homepagePage.seo_title.trim()) 
          ? homepagePage.seo_title.trim() 
          : `${homepagePage.title} - ${website.name}`;
        
        // ✅ PRIORITIZE HOMEPAGE PAGE SEO DESCRIPTION - Only fallback if truly empty
        const description = (homepagePage.seo_description && homepagePage.seo_description.trim())
          ? homepagePage.seo_description.trim()
          : (contentDesc || `${homepagePage.title} - ${website.name}`);
        
        // ✅ PRIORITIZE HOMEPAGE PAGE IMAGES - Only fallback to website if page has no images
        let pickedImage = homepagePage.social_image_url || homepagePage.preview_image_url;
        
        // Only fallback to website image if homepage has no images at all
        if (!pickedImage) {
          pickedImage = websiteImage;
        }
        
        const image = normalizeImageUrl(pickedImage);
        
        console.log(`🏠 Homepage SEO resolved for ${domain} (page:${homepagePage.id}, website:${websiteId})`);
        console.log(`   • title="${title}" [homepage.seo_title]`);
        console.log(`   • description="${description}" [homepage.seo_description]`);
        console.log(`   • image="${image}" [homepage images]`);
        
        return {
          title,
          description,
          og_image: image,
          keywords: homepagePage.seo_keywords || [],
          canonical: homepagePage.canonical_url || `https://${domain}/`,
          robots: homepagePage.meta_robots || 'index, follow',
          site_name: website.name,
          source: `homepage_page|website:${websiteId}|page:${homepagePage.id}`
        };
      }
      
      // Fallback to website-level SEO if no homepage page found
      const title = (websiteSeoTitle && websiteSeoTitle.trim()) 
        ? websiteSeoTitle.trim() 
        : website.name;
      
      return {
        title,
        description: websiteSeoDescription,
        og_image: websiteImage,
        keywords: [],
        canonical: `https://${domain}/`,
        robots: 'index, follow',
        site_name: website.name,
        source: `website_root_fallback|website:${websiteId}`
      };
    }
    
    // Website pages - try exact slug match first
    const { data: page } = await supabase
      .from('website_pages')
      .select(`
        id, title, slug,
        seo_title, seo_description, og_image, social_image_url, preview_image_url,
        seo_keywords, canonical_url, meta_robots, meta_author, language_code,
        custom_meta_tags, content
      `)
      .eq('website_id', websiteId)
      .eq('slug', cleanPath)
      .eq('is_published', true)
      .maybeSingle();
    
    if (page) {
      const contentDesc = extractContentDescription(page.content);

      // ✅ PRIORITIZE PAGE SEO - Only fallback to page title if SEO title is empty
      const rawTitle = (page.seo_title && page.seo_title.trim()) 
        ? page.seo_title.trim() 
        : `${page.title} - ${website.name}`;

      // ✅ PRIORITIZE PAGE SEO DESCRIPTION - Only fallback if truly empty
      const rawDesc = (page.seo_description && page.seo_description.trim())
        ? page.seo_description.trim()
        : (contentDesc || `${page.title} - ${website.name}`);

      // ✅ PRIORITIZE PAGE IMAGES - Only fallback to website if page has no images
      let pickedImage = page.social_image_url || page.preview_image_url;
      
      // Only fallback to website image if page has no images at all
      if (!pickedImage) {
        pickedImage = websiteImage;
      }
      
      const image = normalizeImageUrl(pickedImage);

      console.log(`🔎 Page SEO resolved for slug="${cleanPath}" (page:${page.id}, website:${websiteId})`);
      console.log(`   • title="${rawTitle}" [page.seo_title]`);
      console.log(`   • description="${rawDesc}" [page.seo_description]`);
      console.log(`   • image="${image}" [page images]`);
      
      return {
        title: rawTitle,
        description: rawDesc,
        og_image: image,
        keywords: page.seo_keywords || [],
        canonical: page.canonical_url || `https://${domain}${path}`,
        robots: page.meta_robots || 'index, follow',
        site_name: website.name,
        source: `website_page|website:${websiteId}|slug:${cleanPath}`
      };
    }
    
    // Fallback to website SEO (when no specific page/route found)
    // ✅ PRIORITIZE WEBSITE SEO - Only fallback to website name if SEO title is empty
    const fallbackTitle = (websiteSeoTitle && websiteSeoTitle.trim()) 
      ? websiteSeoTitle.trim() 
      : website.name;
    
    return {
      title: fallbackTitle,
      description: websiteSeoDescription,
      og_image: websiteImage,
      keywords: [],
      canonical: `https://${domain}${path}`,
      robots: 'index, follow',
      site_name: website.name,
      source: `website_fallback|website:${websiteId}`
    };
    
  } catch (error) {
    console.error('❌ SEO resolution error:', error);
    return null;
  }
}

// Generate complete HTML for custom domains with React app integration
function generateDynamicHTML(seo: SEOData, url: string): string {
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
  
  <!-- Dynamic SEO Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}" />
  ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
  <meta name="robots" content="${robots}" />
  <meta name="author" content="${siteName}" />
  
  <!-- Dynamic Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image || ''}" />
  ${image ? `<meta property="og:image:secure_url" content="${image}" />` : ''}
  ${image ? `<meta property="og:image:width" content="1200" />` : ''}
  ${image ? `<meta property="og:image:height" content="630" />` : ''}
  ${image ? `<meta property="og:image:type" content="image/png" />` : ''}
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Dynamic Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name=\"twitter:image\" content=\"${image}\" />` : ''}
  ${image ? `<meta name=\"twitter:image:alt\" content=\"${title}\" />` : ''}
  
  <!-- Additional SEO -->
  <link rel="canonical" href="${canonical}" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${title}",
    "description": "${description}",
    ${image ? `"image": "${image}",` : ''}
    "url": "${canonical}",
    "publisher": {
      "@type": "Organization",
      "name": "${siteName}"${image ? `,
      "logo": {
        "@type": "ImageObject",
        "url": "${image}"
      }` : ''}
    }
  }
  </script>
  
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
    .image-optimization {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  </style>
  
  <!-- Font Awesome -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
  
  <!-- React App Loading -->
  <script type="module" crossorigin src="/assets/index.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index.css">
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
    // React will replace the fallback content
    console.log('Dynamic SEO loaded - React app will take over');
  </script>
</body>
</html>`;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.hostname;
  const pathname = url.pathname;
  const traceId = crypto.randomUUID();
  
  console.log(`[${traceId}] 🌐 Request: ${domain}${pathname}`);
  
  // Detect if this is a custom domain (not ecombuildr.com or localhost)
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');
  
  console.log(`🔍 Domain: ${domain} | Custom: ${isCustomDomain}`);
  
  // For custom domains, ALWAYS serve dynamic HTML with correct SEO
  if (isCustomDomain) {
    console.log(`🏠 Custom domain detected - generating dynamic HTML with SEO`);
    
    try {
      const seoData = await resolveSEOData(domain, pathname);
      
      if (!seoData) {
        console.log(`[${traceId}] ❌ No SEO data found - serving fallback`);
        const fallback = {
          title: domain,
          description: `Welcome to ${domain}`,
          og_image: undefined,
          keywords: [],
          canonical: url.toString(),
          robots: 'index, follow',
          site_name: domain,
          source: 'fallback_no_data'
        } as SEOData;
        const html = generateDynamicHTML(fallback, url.toString());
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Trace-Id': traceId,
            'X-SEO-Source': 'fallback_no_data',
            'X-Served-By': 'dynamic-html'
          },
        });
      }
      
      console.log(`✅ SEO resolved via ${seoData.source}: ${seoData.title}`);
      
      const html = generateDynamicHTML(seoData, url.toString());
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Trace-Id': traceId,
          'X-SEO-Source': seoData.source || 'unknown',
          'X-SEO-Website': seoData.site_name,
          'X-SEO-Page': seoData.title,
          'X-SEO-Domain': domain,
          'X-SEO-Path': pathname,
          'X-Served-By': 'dynamic-html'
        },
      });

    } catch (error) {
      console.error('💥 SEO Handler error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  
  // For system domains, serve the standard React app
  console.log('🏢 System domain - serving standard React app');
  
  // Return the index.html content for regular users
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#10B981" />
    
    <!-- Fallback SEO Meta Tags (overridden by server-side middleware for custom domains) -->
    <title>EcomBuildr - Build Beautiful Online Stores & Funnels</title>
    <meta name="description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />
    <meta name="keywords" content="website builder, ecommerce, online store, sales funnel, drag and drop" />
    <meta name="author" content="EcomBuildr" />
    
    <!-- Fallback Open Graph Meta Tags (overridden by server-side middleware for custom domains) -->
    <meta property="og:title" content="EcomBuildr - Build Beautiful Online Stores & Funnels" />
    <meta property="og:description" content="Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features." />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png" />
    <meta property="og:site_name" content="EcomBuildr" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Fallback Twitter Card Meta Tags (overridden by server-side middleware for custom domains) -->
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
      .image-container img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease; }
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
    </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  
  return new Response(indexHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=0',
      'X-Trace-Id': traceId,
      'X-SEO-Source': 'react_app_fallback'
    },
  });
}

export const config = {
  runtime: 'edge',
};
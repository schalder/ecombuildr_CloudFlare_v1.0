import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SOCIAL_CRAWLERS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
  'discordbot',
  'skypeuripreview',
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

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

interface SEOData {
  title: string;
  description: string;
  og_image?: string;
  keywords: string[];
  canonical: string;
  robots: string;
  site_name: string;
  source?: string; // Debug info
  debug?: {
    titleSource?: string;
    descSource?: string;
    imageSource?: string;
    websiteId?: string;
    pageId?: string;
    slug?: string;
  };
}

function extractContentDescription(content: any): string {
  try {
    if (!content || typeof content !== 'object') return '';
    
    // Handle different content structures
    if (content.sections && Array.isArray(content.sections)) {
      for (const section of content.sections) {
        if (section.type === 'text' && section.content) {
          const text = section.content.replace(/<[^>]*>/g, '').trim();
          if (text.length > 50) return text.substring(0, 200) + '...';
        }
        if (section.type === 'heading' && section.content) {
          const text = section.content.replace(/<[^>]*>/g, '').trim();
          if (text.length > 10) return text;
        }
      }
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting content description:', error);
    return '';
  }
  
  return '';
}

function normalizeImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined;
  
  // Handle relative URLs
  if (imageUrl.startsWith('/')) {
    return `https://ecombuildr.com${imageUrl}`;
  }
  
  // Handle Cloudinary URLs
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  // Handle other absolute URLs
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  return undefined;
}

// Helper function to resolve system domain SEO (ecombuildr.com/store/website-slug/page-slug)
async function resolveSystemDomainSEO(domain: string, path: string, cleanPath: string): Promise<SEOData | null> {
  try {
    console.log(`🏠 Resolving system domain SEO for ${path}`);
    
    // Parse system domain URLs
    if (path.startsWith('/store/')) {
      // Format: /store/website-slug/page-slug
      const pathParts = cleanPath.split('/');
      if (pathParts.length < 2) {
        console.log('❌ Invalid store URL format');
        return null;
      }
      
      const websiteSlug = pathParts[1];
      const pageSlug = pathParts[2] || '';
      
      console.log(`📦 Store URL: website="${websiteSlug}", page="${pageSlug}"`);
      
      // Find website by slug
      const { data: website } = await supabase
        .from('websites')
        .select('id, name, description, settings')
        .eq('slug', websiteSlug)
        .eq('is_active', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (!website) {
        console.log(`❌ Website not found for slug: ${websiteSlug}`);
        return null;
      }
      
      console.log(`✅ Found website: ${website.name} (${website.id})`);
      
      // If no page slug, return website homepage
      if (!pageSlug) {
        return await resolveWebsiteHomepageSEO(website.id, domain, path);
      }
      
      // Find specific page
      const { data: page } = await supabase
        .from('website_pages')
        .select(`
          id, title, slug,
          seo_title, seo_description, og_image, social_image_url, preview_image_url,
          seo_keywords, canonical_url, meta_robots, meta_author, language_code,
          custom_meta_tags, content
        `)
        .eq('website_id', website.id)
        .eq('slug', pageSlug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (!page) {
        console.log(`❌ Page not found for slug: ${pageSlug}`);
        return null;
      }
      
      console.log(`✅ Found page: ${page.title} (${page.id})`);
      
      const contentDesc = extractContentDescription(page.content);
      
      // ✅ PRIORITIZE PAGE SEO - Only fallback to page name if SEO title is empty
      const title = (page.seo_title && page.seo_title.trim()) 
        ? page.seo_title.trim() 
        : `${page.title} - ${website.name}`;
      
      // ✅ PRIORITIZE PAGE SEO DESCRIPTION - Only fallback if truly empty
      const description = (page.seo_description && page.seo_description.trim())
        ? page.seo_description.trim()
        : (contentDesc || `${page.title} - ${website.name}`);
      
      // ✅ PRIORITIZE PAGE IMAGES - Only fallback to website if page has no images
      let image = page.social_image_url || page.og_image || page.preview_image_url;
      if (!image) {
        const ws: any = (website as any).settings || {};
        image = normalizeImageUrl(
          (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
          (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
          ws.favicon
        );
      }
      
      console.log(`🔎 System domain page SEO resolved for page="${pageSlug}" (page:${page.id}, website:${website.id})`);
      console.log(`   • title="${title}"`);
      console.log(`   • description="${description}"`);
      console.log(`   • image="${image}"`);
      
      return {
        title,
        description,
        og_image: normalizeImageUrl(image),
        keywords: page.seo_keywords || [],
        canonical: page.canonical_url || `https://${domain}${path}`,
        robots: page.meta_robots || 'index, follow',
        site_name: website.name,
        source: `system_domain_page|website:${website.id}|page:${pageSlug}`,
        debug: {
          titleSource: page.seo_title ? 'page.seo_title' : 'page.title_fallback',
          descSource: page.seo_description ? 'page.seo_description' : (contentDesc ? 'content_extracted' : 'page.title_fallback'),
          imageSource: page.social_image_url ? 'page.social_image_url' : (page.og_image ? 'page.og_image' : 'website_fallback'),
          websiteId: website.id,
          pageId: page.id,
          slug: pageSlug
        }
      };
    }
    
    if (path.startsWith('/funnel/')) {
      // Format: /funnel/funnel-id/step-slug
      const pathParts = cleanPath.split('/');
      if (pathParts.length < 2) {
        console.log('❌ Invalid funnel URL format');
        return null;
      }
      
      const funnelId = pathParts[1];
      const stepSlug = pathParts[2] || '';
      
      console.log(`🎯 Funnel URL: funnel="${funnelId}", step="${stepSlug}"`);
      
      return await resolveFunnelSEO(funnelId, stepSlug, domain, path);
    }
    
    console.log('❌ Unsupported system domain path');
    return null;
  } catch (error) {
    console.error('💥 System domain SEO resolution error:', error);
    return null;
  }
}

// Helper function to resolve funnel SEO
async function resolveFunnelSEO(funnelId: string, stepSlug: string, domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`🎯 Resolving funnel SEO for funnel:${funnelId}, step:${stepSlug}`);
    
    const { data: funnel } = await supabase
      .from('funnels')
      .select(`
        id, name, description, settings,
        seo_title, seo_description, og_image, social_image_url,
        seo_keywords, canonical_url, meta_robots, meta_author,
        language_code, custom_meta_tags
      `)
      .eq('id', funnelId)
      .eq('is_active', true)
      .eq('is_published', true)
      .maybeSingle();
    
    if (!funnel) {
      console.log('❌ Funnel not found');
      return null;
    }
    
    // Derive funnel-level SEO from settings JSON
    const fs: any = (funnel as any).settings || {};
    const funnelSeoTitle: string | undefined = (fs.seo && fs.seo.title) || funnel.seo_title || undefined;
    const funnelSeoDescription: string = (fs.seo && fs.seo.description) || funnel.seo_description || (funnel as any).description || `Welcome to ${funnel.name}`;
    const funnelImage = normalizeImageUrl(
      funnel.social_image_url || funnel.og_image ||
      (fs.seo && (fs.seo.og_image || fs.seo.social_image_url)) ||
      (fs.branding && (fs.branding.social_image_url || fs.branding.logo)) ||
      fs.favicon
    );
    
    // Check if this is a specific funnel step
    if (stepSlug) {
      const { data: step } = await supabase
        .from('funnel_steps')
        .select(`
          id, name, slug,
          seo_title, seo_description, og_image, social_image_url, preview_image_url,
          seo_keywords, canonical_url, meta_robots, meta_author, language_code,
          custom_meta_tags, content
        `)
        .eq('funnel_id', funnelId)
        .eq('slug', stepSlug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (step) {
        const contentDesc = extractContentDescription(step.content);
        
        // ✅ PRIORITIZE STEP SEO - Only fallback to step name if SEO title is empty
        const title = (step.seo_title && step.seo_title.trim()) 
          ? step.seo_title.trim() 
          : `${step.name} | ${funnel.name}`;
        
        // ✅ PRIORITIZE STEP SEO DESCRIPTION - Only fallback if truly empty
        const description = (step.seo_description && step.seo_description.trim())
          ? step.seo_description.trim()
          : (contentDesc || `${step.name} - ${funnel.name}`);
        
        // ✅ PRIORITIZE STEP IMAGES - Only fallback to funnel if step has no images
        let image = step.social_image_url || step.og_image || step.preview_image_url;
        if (!image) {
          image = funnelImage;
        }
        
        console.log(`🔎 Funnel step SEO resolved for slug="${stepSlug}" (step:${step.id}, funnel:${funnelId})`);
        console.log(`   • title="${title}"`);
        console.log(`   • description="${description}"`);
        console.log(`   • image="${image}"`);
        
        return {
          title,
          description,
          og_image: normalizeImageUrl(image),
          keywords: step.seo_keywords || [],
          canonical: step.canonical_url || `https://${domain}${path}`,
          robots: step.meta_robots || 'index, follow',
          site_name: funnel.name,
          source: `funnel_step|funnel:${funnelId}|step:${stepSlug}`,
          debug: {
            titleSource: step.seo_title ? 'step.seo_title' : 'step.name_fallback',
            descSource: step.seo_description ? 'step.seo_description' : (contentDesc ? 'content_extracted' : 'step.name_fallback'),
            imageSource: step.social_image_url ? 'step.social_image_url' : (step.og_image ? 'step.og_image' : 'funnel_fallback'),
            websiteId: funnelId,
            pageId: step.id,
            slug: stepSlug
          }
        };
      }
    }
    
    // Funnel homepage (root path or no step found)
    // ✅ PRIORITIZE FUNNEL SEO - Only fallback to funnel name if SEO title is empty
    const title = (funnelSeoTitle && funnelSeoTitle.trim()) 
      ? funnelSeoTitle.trim() 
      : funnel.name;
    
    // ✅ PRIORITIZE FUNNEL SEO DESCRIPTION - Only fallback if truly empty
    const description = (funnelSeoDescription && funnelSeoDescription.trim())
      ? funnelSeoDescription.trim()
      : `Sales funnel: ${funnel.name}`;
    
    return {
      title,
      description,
      og_image: funnelImage,
      keywords: funnel.seo_keywords || [],
      canonical: funnel.canonical_url || `https://${domain}${path}`,
      robots: funnel.meta_robots || 'index, follow',
      site_name: funnel.name,
      source: `funnel_homepage|funnel:${funnelId}`
    };
  } catch (error) {
    console.error('💥 Funnel SEO resolution error:', error);
    return null;
  }
}

// Helper function to resolve website homepage SEO
async function resolveWebsiteHomepageSEO(websiteId: string, domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`🏠 Resolving website homepage SEO for website:${websiteId}`);
    
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, description, settings')
      .eq('id', websiteId)
      .maybeSingle();
    
    if (!website) {
      console.log('❌ Website not found');
      return null;
    }
    
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
      
      // ✅ PRIORITIZE HOMEPAGE PAGE SEO - Only fallback to page name if SEO title is empty
      const title = (homepagePage.seo_title && homepagePage.seo_title.trim()) 
        ? homepagePage.seo_title.trim() 
        : `${homepagePage.title} - ${website.name}`;
      
      // ✅ PRIORITIZE HOMEPAGE PAGE SEO DESCRIPTION - Only fallback if truly empty
      const description = (homepagePage.seo_description && homepagePage.seo_description.trim())
        ? homepagePage.seo_description.trim()
        : (contentDesc || `${homepagePage.title} - ${website.name}`);
      
      // ✅ PRIORITIZE HOMEPAGE PAGE IMAGES - Only fallback to website if page has no images
      let image = homepagePage.social_image_url || homepagePage.og_image || homepagePage.preview_image_url;
      if (!image) {
        const ws: any = (website as any).settings || {};
        image = normalizeImageUrl(
          (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
          (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
          ws.favicon
        );
      }
      
      console.log(`🔎 Homepage page SEO resolved (page:${homepagePage.id}, website:${websiteId})`);
      console.log(`   • title="${title}"`);
      console.log(`   • description="${description}"`);
      console.log(`   • image="${image}"`);
      
      return {
        title,
        description,
        og_image: normalizeImageUrl(image),
        keywords: homepagePage.seo_keywords || [],
        canonical: homepagePage.canonical_url || `https://${domain}${path}`,
        robots: homepagePage.meta_robots || 'index, follow',
        site_name: website.name,
        source: `homepage_page|website:${websiteId}|page:${homepagePage.id}`,
        debug: {
          titleSource: homepagePage.seo_title ? 'homepage.seo_title' : 'homepage.title_fallback',
          descSource: homepagePage.seo_description ? 'homepage.seo_description' : (contentDesc ? 'content_extracted' : 'homepage.title_fallback'),
          imageSource: homepagePage.social_image_url ? 'homepage.social_image_url' : (homepagePage.og_image ? 'homepage.og_image' : 'website_fallback'),
          websiteId: websiteId,
          pageId: homepagePage.id,
          slug: homepagePage.slug
        }
      };
    }
    
    // Fallback to website-level SEO
    const ws: any = (website as any).settings || {};
    const websiteSeoTitle: string | undefined = (ws.seo && ws.seo.title) || undefined;
    const websiteSeoDescription: string = (ws.seo && ws.seo.description) || (website as any).description || `Welcome to ${website.name}`;
    const websiteImage = normalizeImageUrl(
      (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
      (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
      ws.favicon
    );
    
    // ✅ PRIORITIZE WEBSITE SEO - Only fallback to website name if SEO title is empty
    const title = (websiteSeoTitle && websiteSeoTitle.trim()) 
      ? websiteSeoTitle.trim() 
      : website.name;
    
    // ✅ PRIORITIZE WEBSITE SEO DESCRIPTION - Only fallback if truly empty
    const description = (websiteSeoDescription && websiteSeoDescription.trim())
      ? websiteSeoDescription.trim()
      : `Welcome to ${website.name}`;
    
    return {
      title,
      description,
      og_image: websiteImage,
      keywords: [],
      canonical: `https://${domain}${path}`,
      robots: 'index, follow',
      site_name: website.name,
      source: `website_root_fallback|website:${websiteId}`
    };
  } catch (error) {
    console.error('💥 Website homepage SEO resolution error:', error);
    return null;
  }
}

// Main SEO data resolution - handles both custom domains and system domains
async function resolveSEOData(domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`🔍 Resolving SEO for ${domain}${path}`);
    
    // Normalize domain variants
    const apexDomain = domain.replace(/^www\./, '');
    const domainVariants = [domain, apexDomain, `www.${apexDomain}`];
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
    // Check if this is a system domain (ecombuildr.com with store/funnel paths)
    const isSystemDomain = domain.includes('ecombuildr.com') && 
                          (path.startsWith('/store/') || path.startsWith('/funnel/'));
    
    if (isSystemDomain) {
      console.log(`🏠 System domain detected - parsing URL structure`);
      return await resolveSystemDomainSEO(domain, path, cleanPath);
    }
    
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
    
    // Step 2: Find ALL connections (website AND funnel)
    const { data: connections } = await supabase
      .from('domain_connections')
      .select('content_type, content_id')
      .eq('domain_id', customDomain.id);
    
    const websiteConnection = connections?.find(c => c.content_type === 'website');
    const funnelConnection = connections?.find(c => c.content_type === 'funnel');
    
    let websiteId: string | null = null;
    let funnelId: string | null = null;
    
    if (websiteConnection) {
      websiteId = websiteConnection.content_id;
      console.log(`✅ Found website connection: ${websiteId}`);
    }
    
    if (funnelConnection) {
      funnelId = funnelConnection.content_id;
      console.log(`✅ Found funnel connection: ${funnelId}`);
    }
    
    // If no connections found, fallback to store content
    if (!websiteConnection && !funnelConnection) {
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
      
      // Try to find funnel by domain match
      const { data: storeFunnels } = await supabase
        .from('funnels')
        .select('id, domain')
        .eq('store_id', customDomain.store_id)
        .eq('is_active', true)
        .eq('is_published', true);
      
      if (storeFunnels && storeFunnels.length > 0) {
        const exactMatch = storeFunnels.find(f => f.domain && f.domain.replace(/^www\./, '') === apexDomain);
        funnelId = exactMatch?.id || storeFunnels[0].id;
        console.log(`📦 Using store funnel fallback: ${funnelId}`);
      }
    }
    
    if (!websiteId && !funnelId) {
      console.log('❌ No website or funnel resolved after fallback');
      return null;
    }
    
    // Step 3: Handle funnel connections first (they take priority)
    if (funnelId) {
      console.log(`🎯 Processing funnel connection: ${funnelId}`);
      return await resolveFunnelSEO(funnelId, cleanPath, domain, path);
    }
    
    // Step 4: Handle website connections (if no funnel connection)
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
  <script type="module" crossorigin src="/assets/index-DOA10Uc1.js"></script>
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
  
  console.log(`[${traceId}] 🌐 MIDDLEWARE TRIGGERED: ${domain}${pathname} | UA: ${userAgent.substring(0, 80)}`);
  
  // Detect if this is a custom domain (not ecombuildr.com or localhost)
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');
  
  // Detect if this is a system domain that needs SEO (ecombuildr.com with store/funnel paths)
  const isSystemDomain = domain.includes('ecombuildr.com') && 
                         (pathname.startsWith('/store/') || pathname.startsWith('/funnel/'));
  
  // Check if this is a social crawler
  const isSocialBot = isSocialCrawler(userAgent);
  
  console.log(`🔍 Domain: ${domain} | Custom: ${isCustomDomain} | System: ${isSystemDomain} | Social Bot: ${isSocialBot}`);
  
  // For custom domains AND system domains, provide SEO for ALL visitors
  if (isCustomDomain || isSystemDomain) {
    console.log(`🌐 ${isCustomDomain ? 'Custom' : 'System'} domain request - generating SEO HTML for ${isSocialBot ? 'social crawler' : 'regular visitor'}`);
    
    try {
      const seoData = await resolveSEOData(domain, pathname);
      
      if (!seoData) {
        console.log(`[${traceId}] ❌ No SEO data found - rendering minimal fallback`);
        const minimal = {
          title: domain,
          description: `Preview of ${domain}`,
          og_image: undefined,
          keywords: [],
          canonical: url.toString(),
          robots: 'index, follow',
          site_name: domain,
          source: 'fallback_no_data'
        } as SEOData;
        const html = generateHTML(minimal, url.toString());
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=120, s-maxage=120',
            'X-Trace-Id': traceId,
            'X-SEO-Source': 'fallback_no_data',
            'X-SEO-Website': domain,
            'X-SEO-Page': domain,
            'X-SEO-Domain': domain,
            'X-SEO-Path': pathname
          },
        });
      }
      
      console.log(`✅ SEO resolved via ${seoData.source}: ${seoData.title}`);
      
      const html = generateHTML(seoData, url.toString());
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Trace-Id': traceId,
          'X-SEO-Source': seoData.source || 'unknown',
          'X-SEO-Website': seoData.site_name,
          'X-SEO-Page': seoData.title,
          'X-SEO-Domain': domain,
          'X-SEO-Path': pathname,
          ...(seoData.debug?.websiteId ? { 'X-SEO-Website-Id': seoData.debug.websiteId } : {}),
          ...(seoData.debug?.pageId ? { 'X-SEO-Page-Id': seoData.debug.pageId } : {}),
          ...(seoData.debug?.slug ? { 'X-SEO-Slug': seoData.debug.slug } : {}),
          ...(seoData.debug?.titleSource ? { 'X-SEO-Title-Source': seoData.debug.titleSource } : {}),
          ...(seoData.debug?.descSource ? { 'X-SEO-Desc-Source': seoData.debug.descSource } : {}),
          ...(seoData.debug?.imageSource ? { 'X-SEO-Image-Source': seoData.debug.imageSource } : {}),
        },
      });

    } catch (error) {
      console.error('💥 SEO Handler error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  
  // For system domains (ecombuildr.com, localhost), pass through
  console.log('🏠 System domain - passing through to React app');
  return new Response(null, { status: 200 });
}

export const config = {
  runtime: 'edge',
};

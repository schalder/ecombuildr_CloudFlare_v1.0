// @ts-ignore - Supabase client will be available at runtime
import { createClient } from '@supabase/supabase-js';

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
  'facebookplatform', 'Facebot', 'FacebookBot', 'Googlebot', 'Bingbot',
  'bot', 'crawler', 'spider', 'baiduspider', 'yandex', 'duckduckbot',
  'slurp', 'ia_archiver', 'semrushbot', 'ahrefsbot', 'dotbot',
  'pinterestbot', 'applebot', 'yahoobot', 'slackbot', 'telegrambot',
  'discordbot', 'skypeuripreview', 'facebookcatalog', 'facebookplatform'
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
  debug?: {
    titleSource?: string;
    descSource?: string;
    imageSource?: string;
    websiteId?: string;
    pageId?: string;
    slug?: string;
    connType?: string;
    connId?: string;
    stepSlug?: string;
  };
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

// Parse URL to extract content identifiers (content-based approach)
function parseContentFromUrl(hostname: string, pathname: string): {
  type: 'website_page' | 'funnel_step' | 'custom_domain_page' | 'custom_domain_step' | 'unknown';
  websiteSlug?: string;
  pageSlug?: string;
  funnelId?: string;
  stepSlug?: string;
  isCustomDomain?: boolean;
} {
  // System domain patterns - direct content resolution
  // Handle both /site/website-slug (homepage) and /site/website-slug/page-slug
  const siteMatch = pathname.match(/^\/site\/([^\/]+)(?:\/(.+))?$/);
  if (siteMatch) {
    return {
      type: 'website_page',
      websiteSlug: siteMatch[1],
      pageSlug: siteMatch[2] || 'homepage' // Default to 'homepage' if no page slug
    };
  }
  
  const funnelMatch = pathname.match(/^\/funnel\/([^\/]+)\/(.+)$/);
  if (funnelMatch) {
    return {
      type: 'funnel_step',
      funnelId: funnelMatch[1],
      stepSlug: funnelMatch[2]
    };
  }
  
  // Custom domain patterns - need to resolve via custom_domains table
  const isSystemDomain = hostname.includes('ecombuildr.com') || hostname.includes('lovable.app');
  if (!isSystemDomain) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (lastSegment) {
      // Could be either a page or step slug - we'll query both
      return {
        type: 'custom_domain_page', // Will also check for funnel steps
        pageSlug: lastSegment,
        stepSlug: lastSegment,
        isCustomDomain: true
      };
    }
  }
  
  return { type: 'unknown' };
}

// Simplified content-based SEO data resolution
async function resolveSEOData(supabase: any, hostname: string, pathname: string): Promise<SEOData | null> {
  try {
    const contentInfo = parseContentFromUrl(hostname, pathname);
    console.log(`🔍 Content-based SEO resolution: ${contentInfo.type} for ${hostname}${pathname}`);
    
    // Direct content resolution based on URL structure
    if (contentInfo.type === 'website_page') {
      return await resolveWebsitePageSEO(supabase, contentInfo.websiteSlug!, contentInfo.pageSlug!, hostname, pathname);
    }
    
    if (contentInfo.type === 'funnel_step') {
      return await resolveFunnelStepSEO(supabase, contentInfo.funnelId!, contentInfo.stepSlug!, hostname, pathname);
    }
    
    if (contentInfo.type === 'custom_domain_page') {
      return await resolveCustomDomainContentSEO(supabase, hostname, contentInfo.pageSlug!, contentInfo.stepSlug!, pathname);
    }
    
    console.log(`❌ Unknown content type: ${contentInfo.type}`);
    return null;
    
  } catch (error) {
    console.error('❌ SEO resolution error:', error);
    return null;
  }
}

// Resolve SEO for website pages (system domain)
async function resolveWebsitePageSEO(supabase: any, websiteSlug: string, pageSlug: string, hostname: string, pathname: string): Promise<SEOData | null> {
  console.log(`📄 Resolving website page: ${websiteSlug}/${pageSlug}`);
  
  let pageQuery = supabase
    .from('website_pages')
    .select(`
      id, title, slug, seo_title, seo_description, og_image, social_image_url, preview_image_url,
      seo_keywords, canonical_url, meta_robots, meta_author, language_code,
      custom_meta_tags, content, is_homepage,
      websites!inner(id, name, slug, description, settings)
    `)
    .eq('websites.slug', websiteSlug);
  
  // If pageSlug is 'homepage', look for homepage page, otherwise look for specific slug
  if (pageSlug === 'homepage') {
    pageQuery = pageQuery.eq('is_homepage', true);
  } else {
    pageQuery = pageQuery.eq('slug', pageSlug);
  }
  
  const { data: page } = await pageQuery.maybeSingle();
  
  if (!page) {
    console.log(`❌ Website page not found: ${websiteSlug}/${pageSlug}`);
    
    // Fallback: try to get website-level SEO
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, description, settings')
      .eq('slug', websiteSlug)
      .maybeSingle();
    
    if (website) {
      console.log(`✅ Using website-level SEO fallback for: ${website.name}`);
      const ws: any = website.settings || {};
      
      const title = (ws.seo && ws.seo.title) || website.name;
      const description = (ws.seo && ws.seo.description) || website.description || `Welcome to ${website.name}`;
      const image = normalizeImageUrl(
        (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
        (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
        ws.favicon
      );
      
      return {
        title,
        description,
        og_image: image,
        keywords: [],
        canonical: `https://${hostname}${pathname}`,
        robots: 'index, follow',
        site_name: website.name,
        source: `website_fallback|website:${website.id}`,
        debug: {
          titleSource: 'website.settings.seo.title',
          descSource: 'website.description',
          imageSource: 'website.settings',
          websiteId: website.id,
          slug: websiteSlug
        }
      };
    }
    
    return null;
  }
  
  const website = page.websites;
  const contentDesc = extractContentDescription(page.content);
  
  const title = (page.seo_title && page.seo_title.trim()) 
    ? page.seo_title.trim() 
    : `${page.title} - ${website.name}`;
  
  const description = (page.seo_description && page.seo_description.trim())
    ? page.seo_description.trim()
    : (contentDesc || `${page.title} - ${website.name}`);
  
  let image = page.social_image_url || page.og_image || page.preview_image_url;
  if (!image) {
    // Fallback to website-level image
    const ws: any = website.settings || {};
    image = normalizeImageUrl(
      (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
      (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
      ws.favicon
    );
  } else {
    image = normalizeImageUrl(image);
  }
  
  const canonicalUrl = page.canonical_url || `https://${hostname}${pathname}`;
  
  console.log(`✅ Website page SEO resolved: ${title}`);
  
  return {
    title,
    description,
    og_image: image,
    keywords: page.seo_keywords || [],
    canonical: canonicalUrl,
    robots: page.meta_robots || 'index, follow',
    site_name: website.name,
    source: `website_page|website:${website.id}|page:${page.id}`,
    debug: {
      titleSource: 'page.seo_title',
      descSource: 'page.seo_description',
      imageSource: page.social_image_url ? 'page.social_image_url' : 'website.settings',
      websiteId: website.id,
      pageId: page.id,
      slug: pageSlug
    }
  };
}

// Resolve SEO for funnel steps (system domain)
async function resolveFunnelStepSEO(supabase: any, funnelId: string, stepSlug: string, hostname: string, pathname: string): Promise<SEOData | null> {
  console.log(`🎯 Resolving funnel step: ${funnelId}/${stepSlug}`);
  
  const { data: step } = await supabase
    .from('funnel_steps')
    .select(`
      id, name, slug, seo_title, seo_description, og_image, social_image_url,
      seo_keywords, canonical_url, meta_robots, meta_author, 
      language_code, custom_meta_tags, content,
      funnels!inner(id, name, slug, seo_title, seo_description, og_image, social_image_url)
    `)
    .eq('slug', stepSlug)
    .eq('funnels.id', funnelId)
    .maybeSingle();
  
  if (!step) {
    console.log(`❌ Funnel step not found: ${funnelId}/${stepSlug}`);
    return null;
  }
  
  const funnel = step.funnels;
  const contentDesc = extractContentDescription(step.content);
  
  const title = (step.seo_title && step.seo_title.trim()) 
    ? step.seo_title.trim() 
    : `${step.name} | ${funnel.name}`;
  
  const description = (step.seo_description && step.seo_description.trim())
    ? step.seo_description.trim()
    : (contentDesc || `${step.name} - ${funnel.name}`);
  
  let image = step.social_image_url || step.og_image || funnel.social_image_url || funnel.og_image;
  image = normalizeImageUrl(image);
  
  const canonicalUrl = step.canonical_url || `https://${hostname}${pathname}`;
  
  console.log(`✅ Funnel step SEO resolved: ${title}`);
  
  return {
    title,
    description,
    og_image: image,
    keywords: step.seo_keywords || [],
    canonical: canonicalUrl,
    robots: step.meta_robots || 'index, follow',
    site_name: funnel.name,
    source: `funnel_step|funnel:${funnel.id}|step:${stepSlug}`,
    debug: {
      titleSource: 'step.seo_title',
      descSource: 'step.seo_description',
      imageSource: step.social_image_url ? 'step.social_image_url' : 'funnel.social_image_url',
      connType: 'funnel',
      connId: funnel.id,
      stepSlug: stepSlug
    }
  };
}

// Resolve SEO for custom domain content (pages or steps)
async function resolveCustomDomainContentSEO(supabase: any, hostname: string, pageSlug: string, stepSlug: string, pathname: string): Promise<SEOData | null> {
  console.log(`🌐 Resolving custom domain content: ${hostname}/${pageSlug}`);
  
  // First, resolve the custom domain to get store_id
  const { data: customDomain } = await supabase
    .from('custom_domains')
    .select('id, domain, store_id')
    .eq('domain', hostname)
    .maybeSingle();
  
  if (!customDomain) {
    console.log(`❌ Custom domain not found: ${hostname}`);
    return null;
  }
  
  // Try to find as website page first
  const { data: page } = await supabase
    .from('website_pages')
    .select(`
      id, title, slug, seo_title, seo_description, og_image, social_image_url, preview_image_url,
      seo_keywords, canonical_url, meta_robots, meta_author, language_code,
      custom_meta_tags, content,
      websites!inner(id, name, slug, description, settings, store_id)
    `)
    .eq('slug', pageSlug)
    .eq('websites.store_id', customDomain.store_id)
    .maybeSingle();
  
  if (page) {
    const website = page.websites;
    const contentDesc = extractContentDescription(page.content);
    
    const title = (page.seo_title && page.seo_title.trim()) 
      ? page.seo_title.trim() 
      : `${page.title} - ${website.name}`;
    
    const description = (page.seo_description && page.seo_description.trim())
      ? page.seo_description.trim()
      : (contentDesc || `${page.title} - ${website.name}`);
    
    let image = page.social_image_url || page.og_image || page.preview_image_url;
    if (!image) {
      const ws: any = website.settings || {};
      image = normalizeImageUrl(
        (ws.seo && (ws.seo.og_image || ws.seo.social_image_url)) ||
        (ws.branding && (ws.branding.social_image_url || ws.branding.logo)) ||
        ws.favicon
      );
    } else {
      image = normalizeImageUrl(image);
    }
    
    const canonicalUrl = page.canonical_url || `https://${hostname}${pathname}`;
    
    console.log(`✅ Custom domain page SEO resolved: ${title}`);
    
    return {
      title,
      description,
      og_image: image,
      keywords: page.seo_keywords || [],
      canonical: canonicalUrl,
      robots: page.meta_robots || 'index, follow',
      site_name: website.name,
      source: `custom_domain_page|domain:${customDomain.id}|website:${website.id}|page:${page.id}`,
      debug: {
        titleSource: 'page.seo_title',
        descSource: 'page.seo_description',
        imageSource: page.social_image_url ? 'page.social_image_url' : 'website.settings',
        websiteId: website.id,
        pageId: page.id,
        slug: pageSlug
      }
    };
  }
  
  // Try to find as funnel step
  const { data: step } = await supabase
    .from('funnel_steps')
    .select(`
      id, name, slug, seo_title, seo_description, og_image, social_image_url,
      seo_keywords, canonical_url, meta_robots, meta_author, 
      language_code, custom_meta_tags, content,
      funnels!inner(id, name, slug, seo_title, seo_description, og_image, social_image_url, store_id)
    `)
    .eq('slug', stepSlug)
    .eq('funnels.store_id', customDomain.store_id)
    .maybeSingle();
  
  if (step) {
    const funnel = step.funnels;
    const contentDesc = extractContentDescription(step.content);
    
    const title = (step.seo_title && step.seo_title.trim()) 
      ? step.seo_title.trim() 
      : `${step.name} | ${funnel.name}`;
    
    const description = (step.seo_description && step.seo_description.trim())
      ? step.seo_description.trim()
      : (contentDesc || `${step.name} - ${funnel.name}`);
    
    let image = step.social_image_url || step.og_image || funnel.social_image_url || funnel.og_image;
    image = normalizeImageUrl(image);
    
    const canonicalUrl = step.canonical_url || `https://${hostname}${pathname}`;
    
    console.log(`✅ Custom domain funnel step SEO resolved: ${title}`);
    
    return {
      title,
      description,
      og_image: image,
      keywords: step.seo_keywords || [],
      canonical: canonicalUrl,
      robots: step.meta_robots || 'index, follow',
      site_name: funnel.name,
      source: `custom_domain_step|domain:${customDomain.id}|funnel:${funnel.id}|step:${stepSlug}`,
      debug: {
        titleSource: 'step.seo_title',
        descSource: 'step.seo_description',
        imageSource: step.social_image_url ? 'step.social_image_url' : 'funnel.social_image_url',
        connType: 'funnel',
        connId: funnel.id,
        stepSlug: stepSlug
      }
    };
  }
  
  console.log(`❌ No content found for custom domain: ${hostname}/${pageSlug}`);
  return null;
}

// HTML escaping function to prevent XSS
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Generate complete HTML for crawlers
function generateHTML(seo: SEOData, url: string): string {
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const image = seo.og_image || '';
  const canonical = seo.canonical;
  const siteName = escapeHtml(seo.site_name);
  const robots = seo.robots;
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.map(k => escapeHtml(k)).join(', ') : '';
  const languageCode = (seo as any).language_code || 'en';

  return `<!DOCTYPE html>
<html lang="${languageCode}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
  <meta property="og:image" content="${image || ''}" />
  ${image ? `<meta property="og:image:secure_url" content="${image}" />` : ''}
  ${image ? `<meta property="og:image:width" content="1200" />` : ''}
  ${image ? `<meta property="og:image:height" content="630" />` : ''}
  ${image ? `<meta property="og:image:type" content="image/png" />` : ''}
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="${languageCode}_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
  ${image ? `<meta name="twitter:image:alt" content="${title}" />` : ''}
  
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

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Get actual hostname from Cloudflare headers
    const hostname = request.headers.get('host') || url.hostname;
    const pathname = url.pathname;
    
    const traceId = crypto.randomUUID();
    
    console.log(`[${traceId}] 🌐 Request: ${hostname}${pathname} | UA: ${userAgent.substring(0, 80)}`);
    
    // Check if this is a social crawler
    const isSocialBot = isSocialCrawler(userAgent);
    
    // Detect content type from URL
    const contentInfo = parseContentFromUrl(hostname, pathname);
    const shouldHandleSEO = isSocialBot && (
      contentInfo.type === 'website_page' ||
      contentInfo.type === 'funnel_step' ||
      contentInfo.type === 'custom_domain_page'
    );
    
    console.log(`🔍 Content: ${contentInfo.type} | Social Bot: ${isSocialBot} | Handle SEO: ${shouldHandleSEO}`);
    console.log(`🔍 Content Info:`, JSON.stringify(contentInfo, null, 2));
    console.log(`🔍 User Agent: ${userAgent}`);
    
    // Handle social crawlers with SEO
    if (shouldHandleSEO) {
      console.log(`🤖 Social crawler detected - generating SEO HTML`);
      
      try {
        // Initialize Supabase client
        const supabase = createClient(
          env.SUPABASE_URL || 'https://fhqwacmokbtbspkxjixf.supabase.co',
          env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM'
        );
        
        const seoData = await resolveSEOData(supabase, hostname, pathname);
        
        if (!seoData) {
          console.log(`[${traceId}] ❌ No SEO data found - rendering minimal fallback`);
          const minimal = {
            title: contentInfo.type === 'website_page' ? `${contentInfo.pageSlug} - Page` : 
                   contentInfo.type === 'funnel_step' ? `${contentInfo.stepSlug} - Step` :
                   `${hostname} - Content`,
            description: `Preview of ${contentInfo.pageSlug || contentInfo.stepSlug || hostname}`,
            og_image: undefined,
            keywords: [],
            canonical: url.toString(),
            robots: 'index, follow',
            site_name: hostname,
            source: 'fallback_no_data'
          } as SEOData;
          const html = generateHTML(minimal, url.toString());
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=120, s-maxage=120',
              'X-Trace-Id': traceId,
              'X-SEO-Source': 'fallback_no_data',
              'X-SEO-Content-Type': contentInfo.type,
              'X-SEO-Path': pathname
            },
          });
        }
        
        console.log(`✅ SEO resolved via ${seoData.source}: ${seoData.title}`);
        
        const html = generateHTML(seoData, url.toString());
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': html.length.toString(),
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Trace-Id': traceId,
            'X-SEO-Source': seoData.source || 'unknown',
            'X-SEO-Content-Type': contentInfo.type,
            'X-SEO-Path': pathname,
            'X-SEO-Website': seoData.site_name,
            'X-SEO-Page': seoData.title,
            ...(seoData.debug?.websiteId ? { 'X-SEO-Website-Id': seoData.debug.websiteId } : {}),
            ...(seoData.debug?.pageId ? { 'X-SEO-Page-Id': seoData.debug.pageId } : {}),
            ...(seoData.debug?.slug ? { 'X-SEO-Slug': seoData.debug.slug } : {}),
            ...(seoData.debug?.titleSource ? { 'X-SEO-Title-Source': seoData.debug.titleSource } : {}),
            ...(seoData.debug?.descSource ? { 'X-SEO-Desc-Source': seoData.debug.descSource } : {}),
            ...(seoData.debug?.imageSource ? { 'X-SEO-Image-Source': seoData.debug.imageSource } : {}),
            ...(seoData.debug?.connType ? { 'X-SEO-Conn-Type': seoData.debug.connType } : {}),
            ...(seoData.debug?.connId ? { 'X-SEO-Conn-Id': seoData.debug.connId } : {}),
            ...(seoData.debug?.stepSlug ? { 'X-SEO-Step-Slug': seoData.debug.stepSlug } : {}),
          },
        });

      } catch (error) {
        console.error('💥 SEO Handler error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
    
    // For non-social crawlers or unsupported patterns, pass through to Pages
    console.log('👤 Non-social crawler or unsupported pattern - passing through');
    return new Response(null, { status: 200 });
  }
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
  'facebookplatform', 'Facebot', 'FacebookBot', 'Googlebot', 'Bingbot',
  'bot', 'crawler', 'spider'
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
    
    // Derive website-level SEO from settings JSON
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
        let pickedImage = homepagePage.social_image_url || homepagePage.og_image || homepagePage.preview_image_url;
        let imageSource = homepagePage.social_image_url
          ? 'homepage.social_image_url'
          : (homepagePage.og_image ? 'homepage.og_image' : (homepagePage.preview_image_url ? 'homepage.preview_image_url' : 'none'));
        
        // Only fallback to website image if homepage has no images at all
        if (!pickedImage) {
          pickedImage = websiteImage;
          imageSource = 'website.settings_image';
        }
        
        const image = normalizeImageUrl(pickedImage);
        
        console.log(`🏠 Homepage SEO resolved for ${domain} (page:${homepagePage.id}, website:${websiteId})`);
        console.log(`   • title="${title}" [homepage.seo_title]`);
        console.log(`   • description="${description}" [homepage.seo_description]`);
        console.log(`   • image="${image}" [${imageSource}]`);
        
        return {
          title,
          description,
          og_image: image,
          keywords: homepagePage.seo_keywords || [],
          canonical: homepagePage.canonical_url || `https://${domain}/`,
          robots: homepagePage.meta_robots || 'index, follow',
          site_name: website.name,
          source: `homepage_page|website:${websiteId}|page:${homepagePage.id}`,
          debug: {
            titleSource: 'homepage.seo_title',
            descSource: 'homepage.seo_description',
            imageSource,
            websiteId,
            pageId: homepagePage.id,
            slug: homepagePage.slug
          }
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
    
    // Product pages
    if (cleanPath.startsWith('product/')) {
      const productSlug = cleanPath.replace('product/', '');
      const { data: product } = await supabase
        .from('products')
        .select(`
          name, description, images, seo_title, seo_description, og_image,
          seo_keywords, canonical_url, meta_robots, meta_author,
          language_code, custom_meta_tags
        `)
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (product) {
        const contentDesc = extractContentDescription(product.description);
        
        // ✅ PRIORITIZE PRODUCT SEO - Only fallback to product name if SEO title is empty
        const title = (product.seo_title && product.seo_title.trim()) 
          ? product.seo_title.trim() 
          : `${product.name} | ${website.name}`;
        
        // ✅ PRIORITIZE PRODUCT SEO DESCRIPTION - Only fallback if truly empty
        const description = (product.seo_description && product.seo_description.trim())
          ? product.seo_description.trim()
          : (contentDesc || `${product.name} - Available at ${website.name}`);
        
        // ✅ PRIORITIZE PRODUCT IMAGES - Only fallback to website if product has no images
        let image = product.og_image || product.images?.[0];
        if (!image) {
          image = websiteImage;
        }
        
        return {
          title,
          description,
          og_image: normalizeImageUrl(image),
          keywords: product.seo_keywords || [],
          canonical: product.canonical_url || `https://${domain}${path}`,
          robots: product.meta_robots || 'index, follow',
          site_name: website.name,
          source: `product_page|website:${websiteId}|slug:${productSlug}`
        };
      }
    }
    
    // Funnel routes
    if (cleanPath.startsWith('funnel/')) {
      const pathParts = cleanPath.split('/');
      const funnelSlug = pathParts[1];
      const stepSlug = pathParts[2];
      
      const { data: funnel } = await supabase
        .from('funnels')
        .select(`
          id, name, seo_title, seo_description, og_image, social_image_url,
          seo_keywords, canonical_url, meta_robots, meta_author,
          language_code, custom_meta_tags
        `)
        .eq('slug', funnelSlug)
        .eq('is_active', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (funnel) {
        if (stepSlug) {
          // Funnel step
          const { data: step } = await supabase
            .from('funnel_steps')
            .select(`
              name, seo_title, seo_description, og_image, social_image_url,
              seo_keywords, canonical_url, meta_robots, meta_author, 
              language_code, custom_meta_tags, content
            `)
            .eq('funnel_id', funnel.id)
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
            let image = step.og_image || step.social_image_url;
            if (!image) {
              image = funnel.og_image;
            }
            
            return {
              title,
              description,
              og_image: normalizeImageUrl(image),
              keywords: step.seo_keywords || [],
              canonical: step.canonical_url || `https://${domain}${path}`,
              robots: step.meta_robots || 'index, follow',
              site_name: funnel.name,
              source: `funnel_step|funnel:${funnel.id}|step:${stepSlug}`
            };
          }
        } else {
          // Funnel landing
          // ✅ PRIORITIZE FUNNEL SEO - Only fallback to funnel name if SEO title is empty
          const title = (funnel.seo_title && funnel.seo_title.trim()) 
            ? funnel.seo_title.trim() 
            : funnel.name;
          
          // ✅ PRIORITIZE FUNNEL SEO DESCRIPTION - Only fallback if truly empty
          const description = (funnel.seo_description && funnel.seo_description.trim())
            ? funnel.seo_description.trim()
            : `Sales funnel: ${funnel.name}`;
          
          // ✅ PRIORITIZE FUNNEL IMAGES
          const image = normalizeImageUrl(funnel.social_image_url || funnel.og_image);
          
          return {
            title,
            description,
            og_image: image,
            keywords: funnel.seo_keywords || [],
            canonical: funnel.canonical_url || `https://${domain}${path}`,
            robots: funnel.meta_robots || 'index, follow',
            site_name: funnel.name,
            source: `funnel_landing|funnel:${funnel.id}`
          };
        }
      }
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
      const titleSource = (page.seo_title && page.seo_title.trim()) ? 'page.seo_title' : 'page.title_fallback';

      // ✅ PRIORITIZE PAGE SEO DESCRIPTION - Only fallback if truly empty
      const rawDesc = (page.seo_description && page.seo_description.trim())
        ? page.seo_description.trim()
        : (contentDesc || `${page.title} - ${website.name}`);
      const descSource = (page.seo_description && page.seo_description.trim())
        ? 'page.seo_description'
        : (contentDesc ? 'content_extracted' : 'page.title_fallback');

      // ✅ PRIORITIZE PAGE IMAGES - Only fallback to website if page has no images
      let pickedImage = page.social_image_url || page.og_image || page.preview_image_url;
      let imageSource = page.social_image_url
        ? 'page.social_image_url'
        : (page.og_image ? 'page.og_image' : (page.preview_image_url ? 'page.preview_image_url' : 'none'));
      
      // Only fallback to website image if page has no images at all
      if (!pickedImage) {
        pickedImage = websiteImage;
        imageSource = 'website.settings_image';
      }
      
      const image = normalizeImageUrl(pickedImage);

      console.log(`🔎 Page SEO resolved for slug="${cleanPath}" (page:${page.id}, website:${websiteId})`);
      console.log(`   • title="${rawTitle}" [${titleSource}]`);
      console.log(`   • description="${rawDesc}" [${descSource}]`);
      console.log(`   • image="${image}" [${imageSource}]`);
      
      return {
        title: rawTitle,
        description: rawDesc,
        og_image: image,
        keywords: page.seo_keywords || [],
        canonical: page.canonical_url || `https://${domain}${path}`,
        robots: page.meta_robots || 'index, follow',
        site_name: website.name,
        source: `website_page|website:${websiteId}|slug:${cleanPath}`,
        debug: {
          titleSource,
          descSource,
          imageSource,
          websiteId,
          pageId: page.id,
          slug: cleanPath
        }
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
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
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
</head>
<body>
  <div id="root">
    <h1>${title}</h1>
    <p>${description}</p>
    <p>Please enable JavaScript to view the full content.</p>
    <script>
      // Redirect to React app after a short delay for crawlers that execute JS
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    </script>
  </div>
</body>
</html>`;
}

// NEW: Function to get routing context for custom domains
async function getRoutingContext(domain: string, pathname: string): Promise<any> {
  try {
    console.log(`🔍 Getting routing context for ${domain}${pathname}`);
    
    // Normalize domain variants
    const apexDomain = domain.replace(/^www\./, '');
    const domainVariants = [domain, apexDomain, `www.${apexDomain}`];
    
    // Get domain info
    const { data: domainData } = await supabase
      .from('custom_domains')
      .select('id, store_id, is_verified, dns_configured')
      .in('domain', domainVariants)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .single();
    
    if (!domainData) {
      console.log(`❌ No verified domain found for ${domain}`);
      return null;
    }
    
    console.log(`✅ Found verified domain: ${domainData.id} -> store ${domainData.store_id}`);
    
    // Get connections for this domain
    const { data: connections } = await supabase
      .from('domain_connections')
      .select('content_type, content_id, path, is_homepage')
      .eq('domain_id', domainData.id);
    
    console.log(`✅ Found ${connections?.length || 0} connections for domain`);
    
    return {
      domainId: domainData.id,
      storeId: domainData.store_id,
      connections: connections || [],
      domain: domain,
      pathname: pathname
    };
  } catch (error) {
    console.error('💥 Error getting routing context:', error);
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const domain = url.hostname;
  const pathname = url.pathname;
  const traceId = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  
  console.log(`[${traceId}] 🌐 Request: ${domain}${pathname} | UA: ${userAgent.substring(0, 80)}`);
  
  // Detect if this is a custom domain (not ecombuildr.com or localhost)
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');
  
  // Check if this is a social crawler
  const isSocialBot = isSocialCrawler(userAgent);
  
  console.log(`🔍 Domain: ${domain} | Custom: ${isCustomDomain} | Social Bot: ${isSocialBot}`);
  
  // For custom domains, provide SEO for ALL visitors (not just social crawlers)
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

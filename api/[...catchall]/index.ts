import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

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

// Main SEO data resolution with comprehensive optimizations
async function resolveSEOData(domain: string, path: string, supabase: any): Promise<SEOData | null> {
  const startTime = Date.now();
  const CIRCUIT_BREAKER_THRESHOLD = 4000; // 4 seconds
  
  try {
    console.log(`🔍 [SEO] Resolving for ${domain}${path}`);
    
    // Normalize domain variants
    const apexDomain = domain.replace(/^www\./, '');
    const domainVariants = [domain, apexDomain, `www.${apexDomain}`];
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
    // PHASE 1 & 2: Combined query optimization - Get domain + connection in parallel
    const queryStart = Date.now();
    
    // Use Promise.all for parallel execution
    const [domainResult, connectionResult] = await Promise.all([
      supabase
        .from('custom_domains')
        .select('id, domain, store_id')
        .in('domain', domainVariants)
        .limit(1)
        .maybeSingle()
        .then((res: any) => ({ ...res, queryTime: Date.now() - queryStart })),
      
      // Pre-fetch connection while domain query runs
      supabase
        .from('domain_connections')
        .select('content_type, content_id, domain_id')
        .in('content_type', ['website', 'funnel'])
        .limit(10) // Get multiple to filter after
        .then((res: any) => ({ ...res, queryTime: Date.now() - queryStart }))
    ]);
    
    const { data: customDomain, error: domainError, queryTime: domainQueryTime } = domainResult;
    
    console.log(`⏱️ [SEO] Domain query: ${domainQueryTime}ms`);
    
    if (domainError) {
      console.error('❌ [SEO] Domain query error:', domainError);
      return null;
    }
    
    if (!customDomain) {
      console.log('❌ [SEO] No custom domain found');
      return null;
    }
    
    // PHASE 1: Early bailout if queries are too slow
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > CIRCUIT_BREAKER_THRESHOLD) {
      console.warn(`⚠️ [SEO] Circuit breaker triggered at ${elapsedTime}ms - returning fallback`);
      return {
        title: domain,
        description: `Welcome to ${domain}`,
        canonical: `https://${domain}${path}`,
        robots: 'index, follow',
        site_name: domain,
        source: 'circuit_breaker_fallback'
      };
    }
    
    console.log(`✅ [SEO] Found domain: ${customDomain.domain} -> store ${customDomain.store_id}`);
    
    // Filter connections for this specific domain
    const { data: allConnections, error: connectionError } = connectionResult;
    const contentConnection = allConnections?.find((c: any) => c.domain_id === customDomain.id);
    
    if (connectionError) {
      console.error('❌ [SEO] Connection query error:', connectionError);
    }
    
    console.log(`⏱️ [SEO] Total initial queries: ${Date.now() - startTime}ms`);
    
    let websiteId: string | null = null;
    let funnelId: string | null = null;
    
    if (contentConnection) {
      if (contentConnection.content_type === 'website') {
        websiteId = contentConnection.content_id;
        console.log(`✅ [SEO] Website connection: ${websiteId}`);
      } else if (contentConnection.content_type === 'funnel') {
        funnelId = contentConnection.content_id;
        console.log(`✅ [SEO] Funnel connection: ${funnelId}`);
      }
    } else {
      // PHASE 1: Simplified fallback - no extra queries, just return basic SEO
      console.log('⚠️ [SEO] No connection found - returning basic fallback');
      return {
        title: domain,
        description: `Welcome to ${domain}`,
        canonical: `https://${domain}${path}`,
        robots: 'index, follow',
        site_name: domain,
        source: 'no_connection_fallback'
      };
    }
    
    // PHASE 2: Handle funnel connections with optimized queries
    if (funnelId) {
      const funnelQueryStart = Date.now();
      console.log(`🎯 [SEO] Processing funnel: ${funnelId}`);
      
      // PHASE 2: Parallel query for funnel + potential step
      const pathParts = cleanPath.split('/').filter(Boolean);
      const stepSlug = pathParts.length >= 2 && pathParts[0] === 'funnel' ? pathParts[2] : null;
      
      const funnelPromises = [
        supabase
          .from('funnels')
          .select('id, name, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots')
          .eq('id', funnelId)
          .eq('is_published', true)
          .limit(1)
          .maybeSingle()
      ];
      
      // Only query step if we have a step slug
      if (stepSlug) {
        funnelPromises.push(
          supabase
            .from('funnel_steps')
            .select('name, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, content')
            .eq('funnel_id', funnelId)
            .eq('slug', stepSlug)
            .eq('is_published', true)
            .limit(1)
            .maybeSingle()
        );
      }
      
      const results = await Promise.all(funnelPromises);
      const { data: funnel } = results[0];
      const { data: step } = results[1] || { data: null };
      
      console.log(`⏱️ [SEO] Funnel queries: ${Date.now() - funnelQueryStart}ms`);
      
      if (!funnel) {
        console.log('❌ [SEO] Funnel not found or not published');
        return null;
      }
      
      // If we have a step, return step SEO
      if (step) {
        const contentDesc = extractContentDescription(step.content);
        const title = (step.seo_title && step.seo_title.trim()) 
          ? step.seo_title.trim() 
          : `${step.name} | ${funnel.name}`;
        const description = (step.seo_description && step.seo_description.trim())
          ? step.seo_description.trim()
          : (contentDesc || `${step.name} - ${funnel.name}`);
        const image = normalizeImageUrl(step.social_image_url || step.og_image || funnel.og_image);
        
        console.log(`✅ [SEO] Funnel step resolved in ${Date.now() - startTime}ms`);
        return {
          title,
          description,
          og_image: image,
          keywords: step.seo_keywords || [],
          canonical: step.canonical_url || `https://${domain}${path}`,
          robots: step.meta_robots || 'index, follow',
          site_name: funnel.name,
          source: `funnel_step|${funnelId}|${stepSlug}`
        };
      }
      
      // For root path or no step found, return funnel landing page SEO
      if (!cleanPath || !stepSlug) {
        const title = (funnel.seo_title && funnel.seo_title.trim()) 
          ? funnel.seo_title.trim() 
          : funnel.name;
        const description = (funnel.seo_description && funnel.seo_description.trim())
          ? funnel.seo_description.trim()
          : `Sales funnel: ${funnel.name}`;
        const image = normalizeImageUrl(funnel.social_image_url || funnel.og_image);
        
        console.log(`✅ [SEO] Funnel landing resolved in ${Date.now() - startTime}ms`);
        return {
          title,
          description,
          og_image: image,
          keywords: funnel.seo_keywords || [],
          canonical: funnel.canonical_url || `https://${domain}${path}`,
          robots: funnel.meta_robots || 'index, follow',
          site_name: funnel.name,
          source: `funnel_landing|${funnelId}`
        };
      }
    }
    
    if (!websiteId) {
      console.log('❌ [SEO] No website ID resolved');
      return null;
    }
    
    // PHASE 2: Parallel queries for website + page data
    const websiteQueryStart = Date.now();
    
    // Build page query based on path
    let pageQuery = supabase
      .from('website_pages')
      .select('id, title, slug, seo_title, seo_description, og_image, social_image_url, preview_image_url, seo_keywords, canonical_url, meta_robots, content')
      .eq('website_id', websiteId)
      .eq('is_published', true)
      .limit(1);
    
    if (!cleanPath) {
      pageQuery = pageQuery.eq('is_homepage', true);
    } else if (cleanPath.startsWith('product/')) {
      // Skip page query for products, we'll handle separately
      pageQuery = null;
    } else {
      pageQuery = pageQuery.eq('slug', cleanPath);
    }
    
    const queries = [
      supabase
        .from('websites')
        .select('id, name, description, settings')
        .eq('id', websiteId)
        .limit(1)
        .maybeSingle()
    ];
    
    if (pageQuery) {
      queries.push(pageQuery.maybeSingle());
    }
    
    const results = await Promise.all(queries);
    const { data: website } = results[0];
    const { data: page } = results[1] || { data: null };
    
    console.log(`⏱️ [SEO] Website queries: ${Date.now() - websiteQueryStart}ms`);
    
    if (!website) {
      console.log('❌ [SEO] Website not found');
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

    // PHASE 2: Use already fetched page data (from parallel query above)
    
    // Root path - use homepage page SEO
    if (!cleanPath && page) {
      const contentDesc = extractContentDescription(page.content);
      
      const title = (page.seo_title && page.seo_title.trim()) 
        ? page.seo_title.trim() 
        : `${page.title} - ${website.name}`;
      const description = (page.seo_description && page.seo_description.trim())
        ? page.seo_description.trim()
        : (contentDesc || `${page.title} - ${website.name}`);
      const pickedImage = page.social_image_url || page.og_image || page.preview_image_url || websiteImage;
      const image = normalizeImageUrl(pickedImage);
      
      console.log(`✅ [SEO] Homepage resolved in ${Date.now() - startTime}ms`);
      return {
        title,
        description,
        og_image: image,
        keywords: page.seo_keywords || [],
        canonical: page.canonical_url || `https://${domain}/`,
        robots: page.meta_robots || 'index, follow',
        site_name: website.name,
        source: `homepage|${websiteId}|${page.id}`
      };
    }
    
    // PHASE 1: Simplified fallback for homepage without page
    if (!cleanPath && !page) {
      const title = (websiteSeoTitle && websiteSeoTitle.trim()) ? websiteSeoTitle.trim() : website.name;
      console.log(`✅ [SEO] Homepage fallback resolved in ${Date.now() - startTime}ms`);
      return {
        title,
        description: websiteSeoDescription,
        og_image: websiteImage,
        keywords: [],
        canonical: `https://${domain}/`,
        robots: 'index, follow',
        site_name: website.name,
        source: `website_homepage_fallback|${websiteId}`
      };
    }
    
    // PHASE 2: Product pages - separate optimized query
    if (cleanPath.startsWith('product/')) {
      const productSlug = cleanPath.replace('product/', '');
      const productQueryStart = Date.now();
      const { data: product } = await supabase
        .from('products')
        .select('name, description, images, seo_title, seo_description, og_image, seo_keywords, canonical_url, meta_robots')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      console.log(`⏱️ [SEO] Product query: ${Date.now() - productQueryStart}ms`);
      
      if (product) {
        const contentDesc = extractContentDescription(product.description);
        const title = (product.seo_title && product.seo_title.trim()) 
          ? product.seo_title.trim() 
          : `${product.name} | ${website.name}`;
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
      const title = (page.seo_title && page.seo_title.trim()) 
        ? page.seo_title.trim() 
        : `${page.title} - ${website.name}`;
      const description = (page.seo_description && page.seo_description.trim())
        ? page.seo_description.trim()
        : (contentDesc || `${page.title} - ${website.name}`);
      const pickedImage = page.social_image_url || page.og_image || page.preview_image_url || websiteImage;
      const image = normalizeImageUrl(pickedImage);
      
      console.log(`✅ [SEO] Page resolved in ${Date.now() - startTime}ms`);
      return {
        title,
        description,
        og_image: image,
        keywords: page.seo_keywords || [],
        canonical: page.canonical_url || `https://${domain}${path}`,
        robots: page.meta_robots || 'index, follow',
        site_name: website.name,
        source: `page|${websiteId}|${cleanPath}`
      };
    }
    
    // PHASE 1: Final fallback - simplified
    const fallbackTitle = (websiteSeoTitle && websiteSeoTitle.trim()) ? websiteSeoTitle.trim() : website.name;
    console.log(`✅ [SEO] Fallback resolved in ${Date.now() - startTime}ms`);
    return {
      title: fallbackTitle,
      description: websiteSeoDescription,
      og_image: websiteImage,
      keywords: [],
      canonical: `https://${domain}${path}`,
      robots: 'index, follow',
      site_name: website.name,
      source: `website_fallback|${websiteId}`
    };
    
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(`❌ [SEO] Resolution error after ${elapsedTime}ms:`, error);
    
    // PHASE 3: Return basic fallback instead of null to prevent 500 errors
    return {
      title: domain,
      description: `Welcome to ${domain}`,
      canonical: `https://${domain}${path}`,
      robots: 'index, follow',
      site_name: domain,
      source: 'error_fallback'
    };
  } finally {
    console.log(`⏱️ [SEO] Total resolution time: ${Date.now() - startTime}ms`);
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
  const startTime = Date.now();
  
  try {
    // Validate request URL
    if (!request.url) {
      console.error('❌ Request URL is undefined');
      return new Response('Bad Request', { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch (error) {
      console.error('❌ Invalid request URL:', request.url, error);
      return new Response('Bad Request', { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const domain = url.hostname;
    const pathname = url.pathname;
    const traceId = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    
    console.log(`[${traceId}] 🌐 Request: ${domain}${pathname} | UA: ${userAgent.substring(0, 80)}`);
    
    // Check environment variables
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      return new Response('Configuration Error', { status: 500 });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Detect if this is a custom domain (not ecombuildr.com or localhost)
    // BUT treat get.ecombuildr.com as custom domain for funnel steps
    const isCustomDomain = !domain.includes('ecombuildr.com') && 
                          !domain.includes('localhost') && 
                          !domain.includes('lovable.dev') &&
                          !domain.includes('lovable.app') &&
                          !domain.includes('lovableproject.com') ||
                          domain === 'get.ecombuildr.com';
    
    // Check if this is a social crawler
    const isSocialBot = isSocialCrawler(userAgent);
    
    console.log(`🔍 Domain: ${domain} | Custom: ${isCustomDomain} | Social Bot: ${isSocialBot}`);
    
    // For custom domains, always handle social crawlers with SEO
    if (isCustomDomain && isSocialBot) {
      console.log(`🤖 Social crawler on custom domain - generating SEO HTML`);
      
      try {
        // PHASE 1: Reduced timeout with circuit breaker
        const seoPromise = resolveSEOData(domain, pathname, supabase);
        const timeoutPromise = new Promise<SEOData | null>((_, reject) => {
          setTimeout(() => reject(new Error('SEO resolution timeout')), 5000); // 5 second timeout
        });
        
        const seoData = await Promise.race([seoPromise, timeoutPromise]).catch(err => {
          console.error(`⚠️ [Handler] SEO timeout after 5s:`, err);
          // Return basic fallback on timeout
          return {
            title: domain,
            description: `Welcome to ${domain}`,
            canonical: `https://${domain}${pathname}`,
            robots: 'index, follow',
            site_name: domain,
            source: 'timeout_fallback'
          } as SEOData;
        });
      
      // PHASE 3: Always have SEO data now (fallback built into resolveSEOData)
      console.log(`✅ [Handler] SEO resolved via ${seoData.source}: ${seoData.title}`);
      
      const html = generateHTML(seoData, url.toString());
      const totalTime = Date.now() - startTime;
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          // PHASE 1: Better caching with stale-while-revalidate
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          'X-Trace-Id': traceId,
          'X-SEO-Source': seoData.source || 'unknown',
          'X-Response-Time': `${totalTime}ms`,
        },
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 [Handler] SEO error after ${totalTime}ms:`, error);
      
      // PHASE 3: Graceful error fallback
      const fallback = {
        title: domain,
        description: `Welcome to ${domain}`,
        canonical: url.toString(),
        robots: 'index, follow',
        site_name: domain,
        source: 'error_handler_fallback'
      } as SEOData;
      const html = generateHTML(fallback, url.toString());
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Trace-Id': traceId,
          'X-SEO-Source': 'error_handler_fallback',
          'X-Response-Time': `${totalTime}ms`,
        },
      });
    }
  }
  
  // For non-social crawlers or system domains, pass through
  console.log('👤 [Handler] Non-bot or system domain - passing through');
  return new Response('<!DOCTYPE html><html><head></head><body></body></html>', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    }
  });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`💥 [Handler] Edge Function error after ${totalTime}ms:`, error);
    
    // PHASE 3: Return 503 with retry-after instead of 500
    return new Response('<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body>Service temporarily unavailable. Please try again.</body></html>', {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '60',
        'Cache-Control': 'no-cache',
      }
    });
  } finally {
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ [Handler] Total execution time: ${totalTime}ms`);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

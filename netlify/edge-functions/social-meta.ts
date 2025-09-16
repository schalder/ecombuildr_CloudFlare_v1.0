import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

// Initialize Supabase client
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot', 
  'WhatsApp',
  'Slackbot',
  'DiscordBot',
  'TelegramBot',
  'SkypeUriPreview',
  'facebookcatalog',
  'facebookplatform',
  'Facebot',
  'FacebookBot',
  'Googlebot',
  'Bingbot',
  'bot',
  'crawler',
  'spider'
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

interface SEOData {
  title?: string;
  description?: string;
  og_image?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  site_name?: string;
}

function generateHTML(seoData: SEOData, url: string, pathname: string): string {
  const title = seoData.title || 'EcomBuildr - Build Beautiful Online Stores & Funnels';
  const description = seoData.description || 'Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features.';
  const image = seoData.og_image || 'https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png';
  const canonical = seoData.canonical || url;
  const siteName = seoData.site_name || 'EcomBuildr';
  const robots = seoData.robots || 'index, follow';
  const keywords = Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : 'website builder, ecommerce, online store, sales funnel, drag and drop';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="robots" content="${robots}" />
  <meta name="author" content="${siteName}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${title}" />
  
  <!-- Additional SEO -->
  <link rel="canonical" href="${canonical}" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${title}",
    "description": "${description}",
    "image": "${image}",
    "url": "${canonical}",
    "publisher": {
      "@type": "Organization",
      "name": "${siteName}",
      "logo": {
        "@type": "ImageObject",
        "url": "${image}"
      }
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

// Enhanced content extraction with better description generation
function extractContentDescription(content: any): string {
  if (!content) return '';
  
  try {
    // Handle string content
    if (typeof content === 'string') {
      return stripHtmlAndExtract(content);
    }
    
    // Handle page builder content
    if (content.sections && Array.isArray(content.sections)) {
      const textContent = content.sections
        .map((section: any) => {
          if (section.type === 'text' || section.type === 'paragraph') {
            return section.content || section.text || '';
          }
          if (section.type === 'heading') {
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
      
      return stripHtmlAndExtract(textContent);
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting content description:', error);
    return '';
  }
}

function stripHtmlAndExtract(html: string, maxLength: number = 155): string {
  if (!html) return '';
  
  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // Clean up whitespace and split into sentences
  const sentences = decoded
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0);
  
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
}

async function getSEOData(domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`Fetching SEO data for domain: ${domain}, path: ${path}`);
    
    // Clean up path
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
    // Disabled external Supabase seo-prerender dependency. Using local DB-only SEO generation.

    
    // Check if this is EcomBuildr main domain
    if (domain === 'ecombuildr.com' || domain === 'localhost' || domain.includes('lovable.app')) {
      // Check seo_pages table for main domain
      const { data: seoPage } = await supabaseClient
        .from('seo_pages')
        .select('*')
        .eq('page_slug', cleanPath || '/')
        .eq('is_active', true)
        .single();
      
      if (seoPage) {
        return {
          title: seoPage.title,
          description: seoPage.description,
          og_image: seoPage.og_image,
          keywords: seoPage.keywords || [],
          canonical: `https://${domain}${path}`,
          robots: 'index, follow',
          site_name: 'EcomBuildr'
        };
      }
      
      return null; // Will use fallback
    }
    
    // Check for custom domain connections with enhanced content handling
    const apexDomain = domain.replace(/^www\./, '');
    const domainVariants = [domain, apexDomain, `www.${apexDomain}`];
    const { data: customDomainData } = await supabaseClient
      .from('custom_domains')
      .select('id, domain, store_id')
      .in('domain', domainVariants)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .maybeSingle();

    // Fetch connection mapping first (domain -> website or specific page)
    let website: any = null;

    const { data: domainConn } = await supabaseClient
      .from('domain_connections')
      .select('content_type, content_id, domain')
      .in('domain', domainVariants)
      .maybeSingle();

    if (domainConn) {
      if (domainConn.content_type === 'website') {
        const { data: siteByConn } = await supabaseClient
          .from('websites')
          .select('id, name, slug, settings, seo_title, seo_description, og_image, domain, is_active, is_published')
          .eq('id', domainConn.content_id)
          .eq('is_active', true)
          .eq('is_published', true)
          .maybeSingle();
        website = siteByConn || website;
      } else if (domainConn.content_type === 'website_page') {
        // Direct page connection: return page SEO immediately
        const { data: pageConnData } = await supabaseClient
          .from('website_pages')
          .select('id, website_id, title, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, content')
          .eq('id', domainConn.content_id)
          .eq('is_published', true)
          .maybeSingle();

        if (pageConnData) {
          const { data: siteForPage } = await supabaseClient
            .from('websites')
            .select('id, name, og_image')
            .eq('id', pageConnData.website_id)
            .maybeSingle();

          const contentDescription = extractContentDescription(pageConnData.content);
          const description = pageConnData.seo_description || contentDescription || `${pageConnData.title}`;
          return {
            title: pageConnData.seo_title || pageConnData.title || siteForPage?.name,
            description,
            og_image: pageConnData.social_image_url || pageConnData.og_image || siteForPage?.og_image,
            keywords: pageConnData.seo_keywords || [],
            canonical: pageConnData.canonical_url || `https://${domain}${path}`,
            robots: pageConnData.meta_robots || 'index, follow',
            site_name: siteForPage?.name || 'Website'
          };
        }
      }
    }

    // If no explicit connection, fall back to custom_domains -> store -> active website(s)
    if (!website && customDomainData?.store_id) {
      const { data: websitesForStore } = await supabaseClient
        .from('websites')
        .select('id, name, slug, settings, seo_title, seo_description, og_image, domain, is_active, is_published')
        .eq('store_id', customDomainData.store_id)
        .eq('is_active', true)
        .eq('is_published', true);

      website = websitesForStore?.find((w: any) => (w.domain || '').replace(/^www\./, '') === apexDomain) || websitesForStore?.[0] || null;
    }

    if (website) {
      console.log('✅ Found website via custom domain');
      
      // For root path, return website-level SEO
      if (cleanPath === '') {
        return {
          title: website.seo_title || website.name || 'EcomBuildr Store',
          description: website.seo_description || 'Professional e-commerce store built with EcomBuildr',
          og_image: website.og_image,
          canonical: `https://${domain}${path}`,
          robots: 'index, follow',
          site_name: website.name || 'EcomBuildr Store'
        };
      }

      // For product pages, try to extract product info
      if (path.includes('/product/')) {
        const productSlug = path.split('/product/')[1];
        const { data: productData } = await supabaseClient
          .from('products')
          .select('name, description, images, price, store_id')
          .eq('slug', productSlug)
          .eq('is_active', true)
            .maybeSingle();

        if (productData) {
          const productImage = productData.images?.[0] || website.og_image;
          const description = extractContentDescription(productData.description) || 
                            `${productData.name} - Available at ${website.name}`;
          
          return {
            title: `${productData.name} | ${website.name}`,
            description,
            og_image: productImage,
            canonical: `https://${domain}${path}`,
            robots: 'index, follow',
            site_name: website.name || 'EcomBuildr Store'
          };
        }
      }

      // For specific pages, try to find page content
      const { data: pageData } = await supabaseClient
        .from('website_pages')
        .select('title, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, content')
        .eq('website_id', website.id)
        .eq('slug', cleanPath)
        .eq('is_published', true)
        .maybeSingle();

      if (pageData) {
        const contentDescription = extractContentDescription(pageData.content);
        const description = pageData.seo_description || contentDescription || 
                          `${pageData.title} - Page from ${website.name}`;
        
        return {
          title: pageData.seo_title || pageData.title || website.name,
          description,
          og_image: pageData.social_image_url || pageData.og_image || website.og_image,
          keywords: pageData.seo_keywords || [],
          canonical: pageData.canonical_url || `https://${domain}${path}`,
          robots: pageData.meta_robots || 'index, follow',
          site_name: website.name || 'EcomBuildr Store'
        };
      }
      
      // Fallback to website defaults
      return {
        title: website.name,
        description: `Welcome to ${website.name}`,
        canonical: `https://${domain}`,
        site_name: website.name
      };
    }

    // Check funnel routes
    if (path.startsWith('/funnel/')) {
      const funnelSlug = path.split('/funnel/')[1]?.split('/')[0];
      const { data: funnelData } = await supabaseClient
        .from('funnels')
        .select('name, seo_title, seo_description, og_image, domain')
        .eq('slug', funnelSlug)
        .eq('is_published', true)
        .eq('is_active', true)
        .maybeSingle();

      if (funnelData) {
        // Check for funnel steps
        const stepSlug = path.split('/funnel/')[1]?.split('/')[1];
        if (stepSlug) {
          const { data: stepData } = await supabaseClient
            .from('funnel_steps')
            .select('name, seo_title, seo_description, og_image, content')
            .eq('slug', stepSlug)
            .eq('is_published', true)
            .maybeSingle();

          if (stepData) {
            const contentDescription = extractContentDescription(stepData.content);
            const description = stepData.seo_description || contentDescription || 
                              `${stepData.name} - ${funnelData.name}`;
            
            return {
              title: stepData.seo_title || `${stepData.name} | ${funnelData.name}`,
              description,
              og_image: stepData.og_image || funnelData.og_image,
              canonical: `https://${domain}${path}`,
              robots: 'index, follow',
              site_name: funnelData.name
            };
          }
        }

        return {
          title: funnelData?.seo_title || funnelData?.name,
          description: funnelData?.seo_description || (funnelData ? `Sales funnel: ${funnelData.name}` : 'Sales funnel'),
          og_image: funnelData.og_image,
          canonical: `https://${domain}${path}`,
          robots: 'index, follow',
          site_name: funnelData.name
        };
      }
    }
    
    
    return null;
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    return null;
  }
}

export default async function handler(request: Request, context: any): Promise<Response | undefined> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const domain = url.hostname;
  const pathname = url.pathname;
  
  console.log('Edge Function - URL:', pathname);
  console.log('Edge Function - Domain:', domain);
  console.log('Edge Function - User Agent:', userAgent);
  
  // Check if it's a social media crawler
  if (!isSocialCrawler(userAgent)) {
    console.log('Edge Function - Not a crawler, letting request pass through');
    // Let Netlify continue to the origin/app
    return context.next();
  }
  
  console.log('Edge Function - Social crawler detected, generating HTML');
  
  try {
    // Using local SEO synthesis only (no external prerender).

    // 2) Fallback: get SEO JSON/DB and synthesize minimal HTML
    const seoData = await getSEOData(domain, pathname);
    console.log('Edge Function - SEO data found:', !!seoData);

    const fallbackSEOData: SEOData = seoData || {
      title: 'EcomBuildr - Build Beautiful Online Stores & Funnels',
      description: 'Create stunning websites, online stores, and sales funnels with EcomBuildr. Drag & drop builder, custom domains, and powerful e-commerce features.',
      og_image: 'https://res.cloudinary.com/dtkeyccga/image/upload/v1706878427/og-image_dcvqpc.png',
      keywords: ['website builder', 'ecommerce', 'online store', 'sales funnel'],
      canonical: url.toString(),
      robots: 'index, follow',
      site_name: 'EcomBuildr'
    };

    const html = generateHTML(fallbackSEOData, url.toString(), pathname);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });

  } catch (error) {
    console.error('Edge Function - Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const config = {
  path: "/*"
};
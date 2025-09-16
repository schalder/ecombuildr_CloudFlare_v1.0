import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    
    if (!websiteConnection) {
      console.log('❌ No website connection found');
      return null;
    }

    const websiteId = websiteConnection.content_id;
    console.log(`✅ Found website connection: ${websiteId}`);
    
    
    // Step 3: Get website data
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, seo_title, seo_description, og_image')
      .eq('id', websiteId)
      .maybeSingle();
    
    if (!website) {
      console.log('❌ Website not found');
      return null;
    }
    
    // Step 4: Route-specific resolution
    
    // Root path - use website SEO
    if (!cleanPath) {
      const image = normalizeImageUrl(website.og_image);
      return {
        title: website.seo_title || website.name,
        description: website.seo_description || `Welcome to ${website.name}`,
        og_image: image,
        keywords: [],
        canonical: `https://${domain}/`,
        robots: 'index, follow',
        site_name: website.name,
        source: 'website_root'
      };
    }
    
    // Product pages
    if (cleanPath.startsWith('product/')) {
      const productSlug = cleanPath.replace('product/', '');
      const { data: product } = await supabase
        .from('products')
        .select('name, description, images, seo_title, seo_description, og_image')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (product) {
        const contentDesc = extractContentDescription(product.description);
        const description = product.seo_description || contentDesc || `${product.name} - Available at ${website.name}`;
        const image = normalizeImageUrl(product.og_image || product.images?.[0] || website.og_image);
        
        return {
          title: product.seo_title || `${product.name} | ${website.name}`,
          description,
          og_image: image,
          keywords: [],
          canonical: `https://${domain}${path}`,
          robots: 'index, follow',
          site_name: website.name,
          source: 'product_page'
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
        .select('id, name, seo_title, seo_description, og_image')
        .eq('slug', funnelSlug)
        .eq('is_active', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (funnel) {
        if (stepSlug) {
          // Funnel step
          const { data: step } = await supabase
            .from('funnel_steps')
            .select('name, seo_title, seo_description, og_image, content')
            .eq('funnel_id', funnel.id)
            .eq('slug', stepSlug)
            .eq('is_published', true)
            .maybeSingle();
          
          if (step) {
            const contentDesc = extractContentDescription(step.content);
            const description = step.seo_description || contentDesc || `${step.name} - ${funnel.name}`;
            const image = normalizeImageUrl(step.og_image || funnel.og_image);
            
            return {
              title: step.seo_title || `${step.name} | ${funnel.name}`,
              description,
              og_image: image,
              keywords: [],
              canonical: `https://${domain}${path}`,
              robots: 'index, follow',
              site_name: funnel.name,
              source: 'funnel_step'
            };
          }
        } else {
          // Funnel landing
          const description = funnel.seo_description || `Sales funnel: ${funnel.name}`;
          const image = normalizeImageUrl(funnel.og_image);
          
          return {
            title: funnel.seo_title || funnel.name,
            description,
            og_image: image,
            keywords: [],
            canonical: `https://${domain}${path}`,
            robots: 'index, follow',
            site_name: funnel.name,
            source: 'funnel_landing'
          };
        }
      }
    }
    
    // Website pages - try exact slug match first
    const { data: page } = await supabase
      .from('website_pages')
      .select(`
        id, title, slug,
        seo_title, seo_description, og_image, social_image_url,
        seo_keywords, canonical_url, meta_robots, content
      `)
      .eq('website_id', websiteId)
      .eq('slug', cleanPath)
      .eq('is_published', true)
      .maybeSingle();
    
    if (page) {
      const contentDesc = extractContentDescription(page.content);
      const description = page.seo_description || contentDesc || `${page.title} - ${website.name}`;
      const image = normalizeImageUrl(page.social_image_url || page.og_image || website.og_image);
      
      return {
        title: page.seo_title || page.title,
        description,
        og_image: image,
        keywords: page.seo_keywords || [],
        canonical: page.canonical_url || `https://${domain}${path}`,
        robots: page.meta_robots || 'index, follow',
        site_name: website.name,
        source: 'website_page'
      };
    }
    
    // Fallback to website SEO
    const image = normalizeImageUrl(website.og_image);
    return {
      title: website.name,
      description: website.seo_description || `Welcome to ${website.name}`,
      og_image: image,
      keywords: [],
      canonical: `https://${domain}${path}`,
      robots: 'index, follow',
      site_name: website.name,
      source: 'website_fallback'
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
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
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

export default async function handler(request: Request, context: any): Promise<Response | undefined> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const domain = url.hostname;
  const pathname = url.pathname;
  
  console.log(`🌐 Request: ${domain}${pathname} | UA: ${userAgent.substring(0, 50)}`);
  
  // Only handle social crawlers
  if (!isSocialCrawler(userAgent)) {
    console.log('👤 Human visitor - passing through to React app');
    return context.next();
  }
  
  console.log('🤖 Social crawler detected - generating SEO HTML');
  
  try {
    const seoData = await resolveSEOData(domain, pathname);
    
    if (!seoData) {
      console.log('❌ No SEO data found - passing through');
      return context.next();
    }
    
    console.log(`✅ SEO resolved via ${seoData.source}: ${seoData.title}`);
    
    const html = generateHTML(seoData, url.toString());
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-SEO-Source': seoData.source || 'unknown',
        'X-SEO-Website': seoData.site_name,
        'X-SEO-Page': seoData.title
      },
    });

  } catch (error) {
    console.error('💥 Handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const config = {
  path: "/*"
};
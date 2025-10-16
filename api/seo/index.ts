import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
  'facebookplatform', 'Facebot', 'FacebookBot', 'Googlebot', 'Bingbot',
  'bot', 'crawler', 'spider', 'baiduspider', 'yandex', 'duckduckbot',
  'slurp', 'ia_archiver', 'semrushbot', 'ahrefsbot', 'dotbot',
  'pinterestbot', 'applebot', 'yahoobot'
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

interface SEOData {
  title: string;
  description: string;
  og_image?: string;
  social_image_url?: string;
  keywords?: string[];
  canonical: string;
  robots: string;
  site_name: string;
  og_type: string;
  language_code?: string;
  author?: string;
  custom_meta_tags?: Record<string, string>;
}

// Extract meaningful description from page content
function extractContentDescription(content: any, maxLength: number = 155): string {
  if (!content) return '';
  
  try {
    let textContent = '';
    
    if (typeof content === 'string') {
      textContent = content;
    } else if (content.sections) {
      // Extract text from page builder sections
      content.sections.forEach((section: any) => {
        if (section.elements) {
          section.elements.forEach((element: any) => {
            if (element.content && typeof element.content === 'string') {
              textContent += element.content + ' ';
            }
          });
        }
      });
    }
    
    // Clean up HTML tags and extra whitespace
    textContent = textContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength).trim() + '...'
      : textContent;
  } catch (error) {
    return '';
  }
}

// Build canonical URL
function buildCanonical(path: string, domain: string): string {
  const protocol = 'https:';
  const cleanPath = path === '/' ? '' : path;
  return `${protocol}//${domain}${cleanPath}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Generate HTML with SEO meta tags
function generateHTML(seo: SEOData, url: string): string {
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const image = seo.social_image_url || seo.og_image || '';
  const canonical = seo.canonical;
  const siteName = escapeHtml(seo.site_name);
  const robots = seo.robots;
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.map(k => escapeHtml(k)).join(', ') : '';
  const languageCode = seo.language_code || 'en';
  const author = escapeHtml(seo.author || '');

  return `<!DOCTYPE html>
<html lang="${languageCode}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
  <meta name="robots" content="${robots}" />
  ${author ? `<meta name="author" content="${author}" />` : ''}
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${seo.og_type}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
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
  
  <!-- Custom Meta Tags -->
  ${seo.custom_meta_tags ? Object.entries(seo.custom_meta_tags).map(([name, content]) => 
    `<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`
  ).join('\n  ') : ''}
  
  <!-- Performance optimizations -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://fhqwacmokbtbspkxjixf.supabase.co" />
  
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
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

// Fetch SEO data for a custom domain and path
async function getSEODataForDomain(domain: string, path: string): Promise<SEOData | null> {
  try {
    // Get custom domain info
    const { data: customDomain } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', domain)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .maybeSingle();

    if (!customDomain) {
      return null;
    }

    // Get domain connections
    const { data: connections } = await supabase
      .from('domain_connections')
      .select('*')
      .eq('domain_id', customDomain.id)
      .order('is_homepage', { ascending: false });

    if (!connections || connections.length === 0) {
      return null;
    }

    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
    // Determine content type and ID based on path
    let contentType = 'website';
    let contentId = null;
    let pageSlug = null;

    // Check for homepage
    if (cleanPath === '' || cleanPath === '/') {
      const homepageConnection = connections.find(conn => conn.is_homepage);
      if (homepageConnection) {
        contentType = homepageConnection.content_type;
        contentId = homepageConnection.content_id;
      }
    } else {
      // Check for specific page routes
      if (cleanPath.startsWith('product/')) {
        // Product page - handled by WebsiteOverrideRoute
        const productSlug = cleanPath.replace('product/', '');
        const { data: product } = await supabase
          .from('products')
          .select('name, description, images, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, meta_author, language_code, custom_meta_tags')
          .eq('slug', productSlug)
          .eq('is_active', true)
          .maybeSingle();

        if (product) {
          const websiteConnection = connections.find(conn => conn.content_type === 'website');
          if (websiteConnection) {
            const { data: website } = await supabase
              .from('websites')
              .select('name, seo_title, seo_description, og_image, social_image_url, meta_robots, canonical_domain')
              .eq('id', websiteConnection.content_id)
              .maybeSingle();

            if (website) {
              const title = product.seo_title || `${product.name} - ${website.name}`;
              const description = product.seo_description || extractContentDescription(product.description);
              const image = product.social_image_url || product.og_image || product.images?.[0];
              const canonical = product.canonical_url || buildCanonical(path, website.canonical_domain || domain);

              return {
                title,
                description,
                og_image: product.og_image,
                social_image_url: product.social_image_url,
                keywords: product.seo_keywords,
                canonical,
                robots: product.meta_robots || website.meta_robots || 'index, follow',
                site_name: website.name,
                og_type: 'product',
                language_code: product.language_code,
                author: product.meta_author,
                custom_meta_tags: product.custom_meta_tags
              };
            }
          }
        }
      } else {
        // Regular page - check for website page override
        const pageConnection = connections.find(conn => 
          conn.content_type === 'website_page' && conn.page_slug === cleanPath
        );
        
        if (pageConnection) {
          contentType = 'website_page';
          contentId = pageConnection.content_id;
          pageSlug = pageConnection.page_slug;
        } else {
          // Check for website connection
          const websiteConnection = connections.find(conn => conn.content_type === 'website');
          if (websiteConnection) {
            contentType = 'website';
            contentId = websiteConnection.content_id;
            pageSlug = cleanPath;
          }
        }
      }
    }

    // Fetch content based on type
    if (contentType === 'website') {
      const { data: website } = await supabase
        .from('websites')
        .select('name, seo_title, seo_description, og_image, social_image_url, meta_robots, canonical_domain')
        .eq('id', contentId)
        .maybeSingle();

      if (website) {
        // If it's a specific page, try to get page data
        let pageData = null;
        if (pageSlug && pageSlug !== '') {
          const { data: page } = await supabase
            .from('website_pages')
            .select('title, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, meta_author, language_code, custom_meta_tags, content')
            .eq('website_id', contentId)
            .eq('slug', pageSlug)
            .eq('is_published', true)
            .maybeSingle();
          pageData = page;
        }

        const title = pageData?.seo_title || pageData?.title || website.seo_title || website.name;
        const description = pageData?.seo_description || website.seo_description || extractContentDescription(pageData?.content);
        const image = pageData?.social_image_url || pageData?.og_image || website.social_image_url || website.og_image;
        const canonical = pageData?.canonical_url || buildCanonical(path, website.canonical_domain || domain);

        return {
          title,
          description,
          og_image: pageData?.og_image || website.og_image,
          social_image_url: pageData?.social_image_url || website.social_image_url,
          keywords: pageData?.seo_keywords,
          canonical,
          robots: pageData?.meta_robots || website.meta_robots || 'index, follow',
          site_name: website.name,
          og_type: 'website',
          language_code: pageData?.language_code,
          author: pageData?.meta_author,
          custom_meta_tags: pageData?.custom_meta_tags
        };
      }
    } else if (contentType === 'website_page') {
      const { data: page } = await supabase
        .from('website_pages')
        .select('title, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, meta_author, language_code, custom_meta_tags, content, website_id')
        .eq('id', contentId)
        .eq('is_published', true)
        .maybeSingle();

      if (page) {
        const { data: website } = await supabase
          .from('websites')
          .select('name, seo_title, seo_description, og_image, social_image_url, meta_robots, canonical_domain')
          .eq('id', page.website_id)
          .maybeSingle();

        if (website) {
          const title = page.seo_title || `${page.title} - ${website.name}`;
          const description = page.seo_description || extractContentDescription(page.content);
          const image = page.social_image_url || page.og_image || website.social_image_url || website.og_image;
          const canonical = page.canonical_url || buildCanonical(path, website.canonical_domain || domain);

          return {
            title,
            description,
            og_image: page.og_image,
            social_image_url: page.social_image_url,
            keywords: page.seo_keywords,
            canonical,
            robots: page.meta_robots || website.meta_robots || 'index, follow',
            site_name: website.name,
            og_type: 'website',
            language_code: page.language_code,
            author: page.meta_author,
            custom_meta_tags: page.custom_meta_tags
          };
        }
      }
    } else if (contentType === 'funnel') {
      const { data: funnel } = await supabase
        .from('funnels')
        .select('name, seo_title, seo_description, og_image, social_image_url, meta_robots, canonical_domain')
        .eq('id', contentId)
        .maybeSingle();

      if (funnel) {
        // If it's a specific step, try to get step data
        let stepData = null;
        if (pageSlug && pageSlug !== '') {
          const { data: step } = await supabase
            .from('funnel_steps')
            .select('title, seo_title, seo_description, og_image, social_image_url, seo_keywords, canonical_url, meta_robots, meta_author, language_code, custom_meta_tags, content')
            .eq('funnel_id', contentId)
            .eq('slug', pageSlug)
            .eq('is_published', true)
            .maybeSingle();
          stepData = step;
        }

        const title = stepData?.seo_title || stepData?.title || funnel.seo_title || funnel.name;
        const description = stepData?.seo_description || funnel.seo_description || extractContentDescription(stepData?.content);
        const image = stepData?.social_image_url || stepData?.og_image || funnel.social_image_url || funnel.og_image;
        const canonical = stepData?.canonical_url || buildCanonical(path, funnel.canonical_domain || domain);

        return {
          title,
          description,
          og_image: stepData?.og_image || funnel.og_image,
          social_image_url: stepData?.social_image_url || funnel.social_image_url,
          keywords: stepData?.seo_keywords,
          canonical,
          robots: stepData?.meta_robots || funnel.meta_robots || 'index, follow',
          site_name: funnel.name,
          og_type: 'website',
          language_code: stepData?.language_code,
          author: stepData?.meta_author,
          custom_meta_tags: stepData?.custom_meta_tags
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Get domain from x-forwarded-host header (Vercel sets this)
  const domain = request.headers.get('x-forwarded-host') || url.hostname;
  const path = url.searchParams.get('path') || '/';
  
  // Debug logging
  console.log('SEO API called:', {
    domain,
    path,
    userAgent: userAgent.substring(0, 100),
    isCrawler: isSocialCrawler(userAgent)
  });
  
  // Only serve SEO HTML to crawlers
  if (!isSocialCrawler(userAgent)) {
    console.log('Not a crawler, redirecting to SPA');
    // Redirect regular users to the SPA
    return Response.redirect(url.toString(), 302);
  }

  try {
    console.log('Crawler detected, fetching SEO data for:', domain, path);
    
    // Fetch SEO data for this domain and path
    const seoData = await getSEODataForDomain(domain, path);
    
    if (!seoData) {
      console.log('No SEO data found for:', domain, path);
      // No SEO data found, serve default SPA
      return Response.redirect(url.toString(), 302);
    }

    console.log('SEO data found:', {
      title: seoData.title,
      description: seoData.description.substring(0, 50) + '...',
      site_name: seoData.site_name
    });

    // Generate HTML with SEO meta tags
    const html = generateHTML(seoData, url.toString());
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-SEO-Source': 'ssr',
        'X-Debug-Domain': domain,
        'X-Debug-Path': path
      },
    });
  } catch (error) {
    console.error('SEO SSR Error:', error);
    // Fallback to SPA on error
    return Response.redirect(url.toString(), 302);
  }
}

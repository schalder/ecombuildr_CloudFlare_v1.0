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

async function getSEOData(domain: string, path: string): Promise<SEOData | null> {
  try {
    console.log(`Fetching SEO data for domain: ${domain}, path: ${path}`);
    
    // Clean up path
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
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
    
    // For custom domains, find associated content by joining with custom_domains
    const { data: domainConnection } = await supabaseClient
      .from('domain_connections')
      .select(`
        content_type,
        content_id,
        websites (
          id,
          name,
          slug,
          settings
        ),
        funnels (
          id,
          name,
          slug,
          settings
        ),
        custom_domains!inner (
          domain
        )
      `)
      .eq('custom_domains.domain', domain)
      .eq('is_active', true)
      .single();
    
    if (!domainConnection) {
      console.log('No domain connection found');
      return null;
    }
    
    console.log('Domain connection found:', domainConnection.content_type);
    
    if (domainConnection.content_type === 'website' && domainConnection.websites) {
      const website = domainConnection.websites;
      
      // If root path, check if there's a homepage
      if (cleanPath === '') {
        const { data: homepage } = await supabaseClient
          .from('website_pages')
          .select(`
            id,
            title,
            slug,
            seo_title,
            seo_description,
            og_image,
            social_image_url,
            seo_keywords,
            canonical_url,
            meta_robots
          `)
          .eq('website_id', website.id)
          .eq('is_published', true)
          .eq('is_homepage', true)
          .single();
        
        if (homepage) {
          return {
            title: homepage.seo_title || homepage.title || website.name,
            description: homepage.seo_description || `Welcome to ${website.name}`,
            og_image: homepage.og_image || homepage.social_image_url,
            keywords: homepage.seo_keywords || [],
            canonical: homepage.canonical_url || `https://${domain}`,
            robots: homepage.meta_robots || 'index, follow',
            site_name: website.name
          };
        }
      } else {
        // Look for specific page
        const { data: page } = await supabaseClient
          .from('website_pages')
          .select(`
            id,
            title,
            slug,
            seo_title,
            seo_description,
            og_image,
            social_image_url,
            seo_keywords,
            canonical_url,
            meta_robots
          `)
          .eq('website_id', website.id)
          .eq('slug', cleanPath)
          .eq('is_published', true)
          .single();
        
        if (page) {
          return {
            title: page.seo_title || page.title,
            description: page.seo_description || `${page.title} - ${website.name}`,
            og_image: page.og_image || page.social_image_url,
            keywords: page.seo_keywords || [],
            canonical: page.canonical_url || `https://${domain}${path}`,
            robots: page.meta_robots || 'index, follow',
            site_name: website.name
          };
        }
      }
      
      // Fallback to website defaults
      return {
        title: website.name,
        description: `Welcome to ${website.name}`,
        canonical: `https://${domain}`,
        site_name: website.name
      };
    }
    
    if (domainConnection.content_type === 'funnel' && domainConnection.funnels) {
      const funnel = domainConnection.funnels;
      
      // Look for funnel step
      const { data: step } = await supabaseClient
        .from('funnel_steps')
        .select(`
          id,
          title,
          slug,
          seo_title,
          seo_description,
          og_image,
          social_image_url,
          seo_keywords,
          canonical_url,
          meta_robots,
          step_order
        `)
        .eq('funnel_id', funnel.id)
        .eq('slug', cleanPath || '')
        .eq('is_published', true)
        .single();
      
      if (step) {
        return {
          title: step.seo_title || step.title,
          description: step.seo_description || `${step.title} - ${funnel.name}`,
          og_image: step.og_image || step.social_image_url,
          keywords: step.seo_keywords || [],
          canonical: step.canonical_url || `https://${domain}${path}`,
          robots: step.meta_robots || 'index, follow',
          site_name: funnel.name
        };
      }
      
      // Fallback to funnel defaults
      return {
        title: funnel.name,
        description: `Welcome to ${funnel.name}`,
        canonical: `https://${domain}`,
        site_name: funnel.name
      };
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
  const domain = url.hostname;
  const pathname = url.pathname;
  
  console.log('Edge Function - URL:', pathname);
  console.log('Edge Function - Domain:', domain);
  console.log('Edge Function - User Agent:', userAgent);
  
  // Check if it's a social media crawler
  if (!isSocialCrawler(userAgent)) {
    console.log('Edge Function - Not a crawler, letting request pass through');
    // Don't return anything - let the request continue to normal handling
    return;
  }
  
  console.log('Edge Function - Social crawler detected, generating HTML');
  
  try {
    // Fetch SEO data
    const seoData = await getSEOData(domain, pathname);
    
    console.log('Edge Function - SEO data found:', !!seoData);
    
    // Generate HTML with meta tags (use fallback data if none found)
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
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
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
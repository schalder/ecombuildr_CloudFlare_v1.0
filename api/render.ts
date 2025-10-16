export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

// Bot user agents to detect
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'googlebot',
  'bingbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'bot',
  'crawler',
  'spider'
];

// Website system routes that should be handled by website renderer
const WEBSITE_SYSTEM_ROUTES = [
  'products',
  'product',
  'cart',
  'checkout',
  'collections',
  'collection',
  'categories',
  'category',
  'search',
  'about',
  'contact',
  'privacy',
  'terms',
  'shipping',
  'returns'
];

// General system routes
const SYSTEM_ROUTES = [
  'payment-processing',
  'order-confirmation'
];

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Check if request is from a bot
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

// Query Supabase
async function supabaseQuery(
  table: string,
  select: string,
  filters: Record<string, any>
): Promise<any> {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  
  Object.entries(filters).forEach(([key, value]) => {
    url += `&${key}=eq.${encodeURIComponent(value)}`;
  });

  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase query failed: ${response.status}`);
  }

  return response.json();
}

// Generate SEO HTML
function generateSEOHTML(data: {
  title: string;
  description: string;
  image: string;
  url: string;
  favicon?: string;
  keywords?: string[];
  canonical?: string;
}): string {
  const {
    title,
    description,
    image,
    url,
    favicon,
    keywords,
    canonical
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Basic SEO -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${keywords && keywords.length > 0 ? `<meta name="keywords" content="${escapeHtml(keywords.join(', '))}">` : ''}
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:site_name" content="EcomBuildr">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(url)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  
  <!-- Favicon -->
  ${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}">` : ''}
  
  <!-- Robots -->
  <meta name="robots" content="index, follow">
  
  <!-- Canonical -->
  <link rel="canonical" href="${escapeHtml(canonical || url)}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <noscript>
    <p>This is a preview for search engines and social media. Please enable JavaScript to view the full site.</p>
  </noscript>
</body>
</html>`;
}

// Main handler
export default async function handler(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Health check endpoint
  if (url.searchParams.has('health')) {
    return new Response(
      JSON.stringify({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        service: 'seo-render'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }

  // Check if this is a bot or test mode
  const forceMode = url.searchParams.has('force') || request.headers.get('x-seo-test') === '1';
  const isBotRequest = isBot(userAgent) || forceMode;

  console.log('SEO Render:', {
    hostname: url.hostname,
    pathname: url.pathname,
    userAgent,
    isBot: isBotRequest,
    forceMode
  });

  // If not a bot and not forced, this shouldn't happen with proper routing
  // Vercel should route regular users directly to index.html
  if (!isBotRequest) {
    console.log('Regular user reached edge function - redirecting to index');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/'
      }
    });
  }

  // Bot detected - generate SEO HTML
  console.log('Bot detected, generating SEO HTML');

  try {
    const hostname = url.hostname;
    const pathname = url.pathname;

    // Skip staging domains - serve SPA
    if (
      hostname === 'ecombuildr.com' ||
      hostname === 'localhost' ||
      hostname.includes('lovable.app') ||
      hostname.includes('lovableproject.com')
    ) {
      console.log('Staging domain detected - bots get SEO HTML');
      // Continue to generate SEO HTML for bots even on staging
    }

    // Query for custom domain
    const [domainData] = await supabaseQuery(
      'custom_domains',
      '*',
      {
        domain: hostname,
        is_verified: 'true',
        dns_configured: 'true'
      }
    );

    if (!domainData) {
      console.log('Domain not found or not verified:', hostname);
      return new Response('Domain not found', { status: 404 });
    }

    console.log('Domain found:', domainData.id);

    // Get domain connections
    const connections = await supabaseQuery(
      'domain_connections',
      '*',
      { domain_id: domainData.id }
    );

    if (!connections || connections.length === 0) {
      console.log('No connections found for domain');
      return new Response('No content configured', { status: 404 });
    }

    console.log('Connections found:', connections.length);

    // Route based on pathname (mirror DomainRouter.tsx logic)
    let selectedConnection = null;
    const pathSegments = pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    if (pathname === '/' || pathname === '') {
      // Root path - prioritize homepage, then website, then course, then funnel
      selectedConnection =
        connections.find((c: any) => c.is_homepage) ||
        connections.find((c: any) => c.content_type === 'website') ||
        connections.find((c: any) => c.content_type === 'course_area') ||
        connections.find((c: any) => c.content_type === 'funnel');
    } else if (pathname.startsWith('/courses') || pathname.startsWith('/members')) {
      // Course paths
      selectedConnection = connections.find((c: any) => c.content_type === 'course_area');
    } else if (WEBSITE_SYSTEM_ROUTES.includes(lastSegment)) {
      // Website system routes
      selectedConnection = connections.find((c: any) => c.content_type === 'website');
    } else if (SYSTEM_ROUTES.includes(lastSegment)) {
      // General system routes - prefer funnel if available
      selectedConnection =
        connections.find((c: any) => c.content_type === 'funnel') ||
        connections.find((c: any) => c.content_type === 'website');
    } else {
      // Check if it's a funnel step
      const funnelConnections = connections.filter((c: any) => c.content_type === 'funnel');
      
      for (const funnelConn of funnelConnections) {
        const [stepExists] = await supabaseQuery(
          'funnel_steps',
          'id',
          {
            funnel_id: funnelConn.content_id,
            slug: lastSegment,
            is_published: 'true'
          }
        );
        
        if (stepExists) {
          selectedConnection = funnelConn;
          break;
        }
      }
      
      // Default to website if no funnel step matches
      if (!selectedConnection) {
        selectedConnection = connections.find((c: any) => c.content_type === 'website');
      }
    }

    if (!selectedConnection) {
      console.log('No matching connection found');
      return new Response('Content not found', { status: 404 });
    }

    console.log('Selected connection:', selectedConnection.content_type, selectedConnection.content_id);

    // Fetch content based on type
    let seoData: any = {
      title: 'Welcome',
      description: 'Welcome to our site',
      image: 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
      url: url.toString(),
      favicon: null,
      keywords: []
    };

    if (selectedConnection.content_type === 'website') {
      // Fetch website data
      const [websiteData] = await supabaseQuery(
        'websites',
        'id,name,slug,description,seo_title,seo_description,og_image,seo_keywords,settings,store_id',
        {
          id: selectedConnection.content_id,
          is_published: 'true',
          is_active: 'true'
        }
      );

      if (websiteData) {
        // Fetch store data
        const [storeData] = await supabaseQuery(
          'stores',
          'id,name,description,favicon_url',
          { id: websiteData.store_id }
        );

        // Check if this is a specific page
        let pageData = null;
        if (lastSegment && !WEBSITE_SYSTEM_ROUTES.includes(lastSegment)) {
          const [page] = await supabaseQuery(
            'website_pages',
            'id,title,slug,seo_title,seo_description,og_image,seo_keywords',
            {
              website_id: websiteData.id,
              slug: lastSegment,
              is_published: 'true'
            }
          );
          pageData = page;
        }

        // Priority: page > website > store
        seoData = {
          title: pageData?.seo_title || pageData?.title || websiteData.seo_title || websiteData.name || storeData?.name || 'Welcome',
          description: pageData?.seo_description || websiteData.seo_description || websiteData.description || storeData?.description || 'Welcome to our site',
          image: pageData?.og_image || websiteData.og_image || 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
          url: url.toString(),
          favicon: websiteData.settings?.favicon_url || storeData?.favicon_url,
          keywords: pageData?.seo_keywords || websiteData.seo_keywords || []
        };
      }
    } else if (selectedConnection.content_type === 'funnel') {
      // Fetch funnel data
      const [funnelData] = await supabaseQuery(
        'funnels',
        'id,name,slug,description,seo_title,seo_description,og_image,seo_keywords,settings,store_id',
        {
          id: selectedConnection.content_id,
          is_published: 'true',
          is_active: 'true'
        }
      );

      if (funnelData) {
        // Fetch store data
        const [storeData] = await supabaseQuery(
          'stores',
          'id,name,description,favicon_url',
          { id: funnelData.store_id }
        );

        // Check if this is a specific step
        let stepData = null;
        if (lastSegment && !SYSTEM_ROUTES.includes(lastSegment)) {
          const [step] = await supabaseQuery(
            'funnel_steps',
            'id,title,slug,seo_title,seo_description,og_image,seo_keywords',
            {
              funnel_id: funnelData.id,
              slug: lastSegment,
              is_published: 'true'
            }
          );
          stepData = step;
        }

        // Priority: step > funnel > store
        seoData = {
          title: stepData?.seo_title || stepData?.title || funnelData.seo_title || funnelData.name || storeData?.name || 'Welcome',
          description: stepData?.seo_description || funnelData.seo_description || funnelData.description || storeData?.description || 'Welcome to our funnel',
          image: stepData?.og_image || funnelData.og_image || 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
          url: url.toString(),
          favicon: funnelData.settings?.favicon_url || storeData?.favicon_url,
          keywords: stepData?.seo_keywords || funnelData.seo_keywords || []
        };
      }
    }

    console.log('Generated SEO data:', {
      title: seoData.title,
      hasImage: !!seoData.image,
      hasFavicon: !!seoData.favicon
    });

    // Generate and return SEO HTML
    const html = generateSEOHTML(seoData);
    const htmlBytes = new TextEncoder().encode(html);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': htmlBytes.length.toString(),
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Connection': 'close',
        'X-Content-Type-Options': 'nosniff',
        'X-Facebook-Optimized': 'true',
        'Accept-Ranges': 'none',
        'X-SEO-Rendered': 'true',
        'X-Bot-Detected': isBotRequest ? 'true' : 'false',
        'X-Content-Type': selectedConnection.content_type
      }
    });

  } catch (error) {
    console.error('Error in SEO render:', error);
    
    // Return minimal HTML on error
    const html = generateSEOHTML({
      title: 'Welcome',
      description: 'Welcome to our site',
      image: 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg',
      url: request.url
    });
    const htmlBytes = new TextEncoder().encode(html);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': htmlBytes.length.toString(),
        'X-SEO-Error': 'true',
        'Accept-Ranges': 'none'
      }
    });
  }
}

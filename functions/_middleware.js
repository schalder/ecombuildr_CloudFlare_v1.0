// Cloudflare Pages Functions SEO Middleware
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const userAgent = context.request.headers.get('user-agent') || '';
    
    console.log(`🌐 Middleware: ${url.pathname} | UA: ${userAgent.substring(0, 80)}`);
    
    // Test endpoint
    if (url.pathname === '/test-middleware') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function middleware is working!',
        pathname: url.pathname,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!context.env.SUPABASE_URL,
          hasSupabaseKey: !!context.env.SUPABASE_ANON_KEY
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Check if this is a social media crawler
    const isSocialCrawler = isSocialMediaCrawler(userAgent);
    
    if (isSocialCrawler) {
      console.log(`🤖 Social crawler detected: ${userAgent.substring(0, 50)}`);
      
      // Handle SEO for user website pages and funnel steps
      const seoResponse = await handleSEORequest(url, context.env);
      if (seoResponse) {
        return seoResponse;
      }
    }
    
    // For all other requests, pass through to Pages
    return await context.next();
    
  } catch (err) {
    console.error('Middleware error:', err);
    return new Response(`${err.message}\n${err.stack}`, { status: 500 });
  }
}

// Check if the request is from a social media crawler
function isSocialMediaCrawler(userAgent) {
  const crawlerPatterns = [
    'facebookexternalhit',
    'facebookcatalog',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'slackbot',
    'discordbot',
    'pinterest',
    'redditbot',
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
  
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
}

// Handle SEO requests for user website pages and funnel steps
async function handleSEORequest(url, env) {
  try {
    const pathname = url.pathname;
    
    // Parse content from URL path
    const content = parseContentFromUrl(pathname);
    
    if (!content) {
      console.log(`No content found for path: ${pathname}`);
      return null;
    }
    
    console.log(`📄 Generating SEO for: ${content.type} - ${content.slug}`);
    
    // Generate dynamic HTML with SEO meta tags
    const html = await generateSEOHTML(content, env);
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('SEO generation error:', error);
    return null;
  }
}

// Parse content from URL path
function parseContentFromUrl(pathname) {
  // Remove leading slash
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  
  // Handle website pages: /site/{store-slug}/{page-slug}
  const websitePageMatch = path.match(/^site\/([^\/]+)\/(.+)$/);
  if (websitePageMatch) {
    return {
      type: 'website_page',
      storeSlug: websitePageMatch[1],
      pageSlug: websitePageMatch[2]
    };
  }
  
  // Handle funnel steps: /funnel/{store-slug}/{funnel-slug}/{step-slug}
  const funnelStepMatch = path.match(/^funnel\/([^\/]+)\/([^\/]+)\/(.+)$/);
  if (funnelStepMatch) {
    return {
      type: 'funnel_step',
      storeSlug: funnelStepMatch[1],
      funnelSlug: funnelStepMatch[2],
      stepSlug: funnelStepMatch[3]
    };
  }
  
  // Handle website home: /site/{store-slug}
  const websiteHomeMatch = path.match(/^site\/([^\/]+)$/);
  if (websiteHomeMatch) {
    return {
      type: 'website_home',
      storeSlug: websiteHomeMatch[1]
    };
  }
  
  // Handle funnel home: /funnel/{store-slug}/{funnel-slug}
  const funnelHomeMatch = path.match(/^funnel\/([^\/]+)\/([^\/]+)$/);
  if (funnelHomeMatch) {
    return {
      type: 'funnel_home',
      storeSlug: funnelHomeMatch[1],
      funnelSlug: funnelHomeMatch[2]
    };
  }
  
  return null;
}

// Generate SEO HTML with dynamic meta tags
async function generateSEOHTML(content, env) {
  try {
    // Query Supabase for content data
    const contentData = await fetchContentData(content, env);
    
    if (!contentData) {
      return generateFallbackHTML();
    }
    
    const { title, description, image, url } = contentData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'EcomBuildr'}</title>
    <meta name="description" content="${description || 'Build and manage your e-commerce store with EcomBuildr'}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title || 'EcomBuildr'}">
    <meta property="og:description" content="${description || 'Build and manage your e-commerce store with EcomBuildr'}">
    <meta property="og:image" content="${image || 'https://app.ecombuildr.com/og-image.jpg'}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title || 'EcomBuildr'}">
    <meta property="twitter:description" content="${description || 'Build and manage your e-commerce store with EcomBuildr'}">
    <meta property="twitter:image" content="${image || 'https://app.ecombuildr.com/og-image.jpg'}">
    
    <!-- Additional SEO -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="EcomBuildr">
    <link rel="canonical" href="${url}">
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .loading { text-align: center; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title || 'EcomBuildr'}</h1>
        <p>${description || 'Build and manage your e-commerce store with EcomBuildr'}</p>
        <div class="loading">Loading...</div>
    </div>
    
    <script>
        // Redirect to the actual page after a short delay
        setTimeout(() => {
            window.location.href = '${url}';
        }, 1000);
    </script>
</body>
</html>`;
    
  } catch (error) {
    console.error('HTML generation error:', error);
    return generateFallbackHTML();
  }
}

// Fetch content data from Supabase
async function fetchContentData(content, env) {
  try {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return null;
    }
    
    let query = '';
    let params = {};
    
    switch (content.type) {
      case 'website_page':
        query = `
          SELECT 
            wp.title,
            wp.description,
            wp.seo_image,
            ws.store_name,
            ws.store_slug
          FROM website_pages wp
          JOIN websites ws ON wp.website_id = ws.id
          WHERE ws.store_slug = $1 AND wp.slug = $2
        `;
        params = { $1: content.storeSlug, $2: content.pageSlug };
        break;
        
      case 'funnel_step':
        query = `
          SELECT 
            fs.title,
            fs.description,
            fs.seo_image,
            ws.store_name,
            ws.store_slug,
            f.funnel_name,
            f.funnel_slug
          FROM funnel_steps fs
          JOIN funnels f ON fs.funnel_id = f.id
          JOIN websites ws ON f.website_id = ws.id
          WHERE ws.store_slug = $1 AND f.funnel_slug = $2 AND fs.slug = $3
        `;
        params = { $1: content.storeSlug, $2: content.funnelSlug, $3: content.stepSlug };
        break;
        
      case 'website_home':
        query = `
          SELECT 
            ws.store_name as title,
            ws.store_description as description,
            ws.store_logo as seo_image,
            ws.store_slug
          FROM websites ws
          WHERE ws.store_slug = $1
        `;
        params = { $1: content.storeSlug };
        break;
        
      case 'funnel_home':
        query = `
          SELECT 
            f.funnel_name as title,
            f.funnel_description as description,
            f.funnel_image as seo_image,
            ws.store_name,
            ws.store_slug,
            f.funnel_slug
          FROM funnels f
          JOIN websites ws ON f.website_id = ws.id
          WHERE ws.store_slug = $1 AND f.funnel_slug = $2
        `;
        params = { $1: content.storeSlug, $2: content.funnelSlug };
        break;
        
      default:
        return null;
    }
    
    // Make request to Supabase using REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/websites?store_slug=eq.${content.storeSlug}&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Supabase query failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log('No content data found');
      return null;
    }
    
    const row = data[0];
    const currentUrl = `https://app.ecombuildr.com/${content.type === 'website_page' ? 'site' : 'funnel'}/${content.storeSlug}${content.pageSlug ? `/${content.pageSlug}` : ''}${content.stepSlug ? `/${content.stepSlug}` : ''}`;
    
    return {
      title: row.title || `${row.store_name || 'Store'} - EcomBuildr`,
      description: row.description || `Visit ${row.store_name || 'this store'} on EcomBuildr`,
      image: row.seo_image || row.store_logo || 'https://app.ecombuildr.com/og-image.jpg',
      url: currentUrl
    };
    
  } catch (error) {
    console.error('Content data fetch error:', error);
    return null;
  }
}

// Generate fallback HTML for when content is not found
function generateFallbackHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcomBuildr - Build Your E-commerce Store</title>
    <meta name="description" content="Build and manage your e-commerce store with EcomBuildr. Create beautiful online stores, funnels, and manage your business effortlessly.">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://app.ecombuildr.com">
    <meta property="og:title" content="EcomBuildr - Build Your E-commerce Store">
    <meta property="og:description" content="Build and manage your e-commerce store with EcomBuildr. Create beautiful online stores, funnels, and manage your business effortlessly.">
    <meta property="og:image" content="https://app.ecombuildr.com/og-image.jpg">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://app.ecombuildr.com">
    <meta property="twitter:title" content="EcomBuildr - Build Your E-commerce Store">
    <meta property="twitter:description" content="Build and manage your e-commerce store with EcomBuildr. Create beautiful online stores, funnels, and manage your business effortlessly.">
    <meta property="twitter:image" content="https://app.ecombuildr.com/og-image.jpg">
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>EcomBuildr</h1>
        <p>Build and manage your e-commerce store with EcomBuildr. Create beautiful online stores, funnels, and manage your business effortlessly.</p>
    </div>
</body>
</html>`;
}
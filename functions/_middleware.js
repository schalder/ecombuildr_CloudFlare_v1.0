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
    const hostname = url.hostname;
    
    // Parse content from URL path and hostname
    const content = await parseContentFromUrl(pathname, hostname, env);
    
    if (!content) {
      console.log(`No content found for path: ${pathname}`);
      return null;
    }
    
    console.log(`📄 Generating SEO for: ${content.type} - ${content.slug || content.pageSlug}`);
    
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

// Parse content from URL path and hostname
async function parseContentFromUrl(pathname, hostname, env) {
  // Check if it's a system domain (e.g., app.ecombuildr.com, ecombuildr.pages.dev)
  if (hostname.includes('ecombuildr.com') || hostname.includes('ecombuildr.pages.dev')) {
    // Existing logic for system domains
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
  } else {
    // Logic for custom domains
    console.log(`[Middleware] Custom domain detected: ${hostname}`);
    
    try {
      const supabaseUrl = env.SUPABASE_URL;
      const supabaseKey = env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[Middleware] Missing Supabase credentials');
        return null;
      }
      
      // Step 1: Find store_id associated with this custom domain
      const customDomainResponse = await fetch(`${supabaseUrl}/rest/v1/custom_domains?domain=eq.${encodeURIComponent(hostname)}&select=store_id`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!customDomainResponse.ok) {
        console.error('[Middleware] Custom domain query failed:', customDomainResponse.status);
        return null;
      }
      
      const customDomains = await customDomainResponse.json();
      
      if (!customDomains || customDomains.length === 0) {
        console.log(`[Middleware] Custom domain ${hostname} not found in database`);
        return null;
      }
      
      const storeId = customDomains[0].store_id;
      console.log(`[Middleware] Found storeId ${storeId} for custom domain ${hostname}`);
      
      // Step 2: Find the correct website for this store_id and page
      let storeSlug = null;
      
      // First, try to find a website that has the requested page
      const pageSlug = pathname.substring(1); // Remove leading slash
      const cleanPageSlug = !pageSlug || pageSlug === 'home-page' ? 'home-page' : pageSlug;
      
      console.log(`[Middleware] Looking for page '${cleanPageSlug}' in store ${storeId}`);
      
      const pageResponse = await fetch(`${supabaseUrl}/rest/v1/website_pages?slug=eq.${encodeURIComponent(cleanPageSlug)}&select=website_id,websites!inner(slug,store_id)`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (pageResponse.ok) {
        const pages = await pageResponse.json();
        const matchingPage = pages.find(page => page.websites.store_id === storeId);
        
        if (matchingPage) {
          storeSlug = matchingPage.websites.slug;
          console.log(`[Middleware] Found page '${cleanPageSlug}' in website '${storeSlug}'`);
        }
      }
      
      // If no specific page found, get the first website for this store
      if (!storeSlug) {
        console.log(`[Middleware] No specific page found, getting first website for store ${storeId}`);
        const websiteResponse = await fetch(`${supabaseUrl}/rest/v1/websites?store_id=eq.${storeId}&select=slug&limit=1`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!websiteResponse.ok) {
          console.error('[Middleware] Website query failed:', websiteResponse.status);
          return null;
        }
        
        const websites = await websiteResponse.json();
        
        if (!websites || websites.length === 0) {
          console.error('[Middleware] Website not found for storeId');
          return null;
        }
        
        storeSlug = websites[0].slug;
        console.log(`[Middleware] Using first website: ${storeSlug}`);
      }
      
      console.log(`[Middleware] Custom domain parsing: storeSlug=${storeSlug}, pageSlug=${cleanPageSlug}`);
      return { 
        type: 'website_page', 
        storeSlug, 
        pageSlug: cleanPageSlug,
        isCustomDomain: true,
        customDomainUrl: `https://${hostname}${pathname}`
      };
      
    } catch (error) {
      console.error('[Middleware] Custom domain parsing error:', error);
      return null;
    }
  }
}

// Generate SEO HTML with dynamic meta tags
async function generateSEOHTML(content, env) {
  try {
    // Query Supabase for content data
    const contentData = await fetchContentData(content, env);
    
    if (!contentData) {
      console.log('No content data found, using fallback');
      return generateFallbackHTML();
    }
    
    const { title, description, image, url, keywords, author, canonical, robots, customMetaTags, language } = contentData;
    
    return `<!DOCTYPE html>
<html lang="${language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'EcomBuildr'}</title>
    <meta name="description" content="${description || 'Build and manage your e-commerce store with EcomBuildr'}">
    ${keywords ? `<meta name="keywords" content="${keywords}">` : ''}
    ${author ? `<meta name="author" content="${author}">` : ''}
    ${robots ? `<meta name="robots" content="${robots}">` : '<meta name="robots" content="index, follow">'}
    ${canonical ? `<link rel="canonical" href="${canonical}">` : `<link rel="canonical" href="${url}">`}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title || 'EcomBuildr'}">
    <meta property="og:description" content="${description || 'Build and manage your e-commerce store with EcomBuildr'}">
    <meta property="og:image" content="${image || 'https://app.ecombuildr.com/og-image.jpg'}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="EcomBuildr">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title || 'EcomBuildr'}">
    <meta property="twitter:description" content="${description || 'Build and manage your e-commerce store with EcomBuildr'}">
    <meta property="twitter:image" content="${image || 'https://app.ecombuildr.com/og-image.jpg'}">
    
    <!-- Custom Meta Tags -->
    ${customMetaTags || ''}
    
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

// Fetch content data from Supabase using correct SEO columns
async function fetchContentData(content, env) {
  try {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return null;
    }
    
    console.log(`🔍 Fetching SEO data for:`, content);
    
    let seoData = null;
    
    switch (content.type) {
      case 'website_page':
        // First get the website to find the website_id
        console.log(`🔍 Step 1: Getting website for slug: ${content.storeSlug}`);
        const websiteResponse = await fetch(`${supabaseUrl}/rest/v1/websites?slug=eq.${encodeURIComponent(content.storeSlug)}&select=id,name,slug`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`🔍 Website query status: ${websiteResponse.status}`);
        
        if (!websiteResponse.ok) {
          const errorText = await websiteResponse.text();
          console.error('Website query failed:', websiteResponse.status, errorText);
          return null;
        }
        
        const websites = await websiteResponse.json();
        console.log(`🔍 Found ${websites.length} websites`);
        
        if (!websites || websites.length === 0) {
          console.log('Website not found');
          return null;
        }
        
        const website = websites[0];
        console.log('✅ Found website:', { id: website.id, name: website.name });
        
        // Now get the website page with SEO data
        console.log(`🔍 Step 2: Getting page for website_id: ${website.id}, slug: ${content.pageSlug}`);
        const pageResponse = await fetch(`${supabaseUrl}/rest/v1/website_pages?website_id=eq.${website.id}&slug=eq.${encodeURIComponent(content.pageSlug)}&select=seo_title,seo_description,seo_keywords,meta_author,canonical_url,custom_meta_tags,social_image_url,language_code,meta_robots`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`🔍 Page query status: ${pageResponse.status}`);
        
        if (!pageResponse.ok) {
          const errorText = await pageResponse.text();
          console.error('Page query failed:', pageResponse.status, errorText);
          return null;
        }
        
        const pages = await pageResponse.json();
        console.log(`🔍 Found ${pages.length} pages`);
        
        if (!pages || pages.length === 0) {
          console.log('Page not found');
          return null;
        }
        
        const page = pages[0];
        console.log('✅ Found page:', { title: page.seo_title, description: page.seo_description });
        
        seoData = {
          title: page.seo_title || `${website.name} - EcomBuildr`,
          description: page.seo_description || `Visit ${website.name} on EcomBuildr`,
          image: page.social_image_url || 'https://app.ecombuildr.com/og-image.jpg',
          url: content.customDomainUrl || `https://app.ecombuildr.com/site/${content.storeSlug}/${content.pageSlug}`,
          keywords: page.seo_keywords,
          author: page.meta_author,
          canonical: page.canonical_url,
          robots: page.meta_robots,
          customMetaTags: page.custom_meta_tags,
          language: page.language_code
        };
        break;
        
      case 'funnel_step':
        // Similar logic for funnel steps
        console.log(`🔍 Getting funnel step data for: ${content.storeSlug}/${content.funnelSlug}/${content.stepSlug}`);
        
        // First get the website
        const websiteResponse2 = await fetch(`${supabaseUrl}/rest/v1/websites?slug=eq.${encodeURIComponent(content.storeSlug)}&select=id,name,slug`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!websiteResponse2.ok) {
          const errorText = await websiteResponse2.text();
          console.error('Website query failed:', websiteResponse2.status, errorText);
          return null;
        }
        
        const websites2 = await websiteResponse2.json();
        if (!websites2 || websites2.length === 0) {
          console.log('Website not found');
          return null;
        }
        
        const website2 = websites2[0];
        
        // Get the funnel
        const funnelResponse = await fetch(`${supabaseUrl}/rest/v1/funnels?website_id=eq.${website2.id}&slug=eq.${encodeURIComponent(content.funnelSlug)}&select=id,name,slug`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!funnelResponse.ok) {
          const errorText = await funnelResponse.text();
          console.error('Funnel query failed:', funnelResponse.status, errorText);
          return null;
        }
        
        const funnels = await funnelResponse.json();
        if (!funnels || funnels.length === 0) {
          console.log('Funnel not found');
          return null;
        }
        
        const funnel = funnels[0];
        
        // Get the funnel step with SEO data
        const stepResponse = await fetch(`${supabaseUrl}/rest/v1/funnel_steps?funnel_id=eq.${funnel.id}&slug=eq.${encodeURIComponent(content.stepSlug)}&select=seo_title,seo_description,og_image,custom_scripts,seo_keywords,meta_author,canonical_url,custom_meta_tags,social_image_url,language_code,meta_robots`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!stepResponse.ok) {
          const errorText = await stepResponse.text();
          console.error('Step query failed:', stepResponse.status, errorText);
          return null;
        }
        
        const steps = await stepResponse.json();
        if (!steps || steps.length === 0) {
          console.log('Step not found');
          return null;
        }
        
        const step = steps[0];
        
        seoData = {
          title: step.seo_title || `${funnel.name} - ${website2.name}`,
          description: step.seo_description || `Visit ${funnel.name} on ${website2.name}`,
          image: step.social_image_url || step.og_image || 'https://app.ecombuildr.com/og-image.jpg',
          url: `https://app.ecombuildr.com/funnel/${content.storeSlug}/${content.funnelSlug}/${content.stepSlug}`,
          keywords: step.seo_keywords,
          author: step.meta_author,
          canonical: step.canonical_url,
          robots: step.meta_robots,
          customMetaTags: step.custom_meta_tags,
          language: step.language_code
        };
        break;
        
      case 'website_home':
        // Get website basic info
        const websiteResponse3 = await fetch(`${supabaseUrl}/rest/v1/websites?slug=eq.${encodeURIComponent(content.storeSlug)}&select=name,description`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!websiteResponse3.ok) {
          const errorText = await websiteResponse3.text();
          console.error('Website query failed:', websiteResponse3.status, errorText);
          return null;
        }
        
        const websites3 = await websiteResponse3.json();
        if (!websites3 || websites3.length === 0) {
          console.log('Website not found');
          return null;
        }
        
        const website3 = websites3[0];
        
        // For custom domains, we need to get the actual home page from website_pages
        if (content.isCustomDomain) {
          console.log(`🔍 Getting home page for website_id: ${website3.id}`);
          const homePageResponse = await fetch(`${supabaseUrl}/rest/v1/website_pages?website_id=eq.${website3.id}&is_homepage=eq.true&select=seo_title,seo_description,seo_keywords,meta_author,canonical_url,custom_meta_tags,social_image_url,language_code,meta_robots`, {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (homePageResponse.ok) {
            const homePages = await homePageResponse.json();
            if (homePages && homePages.length > 0) {
              const homePage = homePages[0];
              seoData = {
                title: homePage.seo_title || website3.name || 'EcomBuildr',
                description: homePage.seo_description || website3.description || 'Build and manage your e-commerce store with EcomBuildr',
                image: homePage.social_image_url || 'https://app.ecombuildr.com/og-image.jpg',
                url: content.customDomainUrl || `https://app.ecombuildr.com/site/${content.storeSlug}`,
                keywords: homePage.seo_keywords,
                author: homePage.meta_author,
                canonical: homePage.canonical_url,
                robots: homePage.meta_robots,
                customMetaTags: homePage.custom_meta_tags,
                language: homePage.language_code
              };
              break;
            }
          }
        }
        
        seoData = {
          title: website3.name || 'EcomBuildr',
          description: website3.description || 'Build and manage your e-commerce store with EcomBuildr',
          image: 'https://app.ecombuildr.com/og-image.jpg',
          url: content.customDomainUrl || `https://app.ecombuildr.com/site/${content.storeSlug}`,
          keywords: null,
          author: null,
          canonical: null,
          robots: 'index, follow',
          customMetaTags: null,
          language: 'en'
        };
        break;
        
      case 'funnel_home':
        // Get funnel basic info
        const websiteResponse4 = await fetch(`${supabaseUrl}/rest/v1/websites?slug=eq.${encodeURIComponent(content.storeSlug)}&select=id,name`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!websiteResponse4.ok) {
          const errorText = await websiteResponse4.text();
          console.error('Website query failed:', websiteResponse4.status, errorText);
          return null;
        }
        
        const websites4 = await websiteResponse4.json();
        if (!websites4 || websites4.length === 0) {
          console.log('Website not found');
          return null;
        }
        
        const website4 = websites4[0];
        
        const funnelResponse2 = await fetch(`${supabaseUrl}/rest/v1/funnels?website_id=eq.${website4.id}&slug=eq.${encodeURIComponent(content.funnelSlug)}&select=name,description`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!funnelResponse2.ok) {
          const errorText = await funnelResponse2.text();
          console.error('Funnel query failed:', funnelResponse2.status, errorText);
          return null;
        }
        
        const funnels2 = await funnelResponse2.json();
        if (!funnels2 || funnels2.length === 0) {
          console.log('Funnel not found');
          return null;
        }
        
        const funnel2 = funnels2[0];
        
        seoData = {
          title: funnel2.name || 'EcomBuildr',
          description: funnel2.description || 'Build and manage your e-commerce store with EcomBuildr',
          image: 'https://app.ecombuildr.com/og-image.jpg',
          url: `https://app.ecombuildr.com/funnel/${content.storeSlug}/${content.funnelSlug}`,
          keywords: null,
          author: null,
          canonical: null,
          robots: 'index, follow',
          customMetaTags: null,
          language: 'en'
        };
        break;
        
      default:
        return null;
    }
    
    console.log('📊 SEO Data found:', seoData);
    return seoData;
    
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
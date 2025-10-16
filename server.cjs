const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase configuration
const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Bot detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'discordbot',
  'telegrambot', 'slackbot', 'skypeuripreview', 'facebookcatalog', 
  'facebookplatform', 'facebot', 'facebookbot', 'googlebot', 'bingbot',
  'bot', 'crawler', 'spider', 'baiduspider', 'yandex', 'duckduckbot',
  'slurp', 'ia_archiver', 'semrushbot', 'ahrefsbot', 'dotbot',
  'pinterestbot', 'applebot', 'yahoobot'
];

function isSocialCrawler(userAgent) {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

// HTML escaping
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Get SEO data from Supabase
async function getSEOData(hostname, pathname) {
  try {
    console.log(`🔍 Getting SEO data for ${hostname}${pathname}`);
    
    // Parse URL pattern
    const cleanPath = pathname === '/' ? '' : pathname.replace(/^\/+|\/+$/g, '');
    
    // Check if it's a custom domain
    const apexDomain = hostname.replace(/^www\./, '');
    const domainVariants = [hostname, apexDomain, `www.${apexDomain}`];
    
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
    
    // Get domain connections
    const { data: allConnections } = await supabase
      .from('domain_connections')
      .select('id, content_type, content_id, path, is_homepage')
      .eq('domain_id', customDomain.id)
      .order('is_homepage', { ascending: false });
    
    if (!allConnections || allConnections.length === 0) {
      console.log('⚠️ No domain connections found');
      return null;
    }
    
    console.log(`✅ Found ${allConnections.length} domain connections`);
    
    // Smart routing logic
    let selectedConnection = null;
    
    if (cleanPath === '') {
      // Root path - prioritize: explicit homepage > website > course_area > funnel
      selectedConnection = 
        allConnections.find(c => c.is_homepage) ||
        allConnections.find(c => c.content_type === 'website') ||
        allConnections.find(c => c.content_type === 'course_area') ||
        allConnections.find(c => c.content_type === 'funnel') ||
        null;
      
      console.log(`🏠 Root path - selected connection: ${selectedConnection?.content_type}`);
    } else {
      // Non-root paths - find by path
      selectedConnection = allConnections.find(c => c.path === cleanPath) || null;
      console.log(`🛤️ Non-root path - selected connection: ${selectedConnection?.content_type}`);
    }
    
    if (!selectedConnection) {
      console.log('❌ No matching connection found');
      return null;
    }
    
    // Get content based on type
    if (selectedConnection.content_type === 'website') {
      const { data: website } = await supabase
        .from('websites')
        .select(`
          id, name, description, seo_title, seo_description, og_image, social_image_url,
          seo_keywords, canonical_url, meta_robots, meta_author, language_code, custom_meta_tags
        `)
        .eq('id', selectedConnection.content_id)
        .single();
      
      if (website) {
        return {
          title: website.seo_title || website.name,
          description: website.seo_description || website.description,
          image: website.social_image_url || website.og_image,
          keywords: website.seo_keywords || [],
          canonical: website.canonical_url || `https://${hostname}${pathname}`,
          robots: website.meta_robots || 'index, follow',
          author: website.meta_author || website.name,
          languageCode: website.language_code || 'en',
          customMetaTags: website.custom_meta_tags || [],
          siteName: website.name,
          source: 'website'
        };
      }
    } else if (selectedConnection.content_type === 'funnel') {
      const { data: funnel } = await supabase
        .from('funnels')
        .select(`
          id, name, description, seo_title, seo_description, og_image, social_image_url,
          seo_keywords, canonical_url, meta_robots, meta_author, language_code, custom_meta_tags
        `)
        .eq('id', selectedConnection.content_id)
        .single();
      
      if (funnel) {
        return {
          title: funnel.seo_title || funnel.name,
          description: funnel.seo_description || funnel.description,
          image: funnel.social_image_url || funnel.og_image,
          keywords: funnel.seo_keywords || [],
          canonical: funnel.canonical_url || `https://${hostname}${pathname}`,
          robots: funnel.meta_robots || 'index, follow',
          author: funnel.meta_author || funnel.name,
          languageCode: funnel.language_code || 'en',
          customMetaTags: funnel.custom_meta_tags || [],
          siteName: funnel.name,
          source: 'funnel'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('💥 Error getting SEO data:', error);
    return null;
  }
}

// Generate HTML with SEO meta tags
function generateHTML(seoData, url) {
  const title = escapeHtml(seoData.title);
  const description = escapeHtml(seoData.description);
  const image = seoData.image || '';
  const canonical = seoData.canonical;
  const siteName = escapeHtml(seoData.siteName);
  const robots = seoData.robots;
  const keywords = Array.isArray(seoData.keywords) ? seoData.keywords.map(k => escapeHtml(k)).join(', ') : '';
  const languageCode = seoData.languageCode || 'en';
  const author = escapeHtml(seoData.author);

  return `<!DOCTYPE html>
<html lang="${languageCode}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
  <meta name="robots" content="${robots}" />
  <meta name="author" content="${author}" />
  
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
  
  <!-- Performance optimizations -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://fhqwacmokbtbspkxjixf.supabase.co" />
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
  
  <!-- Critical resource hints -->
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
  <link rel="preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
  
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
  
  <!-- Font Awesome for icon lists -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;
}

// Main route handler - catch all routes
app.use(async (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const hostname = req.get('Host') || req.hostname;
  const pathname = req.path;
  
  console.log(`🌐 Request: ${hostname}${pathname} | UA: ${userAgent.substring(0, 80)}`);
  
  // Check if it's a social crawler
  const isBot = isSocialCrawler(userAgent);
  console.log(`🤖 Is Social Crawler: ${isBot}`);
  
  if (isBot) {
    console.log('🤖 Social crawler detected - generating SEO HTML');
    
    try {
      const seoData = await getSEOData(hostname, pathname);
      
      if (seoData) {
        console.log(`✅ SEO data found: ${seoData.title}`);
        const html = generateHTML(seoData, `https://${hostname}${pathname}`);
        
        res.set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-SEO-Source': seoData.source,
          'X-SEO-Title': seoData.title
        });
        
        return res.send(html);
      } else {
        console.log('❌ No SEO data found - serving default HTML');
      }
    } catch (error) {
      console.error('💥 Error generating SEO HTML:', error);
    }
  } else {
    console.log('👤 Regular user - serving SPA');
  }
  
  // Serve the regular React app for non-crawlers or when SEO data is not available
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    res.send(html);
  } else {
    res.status(404).send('Build the React app first: npm run build');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Test with: curl -H "User-Agent: facebookexternalhit/1.1" http://localhost:${PORT}/`);
});

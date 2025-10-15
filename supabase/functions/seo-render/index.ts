// Supabase Edge Function for SEO rendering
// Handles bot traffic and generates SEO-optimized HTML

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bot detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot', 'WhatsApp',
  'Slackbot', 'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'Googlebot',
  'Bingbot', 'bot', 'crawler', 'spider', 'BingPreview', 'facebookcatalog'
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

// Extract description from content
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
    
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return '';
    
    let result = sentences[0].trim();
    let currentLength = result.length;
    
    for (let i = 1; i < sentences.length && currentLength < maxLength - 20; i++) {
      const nextSentence = sentences[i].trim();
      if (currentLength + nextSentence.length + 2 <= maxLength) {
        result += '. ' + nextSentence;
        currentLength = result.length;
      } else {
        break;
      }
    }
    
    if (!result.match(/[.!?]$/)) {
      result += '.';
    }
    
    return result.length > maxLength ? result.substring(0, maxLength - 3) + '...' : result;
  } catch (error) {
    console.warn('Error extracting content description:', error);
    return '';
  }
}

// Normalize image URLs
function normalizeImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl || typeof imageUrl !== 'string') return undefined;
  
  const trimmed = imageUrl.trim();
  if (!trimmed) return undefined;
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  return undefined;
}

// Parse URL pattern
function parseUrlPattern(hostname: string, pathname: string) {
  const funnelMatch = pathname.match(/^\/funnel\/([^\/]+)(?:\/([^\/]+))?$/);
  if (funnelMatch) {
    return {
      type: 'funnel_route',
      identifier: funnelMatch[1],
      pagePath: pathname,
      funnelIdentifier: funnelMatch[1],
      stepSlug: funnelMatch[2]
    };
  }
  
  if (!hostname.includes('lovable.app')) {
    return { type: 'custom_domain', identifier: hostname, pagePath: pathname };
  }
  
  const subdomainMatch = hostname.match(/^([^.]+)\.lovable\.app$/);
  if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'app') {
    return { type: 'lovable_subdomain', identifier: subdomainMatch[1], pagePath: pathname };
  }
  
  const storeMatch = pathname.match(/^\/store\/([^\/]+)(\/.*)?$/);
  if (storeMatch) {
    return { type: 'store_slug', identifier: storeMatch[1], pagePath: storeMatch[2] || '/' };
  }
  
  const siteMatch = pathname.match(/^\/site\/([^\/]+)(\/.*)?$/);
  if (siteMatch) {
    return { type: 'site_slug', identifier: siteMatch[1], pagePath: siteMatch[2] || '/' };
  }
  
  return { type: 'custom_domain', identifier: hostname, pagePath: pathname };
}

// Main SEO data resolution
async function resolveSEOData(hostname: string, pathname: string) {
  try {
    const urlPattern = parseUrlPattern(hostname, pathname);
    console.log(`🔍 [SEO] Resolving: ${urlPattern.type} | ${urlPattern.identifier}${urlPattern.pagePath}`);
    
    const path = urlPattern.pagePath;
    const cleanPath = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
    
    let websiteId: string | null = null;
    let storeId: string | null = null;
    
    // Custom domain routing
    if (urlPattern.type === 'custom_domain') {
      const apexDomain = urlPattern.identifier.replace(/^www\./, '');
      const domainVariants = [urlPattern.identifier, apexDomain, `www.${apexDomain}`];
      
      const { data: customDomain } = await supabase
        .from('custom_domains')
        .select('id, domain, store_id')
        .in('domain', domainVariants)
        .eq('is_verified', true)
        .eq('dns_configured', true)
        .maybeSingle();
      
      if (!customDomain) {
        console.log('❌ [SEO] No custom domain found');
        return null;
      }
      
      console.log(`✅ [SEO] Found custom domain: ${customDomain.domain} -> store ${customDomain.store_id}`);
      storeId = customDomain.store_id;
      
      const { data: allConnections } = await supabase
        .from('domain_connections')
        .select('id, content_type, content_id, path, is_homepage')
        .eq('domain_id', customDomain.id)
        .order('is_homepage', { ascending: false });
      
      if (!allConnections || allConnections.length === 0) {
        console.log('⚠️ [SEO] No domain connections found');
        return null;
      }
      
      console.log(`✅ [SEO] Found ${allConnections.length} connections`);
      
      let selectedConnection: any = null;
      
      if (cleanPath === '') {
        selectedConnection = 
          allConnections.find(c => c.is_homepage) ||
          allConnections.find(c => c.content_type === 'website') ||
          allConnections.find(c => c.content_type === 'course_area') ||
          allConnections.find(c => c.content_type === 'funnel') ||
          null;
        
        console.log(`🏠 [SEO] Root path -> ${selectedConnection?.content_type}`);
      } else {
        const pathSegments = cleanPath.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        if (cleanPath.startsWith('courses') || cleanPath.startsWith('members')) {
          selectedConnection = allConnections.find(c => c.content_type === 'course_area') || null;
          console.log(`📚 [SEO] Course path: ${cleanPath}`);
        } else {
          const websiteSystemRoutes = ['product', 'collection', 'search'];
          const generalSystemRoutes = ['payment-processing', 'order-confirmation', 'cart', 'checkout'];
          
          if (websiteSystemRoutes.some(r => cleanPath.includes(r))) {
            selectedConnection = allConnections.find(c => c.content_type === 'website') || null;
            console.log(`🌐 [SEO] Website system route: ${lastSegment}`);
          } else if (generalSystemRoutes.includes(lastSegment)) {
            selectedConnection = allConnections.find(c => c.content_type === 'funnel') || 
                                 allConnections.find(c => c.content_type === 'website') || null;
            console.log(`⚙️ [SEO] System route: ${lastSegment}`);
          } else {
            const funnelConnections = allConnections.filter(c => c.content_type === 'funnel');
            
            for (const funnelConn of funnelConnections) {
              const { data: stepExists } = await supabase
                .from('funnel_steps')
                .select('id')
                .eq('funnel_id', funnelConn.content_id)
                .eq('slug', lastSegment)
                .eq('is_published', true)
                .maybeSingle();
              
              if (stepExists) {
                selectedConnection = funnelConn;
                console.log(`🎯 [SEO] Funnel step: ${lastSegment}`);
                break;
              }
            }
            
            if (!selectedConnection) {
              selectedConnection = allConnections.find(c => c.content_type === 'website') || null;
              console.log(`📄 [SEO] Default to website: ${cleanPath}`);
            }
          }
        }
      }
      
      if (!selectedConnection) {
        console.log('❌ [SEO] No connection selected');
        return null;
      }
      
      if (selectedConnection.content_type === 'website') {
        websiteId = selectedConnection.content_id;
        console.log(`✅ [SEO] Routing to website: ${websiteId}`);
      } else if (selectedConnection.content_type === 'funnel') {
        console.log(`✅ [SEO] Funnel content detected (not implemented in this function yet)`);
        return null;
      } else if (selectedConnection.content_type === 'course_area') {
        console.log(`✅ [SEO] Course area detected`);
        return {
          title: 'Courses',
          description: 'Browse our course offerings',
          og_image: undefined,
          canonical: `https://${hostname}${path}`,
          robots: 'index, follow',
          site_name: 'Courses'
        };
      }
      
    } else if (urlPattern.type === 'lovable_subdomain') {
      const { data: website } = await supabase
        .from('websites')
        .select('id, store_id')
        .eq('slug', urlPattern.identifier)
        .eq('is_published', true)
        .maybeSingle();
      
      if (website) {
        websiteId = website.id;
        storeId = website.store_id;
        console.log(`✅ [SEO] Lovable subdomain website: ${websiteId}`);
      }
    }
    
    if (!websiteId) {
      console.log('❌ [SEO] No website resolved');
      return null;
    }
    
    // Get website data
    const { data: website } = await supabase
      .from('websites')
      .select('id, name, description, settings')
      .eq('id', websiteId)
      .maybeSingle();
    
    if (!website) {
      console.log('❌ [SEO] Website not found');
      return null;
    }
    
    const ws: any = website.settings || {};
    const websiteSeoTitle: string | undefined = ws.seo?.title;
    const websiteSeoDescription: string = ws.seo?.description || website.description || `Welcome to ${website.name}`;
    const websiteImage = normalizeImageUrl(
      ws.seo?.og_image || ws.seo?.social_image_url || ws.branding?.social_image_url || ws.branding?.logo || ws.favicon
    );
    
    // Root path - homepage
    if (!cleanPath) {
      const { data: homepagePage } = await supabase
        .from('website_pages')
        .select('id, title, seo_title, seo_description, og_image, content')
        .eq('website_id', websiteId)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (homepagePage) {
        const pageTitle = homepagePage.seo_title || homepagePage.title || website.name;
        const pageDescription = homepagePage.seo_description || 
                               extractContentDescription(homepagePage.content) || 
                               websiteSeoDescription;
        const pageImage = normalizeImageUrl(homepagePage.og_image) || websiteImage;
        
        console.log(`✅ [SEO] Homepage page: ${pageTitle}`);
        
        return {
          title: pageTitle,
          description: pageDescription,
          og_image: pageImage,
          canonical: `https://${hostname}${path}`,
          robots: 'index, follow',
          site_name: website.name
        };
      }
      
      // Fallback to website-level SEO
      console.log(`✅ [SEO] Website-level SEO: ${website.name}`);
      return {
        title: websiteSeoTitle || website.name,
        description: websiteSeoDescription,
        og_image: websiteImage,
        canonical: `https://${hostname}${path}`,
        robots: 'index, follow',
        site_name: website.name
      };
    }
    
    // Page routing
    const pageSlug = cleanPath.split('/').filter(Boolean).pop() || '';
    const { data: page } = await supabase
      .from('website_pages')
      .select('id, title, seo_title, seo_description, og_image, content')
      .eq('website_id', websiteId)
      .eq('slug', pageSlug)
      .eq('is_published', true)
      .maybeSingle();
    
    if (page) {
      const pageTitle = page.seo_title || page.title || website.name;
      const pageDescription = page.seo_description || 
                             extractContentDescription(page.content) || 
                             websiteSeoDescription;
      const pageImage = normalizeImageUrl(page.og_image) || websiteImage;
      
      console.log(`✅ [SEO] Page found: ${pageTitle}`);
      
      return {
        title: pageTitle,
        description: pageDescription,
        og_image: pageImage,
        canonical: `https://${hostname}${path}`,
        robots: 'index, follow',
        site_name: website.name
      };
    }
    
    // Fallback to website-level
    console.log(`⚠️ [SEO] No page found, using website-level SEO`);
    return {
      title: websiteSeoTitle || website.name,
      description: websiteSeoDescription,
      og_image: websiteImage,
      canonical: `https://${hostname}${path}`,
      robots: 'index, follow',
      site_name: website.name
    };
    
  } catch (error) {
    console.error('❌ [SEO] Error resolving SEO data:', error);
    return null;
  }
}

// Generate HTML
function generateHTML(seoData: any, url: string): string {
  const ogImage = seoData.og_image || '';
  const keywords = seoData.keywords?.join(', ') || '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoData.title}</title>
  <meta name="description" content="${seoData.description}">
  ${keywords ? `<meta name="keywords" content="${keywords}">` : ''}
  <meta name="robots" content="${seoData.robots || 'index, follow'}">
  <link rel="canonical" href="${seoData.canonical || url}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${seoData.title}">
  <meta property="og:description" content="${seoData.description}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  <meta property="og:site_name" content="${seoData.site_name}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${seoData.title}">
  <meta name="twitter:description" content="${seoData.description}">
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
</head>
<body>
  <h1>${seoData.title}</h1>
  <p>${seoData.description}</p>
</body>
</html>`;
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    const forceMode = url.searchParams.get('force') === '1';
    const healthCheck = url.searchParams.get('health') === '1';
    const path = url.searchParams.get('path') || '/';
    const hostname = url.searchParams.get('hostname') || req.headers.get('host') || 'localhost';
    
    // Health check
    if (healthCheck) {
      console.log('🏥 [SEO] Health check');
      return new Response(
        JSON.stringify({ ok: true, timestamp: Date.now(), service: 'seo-render' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const isBot = isSocialCrawler(userAgent) || forceMode;
    
    console.log(`📥 [SEO] Request: ${hostname}${path} | Bot: ${isBot} | UA: ${userAgent.substring(0, 60)}`);
    
    if (!isBot) {
      console.log('👤 [SEO] Regular user - return empty (will serve SPA)');
      return new Response(
        JSON.stringify({ bot: false, message: 'Not a bot - serve SPA' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Bot detected - generate SEO HTML
    const seoData = await resolveSEOData(hostname, path);
    
    if (!seoData) {
      console.log('❌ [SEO] No SEO data found');
      return new Response(
        '<!DOCTYPE html><html><head><title>Page Not Found</title></head><body><h1>404 - Page Not Found</h1></body></html>',
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }
    
    const html = generateHTML(seoData, `https://${hostname}${path}`);
    
    console.log(`✅ [SEO] Generated HTML for: ${seoData.title}`);
    
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-SEO-Handler': 'supabase-edge',
        'X-SEO-Title': seoData.title
      }
    });
    
  } catch (error) {
    console.error('❌ [SEO] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

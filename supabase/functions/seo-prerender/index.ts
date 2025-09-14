import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers - allow all origins for custom domains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const url = new URL(req.url)
  
  // Get domain and path from query parameters
  let domain = url.searchParams.get('domain') || req.headers.get('x-forwarded-host') || req.headers.get('host') || 'ecombuildr.com'
  let path = url.searchParams.get('path') || url.pathname || '/'
  const forceBotParam = url.searchParams.get('force_bot')
  const format = url.searchParams.get('format')
  
  // Clean up domain and path
  if (domain === ':host' || domain.includes('supabase.co') || domain.includes('edge-runtime')) {
    domain = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'ecombuildr.com'
  }
  
  // Handle __bot prefix
  if (path.startsWith('/__bot/')) {
    path = '/' + path.substring(7)
  }
  
  // Normalize path
  if (path !== '/') {
    path = '/' + decodeURIComponent(path).replace(/^\/+|\/+$/g, '')
  }
  
  const userAgent = req.headers.get('user-agent') || ''
  const isBot = forceBotParam === '1' || isLikelyBot(userAgent)
  
  console.log('🔍 SEO request:', { domain, path, isBot, userAgent: userAgent.substring(0, 50) })

  // Handle JSON format requests
  if (format === 'json') {
    try {
      const seoData = await getSEODataAsJSON(supabase, domain, path)
      return new Response(JSON.stringify({ success: true, seo: seoData }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      })
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to generate SEO data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  // For human browsers, redirect to SPA
  if (!isBot) {
    const redirectUrl = `${req.headers.get('x-forwarded-proto') || 'https'}://${domain}${path}`
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
        'Cache-Control': 'no-cache'
      }
    })
  }

  try {
    // Get HTML snapshot from database
    const htmlSnapshot = await getHTMLSnapshot(supabase, domain, path)
    if (htmlSnapshot) {
      console.log('✅ Serving HTML snapshot')
      return new Response(htmlSnapshot, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
          'Vary': 'User-Agent'
        }
      })
    }

    // Generate fallback HTML from database
    const fallbackHTML = await generateFallbackHTML(supabase, domain, path)
    if (fallbackHTML) {
      console.log('✅ Serving generated HTML')
      return new Response(fallbackHTML, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=60',
          'Vary': 'User-Agent'
        }
      })
    }

    // Final fallback
    return new Response(getMinimalHTML(domain, path), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=UTF-8',
        'Vary': 'User-Agent'
      }
    })

  } catch (error) {
    console.error('❌ SEO Error:', error)
    return new Response(getMinimalHTML(domain, path), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=UTF-8'
      }
    })
  }
})

// Get HTML snapshot from database
async function getHTMLSnapshot(supabase: any, domain: string, path: string): Promise<string | null> {
  try {
    // For custom domains
    if (domain !== 'ecombuildr.com') {
      const { data: domainData } = await supabase
        .from('custom_domains')
        .select(`
          domain_connections(content_type, content_id),
          html_snapshots!inner(html_content)
        `)
        .eq('domain', domain)
        .eq('is_verified', true)
        .order('html_snapshots.generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (domainData?.html_snapshots?.[0]?.html_content) {
        return domainData.html_snapshots[0].html_content
      }
    }

    // For ecombuildr.com routes
    const websiteMatch = path.match(/^\/site\/([^\/]+)(?:\/([^\/]+))?$/)
    if (websiteMatch) {
      const [, websiteSlug, pageSlug] = websiteMatch
      
      const { data: snapshot } = await supabase
        .from('html_snapshots')
        .select('html_content')
        .eq('content_type', 'website_page')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (snapshot?.html_content) {
        return snapshot.html_content
      }
    }

    return null
  } catch (error) {
    console.error('Error getting HTML snapshot:', error)
    return null
  }
}

// Generate fallback HTML from database
async function generateFallbackHTML(supabase: any, domain: string, path: string): Promise<string | null> {
  try {
    let pageData = null

    // Handle custom domains
    if (domain !== 'ecombuildr.com') {
      const { data: domainData } = await supabase
        .from('custom_domains')
        .select(`
          domain_connections!inner(content_type, content_id),
          websites!inner(id, name, store_id)
        `)
        .eq('domain', domain)
        .eq('is_verified', true)
        .maybeSingle()

      if (domainData?.domain_connections?.[0]?.content_type === 'website') {
        const websiteId = domainData.domain_connections[0].content_id
        
        let pageQuery = supabase
          .from('website_pages')
          .select('title, seo_title, seo_description, og_image, seo_keywords')
          .eq('website_id', websiteId)
          .eq('is_published', true)

        if (path === '/' || path === '') {
          pageQuery = pageQuery.eq('is_homepage', true)
        } else {
          const slug = path.startsWith('/') ? path.substring(1) : path
          pageQuery = pageQuery.eq('slug', slug)
        }

        const { data } = await pageQuery.maybeSingle()
        if (data) {
          pageData = {
            ...data,
            siteName: domainData.websites.name
          }
        }
      }
    } else {
      // Handle ecombuildr.com /site/ routes
      const siteMatch = path.match(/^\/site\/([^\/]+)(?:\/([^\/]+))?$/)
      if (siteMatch) {
        const [, websiteSlug, pageSlug] = siteMatch
        
        const { data: websiteData } = await supabase
          .from('websites')
          .select('id, name')
          .eq('slug', websiteSlug)
          .eq('is_active', true)
          .eq('is_published', true)
          .maybeSingle()

        if (websiteData) {
          let pageQuery = supabase
            .from('website_pages')
            .select('title, seo_title, seo_description, og_image, seo_keywords')
            .eq('website_id', websiteData.id)
            .eq('is_published', true)

          if (!pageSlug) {
            pageQuery = pageQuery.eq('is_homepage', true)
          } else {
            pageQuery = pageQuery.eq('slug', pageSlug)
          }

          const { data } = await pageQuery.maybeSingle()
          if (data) {
            pageData = {
              ...data,
              siteName: websiteData.name
            }
          }
        }
      }
    }

    if (pageData) {
      const title = pageData.seo_title || pageData.title || 'Page'
      const description = pageData.seo_description || `Visit ${pageData.siteName}`
      const siteName = pageData.siteName || 'Website'
      const ogImage = pageData.og_image || '/default-og-image.jpg'
      const canonicalUrl = `https://${domain}${path}`

      return generateCompleteHTML({
        title,
        description,
        siteName,
        ogImage,
        canonicalUrl,
        keywords: pageData.seo_keywords || [],
        domain,
        path
      })
    }

    return null
  } catch (error) {
    console.error('Error generating fallback HTML:', error)
    return null
  }
}

// Generate complete HTML document
function generateCompleteHTML(params: {
  title: string
  description: string
  siteName: string
  ogImage: string
  canonicalUrl: string
  keywords: string[]
  domain: string
  path: string
}): string {
  const { title, description, siteName, ogImage, canonicalUrl, keywords } = params
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${keywords.map(escapeHtml).join(', ')}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; }
    .loading { color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="loading">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Loading page content...</p>
    </div>
  </div>
  <script>
    // Redirect to SPA for browsers
    if (!navigator.userAgent.includes('bot') && !navigator.userAgent.includes('crawler')) {
      setTimeout(() => window.location.reload(), 1000);
    }
  </script>
</body>
</html>`
}

// Get minimal HTML fallback
function getMinimalHTML(domain: string, path: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <meta name="description" content="Page is loading">
  <meta name="robots" content="noindex">
</head>
<body>
  <div style="font-family: system-ui; text-align: center; padding: 50px;">
    <h1>Loading...</h1>
    <p>Please wait while the page loads.</p>
  </div>
  <script>
    setTimeout(() => window.location.reload(), 2000);
  </script>
</body>
</html>`
}

// Get SEO data as JSON
async function getSEODataAsJSON(supabase: any, domain: string, path: string) {
  // Simplified JSON response for dynamic SEO
  return {
    title: 'Page Title',
    description: 'Page description',
    og_image: '/default-og-image.jpg',
    canonical: `https://${domain}${path}`,
    robots: 'index, follow',
    keywords: [],
    author: '',
    language: 'en'
  }
}

// Check if user agent is a bot
function isLikelyBot(userAgent: string): boolean {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'crawling', 'googlebot', 'bingbot',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
    'discordbot', 'slackbot', 'telegrambot', 'facebot'
  ]
  
  const ua = userAgent.toLowerCase()
  return botPatterns.some(pattern => ua.includes(pattern))
}

// Escape HTML characters
function escapeHtml(text: string): string {
  const div = new Text(text)
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
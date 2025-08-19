import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
  
  // Check if JSON format is requested
  const format = url.searchParams.get('format')
  const isJsonRequest = format === 'json'
  
  // Get domain and path from query parameters first (Netlify prerendering), then fall back to headers/pathname
  let domainParam = url.searchParams.get('domain') 
  let pathParam = url.searchParams.get('path')
  
  // Handle Netlify's :host placeholder issue - log if it happens
  if (domainParam === ':host' || domainParam === '' || !domainParam) {
    console.log('⚠️ Received empty/placeholder domain param:', domainParam, '- using headers as fallback')
    domainParam = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'ecombuildr.com'
    console.log('🔧 Resolved domain from headers:', domainParam)
  }
  
  // Normalize path: decode URI, ensure leading slash, remove trailing slash (except for root)
  let path = pathParam || url.pathname || '/'
  if (path !== '/') {
    path = '/' + decodeURIComponent(path).replace(/^\/+|\/+$/g, '')
  }
  
  const domain = domainParam
  const userAgent = req.headers.get('user-agent') || ''
  
  console.log('🔍 SEO Prerender request:', { 
    path, 
    domain,
    format,
    isJsonRequest,
    originalDomainParam: url.searchParams.get('domain'), 
    'x-forwarded-host': req.headers.get('x-forwarded-host'),
    'host': req.headers.get('host'),
    userAgent 
  })

  // Handle JSON format requests (for dynamic SEO loading)
  if (isJsonRequest) {
    try {
      const seoData = await getSEODataAsJSON(supabase, domain, path)
      console.log('📋 Returning SEO JSON data:', seoData)
      return new Response(JSON.stringify({
        success: true,
        seo: seoData
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
        },
      })
    } catch (error) {
      console.error('❌ Error generating SEO JSON:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to generate SEO data'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
  }

  // Detect if request is from a human browser vs bot
  const isBot = isLikelyBot(userAgent)
  console.log('🤖 Bot detection:', { isBot, userAgent: userAgent.substring(0, 100) })
  
  // If human browser, redirect to SPA with no_prerender param
  if (!isBot) {
    const redirectUrl = new URL(req.url)
    redirectUrl.pathname = path
    redirectUrl.searchParams.set('no_prerender', '1')
    redirectUrl.searchParams.delete('domain')
    redirectUrl.searchParams.delete('path')
    
    console.log('👤 Redirecting human to SPA:', redirectUrl.toString())
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString()
      }
    })
  }

  try {
    // First try to get HTML snapshot from database
    const htmlSnapshot = await getHTMLSnapshot(supabase, domain, path)
    if (htmlSnapshot) {
      console.log('✅ Serving HTML snapshot from database')
      return new Response(htmlSnapshot, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
        },
      })
    }

    // NO FALLBACK - If no snapshot exists, something is wrong
    console.log('❌ No HTML snapshot found - page needs to be published!')
    
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Not Published</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; text-align: center; }
    .error { color: #dc2626; font-size: 18px; margin-bottom: 20px; }
    .instruction { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error">⚠️ This page hasn't been published yet</div>
    <div class="instruction">
      Please go to your page builder and click <strong>"Save & Publish"</strong> to generate this page.
    </div>
  </div>
</body>
</html>`, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=UTF-8',
      },
    })
    
  } catch (error) {
    console.error('SEO Prerender error:', error)
    return generateFallbackHTML(domain, path)
  }
})

// Get HTML snapshot from database
async function getHTMLSnapshot(supabase: any, domain: string, path: string): Promise<string | null> {
  try {
    // Handle custom domains first
    if (domain !== 'ecombuildr.com' && !domain.includes('lovable.app')) {
      console.log('🌐 Custom domain detected:', domain, 'path:', path)
      
      // Look up custom domain mapping to get content_id and content_type
      // Try both verified and unverified domains to handle DNS propagation delays
      const { data: customDomainData, error: domainError } = await supabase
        .from('custom_domains')
        .select(`
          *,
          domain_connections(
            content_type,
            content_id,
            path
          )
        `)
        .eq('domain', domain)
        .maybeSingle()
      
      if (domainError) {
        console.error('❌ Error fetching custom domain:', domainError)
        return null
      }
      
      if (!customDomainData?.domain_connections?.length) {
        console.log('❌ No domain connections found for:', domain)
        // Fallback: Try to find any published website page with this slug
        return await getWebsitePageFallback(supabase, path, domain)
      }
      
      const connection = customDomainData.domain_connections[0]
      console.log('✅ Found connection:', connection)
      
      if (connection.content_type === 'website') {
        return await getWebsitePageSnapshot(supabase, connection.content_id, path === '/' ? '' : path.substring(1), domain)
      } else if (connection.content_type === 'funnel') {
        return await getFunnelStepSnapshot(supabase, connection.content_id, path === '/' ? '' : path.substring(1), domain)
      }
    } else {
      // Handle ecombuildr.com domain routes
      console.log('🏠 EcomBuildr domain detected:', domain, 'path:', path)
      
      // Parse website routes: /w/:websiteSlug/:pageSlug?
      const websiteMatch = path.match(/^\/w\/([^\/]+)(?:\/([^\/]+))?$/)
      if (websiteMatch) {
        const [, websiteSlug, pageSlug] = websiteMatch
        const websiteId = await resolveWebsiteSlug(supabase, websiteSlug)
        if (websiteId) {
          return await getWebsitePageSnapshot(supabase, websiteId, pageSlug || '', null)
        }
      }
      
      // Parse funnel routes: /f/:funnelSlug/:stepSlug?
      const funnelMatch = path.match(/^\/f\/([^\/]+)(?:\/([^\/]+))?$/)
      if (funnelMatch) {
        const [, funnelSlug, stepSlug] = funnelMatch
        const funnelId = await resolveFunnelSlug(supabase, funnelSlug)
        if (funnelId) {
          return await getFunnelStepSnapshot(supabase, funnelId, stepSlug || '', null)
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting HTML snapshot:', error)
    return null
  }
}

// Get website page HTML snapshot
async function getWebsitePageSnapshot(supabase: any, websiteId: string, pageSlug: string, customDomain: string | null): Promise<string | null> {
  try {
    console.log(`🔍 Looking for website page: websiteId=${websiteId}, pageSlug="${pageSlug}", customDomain=${customDomain}`)
    
    // First get the page ID
    let pageQuery = supabase
      .from('website_pages')
      .select('id, slug, is_homepage, title')
      .eq('website_id', websiteId)
      .eq('is_published', true)
    
    if (pageSlug && pageSlug !== '') {
      // Looking for specific page by slug
      pageQuery = pageQuery.eq('slug', pageSlug)
    } else {
      // Looking for homepage
      pageQuery = pageQuery.eq('is_homepage', true)
    }
    
    const { data: page, error: pageError } = await pageQuery.maybeSingle()
    console.log('📄 Page query result:', { page, pageError })
    
    if (pageError) {
      console.error('❌ Page query error:', pageError)
      return await getContentSnapshot(supabase, websiteId, 'website', customDomain)
    }
    
    if (page) {
      // Look for page-specific snapshot first
      console.log(`🎯 Found page: ${page.title} (${page.slug}), looking for snapshot...`)
      const pageSnapshot = await getContentSnapshot(supabase, page.id, 'website_page', customDomain)
      if (pageSnapshot) {
        console.log('✅ Found page-specific snapshot')
        return pageSnapshot
      }
    }
    
    // Fallback to website-level snapshot
    console.log('🔄 Falling back to website-level snapshot')
    return await getContentSnapshot(supabase, websiteId, 'website', customDomain)
    
  } catch (error) {
    console.error('💥 Error getting website page snapshot:', error)
    return null
  }
}

// Get funnel step HTML snapshot
async function getFunnelStepSnapshot(supabase: any, funnelId: string, stepSlug: string, customDomain: string | null): Promise<string | null> {
  try {
    // First get the step ID
    let stepQuery = supabase
      .from('funnel_steps')
      .select('id')
      .eq('funnel_id', funnelId)
      .eq('is_published', true)
    
    if (stepSlug) {
      stepQuery = stepQuery.eq('slug', stepSlug)
    } else {
      stepQuery = stepQuery.order('step_order', { ascending: true }).limit(1)
    }
    
    const { data: step, error: stepError } = await stepQuery.maybeSingle()
    
    if (stepError || !step) {
      console.error('Step not found:', stepError)
      // Try funnel-level snapshot
      return await getContentSnapshot(supabase, funnelId, 'funnel', customDomain)
    }
    
    // Look for step-specific snapshot first
    const stepSnapshot = await getContentSnapshot(supabase, step.id, 'funnel_step', customDomain)
    if (stepSnapshot) {
      return stepSnapshot
    }
    
    // Fallback to funnel-level snapshot
    return await getContentSnapshot(supabase, funnelId, 'funnel', customDomain)
    
  } catch (error) {
    console.error('Error getting funnel step snapshot:', error)
    return null
  }
}

// Get content snapshot by ID and type
async function getContentSnapshot(supabase: any, contentId: string, contentType: string, customDomain: string | null): Promise<string | null> {
  try {
    // First try to get domain-specific snapshot
    if (customDomain) {
      let query = supabase
        .from('html_snapshots')
        .select('html_content')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('custom_domain', customDomain)
        .order('generated_at', { ascending: false })
        .limit(1)
      
      const { data: domainSnapshot } = await query.maybeSingle()
      
      if (domainSnapshot?.html_content) {
        console.log(`✅ Found domain-specific snapshot for ${contentType}:${contentId}`)
        return domainSnapshot.html_content
      }
    }
    
    // Fallback to null domain snapshot
    let fallbackQuery = supabase
      .from('html_snapshots')
      .select('html_content')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .is('custom_domain', null)
      .order('generated_at', { ascending: false })
      .limit(1)
    
    const { data: fallbackSnapshot } = await fallbackQuery.maybeSingle()
    
    if (fallbackSnapshot?.html_content) {
      console.log(`✅ Found fallback snapshot for ${contentType}:${contentId}`)
      return fallbackSnapshot.html_content
    }
    
    console.log(`❌ No snapshot found for ${contentType}:${contentId}`)
    return null
    
  } catch (error) {
    console.error('Error getting content snapshot:', error)
    return null
  }
}

// Helper function to resolve website slug to ID
async function resolveWebsiteSlug(supabase: any, websiteSlug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('websites')
    .select('id')
    .eq('slug', websiteSlug)
    .eq('is_active', true)
    .maybeSingle()
  
  if (error || !data) {
    console.error('Error resolving website slug:', error)
    return null
  }
  
  return data.id
}

// Helper function to resolve funnel slug to ID
async function resolveFunnelSlug(supabase: any, funnelSlug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('funnels')
    .select('id')
    .eq('slug', funnelSlug)
    .eq('is_active', true)
    .maybeSingle()
  
  if (error || !data) {
    console.error('Error resolving funnel slug:', error)
    return null
  }
  
  return data.id
}

// Generate SEO content for a website page
async function generateWebsitePageSEO(supabase: any, websiteId: string, pageSlug: string, domain: string): Promise<string> {
  try {
    // Fetch website data
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('name, slug, description')
      .eq('id', websiteId)
      .eq('is_active', true)
      .single()
    
    if (websiteError || !website) {
      console.error('Website not found:', websiteError)
      return getDefaultSEO()
    }
    
    // Fetch page data - use homepage if no slug provided
    let pageQuery = supabase
      .from('website_pages')
      .select('*')
      .eq('website_id', websiteId)
      .eq('is_published', true)
    
    if (pageSlug) {
      pageQuery = pageQuery.eq('slug', pageSlug)
    } else {
      pageQuery = pageQuery.eq('is_homepage', true)
    }
    
    const { data: page, error: pageError } = await pageQuery.maybeSingle()
    
    if (pageError || !page) {
      console.error('Page not found:', pageError)
      return getDefaultSEO()
    }
    
    // Build SEO metadata using only page-level data
    const title = page.seo_title || `${page.title} - ${website.name}`
    const description = page.seo_description || undefined
    const image = page.og_image || undefined
    const canonicalUrl = page.canonical_url || (domain === 'ecombuildr.com' || domain.includes('lovable.app')
      ? `https://ecombuildr.com/w/${website.slug}${pageSlug ? `/${pageSlug}` : ''}` 
      : `https://${domain}${pageSlug ? `/${pageSlug}` : ''}`)
    const robots = page.meta_robots || 'index, follow'
    const keywords = Array.isArray(page.seo_keywords) ? page.seo_keywords.join(', ') : ''
    const author = page.meta_author || undefined
    const languageCode = page.language_code || 'en'
    
    return generateSEOTags({
      title,
      description,
      image,
      canonicalUrl,
      robots,
      siteName: website.name,
      ogType: 'website',
      keywords,
      author,
      languageCode,
      customMetaTags: page.custom_meta_tags,
      customScripts: page.custom_scripts
    })
  } catch (error) {
    console.error('Error generating website page SEO:', error)
    return getDefaultSEO()
  }
}

// Generate SEO content for a funnel step
async function generateFunnelStepSEO(supabase: any, funnelId: string, stepSlug: string, domain: string): Promise<string> {
  try {
    // Fetch funnel data
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('name, slug, description')
      .eq('id', funnelId)
      .eq('is_active', true)
      .single()
    
    if (funnelError || !funnel) {
      console.error('Funnel not found:', funnelError)
      return getDefaultSEO()
    }
    
    // Fetch step data - use first step if no slug provided
    let stepQuery = supabase
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', funnelId)
      .eq('is_published', true)
    
    if (stepSlug) {
      stepQuery = stepQuery.eq('slug', stepSlug)
    } else {
      stepQuery = stepQuery.order('step_order', { ascending: true }).limit(1)
    }
    
    const { data: step, error: stepError } = await stepQuery.maybeSingle()
    
    if (stepError || !step) {
      console.error('Step not found:', stepError)
      return getDefaultSEO()
    }
    
    // Build SEO metadata using only step-level data
    const title = step.seo_title || `${step.title} - ${funnel.name}`
    const description = step.seo_description || undefined
    const image = step.social_image_url || step.og_image || undefined
    const canonicalUrl = step.canonical_url || (domain === 'ecombuildr.com' || domain.includes('lovable.app')
      ? `https://ecombuildr.com/f/${funnel.slug}${stepSlug ? `/${stepSlug}` : ''}` 
      : `https://${domain}${stepSlug ? `/${stepSlug}` : ''}`)
    const robots = step.meta_robots || 'index, follow'
    const keywords = Array.isArray(step.seo_keywords) ? step.seo_keywords.join(', ') : ''
    const author = step.meta_author || undefined
    const languageCode = step.language_code || 'en'
    
    return generateSEOTags({
      title,
      description,
      image,
      canonicalUrl,
      robots,
      siteName: funnel.name,
      ogType: 'website',
      keywords,
      author,
      languageCode,
      customMetaTags: step.custom_meta_tags,
      customScripts: step.custom_scripts
    })
  } catch (error) {
    console.error('Error generating funnel step SEO:', error)
    return getDefaultSEO()
  }
}

// Generate marketing page SEO for the main site
function getMarketingSEO(): string {
  return generateSEOTags({
    title: 'EcomBuildr - Build High-Converting Funnels & Websites',
    description: 'Create stunning e-commerce funnels and websites with our powerful drag-and-drop page builder. Start selling online in minutes.',
    image: 'https://ecombuildr.com/og-image.png',
    canonicalUrl: 'https://ecombuildr.com',
    robots: 'index, follow',
    siteName: 'EcomBuildr',
    ogType: 'website'
  })
}

// Generate default SEO content
function getDefaultSEO(): string {
  return generateSEOTags({
    title: 'EcomBuildr - Build High-Converting Funnels & Websites',
    description: 'Create stunning e-commerce funnels and websites with our powerful drag-and-drop page builder.',
    canonicalUrl: 'https://ecombuildr.com',
    robots: 'index, follow',
    siteName: 'EcomBuildr',
    ogType: 'website'
  })
}

// Generate fallback HTML response
function generateFallbackHTML(domain?: string, path?: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Not Generated - EcomBuildr</title>
  <meta name="description" content="This page has not been generated yet. Please publish the page first." />
  <meta name="robots" content="noindex, nofollow" />
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #e11d48; margin-bottom: 20px; font-size: 24px;">⚠️ Page Not Generated</h1>
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      This page hasn't been generated yet. To fix this:
    </p>
    <ol style="color: #666; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
      <li>Go to your page builder</li>
      <li>Make sure your content is designed</li>
      <li>Set up SEO information in page settings</li>
      <li><strong>Save and Publish</strong> the page</li>
      <li>Wait a few moments for generation to complete</li>
    </ol>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #0ea5e9;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>Note:</strong> Each time you publish, a static HTML version is generated with your SEO settings. This ensures fast loading and proper search engine indexing.
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
      Domain: ${domain || 'unknown'} | Path: ${path || 'unknown'}
    </p>
  </div>
</body>
</html>`
  
  return new Response(html, {
    status: 200, // Return 200 instead of 404 to avoid redirect loops
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html'
    }
  })
}

// Helper function to generate SEO meta tags
function generateSEOTags(seo: {
  title?: string
  description?: string
  image?: string
  canonicalUrl?: string
  robots?: string
  siteName?: string
  ogType?: string
  keywords?: string
  author?: string
  languageCode?: string
  customMetaTags?: any
  customScripts?: string
}): string {
  const {
    title = 'EcomBuildr',
    description,
    image,
    canonicalUrl,
    robots = 'index, follow',
    siteName = 'EcomBuildr',
    ogType = 'website',
    keywords,
    author,
    languageCode = 'en',
    customMetaTags,
    customScripts
  } = seo

  let seoTags = `
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  ${description ? `<meta name="description" content="${description}" />` : ''}
  ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
  ${author ? `<meta name="author" content="${author}" />` : ''}
  <meta name="robots" content="${robots}" />
  ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}" />` : ''}
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${title}" />
  ${description ? `<meta property="og:description" content="${description}" />` : ''}
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
  ${canonicalUrl ? `<meta property="og:url" content="${canonicalUrl}" />` : ''}
  <meta property="og:site_name" content="${siteName}" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content="${title}" />
  ${description ? `<meta property="twitter:description" content="${description}" />` : ''}
  ${image ? `<meta property="twitter:image" content="${image}" />` : ''}
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "${siteName}",
    "url": "${canonicalUrl || 'https://ecombuildr.com'}",
    ${image ? `"logo": "${image}",` : ''}
    "description": "${description || 'Build high-converting funnels and websites'}"
  }
  </script>`
  
  // Add custom meta tags if provided
  if (customMetaTags && typeof customMetaTags === 'object') {
    for (const [name, content] of Object.entries(customMetaTags)) {
      if (content) {
        seoTags += `\n  <meta name="${name}" content="${content}" />`
      }
    }
  }
  
  // Add custom scripts if provided
  if (customScripts) {
    seoTags += `\n  ${customScripts}`
  }
  
  return seoTags
}

// Bot detection function
function isLikelyBot(userAgent: string): boolean {
  if (!userAgent) return true // Assume bot if no user agent
  
  const botPatterns = [
    // Search engines
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    // Social media crawlers
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
    // SEO tools
    'screaming frog', 'ahrefs', 'semrush', 'moz',
    // Other bots
    'bot', 'crawler', 'spider', 'scraper'
  ]
  
  const lowercaseUA = userAgent.toLowerCase()
  return botPatterns.some(pattern => lowercaseUA.includes(pattern))
}

// Get SEO data as JSON for dynamic loading
async function getSEODataAsJSON(supabase: any, domain: string, path: string): Promise<any> {
  try {
    // Handle custom domains first
    if (domain !== 'ecombuildr.com' && !domain.includes('lovable.app')) {
      console.log('🌐 Custom domain SEO JSON request:', domain, 'path:', path)
      
      // Look up custom domain mapping to get content_id and content_type
      const { data: customDomainData, error: domainError } = await supabase
        .from('custom_domains')
        .select(`
          *,
          domain_connections(
            content_type,
            content_id,
            path
          )
        `)
        .eq('domain', domain)
        .maybeSingle()
      
      if (domainError || !customDomainData?.domain_connections?.length) {
        console.log('❌ No domain connections found for:', domain)
        return getDefaultSEOData()
      }
      
      const connection = customDomainData.domain_connections[0]
      console.log('✅ Found connection:', connection)
      
      if (connection.content_type === 'website') {
        return await getWebsitePageSEOData(supabase, connection.content_id, path === '/' ? '' : path.substring(1), domain)
      } else if (connection.content_type === 'funnel') {
        return await getFunnelStepSEOData(supabase, connection.content_id, path === '/' ? '' : path.substring(1), domain)
      }
    } else {
      // Handle ecombuildr.com domain routes
      console.log('🏠 EcomBuildr domain SEO JSON request:', domain, 'path:', path)
      
      // Parse website routes: /w/:websiteSlug/:pageSlug?
      const websiteMatch = path.match(/^\/w\/([^\/]+)(?:\/([^\/]+))?$/)
      if (websiteMatch) {
        const [, websiteSlug, pageSlug] = websiteMatch
        const websiteId = await resolveWebsiteSlug(supabase, websiteSlug)
        if (websiteId) {
          return await getWebsitePageSEOData(supabase, websiteId, pageSlug || '', null)
        }
      }
      
      // Parse funnel routes: /f/:funnelSlug/:stepSlug?
      const funnelMatch = path.match(/^\/f\/([^\/]+)(?:\/([^\/]+))?$/)
      if (funnelMatch) {
        const [, funnelSlug, stepSlug] = funnelMatch
        const funnelId = await resolveFunnelSlug(supabase, funnelSlug)
        if (funnelId) {
          return await getFunnelStepSEOData(supabase, funnelId, stepSlug || '', null)
        }
      }
    }
    
    // Default SaaS SEO data for marketing pages
    return getDefaultSEOData()
  } catch (error) {
    console.error('Error getting SEO JSON data:', error)
    return getDefaultSEOData()
  }
}

// Get website page SEO data as JSON
async function getWebsitePageSEOData(supabase: any, websiteId: string, pageSlug: string, domain: string | null): Promise<any> {
  try {
    // First, try to extract SEO from HTML snapshot
    const snapshotSEO = await extractSEOFromSnapshot(supabase, websiteId, pageSlug, 'website', domain)
    if (snapshotSEO) {
      console.log('✅ Extracted SEO from website page snapshot')
      return snapshotSEO
    }

    // Fallback to database tables
    console.log('🔄 Falling back to database for website page SEO')
    
    // Fetch website data
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('name, slug, description')
      .eq('id', websiteId)
      .eq('is_active', true)
      .single()
    
    if (websiteError || !website) {
      return getDefaultSEOData()
    }
    
    // Fetch page data
    let pageQuery = supabase
      .from('website_pages')
      .select('*')
      .eq('website_id', websiteId)
      .eq('is_published', true)
    
    if (pageSlug) {
      pageQuery = pageQuery.eq('slug', pageSlug)
    } else {
      pageQuery = pageQuery.eq('is_homepage', true)
    }
    
    const { data: page, error: pageError } = await pageQuery.maybeSingle()
    
    if (pageError || !page) {
      return getDefaultSEOData()
    }
    
    const canonicalUrl = page.canonical_url || (domain
      ? `https://${domain}${pageSlug ? `/${pageSlug}` : ''}`
      : `https://ecombuildr.com/w/${website.slug}${pageSlug ? `/${pageSlug}` : ''}`)
    
    return {
      title: page.seo_title || `${page.title} - ${website.name}`,
      description: page.seo_description || website.description,
      og_image: page.og_image,
      canonical: canonicalUrl,
      robots: page.meta_robots || 'index, follow',
      keywords: Array.isArray(page.seo_keywords) ? page.seo_keywords : [],
      author: page.meta_author,
      language: page.language_code || 'en'
    }
  } catch (error) {
    console.error('Error getting website page SEO data:', error)
    return getDefaultSEOData()
  }
}

// Get funnel step SEO data as JSON
async function getFunnelStepSEOData(supabase: any, funnelId: string, stepSlug: string, domain: string | null): Promise<any> {
  try {
    // First, try to extract SEO from HTML snapshot
    const snapshotSEO = await extractSEOFromSnapshot(supabase, funnelId, stepSlug, 'funnel', domain)
    if (snapshotSEO) {
      console.log('✅ Extracted SEO from funnel step snapshot')
      return snapshotSEO
    }

    // Fallback to database tables
    console.log('🔄 Falling back to database for funnel step SEO')
    
    // Fetch funnel data
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('name, slug, description')
      .eq('id', funnelId)
      .eq('is_active', true)
      .single()
    
    if (funnelError || !funnel) {
      return getDefaultSEOData()
    }
    
    // Fetch step data
    let stepQuery = supabase
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', funnelId)
      .eq('is_published', true)
    
    if (stepSlug) {
      stepQuery = stepQuery.eq('slug', stepSlug)
    } else {
      stepQuery = stepQuery.order('step_order', { ascending: true }).limit(1)
    }
    
    const { data: step, error: stepError } = await stepQuery.maybeSingle()
    
    if (stepError || !step) {
      return getDefaultSEOData()
    }
    
    const canonicalUrl = step.canonical_url || (domain
      ? `https://${domain}${stepSlug ? `/${stepSlug}` : ''}`
      : `https://ecombuildr.com/f/${funnel.slug}${stepSlug ? `/${stepSlug}` : ''}`)
    
    return {
      title: step.seo_title || `${step.title} - ${funnel.name}`,
      description: step.seo_description || funnel.description,
      og_image: step.social_image_url || step.og_image,
      canonical: canonicalUrl,
      robots: step.meta_robots || 'index, follow',
      keywords: Array.isArray(step.seo_keywords) ? step.seo_keywords : [],
      author: step.meta_author,
      language: step.language_code || 'en'
    }
  } catch (error) {
    console.error('Error getting funnel step SEO data:', error)
    return getDefaultSEOData()
  }
}

// Get default SEO data
function getDefaultSEOData(): any {
  return {
    title: 'EcomBuildr - Build Professional E-commerce Stores & Sales Funnels',
    description: 'Create stunning online stores and high-converting sales funnels with EcomBuildr. No coding required. Start selling online in minutes with our drag-and-drop builder.',
    og_image: 'https://ecombuildr.com/og-image.jpg',
    canonical: 'https://ecombuildr.com',
    robots: 'index, follow',
    keywords: ['ecommerce builder', 'online store', 'sales funnel', 'website builder', 'no-code', 'drag and drop', 'online selling'],
    author: null,
    language: 'en'
  }
}

// Extract SEO data from HTML snapshot
async function extractSEOFromSnapshot(supabase: any, contentId: string, pageSlug: string, contentType: 'website' | 'funnel', domain: string | null): Promise<any> {
  try {
    // For website, first try to get page-specific snapshot
    if (contentType === 'website') {
      // Get page ID first
      let pageQuery = supabase
        .from('website_pages')
        .select('id, slug, is_homepage')
        .eq('website_id', contentId)
        .eq('is_published', true)
      
      if (pageSlug) {
        pageQuery = pageQuery.eq('slug', pageSlug)
      } else {
        pageQuery = pageQuery.eq('is_homepage', true)
      }
      
      const { data: page } = await pageQuery.maybeSingle()
      
      if (page) {
        // Try to get page-specific snapshot
        const pageSnapshot = await getContentSnapshot(supabase, page.id, 'website_page', domain)
        if (pageSnapshot) {
          const seoData = parseHTMLForSEO(pageSnapshot)
          if (seoData) return seoData
        }
      }
      
      // Fallback to website-level snapshot
      const websiteSnapshot = await getContentSnapshot(supabase, contentId, 'website', domain)
      if (websiteSnapshot) {
        const seoData = parseHTMLForSEO(websiteSnapshot)
        if (seoData) return seoData
      }
    }
    
    // For funnel, first try to get step-specific snapshot
    if (contentType === 'funnel') {
      // Get step ID first
      let stepQuery = supabase
        .from('funnel_steps')
        .select('id')
        .eq('funnel_id', contentId)
        .eq('is_published', true)
      
      if (pageSlug) {
        stepQuery = stepQuery.eq('slug', pageSlug)
      } else {
        stepQuery = stepQuery.order('step_order', { ascending: true }).limit(1)
      }
      
      const { data: step } = await stepQuery.maybeSingle()
      
      if (step) {
        // Try to get step-specific snapshot
        const stepSnapshot = await getContentSnapshot(supabase, step.id, 'funnel_step', domain)
        if (stepSnapshot) {
          const seoData = parseHTMLForSEO(stepSnapshot)
          if (seoData) return seoData
        }
      }
      
      // Fallback to funnel-level snapshot
      const funnelSnapshot = await getContentSnapshot(supabase, contentId, 'funnel', domain)
      if (funnelSnapshot) {
        const seoData = parseHTMLForSEO(funnelSnapshot)
        if (seoData) return seoData
      }
    }
    
    return null
  } catch (error) {
    console.error('Error extracting SEO from snapshot:', error)
    return null
  }
}

// Parse HTML content to extract SEO data
function parseHTMLForSEO(htmlContent: string): any {
  try {
    // Extract title
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null
    
    // Extract meta description
    const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']*?)["']/i)
    const description = descMatch ? descMatch[1] : null
    
    // Extract meta keywords
    const keywordsMatch = htmlContent.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*?)["']/i)
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : []
    
    // Extract meta robots
    const robotsMatch = htmlContent.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*?)["']/i)
    const robots = robotsMatch ? robotsMatch[1] : 'index,follow'
    
    // Extract canonical URL
    const canonicalMatch = htmlContent.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*?)["']/i)
    const canonical = canonicalMatch ? canonicalMatch[1] : null
    
    // Extract OG image
    const ogImageMatch = htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*?)["']/i)
    const og_image = ogImageMatch ? ogImageMatch[1] : null
    
    // Extract author
    const authorMatch = htmlContent.match(/<meta\s+name=["']author["']\s+content=["']([^"']*?)["']/i)
    const author = authorMatch ? authorMatch[1] : null
    
    // Extract language
    const langMatch = htmlContent.match(/<html[^>]+lang=["']([^"']*?)["']/i)
    const language = langMatch ? langMatch[1] : 'en'
    
    // Only return data if we found at least title or description
    if (title || description) {
      console.log('🎯 Extracted SEO from HTML snapshot:', { title, description, canonical })
      return {
        title,
        description,
        og_image,
        canonical,
        robots,
        keywords,
        author,
        language
      }
    }
    
    return null
  } catch (error) {
    console.error('Error parsing HTML for SEO:', error)
    return null
  }
}

// Fallback function to find published website pages by path
async function getWebsitePageFallback(supabase: any, path: string, domain: string): Promise<string | null> {
  try {
    console.log(`🔄 Attempting fallback: looking for published pages with path "${path}"`)
    
    // Extract potential slug from path
    const slug = path === '/' ? '' : path.substring(1)
    
    // Try to find any published website page with this slug
    let query = supabase
      .from('website_pages')
      .select(`
        id,
        title,
        slug,
        website_id,
        websites(name, slug, store_id)
      `)
      .eq('is_published', true)
    
    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.eq('is_homepage', true)
    }
    
    const { data: pages, error } = await query
    
    if (error || !pages || pages.length === 0) {
      console.log('❌ No fallback pages found')
      return null
    }
    
    // Use the first found page
    const page = pages[0]
    console.log(`✅ Fallback found page: "${page.title}" from website: "${page.websites?.name}"`)
    
    // Get snapshot for this page
    return await getContentSnapshot(supabase, page.id, 'website_page', null)
  } catch (error) {
    console.error('Error in getWebsitePageFallback:', error)
    return null
  }
}
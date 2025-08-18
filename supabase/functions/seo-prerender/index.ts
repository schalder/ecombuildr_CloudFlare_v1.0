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
  const path = url.searchParams.get('path') || url.pathname || '/'
  const domain = url.searchParams.get('domain') || url.hostname || req.headers.get('host') || 'ecombuildr.com'
  
  console.log('SEO Prerender request:', { path, domain, userAgent: req.headers.get('user-agent') })

  try {
    // Fetch the base index.html template from the live site
    const templateResponse = await fetch('https://ecombuildr.lovable.app/index.html')
    let html = await templateResponse.text()
    
    // Generate page-specific SEO content
    const seoContent = await generateSEOContent(supabase, domain, path)
    
    // Replace the <head> section with our enhanced SEO content, but preserve Vite assets
    html = html.replace(
      /<head>[\s\S]*?<\/head>/i,
      `<head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${seoContent}
        <script type="module" crossorigin src="/assets/index.js"></script>
        <link rel="stylesheet" crossorigin href="/assets/index.css" />
      </head>`
    )
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('SEO Prerender error:', error)
    return generateFallbackHTML(domain, path)
  }
})

async function generateSEOContent(supabase: any, domain: string, path: string): Promise<string> {
  // Handle custom domains first
  if (domain !== 'ecombuildr.com' && !domain.includes('lovable.app')) {
    console.log('Custom domain detected:', domain)
    
    // Look up custom domain mapping
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
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .single()
    
    if (domainError) {
      console.error('Error fetching custom domain:', domainError)
      return getDefaultSEO()
    }
    
    if (customDomainData?.domain_connections?.length) {
      const connection = customDomainData.domain_connections[0]
      
      if (connection.content_type === 'website') {
        return await generateWebsitePageSEO(supabase, connection.content_id, path, domain)
      } else if (connection.content_type === 'funnel') {
        return await generateFunnelStepSEO(supabase, connection.content_id, path, domain)
      }
    }
  } else {
    // Handle ecombuildr.com domain routes
    if (path === '/' || path === '' || path === '/index.html') {
      return getMarketingSEO()
    }
    
    // Parse website routes: /w/:websiteSlug/:pageSlug?
    const websiteMatch = path.match(/^\/w\/([^\/]+)(?:\/([^\/]+))?$/)
    if (websiteMatch) {
      const [, websiteSlug, pageSlug] = websiteMatch
      const websiteId = await resolveWebsiteSlug(supabase, websiteSlug)
      if (websiteId) {
        return await generateWebsitePageSEO(supabase, websiteId, pageSlug || '', domain)
      }
    }
    
    // Parse funnel routes: /f/:funnelSlug/:stepSlug?
    const funnelMatch = path.match(/^\/f\/([^\/]+)(?:\/([^\/]+))?$/)
    if (funnelMatch) {
      const [, funnelSlug, stepSlug] = funnelMatch
      const funnelId = await resolveFunnelSlug(supabase, funnelSlug)
      if (funnelId) {
        return await generateFunnelStepSEO(supabase, funnelId, stepSlug || '', domain)
      }
    }
  }
  
  // Fallback for unmatched routes
  return getDefaultSEO()
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
  const fallbackSEO = generateSEOTags({
    title: 'Page Not Found - EcomBuildr',
    description: 'The requested page could not be found.',
    canonicalUrl: domain && domain !== 'ecombuildr.com' ? `https://${domain}${path || ''}` : 'https://ecombuildr.com',
    robots: 'noindex, nofollow',
    siteName: 'EcomBuildr',
    ogType: 'website'
  })
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${fallbackSEO}
</head>
<body>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div style="text-align: center;">
      <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">Page Not Found</h1>
      <p>The requested page could not be found.</p>
    </div>
  </div>
</body>
</html>`
  
  return new Response(html, {
    status: 404,
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const userAgent = req.headers.get('user-agent') || ''
    const path = url.searchParams.get('path') || '/'
    const domain = url.searchParams.get('domain') || 'ecombuildr.com'
    
    console.log(`SEO prerender request: ${path} from ${userAgent}`)
    
    // Check if this is a bot/crawler
    const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent)
    
    if (!isBot) {
      return new Response(
        JSON.stringify({ message: 'Not a bot, serving regular SPA' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let htmlContent = ''

    // Check for custom domain first
    if (domain !== 'ecombuildr.com') {
      const { data: customDomain } = await supabase
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

      if (customDomain?.domain_connections?.length) {
        const connection = customDomain.domain_connections[0]
        
        if (connection.content_type === 'website') {
          // Get website and resolve specific page based on path
          const { data: website } = await supabase
            .from('websites')
            .select('*')
            .eq('id', connection.content_id)
            .single()

          if (website) {
            let page = null
            
            // Handle different path scenarios for custom domains
            if (path === '/' || path === '') {
              // Get homepage
              const { data: homePage } = await supabase
                .from('website_pages')
                .select('*')
                .eq('website_id', website.id)
                .eq('is_homepage', true)
                .eq('is_published', true)
                .single()
              page = homePage
            } else {
              // Try to find page by path/slug
              const pageSlug = path.startsWith('/') ? path.substring(1) : path
              const { data: specificPage } = await supabase
                .from('website_pages')
                .select('*')
                .eq('website_id', website.id)
                .eq('slug', pageSlug)
                .eq('is_published', true)
                .single()
              page = specificPage
            }

            if (page) {
              htmlContent = await generateWebsitePageHTML(website, page, domain)
            }
          }
        } else if (connection.content_type === 'funnel') {
          // Get funnel and resolve specific step based on path
          const { data: funnel } = await supabase
            .from('funnels')
            .select('*')
            .eq('id', connection.content_id)
            .single()

          if (funnel) {
            let step = null
            
            if (path === '/' || path === '') {
              // Get first step
              const { data: firstStep } = await supabase
                .from('funnel_steps')
                .select('*')
                .eq('funnel_id', funnel.id)
                .eq('is_published', true)
                .order('step_order')
                .limit(1)
                .single()
              step = firstStep
            } else {
              // Try to find step by path/slug
              const stepSlug = path.startsWith('/') ? path.substring(1) : path
              const { data: specificStep } = await supabase
                .from('funnel_steps')
                .select('*')
                .eq('funnel_id', funnel.id)
                .eq('slug', stepSlug)
                .eq('is_published', true)
                .single()
              step = specificStep
            }

            if (step) {
              htmlContent = await generateFunnelStepHTML(funnel, step, domain)
            }
          }
        }
      }
      } else {
        // Handle root path for marketing site on ecombuildr.com
        if (path === '/' || path === '' || path === '/index.html') {
          htmlContent = generateMarketingHTML()
        } else if (path.startsWith('/w/')) {
          // Website route: /w/website-slug or /w/website-slug/page-slug
          const pathParts = path.split('/').filter(Boolean)
          const websiteSlug = pathParts[1]
          const pageSlug = pathParts[2] || ''

          const { data: website } = await supabase
            .from('websites')
            .select('*')
            .eq('slug', websiteSlug)
            .eq('is_published', true)
            .eq('is_active', true)
            .single()

          if (website) {
            // Get specific page or homepage
            let page = null
            if (pageSlug) {
              const { data: specificPage } = await supabase
                .from('website_pages')
                .select('*')
                .eq('website_id', website.id)
                .eq('slug', pageSlug)
                .eq('is_published', true)
                .single()
              page = specificPage
            } else {
              // Get homepage
              const { data: homePage } = await supabase
                .from('website_pages')
                .select('*')
                .eq('website_id', website.id)
                .eq('is_homepage', true)
                .eq('is_published', true)
                .single()
              page = homePage
            }

            if (page) {
              htmlContent = await generateWebsitePageHTML(website, page)
            }
          }
        } else if (path.startsWith('/f/')) {
          // Funnel route: /f/funnel-slug or /f/funnel-slug/step-slug  
          const pathParts = path.split('/').filter(Boolean)
          const funnelSlug = pathParts[1]
          const stepSlug = pathParts[2] || ''

          const { data: funnel } = await supabase
            .from('funnels')
            .select('*')
            .eq('slug', funnelSlug)
            .eq('is_published', true)
            .eq('is_active', true)
            .single()

          if (funnel) {
            // Get specific step or first step
            let step = null
            if (stepSlug) {
              const { data: specificStep } = await supabase
                .from('funnel_steps')
                .select('*')
                .eq('funnel_id', funnel.id)
                .eq('slug', stepSlug)
                .eq('is_published', true)
                .single()
              step = specificStep
            } else {
              // Get first step
              const { data: firstStep } = await supabase
                .from('funnel_steps')
                .select('*')
                .eq('funnel_id', funnel.id)
                .eq('is_published', true)
                .order('step_order')
                .limit(1)
                .single()
              step = firstStep
            }

            if (step) {
              htmlContent = await generateFunnelStepHTML(funnel, step)
            }
          }
        }
      }

    // Fallback to basic HTML if no content found
    if (!htmlContent) {
      htmlContent = generateFallbackHTML()
    }

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
      },
      status: 200
    })

  } catch (error) {
    console.error('Error in SEO prerender:', error)
    
    return new Response(generateFallbackHTML(), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 200
    })
  }
})

async function generateWebsitePageHTML(website: any, page: any, customDomain?: string): Promise<string> {
  // Use page-level SEO data only
  const title = page.seo_title || page.title
  const description = page.seo_description || 'Discover amazing products'
  const image = page.og_image || page.social_image_url
  const keywords = (page.seo_keywords || []).join(', ')
  const canonical = page.canonical_url || (customDomain ? `https://${customDomain}/${page.slug}` : `https://ecombuildr.com/w/${website.slug}/${page.slug}`)
  const robots = page.meta_robots || 'index,follow'
  const author = page.meta_author
  const language = page.language_code || 'en'
  
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
    ${author ? `<meta name="author" content="${author}" />` : ''}
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${canonical}"
    }
    </script>
    
    ${page.custom_scripts || ''}
</head>
<body>
    <div id="root">
        <main>
            <h1>${title}</h1>
            <p>${description}</p>
            <div id="loading">Loading page content...</div>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}

async function generateFunnelStepHTML(funnel: any, step: any, customDomain?: string): Promise<string> {
  // Use step-level SEO data only
  const title = step.seo_title || step.title
  const description = step.seo_description || 'High converting sales funnel'
  const image = step.og_image || step.social_image_url
  const keywords = (step.seo_keywords || []).join(', ')
  const canonical = step.canonical_url || (customDomain ? `https://${customDomain}/${step.slug}` : `https://ecombuildr.com/f/${funnel.slug}/${step.slug}`)
  const robots = step.meta_robots || 'index,follow'
  const author = step.meta_author
  const language = step.language_code || 'en'
  
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
    ${author ? `<meta name="author" content="${author}" />` : ''}
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${canonical}"
    }
    </script>
    
    ${step.custom_scripts || ''}
</head>
<body>
    <div id="root">
        <main>
            <h1>${title}</h1>
            <p>${description}</p>
            <div id="loading">Loading funnel content...</div>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}

function generateMarketingHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcomBuildr - Build Professional E-commerce Stores & Sales Funnels</title>
    <meta name="description" content="Create stunning online stores and high-converting sales funnels with EcomBuildr. No coding required. Start selling online in minutes with our drag-and-drop builder." />
    <meta name="keywords" content="ecommerce builder, online store, sales funnel, website builder, no-code, drag and drop, online selling" />
    <meta name="robots" content="index, follow" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="EcomBuildr - Build Professional E-commerce Stores & Sales Funnels" />
    <meta property="og:description" content="Create stunning online stores and high-converting sales funnels with EcomBuildr. No coding required. Start selling online in minutes with our drag-and-drop builder." />
    <meta property="og:image" content="https://ecombuildr.com/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://ecombuildr.com" />
    <meta property="og:site_name" content="EcomBuildr" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="EcomBuildr - Build Professional E-commerce Stores & Sales Funnels" />
    <meta name="twitter:description" content="Create stunning online stores and high-converting sales funnels with EcomBuildr. No coding required. Start selling online in minutes with our drag-and-drop builder." />
    <meta name="twitter:image" content="https://ecombuildr.com/og-image.jpg" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://ecombuildr.com" />
</head>
<body>
    <div id="root">
        <main>
            <h1>EcomBuildr - Professional E-commerce Builder</h1>
            <p>Build stunning online stores and high-converting sales funnels without coding. Start your business today!</p>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}

function generateFallbackHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcomBuildr - Create Beautiful Online Stores</title>
    <meta name="description" content="Build stunning e-commerce websites and sales funnels with EcomBuildr's powerful page builder." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="EcomBuildr - Create Beautiful Online Stores" />
    <meta property="og:description" content="Build stunning e-commerce websites and sales funnels with EcomBuildr's powerful page builder." />
    <meta property="og:type" content="website" />
</head>
<body>
    <div id="root">
        <main>
            <h1>EcomBuildr - Create Beautiful Online Stores</h1>
            <p>Build stunning e-commerce websites and sales funnels with our powerful page builder.</p>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}
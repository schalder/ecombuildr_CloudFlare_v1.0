import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SEOData {
  title?: string;
  description?: string;
  og_image?: string;
  keywords?: string[];
  canonical_url?: string;
  robots?: string;
  site_name?: string;
  favicon_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const domain = url.searchParams.get('domain')
    const path = url.searchParams.get('path') || '/'
    const userAgent = req.headers.get('user-agent') || ''

    // Check if request is from a crawler
    const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp/i.test(userAgent)
    
    if (!isCrawler) {
      return new Response(JSON.stringify({ isCrawler: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let seoData: SEOData = {
      title: 'Loading...',
      description: 'E-commerce website',
      robots: 'index, follow'
    }

    // Try to find website by domain
    const { data: website } = await supabase
      .from('websites')
      .select(`
        *,
        stores!inner(*)
      `)
      .or(`domain.eq.${domain},slug.eq.${domain}`)
      .eq('is_active', true)
      .maybeSingle()

    if (website) {
      const store = website.stores as any
      
      // Get page-specific SEO if path is not root
      let pageData = null
      if (path !== '/' && path !== '') {
        const slug = path.replace('/', '')
        const { data: page } = await supabase
          .from('website_pages')
          .select('*')
          .eq('website_id', website.id)
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle()
        
        pageData = page
      } else {
        // Get homepage
        const { data: page } = await supabase
          .from('website_pages')
          .select('*')
          .eq('website_id', website.id)
          .eq('is_homepage', true)
          .eq('is_published', true)
          .maybeSingle()
        
        pageData = page
      }

      // Build SEO data
      if (pageData) {
        seoData = {
          title: pageData.seo_title || `${pageData.title} - ${website.name}`,
          description: pageData.seo_description || website.seo_description || website.description,
          og_image: pageData.og_image || website.og_image,
          keywords: pageData.seo_keywords || website.seo_keywords,
          canonical_url: `https://${domain}${path}`,
          robots: website.meta_robots || 'index, follow',
          site_name: website.name,
          favicon_url: website.settings?.favicon_url || store?.favicon_url
        }
      } else {
        seoData = {
          title: website.seo_title || website.name,
          description: website.seo_description || website.description,
          og_image: website.og_image,
          keywords: website.seo_keywords,
          canonical_url: `https://${domain}${path}`,
          robots: website.meta_robots || 'index, follow',
          site_name: website.name,
          favicon_url: website.settings?.favicon_url || store?.favicon_url
        }
      }
    } else {
      // Try to find funnel by domain
      const { data: funnel } = await supabase
        .from('funnels')
        .select(`
          *,
          stores!inner(*)
        `)
        .eq('domain', domain)
        .eq('is_active', true)
        .maybeSingle()

      if (funnel) {
        const store = funnel.stores as any
        seoData = {
          title: funnel.seo_title || funnel.name,
          description: funnel.seo_description || funnel.description,
          og_image: funnel.og_image,
          canonical_url: `https://${domain}${path}`,
          robots: funnel.meta_robots || 'index, follow',
          site_name: funnel.name,
          favicon_url: store?.favicon_url
        }
      }
    }

    // Generate HTML with proper meta tags
    const keywordsString = Array.isArray(seoData.keywords) 
      ? seoData.keywords.join(', ') 
      : seoData.keywords || ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO Meta Tags -->
  <title>${seoData.title}</title>
  <meta name="description" content="${seoData.description}" />
  ${keywordsString ? `<meta name="keywords" content="${keywordsString}" />` : ''}
  <meta name="robots" content="${seoData.robots}" />
  <link rel="canonical" href="${seoData.canonical_url}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${seoData.title}" />
  <meta property="og:description" content="${seoData.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${seoData.canonical_url}" />
  ${seoData.site_name ? `<meta property="og:site_name" content="${seoData.site_name}" />` : ''}
  ${seoData.og_image ? `<meta property="og:image" content="${seoData.og_image}" />` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${seoData.title}" />
  <meta name="twitter:description" content="${seoData.description}" />
  ${seoData.og_image ? `<meta name="twitter:image" content="${seoData.og_image}" />` : ''}
  
  <!-- Favicon -->
  ${seoData.favicon_url ? `<link rel="icon" href="${seoData.favicon_url}" />` : ''}
  
  <!-- Theme -->
  <meta name="theme-color" content="#10B981" />
  
  <!-- Font Awesome -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkfT9l64lZ7P6Q5GxynwL97N6hCk9JQ3aP9JQv4dZ6b8x0zJQZQYShCw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
  
  <script type="module" src="/src/main.tsx"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`

    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300' // 5 minutes cache
      },
    })

  } catch (error) {
    console.error('SEO Meta Injection Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
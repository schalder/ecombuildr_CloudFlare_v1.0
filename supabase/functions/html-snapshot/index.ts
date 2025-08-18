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

    const { contentType, contentId, customDomain } = await req.json()
    
    console.log(`Generating HTML snapshot for ${contentType}:${contentId}`)

    let htmlContent = ''
    
    if (contentType === 'website') {
      // Fetch website and page data
      const { data: website } = await supabase
        .from('websites')
        .select('*')
        .eq('id', contentId)
        .single()

      if (!website) {
        throw new Error('Website not found')
      }

      // Get homepage or first published page
      const { data: homePage } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', contentId)
        .eq('is_published', true)
        .eq('is_homepage', true)
        .maybeSingle()

      const pageData = homePage || await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', contentId)
        .eq('is_published', true)
        .limit(1)
        .single()

      if (pageData) {
        htmlContent = generateWebsiteHTML(website, pageData, customDomain)
      }
      
    } else if (contentType === 'funnel') {
      // Fetch funnel data
      const { data: funnel } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', contentId)
        .single()

      if (!funnel) {
        throw new Error('Funnel not found')
      }

      // Get first funnel step
      const { data: firstStep } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', contentId)
        .eq('is_published', true)
        .order('step_order')
        .limit(1)
        .single()

      htmlContent = generateFunnelHTML(funnel, firstStep, customDomain)
      
    } else if (contentType === 'website_page') {
      // Fetch specific website page
      const { data: page } = await supabase
        .from('website_pages')
        .select(`
          *,
          websites(*)
        `)
        .eq('id', contentId)
        .single()

      if (!page) {
        throw new Error('Website page not found')
      }

      htmlContent = generateWebsiteHTML(page.websites, page, customDomain)
      
    } else if (contentType === 'funnel_step') {
      // Fetch specific funnel step
      const { data: step } = await supabase
        .from('funnel_steps')
        .select(`
          *,
          funnels(*)
        `)
        .eq('id', contentId)
        .single()

      if (!step) {
        throw new Error('Funnel step not found')
      }

      htmlContent = generateFunnelHTML(step.funnels, step, customDomain)
    }

    // Store the snapshot
    await supabase
      .from('html_snapshots')
      .upsert({
        content_type: contentType,
        content_id: contentId,
        custom_domain: customDomain,
        html_content: htmlContent,
        generated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'HTML snapshot generated successfully',
        preview: htmlContent.substring(0, 500) + '...'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating HTML snapshot:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function generateWebsiteHTML(website: any, page: any, customDomain?: string): string {
  // Use ONLY page-level SEO data (no fallbacks to website-level)
  const title = page.seo_title || page.title || website.name
  const description = page.seo_description || 'Discover amazing products'
  const image = page.og_image || page.social_image_url
  const keywords = (page.seo_keywords || []).join(', ')
  const canonical = page.canonical_url || (customDomain ? `https://${customDomain}` : `https://ecombuildr.com/w/${website.slug}/${page.slug}`)
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
    
    ${website.facebook_pixel_id ? `<script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${website.facebook_pixel_id}');
      fbq('track', 'PageView');
    </script>` : ''}
    
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

function generateFunnelHTML(funnel: any, step: any, customDomain?: string): string {
  // Use ONLY step-level SEO data (no fallbacks to funnel-level)
  const title = step.seo_title || step.title || funnel.name
  const description = step.seo_description || 'High converting sales funnel'
  const image = step.og_image || step.social_image_url
  const keywords = (step.seo_keywords || []).join(', ')
  const canonical = step.canonical_url || (customDomain ? `https://${customDomain}` : `https://ecombuildr.com/f/${funnel.slug}/${step.slug}`)
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
            <div id="loading">Loading funnel step...</div>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}
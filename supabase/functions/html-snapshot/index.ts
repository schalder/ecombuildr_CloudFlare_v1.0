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

    const body = await req.json().catch(() => ({}))
    const { contentType, contentId, customDomain } = body
    
    console.log(`🔍 Generating HTML snapshot for ${contentType}:${contentId}`)
    console.log(`📋 Request body:`, { contentType, contentId, customDomain })

    if (!contentType || !contentId) {
      throw new Error('Missing contentType or contentId in request body')
    }

    let htmlContent = ''
    
    try {
      if (contentType === 'website_page') {
        // Fetch specific website page
        console.log(`📄 Fetching website page: ${contentId}`)
        const { data: page, error: pageError } = await supabase
          .from('website_pages')
          .select('*')
          .eq('id', contentId)
          .maybeSingle()

        if (pageError) {
          console.error('❌ Error fetching website page:', pageError)
          throw new Error(`Error fetching website page: ${pageError.message}`)
        }

        if (!page) {
          console.error('❌ Website page not found:', contentId)
          throw new Error('Website page not found')
        }

        console.log(`✅ Found website page: ${page.title} (website_id: ${page.website_id})`)

        // Fetch the related website separately
        console.log(`🌐 Fetching website: ${page.website_id}`)
        const { data: website, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', page.website_id)
          .maybeSingle()

        if (websiteError) {
          console.error('❌ Error fetching website:', websiteError)
          throw new Error(`Error fetching website: ${websiteError.message}`)
        }

        if (!website) {
          console.error('❌ Website not found for page:', page.website_id)
          throw new Error('Website not found for page')
        }

        console.log(`✅ Found website: ${website.name}`)
        console.log(`🎨 Generating HTML for page: ${page.title}`)
        htmlContent = generateWebsiteHTML(website, page, customDomain)
        
      } else {
        throw new Error(`Unsupported content type: ${contentType}`)
      }

      console.log(`📝 Generated HTML content length: ${htmlContent.length}`)
      
    } catch (dataError) {
      console.error('❌ Error fetching data:', dataError)
      throw dataError
    }

    // Store the snapshot using manual update/insert approach to avoid constraint issues
    console.log(`💾 Storing HTML snapshot: ${contentType}:${contentId}`)
    
    try {
      // First, check if a record already exists
      let query = supabase
        .from('html_snapshots')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)

      if (customDomain) {
        query = query.eq('custom_domain', customDomain)
      } else {
        query = query.is('custom_domain', null)
      }

      const { data: existingRecord, error: selectError } = await query.maybeSingle()
      
      if (selectError) {
        console.error('❌ Error checking existing record:', selectError)
        throw selectError
      }

      let result
      if (existingRecord) {
        // Update existing record
        console.log(`🔄 Updating existing snapshot: ${existingRecord.id}`)
        result = await supabase
          .from('html_snapshots')
          .update({
            html_content: htmlContent,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
      } else {
        // Insert new record
        console.log(`✨ Creating new snapshot`)
        result = await supabase
          .from('html_snapshots')
          .insert({
            content_id: contentId,
            content_type: contentType,
            custom_domain: customDomain || null,
            html_content: htmlContent,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('❌ Database error:', result.error)
        throw result.error
      }

      console.log('✅ HTML snapshot stored successfully')
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'HTML snapshot generated successfully',
        contentType,
        contentId,
        htmlLength: htmlContent.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error generating HTML snapshot:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
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
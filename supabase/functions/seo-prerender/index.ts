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
        
        // Try to get cached snapshot first
        const { data: snapshot } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_type', connection.content_type)
          .eq('content_id', connection.content_id)
          .eq('custom_domain', domain)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (snapshot) {
          htmlContent = snapshot.html_content
        } else {
          // Generate on-demand
          const { data: generatedSnapshot } = await supabase.functions.invoke('html-snapshot', {
            body: {
              contentType: connection.content_type,
              contentId: connection.content_id,
              customDomain: domain
            }
          })
          
          if (generatedSnapshot?.preview) {
            htmlContent = generatedSnapshot.preview
          }
        }
      }
    } else {
      // Handle root path for marketing site on ecombuildr.com
      if (path === '/' || path === '' || path === '/index.html') {
        htmlContent = generateMarketingHTML()
      } else if (path.startsWith('/w/')) {
        // Website route
        const slug = path.split('/')[2]
        const { data: website } = await supabase
          .from('websites')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .eq('is_active', true)
          .single()

        if (website) {
          const { data: snapshot } = await supabase
            .from('html_snapshots')
            .select('html_content')
            .eq('content_type', 'website')
            .eq('content_id', website.id)
            .is('custom_domain', null)
            .order('generated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          htmlContent = snapshot?.html_content || await generateWebsiteHTML(website)
        }
      } else if (path.startsWith('/f/')) {
        // Funnel route
        const slug = path.split('/')[2]
        const { data: funnel } = await supabase
          .from('funnels')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .eq('is_active', true)
          .single()

        if (funnel) {
          const { data: snapshot } = await supabase
            .from('html_snapshots')
            .select('html_content')
            .eq('content_type', 'funnel')
            .eq('content_id', funnel.id)
            .is('custom_domain', null)
            .order('generated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          htmlContent = snapshot?.html_content || await generateFunnelHTML(funnel)
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

async function generateWebsiteHTML(website: any): Promise<string> {
  // Simplified version - in production this would be more comprehensive
  const title = website.seo_title || website.name
  const description = website.seo_description || website.description || 'Discover amazing products'
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://ecombuildr.com/w/${website.slug}" />
</head>
<body>
    <div id="root">
        <main>
            <h1>${title}</h1>
            <p>${description}</p>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}

async function generateFunnelHTML(funnel: any): Promise<string> {
  const title = funnel.seo_title || funnel.name
  const description = funnel.seo_description || funnel.description || 'High converting sales funnel'
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://ecombuildr.com/f/${funnel.slug}" />
</head>
<body>
    <div id="root">
        <main>
            <h1>${title}</h1>
            <p>${description}</p>
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
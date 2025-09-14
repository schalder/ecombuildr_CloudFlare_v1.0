import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const url = new URL(req.url)
  let domain = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'ecombuildr.com'
  let path = url.pathname || '/'

  // Clean up domain
  if (domain.includes('supabase.co') || domain.includes('edge-runtime')) {
    domain = req.headers.get('x-forwarded-host') || 'ecombuildr.com'
  }

  // Normalize path
  if (path !== '/') {
    path = '/' + decodeURIComponent(path).replace(/^\/+|\/+$/g, '')
  }

  console.log('🌐 Page request:', { domain, path })

  try {
    // Get HTML snapshot from database
    const htmlContent = await getPageHTML(supabase, domain, path)
    
    if (htmlContent) {
      console.log('✅ Serving pre-generated HTML')
      return new Response(htmlContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300',
        }
      })
    }

    // Fallback to React app
    console.log('⚛️ Falling back to React app')
    return await serveReactApp(domain, path)

  } catch (error) {
    console.error('❌ Error serving page:', error)
    return await serveReactApp(domain, path)
  }
})

async function getPageHTML(supabase: any, domain: string, path: string): Promise<string | null> {
  try {
    // Handle custom domains
    if (domain !== 'ecombuildr.com') {
      const { data: customDomain } = await supabase
        .from('custom_domains')
        .select(`
          domain_connections!inner(content_type, content_id)
        `)
        .eq('domain', domain)
        .eq('is_verified', true)
        .maybeSingle()

      if (customDomain?.domain_connections?.[0]) {
        const connection = customDomain.domain_connections[0]
        
        if (connection.content_type === 'website') {
          // Get website page
          const pageSlug = path === '/' ? '' : path.substring(1)
          
          const { data: page } = await supabase
            .from('website_pages')
            .select('id')
            .eq('website_id', connection.content_id)
            .eq('is_published', true)
            .eq(pageSlug ? 'slug' : 'is_homepage', pageSlug || true)
            .maybeSingle()

          if (page) {
            const { data: snapshot } = await supabase
              .from('html_snapshots')
              .select('html_content')
              .eq('content_type', 'website_page')
              .eq('content_id', page.id)
              .eq('custom_domain', domain)
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            return snapshot?.html_content || null
          }
        } else if (connection.content_type === 'funnel') {
          // Get funnel step
          const stepSlug = path === '/' ? '' : path.substring(1)
          
          const { data: step } = await supabase
            .from('funnel_steps')
            .select('id')
            .eq('funnel_id', connection.content_id)
            .eq('is_published', true)
            .eq(stepSlug ? 'slug' : 'step_order', stepSlug || 1)
            .maybeSingle()

          if (step) {
            const { data: snapshot } = await supabase
              .from('html_snapshots')
              .select('html_content')
              .eq('content_type', 'funnel_step')
              .eq('content_id', step.id)
              .eq('custom_domain', domain)
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            return snapshot?.html_content || null
          }
        }
      }
    } else {
      // Handle ecombuildr.com system domain routes
      const websiteMatch = path.match(/^\/site\/([^\/]+)(?:\/([^\/]+))?$/)
      const funnelMatch = path.match(/^\/f\/([^\/]+)(?:\/([^\/]+))?$/)
      
      if (websiteMatch) {
        const [, websiteSlug, pageSlug] = websiteMatch
        
        // Get website
        const { data: website } = await supabase
          .from('websites')
          .select('id')
          .eq('slug', websiteSlug)
          .eq('is_active', true)
          .eq('is_published', true)
          .maybeSingle()

        if (website) {
          // Get page
          const { data: page } = await supabase
            .from('website_pages')
            .select('id')
            .eq('website_id', website.id)
            .eq('is_published', true)
            .eq(pageSlug ? 'slug' : 'is_homepage', pageSlug || true)
            .maybeSingle()

          if (page) {
            const { data: snapshot } = await supabase
              .from('html_snapshots')
              .select('html_content')
              .eq('content_type', 'website_page')
              .eq('content_id', page.id)
              .is('custom_domain', null)
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            return snapshot?.html_content || null
          }
        }
      } else if (funnelMatch) {
        const [, funnelSlug, stepSlug] = funnelMatch
        
        // Get funnel
        const { data: funnel } = await supabase
          .from('funnels')
          .select('id')
          .eq('slug', funnelSlug)
          .eq('is_active', true)
          .eq('is_published', true)
          .maybeSingle()

        if (funnel) {
          // Get step
          const { data: step } = await supabase
            .from('funnel_steps')
            .select('id')
            .eq('funnel_id', funnel.id)
            .eq('is_published', true)
            .eq(stepSlug ? 'slug' : 'step_order', stepSlug || 1)
            .maybeSingle()

          if (step) {
            const { data: snapshot } = await supabase
              .from('html_snapshots')
              .select('html_content')
              .eq('content_type', 'funnel_step')
              .eq('content_id', step.id)
              .is('custom_domain', null)
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            return snapshot?.html_content || null
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting page HTML:', error)
    return null
  }
}

async function serveReactApp(domain: string, path: string): Promise<Response> {
  // Generate basic HTML shell that will load React
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Loading...</title>
    <meta name="description" content="Page is loading" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
</head>
<body>
    <div id="root">
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; color: #666;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <p>Loading page content...</p>
        </div>
    </div>
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache',
    }
  })
}
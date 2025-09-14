import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getHost(req: Request) {
  return req.headers.get('x-forwarded-host') || req.headers.get('host') || undefined
}

function normalizePath(p?: string | null) {
  if (!p) return '/'
  try { p = decodeURIComponent(p) } catch {}
  // Ensure leading slash, strip query/hash if present
  p = p.replace(/^[^/]/, (m) => '/' + m)
  p = p.split('?')[0].split('#')[0]
  return p
}

function getSlugFromPath(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, '')
  const first = clean.split('/')[0]
  return first || ''
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const qpDomain = url.searchParams.get('domain')
    const domain = qpDomain && qpDomain !== ':host' ? qpDomain : getHost(req)
    const pathParam = url.searchParams.get('path') || url.pathname
    const path = normalizePath(pathParam)
    const slug = getSlugFromPath(path)
    const isHome = slug === '' || slug === 'index'

    console.log('🔍 HTML serve request:', { domain, path, slug, isHome })

    if (!domain) {
      return new Response('Domain required', { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRole)

    // 1) Try WEBSITE by domain
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('domain', domain)
      .eq('is_published', true)
      .eq('is_active', true)
      .maybeSingle()

    if (website) {
      // Resolve page by slug or homepage
      let pageId: string | null = null
      if (isHome) {
        const { data: home } = await supabase
          .from('website_pages')
          .select('id')
          .eq('website_id', website.id)
          .eq('is_homepage', true)
          .maybeSingle()
        pageId = home?.id || null
      } else {
        const { data: page } = await supabase
          .from('website_pages')
          .select('id')
          .eq('website_id', website.id)
          .eq('slug', slug)
          .maybeSingle()
        pageId = page?.id || null
      }

      if (pageId) {
        // Prefer custom-domain snapshot, then default
        let { data: snap } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_id', pageId)
          .eq('content_type', 'website_page')
          .eq('custom_domain', domain)
          .maybeSingle()

        if (!snap) {
          const { data: snapDefault } = await supabase
            .from('html_snapshots')
            .select('html_content')
            .eq('content_id', pageId)
            .eq('content_type', 'website_page')
            .is('custom_domain', null)
            .maybeSingle()
          snap = snapDefault
        }

        if (snap?.html_content) {
          console.log('✅ Found page HTML snapshot, serving')
          return new Response(snap.html_content, {
            headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
          })
        }
      }

      // Fallback: try website-level snapshot (rare)
      const { data: siteSnap } = await supabase
        .from('html_snapshots')
        .select('html_content')
        .eq('content_id', website.id)
        .eq('content_type', 'website')
        .eq('custom_domain', domain)
        .maybeSingle()

      if (siteSnap?.html_content) {
        console.log('✅ Found website HTML snapshot (fallback), serving')
        return new Response(siteSnap.html_content, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
        })
      }
    }

    // 2) Try FUNNEL by domain
    const { data: funnel } = await supabase
      .from('funnels')
      .select('id')
      .eq('domain', domain)
      .eq('is_published', true)
      .eq('is_active', true)
      .maybeSingle()

    if (funnel) {
      let stepId: string | null = null
      if (isHome) {
        const { data: home } = await supabase
          .from('funnel_steps')
          .select('id')
          .eq('funnel_id', funnel.id)
          .eq('is_homepage', true)
          .maybeSingle()
        stepId = home?.id || null
      } else {
        const { data: step } = await supabase
          .from('funnel_steps')
          .select('id')
          .eq('funnel_id', funnel.id)
          .eq('slug', slug)
          .maybeSingle()
        stepId = step?.id || null
      }

      if (stepId) {
        let { data: snap } = await supabase
          .from('html_snapshots')
          .select('html_content')
          .eq('content_id', stepId)
          .eq('content_type', 'funnel_step')
          .eq('custom_domain', domain)
          .maybeSingle()

        if (!snap) {
          const { data: snapDefault } = await supabase
            .from('html_snapshots')
            .select('html_content')
            .eq('content_id', stepId)
            .eq('content_type', 'funnel_step')
            .is('custom_domain', null)
            .maybeSingle()
          snap = snapDefault
        }

        if (snap?.html_content) {
          console.log('✅ Found funnel step HTML snapshot, serving')
          return new Response(snap.html_content, {
            headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600' }
          })
        }
      }
    }

    console.log('❌ No matching snapshot found, falling back to SPA index proxy')
    try {
      const resp = await fetch(`https://${domain}/index.html`)
      const html = await resp.text()
      return new Response(html, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' }
      })
    } catch (_) {
      return new Response('<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Loading...</title></head><body><div id="root"></div></body></html>', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' }
      })
    }
  } catch (err) {
    console.error('❌ Error serving HTML:', err)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})
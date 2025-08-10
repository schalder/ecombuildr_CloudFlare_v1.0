// supabase/functions/robots/index.ts
// Dynamic robots.txt per tenant (website/funnel)
// Public function with CORS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const host = url.searchParams.get('host') || req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const websiteSlug = url.searchParams.get('websiteSlug') || undefined;
    const funnelSlug = url.searchParams.get('funnelSlug') || undefined;

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let metaRobots = 'index, follow';

    // Try to find a matching website by domain or slug
    if (websiteSlug || host) {
      const { data } = await supabase
        .from('websites')
        .select('meta_robots')
        .or(
          websiteSlug
            ? `slug.eq.${websiteSlug}`
            : ''
        )
        .eq('is_active', true)
        .eq('is_published', true)
        .limit(1);

      if (data && data.length > 0 && data[0]?.meta_robots) metaRobots = data[0].meta_robots as string;
    }

    // Fallback to funnel if provided
    if (funnelSlug) {
      const { data } = await supabase
        .from('funnels')
        .select('meta_robots')
        .eq('slug', funnelSlug)
        .eq('is_active', true)
        .eq('is_published', true)
        .limit(1);
      if (data && data.length > 0 && data[0]?.meta_robots) metaRobots = data[0].meta_robots as string;
    }

    const sitemapHref = `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/sitemap?host=${encodeURIComponent(host)}`;

    const body = [
      `User-agent: *`,
      `Allow: /`,
      `Disallow: /dashboard`,
      `Disallow: /admin`,
      `Disallow: /api`,
      `# Meta robots default: ${metaRobots}`,
      `Sitemap: ${sitemapHref}`,
      '',
    ].join('\n');

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return new Response('User-agent: *\nAllow: /\n', {
      headers: { ...corsHeaders, 'content-type': 'text/plain; charset=utf-8' },
      status: 200,
    });
  }
});

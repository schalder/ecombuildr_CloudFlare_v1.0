// supabase/functions/sitemap/index.ts
// Generates sitemap.xml per website or funnel
// Public function with CORS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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

    let urls: string[] = [];

    if (websiteSlug) {
      // Resolve website by slug
      const { data: website } = await supabase
        .from('websites')
        .select('id, slug, domain')
        .eq('slug', websiteSlug)
        .eq('is_published', true)
        .eq('is_active', true)
        .maybeSingle();

      if (website) {
        const base = (website as any).domain ? `https://${(website as any).domain}` : (host ? `https://${host}/site/${(website as any).slug}` : `https://example.com/site/${(website as any).slug}`);
        const { data: pages } = await supabase
          .from('website_pages')
          .select('slug, is_homepage')
          .eq('website_id', (website as any).id)
          .eq('is_published', true);
        urls = (pages || []).map((p: any) => (p.is_homepage ? `${base}/` : `${base}/${p.slug}`));
      }
    } else if (host) {
      // Resolve by domain
      const { data: website } = await supabase
        .from('websites')
        .select('id, slug, domain')
        .eq('domain', host)
        .eq('is_published', true)
        .eq('is_active', true)
        .maybeSingle();

      if (website) {
        const base = (website as any).domain ? `https://${(website as any).domain}` : `https://${host}/site/${(website as any).slug}`;
        const { data: pages } = await supabase
          .from('website_pages')
          .select('slug, is_homepage')
          .eq('website_id', (website as any).id)
          .eq('is_published', true);
        urls = (pages || []).map((p: any) => (p.is_homepage ? `${base}/` : `${base}/${p.slug}`));
      }
    }

    if (funnelSlug) {
      const { data: funnel } = await supabase
        .from('funnels')
        .select('id, slug, domain')
        .eq('slug', funnelSlug)
        .eq('is_published', true)
        .eq('is_active', true)
        .maybeSingle();
      if (funnel) {
        const base = (funnel as any).domain ? `https://${(funnel as any).domain}` : (host ? `https://${host}/funnels/${(funnel as any).slug}` : `https://example.com/funnels/${(funnel as any).slug}`);
        const { data: steps } = await supabase
          .from('funnel_steps')
          .select('slug')
          .eq('funnel_id', (funnel as any).id)
          .eq('is_published', true);
        urls = urls.concat((steps || []).map((s: any) => `${base}/${s.slug}`));
      }
    }

    const now = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((loc) => `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n') +
      `\n</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    const fallback = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new Response(fallback, { headers: { ...corsHeaders, 'content-type': 'application/xml; charset=utf-8' } });
  }
});

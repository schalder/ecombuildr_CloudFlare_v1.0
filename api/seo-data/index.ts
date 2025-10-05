import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog',
];

interface SEOData {
  title: string;
  description: string;
  og_image?: string;
  keywords: string[];
  canonical: string;
  robots: string;
  site_name: string;
  source: string;
  debug: any;
}

function isSocialCrawler(userAgent: string): boolean {
  return SOCIAL_CRAWLERS.some(crawler => userAgent.includes(crawler));
}

// Helper function to resolve website SEO data
async function resolveWebsiteSEO(websiteId: string, pathname: string): Promise<SEOData | null> {
  try {
    const { data: website } = await supabase
      .from('websites')
      .select('name, description')
      .eq('id', websiteId)
      .single();

    if (!website) return null;

    if (pathname === '/' || pathname === '') {
      return {
        title: website.name || 'Website',
        description: website.description || `Visit ${website.name}`,
        og_image: undefined,
        keywords: ['website', 'online store'],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}`,
        robots: 'index, follow',
        site_name: website.name || 'Website',
        source: 'website_root',
        debug: {
          websiteId,
          titleSource: 'website.name',
          descSource: 'website.description',
          imageSource: 'none'
        }
      };
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const pageSlug = pathSegments[pathSegments.length - 1];

    const { data: page } = await supabase
      .from('website_pages')
      .select('id, title, seo_title, seo_description, og_image, slug, is_published')
      .eq('website_id', websiteId)
      .eq('slug', pageSlug)
      .eq('is_published', true)
      .single();

    if (page) {
      return {
        title: page.seo_title || page.title || `${website.name} - ${pageSlug}`,
        description: page.seo_description || `Visit ${page.title || pageSlug} on ${website.name}`,
        og_image: page.og_image || undefined,
        keywords: ['website', 'page', pageSlug],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}${pathname}`,
        robots: 'index, follow',
        site_name: website.name || 'Website',
        source: 'website_page',
        debug: {
          websiteId,
          pageId: page.id,
          slug: pageSlug,
          titleSource: 'page.seo_title || page.title',
          descSource: 'page.seo_description',
          imageSource: 'page.og_image'
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Error resolving website SEO:', error);
    return null;
  }
}

// Helper function to resolve funnel SEO data
async function resolveFunnelSEO(funnelId: string, pathname: string): Promise<SEOData | null> {
  try {
    const { data: funnel } = await supabase
      .from('funnels')
      .select('name, description, seo_title, seo_description, og_image')
      .eq('id', funnelId)
      .single();

    if (!funnel) return null;

    if (pathname === '/' || pathname === '') {
      return {
        title: funnel.seo_title || funnel.name || 'Sales Funnel',
        description: funnel.seo_description || funnel.description || `Visit ${funnel.name}`,
        og_image: funnel.og_image || undefined,
        keywords: ['sales funnel', 'marketing'],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}`,
        robots: 'index, follow',
        site_name: funnel.name || 'Sales Funnel',
        source: 'funnel_root',
        debug: {
          websiteId: funnelId,
          titleSource: 'funnel.seo_title || funnel.name',
          descSource: 'funnel.seo_description || funnel.description',
          imageSource: 'funnel.og_image'
        }
      };
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const stepSlug = pathSegments[pathSegments.length - 1];

    const { data: step } = await supabase
      .from('funnel_steps')
      .select('id, title, seo_title, seo_description, og_image, slug, is_published')
      .eq('funnel_id', funnelId)
      .eq('slug', stepSlug)
      .eq('is_published', true)
      .single();

    if (step) {
      return {
        title: step.seo_title || step.title || `${funnel.name} - ${stepSlug}`,
        description: step.seo_description || `Visit ${step.title || stepSlug} on ${funnel.name}`,
        og_image: step.og_image || funnel.og_image || undefined,
        keywords: ['sales funnel', 'step', stepSlug],
        canonical: `https://${new URL(Deno.env.get('VERCEL_URL') || 'localhost').hostname}${pathname}`,
        robots: 'index, follow',
        site_name: funnel.name || 'Sales Funnel',
        source: 'funnel_step',
        debug: {
          websiteId: funnelId,
          pageId: step.id,
          slug: stepSlug,
          titleSource: 'step.seo_title || step.title',
          descSource: 'step.seo_description',
          imageSource: 'step.og_image || funnel.og_image'
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Error resolving funnel SEO:', error);
    return null;
  }
}

// Helper function to resolve course area SEO data
async function resolveCourseAreaSEO(domain: string): Promise<SEOData | null> {
  try {
    return {
      title: 'Course Area - EcomBuildr',
      description: 'Access your courses and learning materials on EcomBuildr',
      og_image: undefined,
      keywords: ['courses', 'learning', 'education'],
      canonical: `https://${domain}`,
      robots: 'index, follow',
      site_name: 'EcomBuildr Course Area',
      source: 'course_area',
      debug: {
        domain,
        titleSource: 'hardcoded',
        descSource: 'hardcoded',
        imageSource: 'none'
      }
    };
  } catch (error) {
    console.error('Error resolving course area SEO:', error);
    return null;
  }
}

// Main function to resolve SEO data based on domain and pathname
async function resolveSEOData(domain: string, pathname: string): Promise<SEOData | null> {
  try {
    // Get domain connection info
    const { data: connection } = await supabase
      .from('domain_connections')
      .select('content_type, content_id, store_id')
      .eq('domain', domain)
      .single();

    if (!connection) {
      console.log('No domain connection found for:', domain);
      return null;
    }

    console.log('Found domain connection:', connection);

    // Route to appropriate resolver based on content type
    switch (connection.content_type) {
      case 'website':
        return await resolveWebsiteSEO(connection.content_id, pathname);
      case 'funnel':
        return await resolveFunnelSEO(connection.content_id, pathname);
      case 'course_area':
        return await resolveCourseAreaSEO(domain);
      default:
        console.log('Unknown content type:', connection.content_type);
        return null;
    }
  } catch (error) {
    console.error('Error resolving SEO data:', error);
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain') || url.hostname;
  const pathname = url.searchParams.get('pathname') || url.pathname;

  console.log('SEO API called with:', { domain, pathname });

  try {
    const seoData = await resolveSEOData(domain, pathname);
    if (seoData) {
      console.log('Returning SEO data:', seoData);
      return new Response(JSON.stringify(seoData), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
      });
    }
    return new Response(JSON.stringify({ message: 'SEO data not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in seo-data API:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

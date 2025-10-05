import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4?target=deno';

const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SEOData {
  title: string;
  description: string;
  og_image?: string;
  keywords: string[];
  canonical: string;
  robots: string;
  site_name: string;
  source: string;
  debug?: {
    websiteId?: string;
    pageId?: string;
    slug?: string;
    titleSource?: string;
    descSource?: string;
    imageSource?: string;
  };
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const path = url.searchParams.get('path');

  if (!domain || !path) {
    return new Response(JSON.stringify({ error: 'Missing domain or path parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log(`🔍 SEO API request: ${domain}${path}`);

  try {
    const seoData = await resolveSEOData(domain, path);
    
    if (!seoData) {
      return new Response(JSON.stringify({
        title: domain,
        description: `Preview of ${domain}`,
        og_image: undefined,
        keywords: [],
        canonical: `https://${domain}${path}`,
        robots: 'index, follow',
        site_name: domain,
        source: 'fallback_no_data'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ SEO data resolved: ${seoData.title} (${seoData.source})`);
    
    return new Response(JSON.stringify(seoData), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 SEO API error:', error);
    return new Response(JSON.stringify({
      title: domain,
      description: `Preview of ${domain}`,
      og_image: undefined,
      keywords: [],
      canonical: `https://${domain}${path}`,
      robots: 'index, follow',
      site_name: domain,
      source: 'fallback_error'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to resolve SEO data
async function resolveSEOData(domain: string, pathname: string): Promise<SEOData | null> {
  try {
    // Get domain info
    const { data: domainData } = await supabase
      .from('custom_domains')
      .select('id, store_id')
      .eq('domain', domain)
      .eq('is_verified', true)
      .eq('dns_configured', true)
      .single();

    if (!domainData) return null;

    // Get connections for this domain
    const { data: connections } = await supabase
      .from('domain_connections')
      .select('*')
      .eq('domain_id', domainData.id)
      .order('is_homepage', { ascending: false });

    if (!connections || connections.length === 0) return null;

    // Determine content type and ID
    let contentType: 'website' | 'funnel' | 'course_area' | null = null;
    let contentId: string | null = null;

    if (pathname === '/' || pathname === '') {
      // For root path, prioritize: explicit homepage > website > course_area > first funnel
      const homepageConnection = connections.find(c => c.is_homepage);
      const websiteConnection = connections.find(c => c.content_type === 'website');
      const courseConnection = connections.find(c => c.content_type === 'course_area');
      const funnelConnection = connections.find(c => c.content_type === 'funnel');

      const selectedConnection = homepageConnection || websiteConnection || courseConnection || funnelConnection;
      if (selectedConnection) {
        contentType = selectedConnection.content_type;
        contentId = selectedConnection.content_id;
      }
    } else {
      // For specific paths, check for website system routes first
      const systemRoutes = ['payment-processing', 'order-confirmation', 'cart', 'checkout'];
      const pathSegments = pathname.split('/').filter(Boolean);
      const potentialSlug = pathSegments[pathSegments.length - 1];

      if (systemRoutes.includes(potentialSlug)) {
        const websiteConnection = connections.find(c => c.content_type === 'website');
        if (websiteConnection) {
          contentType = 'website';
          contentId = websiteConnection.content_id;
        }
      } else {
        // Check for funnel steps
        const funnelConnections = connections.filter(c => c.content_type === 'funnel');
        
        for (const funnelConnection of funnelConnections) {
          const { data: stepExists } = await supabase
            .from('funnel_steps')
            .select('id')
            .eq('funnel_id', funnelConnection.content_id)
            .eq('slug', potentialSlug)
            .eq('is_published', true)
            .maybeSingle();
            
          if (stepExists) {
            contentType = 'funnel';
            contentId = funnelConnection.content_id;
            break;
          }
        }

        // If no funnel step matches, use website
        if (!contentType) {
          const websiteConnection = connections.find(c => c.content_type === 'website');
          if (websiteConnection) {
            contentType = 'website';
            contentId = websiteConnection.content_id;
          }
        }
      }
    }

    if (!contentType || !contentId) return null;

    // Resolve SEO data based on content type
    if (contentType === 'website') {
      return await resolveWebsiteSEO(contentId, pathname);
    } else if (contentType === 'funnel') {
      return await resolveFunnelSEO(contentId, pathname);
    } else if (contentType === 'course_area') {
      return await resolveCourseAreaSEO(domain);
    }

    return null;

  } catch (error) {
    console.error('Error resolving SEO data:', error);
    return null;
  }
}

// Helper function to resolve website SEO data
async function resolveWebsiteSEO(websiteId: string, pathname: string): Promise<SEOData | null> {
  try {
    // Get website info
    const { data: website } = await supabase
      .from('websites')
      .select('name, description')
      .eq('id', websiteId)
      .single();

    if (!website) return null;

    // For root path, use website-level SEO
    if (pathname === '/' || pathname === '') {
      return {
        title: website.name || 'Website',
        description: website.description || `Visit ${website.name}`,
        og_image: undefined,
        keywords: ['website', 'online store'],
        canonical: `https://${window.location.hostname}`,
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

    // For specific pages, try to find the page
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
        canonical: `https://${window.location.hostname}${pathname}`,
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

    // Fallback to website-level SEO for unknown pages
    return {
      title: `${website.name} - ${pageSlug}`,
      description: website.description || `Visit ${website.name}`,
      og_image: undefined,
      keywords: ['website', 'page', pageSlug],
      canonical: `https://${window.location.hostname}${pathname}`,
      robots: 'index, follow',
      site_name: website.name || 'Website',
      source: 'website_fallback',
      debug: {
        websiteId,
        slug: pageSlug,
        titleSource: 'website.name + pageSlug',
        descSource: 'website.description',
        imageSource: 'none'
      }
    };

  } catch (error) {
    console.error('Error resolving website SEO:', error);
    return null;
  }
}

// Helper function to resolve funnel SEO data
async function resolveFunnelSEO(funnelId: string, pathname: string): Promise<SEOData | null> {
  try {
    // Get funnel info
    const { data: funnel } = await supabase
      .from('funnels')
      .select('name, description, seo_title, seo_description, og_image')
      .eq('id', funnelId)
      .single();

    if (!funnel) return null;

    // For root path, use funnel-level SEO
    if (pathname === '/' || pathname === '') {
      return {
        title: funnel.seo_title || funnel.name || 'Sales Funnel',
        description: funnel.seo_description || funnel.description || `Visit ${funnel.name}`,
        og_image: funnel.og_image || undefined,
        keywords: ['sales funnel', 'marketing'],
        canonical: `https://${window.location.hostname}`,
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

    // For specific steps, try to find the step
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
        canonical: `https://${window.location.hostname}${pathname}`,
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

    // Fallback to funnel-level SEO for unknown steps
    return {
      title: `${funnel.name} - ${stepSlug}`,
      description: funnel.description || `Visit ${funnel.name}`,
      og_image: funnel.og_image || undefined,
      keywords: ['sales funnel', 'step', stepSlug],
      canonical: `https://${window.location.hostname}${pathname}`,
      robots: 'index, follow',
      site_name: funnel.name || 'Sales Funnel',
      source: 'funnel_fallback',
      debug: {
        websiteId: funnelId,
        slug: stepSlug,
        titleSource: 'funnel.name + stepSlug',
        descSource: 'funnel.description',
        imageSource: 'funnel.og_image'
      }
    };

  } catch (error) {
    console.error('Error resolving funnel SEO:', error);
    return null;
  }
}

// Helper function to resolve course area SEO data
async function resolveCourseAreaSEO(domain: string): Promise<SEOData | null> {
  try {
    // Get store info from domain
    const { data: domainData } = await supabase
      .from('custom_domains')
      .select('store_id')
      .eq('domain', domain)
      .single();

    if (!domainData) return null;

    const { data: store } = await supabase
      .from('stores')
      .select('name, description')
      .eq('id', domainData.store_id)
      .single();

    if (!store) return null;

    return {
      title: `${store.name} - Course Library`,
      description: store.description || `Browse courses from ${store.name}`,
      og_image: undefined,
      keywords: ['courses', 'learning', 'education'],
      canonical: `https://${domain}`,
      robots: 'index, follow',
      site_name: store.name || 'Course Library',
      source: 'course_area',
      debug: {
        titleSource: 'store.name + Course Library',
        descSource: 'store.description',
        imageSource: 'none'
      }
    };

  } catch (error) {
    console.error('Error resolving course area SEO:', error);
    return null;
  }
}

export const config = {
  runtime: 'edge',
};

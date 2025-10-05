import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

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

interface SocialCrawlerSEOProps {
  domain: string;
  pathname: string;
  contentType?: 'website' | 'funnel' | 'course_area';
  contentId?: string;
}

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
  'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot',
  'facebookcatalog', 'Pinterestbot', 'Applebot', 'ia_archiver'
];

const isSocialCrawler = (userAgent: string): boolean => {
  return SOCIAL_CRAWLERS.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
};

export const SocialCrawlerSEO: React.FC<SocialCrawlerSEOProps> = ({ 
  domain, 
  pathname, 
  contentType,
  contentId 
}) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [isSocialBot, setIsSocialBot] = useState(false);

  useEffect(() => {
    // Check if this is a social crawler
    const userAgent = navigator.userAgent;
    const isBot = isSocialCrawler(userAgent);
    setIsSocialBot(isBot);

    if (!isBot) {
      return; // Only process SEO for social crawlers
    }

    console.log(`🤖 Social crawler detected: ${userAgent.substring(0, 80)}`);
    console.log(`🌐 Domain: ${domain}, Path: ${pathname}, Content: ${contentType}/${contentId}`);

    // Fetch SEO data based on content type
    const fetchSEOData = async () => {
      try {
        let seoData: SEOData | null = null;

        if (contentType === 'website' && contentId) {
          seoData = await resolveWebsiteSEO(contentId, pathname);
        } else if (contentType === 'funnel' && contentId) {
          seoData = await resolveFunnelSEO(contentId, pathname);
        } else if (contentType === 'course_area') {
          seoData = await resolveCourseAreaSEO(domain);
        }

        if (seoData) {
          console.log(`✅ SEO data resolved: ${seoData.title} (${seoData.source})`);
          setSeoData(seoData);
        } else {
          console.log(`❌ No SEO data found - using fallback`);
          setSeoData({
            title: domain,
            description: `Preview of ${domain}`,
            og_image: undefined,
            keywords: [],
            canonical: `https://${domain}${pathname}`,
            robots: 'index, follow',
            site_name: domain,
            source: 'fallback_no_data'
          });
        }
      } catch (error) {
        console.error('💥 Error fetching SEO data:', error);
        setSeoData({
          title: domain,
          description: `Preview of ${domain}`,
          og_image: undefined,
          keywords: [],
          canonical: `https://${domain}${pathname}`,
          robots: 'index, follow',
          site_name: domain,
          source: 'fallback_error'
        });
      }
    };

    fetchSEOData();
  }, [domain, pathname, contentType, contentId]);

  // Only render SEO meta tags for social crawlers
  if (!isSocialBot || !seoData) {
    return null;
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords.join(', ')} />
      <meta name="robots" content={seoData.robots} />
      <link rel="canonical" href={seoData.canonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seoData.canonical} />
      <meta property="og:site_name" content={seoData.site_name} />
      <meta property="og:locale" content="en_US" />
      {seoData.og_image && (
        <meta property="og:image" content={seoData.og_image} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      {seoData.og_image && (
        <meta name="twitter:image" content={seoData.og_image} />
      )}
      
      {/* Debug Headers */}
      <meta name="X-SEO-Source" content={seoData.source} />
      <meta name="X-SEO-Website" content={seoData.site_name} />
      <meta name="X-SEO-Page" content={seoData.title} />
      <meta name="X-SEO-Domain" content={domain} />
      <meta name="X-SEO-Path" content={pathname} />
      {seoData.debug?.websiteId && (
        <meta name="X-SEO-Website-Id" content={seoData.debug.websiteId} />
      )}
      {seoData.debug?.pageId && (
        <meta name="X-SEO-Page-Id" content={seoData.debug.pageId} />
      )}
      {seoData.debug?.slug && (
        <meta name="X-SEO-Slug" content={seoData.debug.slug} />
      )}
      {seoData.debug?.titleSource && (
        <meta name="X-SEO-Title-Source" content={seoData.debug.titleSource} />
      )}
      {seoData.debug?.descSource && (
        <meta name="X-SEO-Desc-Source" content={seoData.debug.descSource} />
      )}
      {seoData.debug?.imageSource && (
        <meta name="X-SEO-Image-Source" content={seoData.debug.imageSource} />
      )}
    </Helmet>
  );
};

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

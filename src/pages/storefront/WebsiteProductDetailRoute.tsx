import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import ProductDetail from '@/pages/storefront/ProductDetail';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO, buildCanonical } from '@/lib/seo';
import { MetaTags, generateDescriptionFromContent } from '@/components/MetaTags';
import { SocialDebugger } from '@/components/SocialDebugger';

interface WebsiteData {
  id: string;
  name: string;
  settings?: any;
}

interface WebsitePageData {
  id: string;
  title: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
}

export const WebsiteProductDetailRoute: React.FC = () => {
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [page, setPage] = React.useState<WebsitePageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [resolvedWebsiteId, setResolvedWebsiteId] = React.useState<string | null>(null);
  const [websiteMeta, setWebsiteMeta] = React.useState<any>(null);

  // Resolve website id if only slug is provided
  React.useEffect(() => {
    (async () => {
      if (websiteId) {
        setResolvedWebsiteId(websiteId);
        return;
      }
      if (websiteSlug) {
        try {
          const { data } = await supabase
            .from('websites')
            .select('id, settings')
            .eq('slug', websiteSlug)
            .eq('is_active', true)
            .maybeSingle();
          const id = (data as any)?.id || null;
          setResolvedWebsiteId(id);
          // Initialize currency from settings when available
          try {
            const code = (data as any)?.settings?.currency?.code || 'BDT';
            setGlobalCurrency(code as any);
          } catch {}
        } catch {
          setResolvedWebsiteId(null);
        }
      }
    })();
  }, [websiteId, websiteSlug]);

  React.useEffect(() => {
    const fetchTemplate = async () => {
      if (!resolvedWebsiteId) return;
      setLoading(true);
      try {
        const { data: website, error: wErr } = await supabase
          .from('websites')
          .select('id, name, settings, domain')
          .eq('id', resolvedWebsiteId)
          .maybeSingle();
        if (wErr || !website) {
          setPage(null);
          setLoading(false);
          return;
        }

        setWebsiteMeta(website);

        // Initialize global currency from website settings
        try {
          const code = (website as any)?.settings?.currency?.code || 'BDT';
          setGlobalCurrency(code as any);
        } catch {}

        const settings: any = (website as any).settings || {};
        const templateId: string | undefined = settings?.system_pages?.product_detail_page_id || undefined;
        if (!templateId) {
          setPage(null);
          setLoading(false);
          return;
        }

        let query = supabase
          .from('website_pages')
          .select('*')
          .eq('id', templateId)
          .eq('website_id', resolvedWebsiteId);

        if (!isPreview) {
          query = query.eq('is_published', true);
        }

        const { data: pageData, error: pErr } = await query.maybeSingle();
        if (pErr) throw pErr;
        setPage(pageData);
      } catch (e) {
        console.warn('WebsiteProductDetailRoute: failed to fetch template page', e);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [resolvedWebsiteId, isPreview]);

  // Provisional website-level SEO (runs as soon as website meta loads)
  React.useEffect(() => {
    if (!websiteMeta) return;
    const settings: any = (websiteMeta as any)?.settings || {};
    const seoSettings = settings?.seo || {};
    const canonicalDomain = settings?.canonical_domain || (websiteMeta as any)?.domain;
    const canonical = buildCanonical(undefined, canonicalDomain);
    setSEO({
      title: seoSettings?.title || websiteMeta?.name,
      description: seoSettings?.description,
      image: seoSettings?.og_image || seoSettings?.social_image_url,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : (seoSettings?.meta_robots || 'index, follow'),
      siteName: websiteMeta?.name,
      ogType: 'website',
      favicon: settings?.favicon_url,
    });
  }, [websiteMeta, isPreview]);

  // SEO handling using centralized utility
  React.useEffect(() => {
    if (!page) return;

    const settings: any = (websiteMeta as any)?.settings || {};
    const seoSettings = settings?.seo || {};
    const canonicalDomain = settings?.canonical_domain || (websiteMeta as any)?.domain;
    
    const title = page.seo_title || seoSettings?.title || page.title;
    const description = page.seo_description || seoSettings?.description;
    const image = page.og_image || seoSettings?.og_image || seoSettings?.social_image_url;
    const canonical = buildCanonical(undefined, canonicalDomain);

    setSEO({
      title,
      description,
      image,
      canonical,
      robots: seoSettings?.meta_robots || 'index, follow',
      siteName: websiteMeta?.name,
      ogType: 'product',
      favicon: settings?.favicon_url,
    });

    if (page.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = page.custom_scripts;
      document.head.appendChild(scriptElement);
      return () => {
        document.head.removeChild(scriptElement);
      };
    }
  }, [page, websiteMeta]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!page) return <ProductDetail />;

  // Generate enhanced meta tags
  const settings: any = (websiteMeta as any)?.settings || {};
  const seoSettings = settings?.seo || {};
  const canonicalDomain = settings?.canonical_domain || (websiteMeta as any)?.domain;
  
  const enhancedTitle = page?.seo_title || page?.title || websiteMeta?.name || 'EcomBuildr Store';
  const enhancedDescription = page?.seo_description || 
    generateDescriptionFromContent(page?.content) || 
    seoSettings?.description || 
    'Professional e-commerce store built with EcomBuildr';
  const enhancedImage = page?.og_image || seoSettings?.og_image || seoSettings?.social_image_url;
  const enhancedUrl = buildCanonical(undefined, canonicalDomain);

  return (
    <>
      <MetaTags
        title={enhancedTitle}
        description={enhancedDescription}
        image={enhancedImage}
        url={enhancedUrl}
        type="product"
        siteName={websiteMeta?.name || 'EcomBuildr Store'}
        robots={isPreview ? 'noindex, nofollow' : 'index, follow'}
        canonical={enhancedUrl}
        favicon={websiteMeta?.settings?.favicon_url}
      />
      <main>
        {page.content?.sections ? (
          <PageBuilderRenderer data={page.content} />
        ) : (
          <ProductDetail />
        )}
      </main>
      <SocialDebugger
        url={enhancedUrl}
        title={enhancedTitle}
        description={enhancedDescription}
        image={enhancedImage}
      />
    </>
  );
};
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import ProductDetail from '@/pages/storefront/ProductDetail';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { setGlobalCurrency } from '@/lib/currency';
import { buildCanonical } from '@/lib/seo';
import { SEOHead } from '@/components/SEOHead';
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
          .select('id, name, settings, domain, seo_title, seo_description, og_image, meta_robots, canonical_domain')
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

  // Custom scripts handling
  React.useEffect(() => {
    if (!page?.custom_scripts) return;

    const scriptElement = document.createElement('div');
    scriptElement.innerHTML = page.custom_scripts;
    document.head.appendChild(scriptElement);
    return () => {
      document.head.removeChild(scriptElement);
    };
  }, [page?.custom_scripts]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!page) return <ProductDetail />;

  // Generate enhanced meta tags
  const enhancedTitle = page?.seo_title || page?.title || websiteMeta?.name || 'EcomBuildr Store';
  const enhancedDescription = page?.seo_description || 
    generateDescriptionFromContent(page?.content) || 
    websiteMeta?.seo_description || 
    'Professional e-commerce store built with EcomBuildr';
  const enhancedImage = page?.og_image || websiteMeta?.og_image;
  const enhancedUrl = buildCanonical(undefined, websiteMeta?.canonical_domain || websiteMeta?.domain);

  return (
    <>
      <SEOHead
        title={page.seo_title || websiteMeta?.seo_title || page.title}
        description={page.seo_description || websiteMeta?.seo_description}
        ogImage={page.og_image}
        socialImageUrl={page.social_image_url}
        keywords={page.seo_keywords}
        canonical={buildCanonical(undefined, websiteMeta?.canonical_domain || websiteMeta?.domain)}
        noIndex={isPreview}
        metaRobots={websiteMeta?.meta_robots}
        siteName={websiteMeta?.name}
        ogType="product"
        useUserData={true}
      />
      <main>
        {page.content?.sections ? (
          <PageBuilderRenderer data={page.content} />
        ) : (
          <ProductDetail />
        )}
      </main>
      <SocialDebugger
        url={buildCanonical(undefined, websiteMeta?.canonical_domain || websiteMeta?.domain)}
        title={page.seo_title || websiteMeta?.seo_title || page.title}
        description={page.seo_description || websiteMeta?.seo_description}
        image={page.social_image_url || page.og_image}
      />
    </>
  );
};
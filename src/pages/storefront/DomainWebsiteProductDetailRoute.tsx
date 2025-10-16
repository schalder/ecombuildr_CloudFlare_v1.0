import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ProductDetail } from '@/pages/storefront/ProductDetail';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { setGlobalCurrency } from '@/lib/currency';
import { buildCanonical } from '@/lib/seo';
import { SEOHead } from '@/components/SEOHead';
import { MetaTags, generateDescriptionFromContent } from '@/components/MetaTags';
import { SocialDebugger } from '@/components/SocialDebugger';

interface WebsitePageData {
  id: string;
  title: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
  meta_robots?: string;
  keywords?: string;
  author?: string;
  language_code?: string;
  custom_meta_tags?: any;
  structured_data?: any;
}

interface DomainWebsiteProductDetailRouteProps {
  websiteId: string;
  website?: any;
}

export const DomainWebsiteProductDetailRoute: React.FC<DomainWebsiteProductDetailRouteProps> = ({ 
  websiteId, 
  website 
}) => {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [page, setPage] = React.useState<WebsitePageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [websiteMeta, setWebsiteMeta] = React.useState<any>(website);

  React.useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        // If website data isn't provided, fetch it
        if (!websiteMeta) {
          const { data: websiteData, error: wErr } = await supabase
            .from('websites')
            .select('id, name, settings, domain, seo_title, seo_description, og_image, meta_robots, canonical_domain')
            .eq('id', websiteId)
            .maybeSingle();
          if (wErr || !websiteData) {
            setPage(null);
            setLoading(false);
            return;
          }
          setWebsiteMeta(websiteData);
        }

        const currentWebsite = websiteMeta || website;
        
        // Initialize global currency from website settings
        try {
          const code = currentWebsite?.settings?.currency?.code || 'BDT';
          setGlobalCurrency(code as any);
        } catch {}

        const settings: any = currentWebsite?.settings || {};
        const templateId: string | undefined = settings?.system_pages?.product_detail_page_id || undefined;

        if (!templateId) {
          setPage(null);
        } else {
          let query = supabase
            .from('website_pages')
            .select('*')
            .eq('id', templateId)
            .eq('website_id', websiteId);

          if (!isPreview) {
            query = query.eq('is_published', true);
          }

          const { data: pageData, error: pErr } = await query.maybeSingle();
          if (pErr) throw pErr;
          setPage(pageData);
        }
      } catch (e) {
        console.warn('DomainWebsiteProductDetailRoute: failed to fetch template page', e);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [websiteId, isPreview, website, websiteMeta]);

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
  const currentWebsite = websiteMeta || website;
  const enhancedTitle = page?.seo_title || page?.title || currentWebsite?.name || 'EcomBuildr Store';
  const enhancedDescription = page?.seo_description || 
    generateDescriptionFromContent(page?.content) || 
    currentWebsite?.seo_description || 
    'Professional e-commerce store built with EcomBuildr';
  const enhancedImage = page?.og_image || currentWebsite?.og_image;
  const enhancedUrl = buildCanonical(undefined, currentWebsite?.canonical_domain || currentWebsite?.domain);

  return (
    <>
      <SEOHead
        title={page.seo_title || currentWebsite?.seo_title || page.title}
        description={page.seo_description || currentWebsite?.seo_description}
        ogImage={page.og_image}
        socialImageUrl={page.social_image_url}
        keywords={page.keywords ? page.keywords.split(',').map(k => k.trim()) : undefined}
        canonical={buildCanonical(undefined, currentWebsite?.canonical_domain || currentWebsite?.domain)}
        noIndex={isPreview}
        metaRobots={page.meta_robots || currentWebsite?.meta_robots}
        author={page.author}
        languageCode={page.language_code}
        customMetaTags={page.custom_meta_tags ? (typeof page.custom_meta_tags === 'string' ? JSON.parse(page.custom_meta_tags) : page.custom_meta_tags) : undefined}
        siteName={currentWebsite?.name}
        ogType="product"
        useUserData={true}
      />
      {page.content?.sections ? (
        <PageBuilderRenderer data={page.content} />
      ) : (
        <ProductDetail />
      )}
      <SocialDebugger
        url={buildCanonical(undefined, currentWebsite?.canonical_domain || currentWebsite?.domain)}
        title={page.seo_title || currentWebsite?.seo_title || page.title}
        description={page.seo_description || currentWebsite?.seo_description}
        image={page.social_image_url || page.og_image}
      />
    </>
  );
};
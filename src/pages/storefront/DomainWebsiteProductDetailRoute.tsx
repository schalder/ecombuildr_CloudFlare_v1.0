import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import ProductDetail from '@/pages/storefront/ProductDetail';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO, buildCanonical } from '@/lib/seo';

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
          setLoading(false);
          return;
        }

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
      } catch (e) {
        console.warn('DomainWebsiteProductDetailRoute: failed to fetch template page', e);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [websiteId, isPreview, website, websiteMeta]);

  // Provisional website-level SEO (runs as soon as website meta loads)
  React.useEffect(() => {
    const currentWebsite = websiteMeta || website;
    if (!currentWebsite) return;
    const canonical = buildCanonical(undefined, currentWebsite?.canonical_domain || currentWebsite?.domain);
    setSEO({
      title: currentWebsite?.seo_title || currentWebsite?.name,
      description: currentWebsite?.seo_description,
      image: currentWebsite?.og_image,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : (currentWebsite?.meta_robots || 'index, follow'),
      siteName: currentWebsite?.name,
      ogType: 'website',
      favicon: currentWebsite?.settings?.favicon_url || '/favicon.ico',
    });
  }, [websiteMeta, website, isPreview]);

  // SEO handling using centralized utility
  React.useEffect(() => {
    if (!page) return;
    const currentWebsite = websiteMeta || website;

    const title = page.seo_title || currentWebsite?.seo_title || page.title;
    const description = page.seo_description || currentWebsite?.seo_description;
    const image = page.og_image || currentWebsite?.og_image;
    const canonical = buildCanonical(undefined, currentWebsite?.canonical_domain || currentWebsite?.domain);

    setSEO({
      title,
      description,
      image,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : (page.meta_robots || currentWebsite?.meta_robots || 'index, follow'),
      siteName: currentWebsite?.name,
      ogType: 'product',
      favicon: currentWebsite?.settings?.favicon_url,
      keywords: page.keywords ? page.keywords.split(',').map(k => k.trim()) : undefined,
      author: page.author,
      languageCode: page.language_code,
      customMetaTags: page.custom_meta_tags ? (typeof page.custom_meta_tags === 'string' ? JSON.parse(page.custom_meta_tags) : page.custom_meta_tags) : undefined,
      structuredData: page.structured_data ? (typeof page.structured_data === 'string' ? JSON.parse(page.structured_data) : page.structured_data) : undefined,
    });

    if (page.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = page.custom_scripts;
      document.head.appendChild(scriptElement);
      return () => {
        document.head.removeChild(scriptElement);
      };
    }
  }, [page, websiteMeta, website]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!page) return <ProductDetail />;

  return (
    <>
      {page.content?.sections ? (
        <PageBuilderRenderer data={page.content} />
      ) : (
        <ProductDetail />
      )}
    </>
  );
};
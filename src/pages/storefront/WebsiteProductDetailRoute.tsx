import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import ProductDetail from '@/pages/storefront/ProductDetail';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';

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
  const { websiteId } = useParams<{ websiteId: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [page, setPage] = React.useState<WebsitePageData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTemplate = async () => {
      if (!websiteId) return;
      setLoading(true);
      try {
        const { data: website, error: wErr } = await supabase
          .from('websites')
          .select('id, name, settings')
          .eq('id', websiteId)
          .maybeSingle();
        if (wErr || !website) {
          setPage(null);
          setLoading(false);
          return;
        }

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
          .eq('website_id', websiteId);

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
  }, [websiteId, isPreview]);

  // Basic SEO handling for override pages
  React.useEffect(() => {
    if (!page) return;
    if (page.seo_title) document.title = page.seo_title;

    if (page.seo_description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', page.seo_description);
    }

    if (page.og_image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', page.og_image);
    }

    // Inject custom scripts if they exist
    if (page.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = page.custom_scripts;
      document.head.appendChild(scriptElement);
      return () => {
        document.head.removeChild(scriptElement);
      };
    }
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!page) return <ProductDetail />;

  return (
    <main>
      {page.content?.sections ? (
        <PageBuilderRenderer data={page.content} />
      ) : (
        <ProductDetail />
      )}
    </main>
  );
};
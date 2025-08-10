import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { setGlobalCurrency } from '@/lib/currency';

interface WebsitePageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
}

interface WebsiteOverrideRouteProps {
  slug: string;
  fallback: React.ReactElement;
}

export const WebsiteOverrideRoute: React.FC<WebsiteOverrideRouteProps> = ({ slug, fallback }) => {
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const [page, setPage] = React.useState<WebsitePageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [resolvedWebsiteId, setResolvedWebsiteId] = React.useState<string | null>(null);

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
            .select('id')
            .eq('slug', websiteSlug)
            .eq('is_active', true)
            .maybeSingle();
          setResolvedWebsiteId((data as any)?.id || null);
        } catch {
          setResolvedWebsiteId(null);
        }
      }
    })();
  }, [websiteId, websiteSlug]);

  React.useEffect(() => {
    const fetchPage = async () => {
      if (!resolvedWebsiteId) return;
      setLoading(true);
      try {
        let query = supabase
          .from('website_pages')
          .select('*')
          .eq('website_id', resolvedWebsiteId)
          .eq('slug', slug);

        if (!isPreview) {
          query = query.eq('is_published', true);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        setPage(data);
      } catch (e) {
        console.warn('WebsiteOverrideRoute: failed to fetch override page', e);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [resolvedWebsiteId, slug, isPreview]);

  // Ensure global currency is set for override routes
  React.useEffect(() => {
    (async () => {
      if (!resolvedWebsiteId) return;
      try {
        const { data } = await supabase
          .from('websites')
          .select('settings')
          .eq('id', resolvedWebsiteId)
          .maybeSingle();
        const code = (data as any)?.settings?.currency?.code || 'BDT';
        setGlobalCurrency(code as any);
      } catch (e) {
        // ignore
      }
    })();
  }, [resolvedWebsiteId]);

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

  if (!page) return fallback;

  return (
    <main>
      {page.content?.sections ? (
        <PageBuilderRenderer data={page.content} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
          <p className="text-muted-foreground">This page is still being set up.</p>
        </div>
      )}
    </main>
  );
};
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO, buildCanonical } from '@/lib/seo';

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
  websiteId?: string;
}

export const WebsiteOverrideRoute: React.FC<WebsiteOverrideRouteProps> = ({ slug, fallback, websiteId: propsWebsiteId }) => {
  const { websiteId: paramsWebsiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const websiteId = propsWebsiteId || paramsWebsiteId;
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

  // Ensure global currency is set and load website meta
  React.useEffect(() => {
    (async () => {
      if (!resolvedWebsiteId) return;
      try {
        const { data } = await supabase
          .from('websites')
          .select('name, settings, domain, seo_title, seo_description, og_image, meta_robots, canonical_domain')
          .eq('id', resolvedWebsiteId)
          .maybeSingle();
        const code = (data as any)?.settings?.currency?.code || 'BDT';
        setGlobalCurrency(code as any);
        setWebsiteMeta(data);
      } catch (e) {
        // ignore
      }
    })();
  }, [resolvedWebsiteId]);

  // Provisional website-level SEO (runs as soon as website meta loads)
  React.useEffect(() => {
    if (!websiteMeta) return;
    const canonical = buildCanonical(undefined, websiteMeta?.canonical_domain || websiteMeta?.domain);
    setSEO({
      title: websiteMeta?.seo_title || websiteMeta?.name,
      description: websiteMeta?.seo_description,
      image: websiteMeta?.og_image,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : (websiteMeta?.meta_robots || 'index, follow'),
      siteName: websiteMeta?.name,
      ogType: 'website',
      favicon: websiteMeta?.settings?.favicon_url || '/favicon.ico',
    });
  }, [websiteMeta, isPreview]);

  // SEO handling using centralized utility
  React.useEffect(() => {
    if (!page) return;

    const title = page.seo_title || (websiteMeta?.name ? `${page.title} - ${websiteMeta.name}` : page.title);
    const description = page.seo_description || websiteMeta?.seo_description;
    const image = page.og_image || websiteMeta?.og_image;
    const canonical = buildCanonical(undefined, websiteMeta?.canonical_domain || websiteMeta?.domain);

    setSEO({
      title,
      description,
      image,
      canonical,
      robots: websiteMeta?.meta_robots || 'index, follow',
      siteName: websiteMeta?.name,
      ogType: 'website',
      favicon: websiteMeta?.settings?.favicon_url || '/favicon.ico',
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
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { ScriptManager } from '@/components/storefront/optimized/ScriptManager';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO, buildCanonical } from '@/lib/seo';
import { optimizedWebsitePageQuery } from '@/components/storefront/optimized/DataOptimizer';
import { PerformanceMonitor } from '@/components/storefront/optimized/PerformanceMonitor';
import { FontOptimizer } from '@/components/storefront/optimized/FontOptimizer';

interface WebsitePageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
  seo_keywords?: string[];
  meta_author?: string;
  canonical_url?: string;
  custom_meta_tags?: any;
  social_image_url?: string;
  language_code?: string;
  meta_robots?: string;
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
          .select(optimizedWebsitePageQuery.select)
          .eq('website_id', resolvedWebsiteId)
          .eq('slug', slug);

        if (!isPreview) {
          query = query.eq('is_published', true);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (data) {
          setPage(data as unknown as WebsitePageData);
        } else {
          setPage(null);
        }
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
  // Also set provisional SEO (especially favicon) as early as possible
  React.useEffect(() => {
    (async () => {
      if (!resolvedWebsiteId) return;
      try {
        const { data } = await supabase
          .from('websites')
          .select('name, settings, domain')
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
    const canonical = buildCanonical(undefined, websiteMeta?.domain);
    setSEO({
      title: websiteMeta?.name,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : 'index, follow',
      siteName: websiteMeta?.name,
      ogType: 'website',
      favicon: websiteMeta?.settings?.favicon_url,
    });
  }, [websiteMeta, isPreview]);

  // SEO handling using centralized utility
  React.useEffect(() => {
    if (!page) return;

    const title = page.seo_title || (websiteMeta?.name ? `${page.title} - ${websiteMeta.name}` : page.title);
    const description = page.seo_description;
    const image = page.social_image_url || page.og_image;
    const canonical = page.canonical_url || buildCanonical(undefined, websiteMeta?.domain);
    const keywords = page.seo_keywords || [];
    const author = page.meta_author;
    const robots = page.meta_robots || 'index, follow';
    const languageCode = page.language_code || 'en';
    const customMetaTags = Object.entries((page.custom_meta_tags as Record<string, string>) || {}).map(([name, content]) => ({ name, content }));

    setSEO({
      title,
      description,
      image,
      socialImageUrl: page.social_image_url,
      keywords,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : robots,
      author,
      languageCode,
      customMetaTags,
      siteName: websiteMeta?.name,
      ogType: 'website',
      favicon: websiteMeta?.settings?.favicon_url,
    });

    // Custom scripts are handled by ScriptManager in StorefrontPageBuilder
  }, [page, websiteMeta, isPreview]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!page) return fallback;

  return (
    <>
      <FontOptimizer />
      <PerformanceMonitor page={`website-${slug}`} />
      <main>
        {page.content?.sections ? (
          <>
            <PageBuilderRenderer data={page.content} />
            <ScriptManager customScripts={page.custom_scripts} />
          </>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
            <p className="text-muted-foreground">This page is still being set up.</p>
          </div>
        )}
      </main>
    </>
  );
};
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { StorefrontPageBuilder } from '@/components/storefront/renderer/StorefrontPageBuilder';
import { ScriptManager } from '@/components/storefront/optimized/ScriptManager';
import { setGlobalCurrency } from '@/lib/currency';
import { buildCanonical } from '@/lib/seo';
import { SEOHead } from '@/components/SEOHead';
import { optimizedWebsitePageQuery } from '@/components/storefront/optimized/DataOptimizer';
import { PerformanceMonitor } from '@/components/storefront/optimized/PerformanceMonitor';
import { FontOptimizer } from '@/components/storefront/optimized/FontOptimizer';
import { CourseOrderConfirmation } from '@/components/course/CourseOrderConfirmation';

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
  const sf = searchParams.get('sf');
  const useStorefront = sf === '0' ? false : true;
  const orderIdParam = searchParams.get('orderId');
  const tokenParam = searchParams.get('ot') || searchParams.get('token');
  const isCourseOrderOverride = slug === 'order-confirmation' && !!orderIdParam && !tokenParam;
  if (isCourseOrderOverride) {
    console.log('[WebsiteOverrideRoute] course-order-override active', { slug, orderId: orderIdParam, tokenPresent: !!tokenParam });
  }
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
          .select(useStorefront ? optimizedWebsitePageQuery.select : '*')
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

  // Custom scripts are now handled by ScriptManager for storefront renderer
  React.useEffect(() => {
    if (!useStorefront && page?.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = page.custom_scripts;
      document.head.appendChild(scriptElement);
      return () => {
        document.head.removeChild(scriptElement);
      };
    }
  }, [useStorefront, page?.custom_scripts]);

  if (isCourseOrderOverride) {
    console.log('[WebsiteOverrideRoute] rendering CourseOrderConfirmation override');
    return (
      <>
        <FontOptimizer />
        <PerformanceMonitor page={`course-order-confirmation`} />
        <main>
          <CourseOrderConfirmation />
        </main>
      </>
    );
  }

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
      <SEOHead
        title={page.seo_title || (websiteMeta?.name ? `${page.title} - ${websiteMeta.name}` : page.title)}
        description={page.seo_description}
        ogImage={page.og_image}
        socialImageUrl={page.social_image_url}
        keywords={page.seo_keywords}
        canonical={page.canonical_url || buildCanonical(undefined, websiteMeta?.domain)}
        noIndex={isPreview}
        metaRobots={page.meta_robots}
        author={page.meta_author}
        languageCode={page.language_code}
        customMetaTags={Object.entries((page.custom_meta_tags as Record<string, string>) || {}).map(([name, content]) => ({ name, content }))}
        siteName={websiteMeta?.name}
        ogType="website"
        useUserData={true}
      />
      <FontOptimizer />
      <PerformanceMonitor page={`website-${slug}`} />
      <main>
        {page.content?.sections ? (
          useStorefront ? (
            <>
              <StorefrontPageBuilder data={page.content} />
              <ScriptManager customScripts={page.custom_scripts} />
            </>
          ) : (
            <PageBuilderRenderer data={page.content} />
          )
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
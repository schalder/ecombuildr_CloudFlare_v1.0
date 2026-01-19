import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { useStore } from '@/contexts/StoreContext';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO } from '@/lib/seo';
import { useStorefrontWebsiteId, useStorefrontWebsite, useStorefrontWebsitePage } from '@/hooks/useStorefrontData';
interface WebsitePageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
  is_homepage: boolean;
  website_id: string;
  canonical_url?: string;
  meta_robots?: string;
}

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings?: any;
}

export const WebsitePage: React.FC = () => {
  const { websiteId, websiteSlug, pageSlug } = useParams<{ websiteId?: string; websiteSlug?: string; pageSlug?: string }>();
  const { loadStoreById } = useStore();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  // ✅ OPTIMIZATION: Use optimized hooks with aggressive caching
  // Resolve website ID from slug if needed
  const { data: resolvedWebsiteIdFromSlug, isLoading: resolvingSiteId } = useStorefrontWebsiteId(websiteSlug || null);
  const resolvedWebsiteId = websiteId || resolvedWebsiteIdFromSlug;

  // ✅ OPTIMIZATION: Fetch website and page in parallel with caching
  const { data: website, isLoading: websiteLoading, error: websiteError } = useStorefrontWebsite(resolvedWebsiteId);
  const { data: page, isLoading: pageLoading, error: pageError } = useStorefrontWebsitePage(
    resolvedWebsiteId,
    pageSlug || null,
    isPreview
  );

  const loading = resolvingSiteId || websiteLoading || pageLoading;
  const error = websiteError || pageError 
    ? (websiteError?.message || pageError?.message || 'Failed to load page')
    : (!loading && (!page || !website) ? 'Page not found' : null);

  // ✅ OPTIMIZATION: Load store in parallel (non-blocking)
  useEffect(() => {
    if (website?.store_id) {
      loadStoreById(website.store_id).catch(() => {
        // Silently fail - store context is optional for some pages
      });
    }
  }, [website?.store_id, loadStoreById]);

  // Set up SEO metadata from page-level settings only
  useEffect(() => {
    if (!page || !website) return;

    // Use only page-level SEO - no website fallbacks
    const title = page.seo_title || `${page.title} - ${website.name}`;
    const description = page.seo_description;
    const image = page.og_image;
    const canonical = page.canonical_url;

    setSEO({
      title: title || undefined,
      description,
      image,
      canonical,
      robots: isPreview ? 'noindex, nofollow' : (page.meta_robots || 'index, follow'),
      siteName: website.name,
      ogType: 'website',
      favicon: (website as any)?.settings?.favicon_url,
    });

    // Inject custom scripts if they exist
    if (page.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = page.custom_scripts;
      document.head.appendChild(scriptElement);
      return () => {
        if (document.head.contains(scriptElement)) {
          document.head.removeChild(scriptElement);
        }
      };
    }
  }, [page, website, isPreview]);

  // Ensure global currency matches website settings on WebsitePage routes
  useEffect(() => {
    const code = (website?.settings?.currency?.code as string) || 'BDT';
    try { setGlobalCurrency(code as any); } catch {}
  }, [website?.settings?.currency?.code]);

  // ✅ OPTIMIZATION: Show error state immediately if data failed to load
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Website: {websiteSlug || websiteId || 'unknown'} | Page: {pageSlug || 'homepage'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <main>
        {page?.content?.sections ? (
          <PageBuilderRenderer data={page.content} />
        ) : page ? (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
            <p className="text-muted-foreground">This page is still being set up.</p>
          </div>
        ) : (
          <div className="w-full min-h-screen" />
        )}
      </main>
    </div>
  );
};
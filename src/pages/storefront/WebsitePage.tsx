import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { useStore } from '@/contexts/StoreContext';
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
  is_homepage: boolean;
  website_id: string;
}

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings?: any;
}

export const WebsitePage: React.FC = () => {
  const { websiteId, websiteSlug, pageSlug } = useParams<{ websiteId?: string; websiteSlug?: string; pageSlug?: string }>();
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [page, setPage] = useState<WebsitePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadStoreById } = useStore();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const [resolvedWebsiteId, setResolvedWebsiteId] = useState<string | null>(null);
  const [resolvingSiteId, setResolvingSiteId] = useState(true);
  useEffect(() => {
    let active = true;
    setResolvingSiteId(true);
    (async () => {
      try {
        if (websiteId) {
          if (!active) return;
          setResolvedWebsiteId(websiteId);
        } else if (websiteSlug) {
          const { data } = await supabase
            .from('websites')
            .select('id')
            .eq('slug', websiteSlug)
            .eq('is_active', true)
            .maybeSingle();
          if (!active) return;
          setResolvedWebsiteId((data as any)?.id || null);
        } else {
          if (!active) return;
          setResolvedWebsiteId(null);
        }
      } catch {
        if (!active) return;
        setResolvedWebsiteId(null);
      } finally {
        if (!active) return;
        setResolvingSiteId(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [websiteId, websiteSlug]);

  useEffect(() => {
    const fetchWebsiteAndPage = async () => {
      if (resolvingSiteId) {
        setLoading(true);
        return;
      }

      if (!resolvedWebsiteId) {
        setError('Invalid website URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('WebsitePage: Fetching website and page:', { resolvedWebsiteId, pageSlug });

        // First fetch the website to check if it's active
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', resolvedWebsiteId)
          .eq('is_active', true)
          .maybeSingle();

        if (websiteError) {
          console.error('WebsitePage: Error fetching website:', websiteError);
          setError('Failed to load website');
          return;
        }

        if (!websiteData) {
          console.log('WebsitePage: Website not found or not published:', resolvedWebsiteId);
          setError('Website not found or not available');
          return;
        }

        setWebsite(websiteData);

        // Ensure StoreContext is populated for ecommerce elements
        try {
          await loadStoreById(websiteData.store_id);
        } catch (e) {
          console.warn('WebsitePage: loadStoreById failed', e);
        }

        // Then fetch the website page
        let pageQuery = supabase
          .from('website_pages')
          .select('*')
          .eq('website_id', resolvedWebsiteId);

        if (!isPreview) {
          pageQuery = pageQuery.eq('is_published', true);
        }

        if (pageSlug) {
          // Fetch specific page by slug
          pageQuery = pageQuery.eq('slug', pageSlug);
        } else {
          // Fetch homepage if no slug provided
          pageQuery = pageQuery.eq('is_homepage', true);
        }

        const { data: pageData, error: pageError } = await pageQuery.maybeSingle();

        if (pageError) {
          console.error('WebsitePage: Error fetching page:', pageError);
          setError('Failed to load page');
          return;
        }

        if (!pageData) {
          console.log('WebsitePage: Page not found:', pageSlug || 'homepage');
          setError(pageSlug ? `Page "${pageSlug}" not found` : 'Homepage not found');
          return;
        }

        console.log('WebsitePage: Website and page loaded successfully:', { websiteData, pageData });
        setPage(pageData);
      } catch (err) {
        console.error('WebsitePage: Error fetching data:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteAndPage();
  }, [resolvedWebsiteId, pageSlug, loadStoreById, isPreview, resolvingSiteId]);

  // Set up SEO metadata
  useEffect(() => {
    if (page) {
      if (page.seo_title) {
        document.title = page.seo_title;
      } else if (page.title && website?.name) {
        document.title = `${page.title} - ${website.name}`;
      }

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

        // Cleanup function to remove scripts when component unmounts
        return () => {
          document.head.removeChild(scriptElement);
        };
      }
    }
  }, [page, website]);

  // Ensure global currency matches website settings on WebsitePage routes
  useEffect(() => {
    const code = (website?.settings?.currency?.code as string) || 'BDT';
    try { setGlobalCurrency(code as any); } catch {}
  }, [website?.settings?.currency?.code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !page || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested page could not be found.'}</p>
          <p className="text-sm text-muted-foreground mt-2">Website: {websiteSlug || websiteId || 'unknown'} | Page: {pageSlug || 'homepage'}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full min-h-screen">
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
    </div>
  );
};
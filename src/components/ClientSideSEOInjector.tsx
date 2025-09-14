import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { setSEO, buildCanonical } from '@/lib/seo';
import { useStorefrontRenderer } from '@/hooks/useStorefrontRenderer';

export const ClientSideSEOInjector: React.FC = () => {
  const location = useLocation();
  const { useStorefront } = useStorefrontRenderer();
  const { seoData, loading } = useSEO(location.pathname || '/');

  useEffect(() => {
    if (!useStorefront) return; // Only inject on public/storefront pages
    if (loading) return;
    if (!seoData) return;

    try {
      const existingDesc = document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
        ?.trim();

      const isPlaceholder = !existingDesc || /Dynamic SEO tags|will be loaded here/i.test(existingDesc);

      // Only inject if description is missing/placeholder to avoid overriding explicit page SEO
      if (!isPlaceholder) return;

      const canonical = buildCanonical(location.pathname, window.location.origin);

      setSEO({
        title: seoData.title,
        description: seoData.description,
        socialImageUrl: seoData.og_image || undefined,
        keywords: seoData.keywords,
        canonical,
        robots: 'index, follow',
        siteName: (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content || undefined,
        ogType: 'website',
        languageCode: document.documentElement.lang || undefined,
      });
    } catch (e) {
      console.warn('Client-side SEO injection failed:', e);
    }
  }, [useStorefront, loading, seoData, location.pathname]);

  return null;
};

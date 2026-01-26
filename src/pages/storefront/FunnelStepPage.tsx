import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { useStore } from '@/contexts/StoreContext';
import { setSEO, buildCanonical } from '@/lib/seo';
import { PixelManager } from '@/components/pixel/PixelManager';
import { FunnelHeader } from '@/components/storefront/FunnelHeader';
import { FunnelFooter } from '@/components/storefront/FunnelFooter';
import { FunnelStepProvider } from '@/contexts/FunnelStepContext';
import { useStorefrontFunnelStep } from '@/hooks/useStorefrontData';
import { TrackingCodeManager } from '@/components/tracking/TrackingCodeManager';
interface FunnelStepData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
  step_type: string;
  step_order: number;
  funnel_id: string;
}

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings?: any;
}

export const FunnelStepPage: React.FC = () => {
  const { funnelId, stepSlug } = useParams<{ funnelId: string; stepSlug?: string }>();
  const { loadStoreById, store } = useStore();
  const navigate = useNavigate();

  // ✅ OPTIMIZATION: Use optimized hook with aggressive caching and parallel fetching
  const { data: funnelStepData, isLoading, error } = useStorefrontFunnelStep(funnelId || null, stepSlug || null);

  const funnel = funnelStepData?.funnel;
  const step = funnelStepData?.step;

  // ✅ OPTIMIZATION: Handle redirect to first step if no stepSlug (only once)
  useEffect(() => {
    if (!isLoading && funnel && !stepSlug && step?.slug) {
      navigate(`/funnel/${funnelId}/${step.slug}`, { replace: true });
    }
  }, [isLoading, funnel, step, stepSlug, funnelId, navigate]);

  // ✅ OPTIMIZATION: Load store in parallel (non-blocking)
  useEffect(() => {
    if (funnel?.store_id) {
      loadStoreById(funnel.store_id).catch(() => {
        // Silently fail - store context is optional for some pages
      });
    }
  }, [funnel?.store_id, loadStoreById]);

  // Provisional funnel-level SEO (runs as soon as funnel loads)
  useEffect(() => {
    if (!funnel) return;
    const canonical = buildCanonical(undefined, (funnel as any)?.canonical_domain);
    setSEO({
      title: ((funnel as any)?.seo_title || funnel.name) || undefined,
      description: ((funnel as any)?.seo_description || funnel.description) || undefined,
      image: (funnel as any)?.og_image,
      canonical,
      robots: (funnel as any)?.meta_robots || 'index, follow',
      siteName: funnel.name,
      ogType: 'website',
      favicon: store?.favicon_url,
    });
  }, [funnel, store]);

  // Set up SEO metadata using centralized utility
  useEffect(() => {
    if (!step || !funnel) return;

    const title = step.seo_title || (step.title && funnel.name ? `${step.title} - ${funnel.name}` : step.title);
    const description = step.seo_description || (funnel as any)?.seo_description || funnel.description;
    const image = step.og_image || (funnel as any)?.og_image;
    const canonical = buildCanonical(undefined, (funnel as any)?.canonical_domain);

    setSEO({
      title: title || undefined,
      description,
      image,
      canonical,
      robots: (funnel as any)?.meta_robots || 'index, follow',
      siteName: funnel.name,
      ogType: 'website',
      favicon: funnel?.settings?.favicon_url || store?.favicon_url,
    });

    // Inject custom scripts if they exist
    if (step.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = step.custom_scripts;
      document.head.appendChild(scriptElement);

      // Cleanup function to remove scripts when component unmounts
      return () => {
        document.head.removeChild(scriptElement);
      };
    }
  }, [step, funnel, store]);

  // ✅ OPTIMIZATION: Show error state immediately if data failed to load
  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : 'The requested page could not be found.'}</p>
          <p className="text-sm text-muted-foreground mt-2">Funnel: {funnelId} | Step: {stepSlug}</p>
        </div>
      </div>
    );
  }

  // Show loading state or redirecting state
  if (isLoading || (!stepSlug && step?.slug)) {
    return <div className="w-full min-h-screen" />;
  }

  return (
    <FunnelStepProvider stepId={step?.id || ''} funnelId={funnel?.id || ''}>
      <PixelManager
        websitePixels={{
          facebook_pixel_id: funnel?.settings?.facebook_pixel_id,
          google_analytics_id: funnel?.settings?.google_analytics_id,
          google_ads_id: funnel?.settings?.google_ads_id,
          tiktok_pixel_id: funnel?.settings?.tiktok_pixel_id,
        }}
        storeId={funnel?.store_id || ''}
        funnelId={funnel?.id || ''}
      >
        <TrackingCodeManager 
          headerCode={funnel?.settings?.header_tracking_code}
          footerCode={funnel?.settings?.footer_tracking_code}
          priority="funnel"
        />
        <div className="w-full min-h-screen">
          {funnel && <FunnelHeader funnel={funnel} />}
          {/* Render funnel step content using PageBuilderRenderer */}
          {step?.content?.sections ? (
            <PageBuilderRenderer data={step.content} />
          ) : step ? (
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold mb-6">{step.title}</h1>
              <p className="text-muted-foreground">This step is still being set up.</p>
            </div>
          ) : (
            <div className="w-full min-h-screen" />
          )}
          {funnel && <FunnelFooter funnel={funnel} />}
        </div>
      </PixelManager>
    </FunnelStepProvider>
  );
};
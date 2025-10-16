import React from 'react';
import { Outlet, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { setGlobalCurrency } from '@/lib/currency';
import { PixelManager } from '@/components/pixel/PixelManager';
import { WebsiteProvider } from '@/contexts/WebsiteContext';
import { FloatingCartButton } from '@/components/storefront/FloatingCartButton';
import { SupportWidget } from '@/components/storefront/SupportWidget';
import { TrackingCodeManager } from '@/components/tracking/TrackingCodeManager';
import { FOMOManager } from '@/components/storefront/FOMOManager';
import { SEOHead } from '@/components/SEOHead';

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

export const WebsiteLayout: React.FC = () => {
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get('preview') === '1';
  const [website, setWebsite] = React.useState<WebsiteData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { store, loadStoreById } = useStore();

  React.useEffect(() => {
    const loadWebsite = async () => {
      if (!websiteId && !websiteSlug) return;
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('websites')
          .select('*')
          .eq(websiteId ? 'id' : 'slug', (websiteId || websiteSlug) as string)
          .eq('is_active', true);
        // For preview, don't filter by is_published; RLS will allow owners
        if (!isPreview) {
          // no extra filter; RLS already restricts public to is_published=true
        }
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (!data) {
          setError('Website not found or not available');
          return;
        }
        setWebsite(data as WebsiteData);
        try {
          await loadStoreById((data as WebsiteData).store_id);
        } catch (e) {
          console.warn('WebsiteLayout: loadStoreById failed', e);
        }
      } catch (e: any) {
        console.error('WebsiteLayout: Error loading website', e);
        setError('Failed to load website');
      } finally {
        setLoading(false);
      }
    };
    loadWebsite();
  }, [websiteId, websiteSlug, isPreview, loadStoreById]);

  // Redirect legacy /website/:id to clean /site/:slug while preserving the rest of the path
  React.useEffect(() => {
    if (website && websiteId && !websiteSlug) {
      const current = window.location.pathname + window.location.search + window.location.hash;
      const next = current.replace(`/website/${websiteId}`, `/site/${website.slug}`);
      if (next !== current) {
        navigate(next, { replace: true });
      }
    }
  }, [website, websiteId, websiteSlug, navigate]);

  React.useEffect(() => {
    const code = (website?.settings?.currency?.code as string) || 'BDT';
    try { setGlobalCurrency(code as any); } catch {}
  }, [website?.settings?.currency?.code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Website Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested website could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <WebsiteProvider websiteId={website.id} websiteSlug={website.slug}>
      <SEOHead
        title={website.seo_title || website.name}
        description={website.seo_description || website.description}
        ogImage={website.social_image_url || website.og_image}
        socialImageUrl={website.social_image_url}
        keywords={website.seo_keywords ? website.seo_keywords.split(',').map(k => k.trim()) : []}
        canonical={website.canonical_url || window.location.href}
        noIndex={website.meta_robots === 'noindex, nofollow'}
        author={website.meta_author}
        languageCode={website.language_code}
        metaRobots={website.meta_robots}
        customMetaTags={website.custom_meta_tags || []}
      />
      <PixelManager websitePixels={website.settings} storeId={website.store_id}>
        <TrackingCodeManager 
          headerCode={website.settings?.header_tracking_code}
          footerCode={website.settings?.footer_tracking_code}
          priority="website"
        />
        <div className="min-h-screen flex flex-col bg-background">
        <style>{`
          :root {
            ${store?.primary_color ? `--store-primary: ${store.primary_color};` : '--store-primary: #10B981;'}
            ${store?.secondary_color ? `--store-secondary: ${store.secondary_color};` : '--store-secondary: #059669;'}
            ${website.settings?.product_button_bg ? `--product-button-bg: ${website.settings.product_button_bg};` : ''}
            ${website.settings?.product_button_text ? `--product-button-text: ${website.settings.product_button_text};` : ''}
            ${website.settings?.product_button_hover_bg ? `--product-button-hover-bg: ${website.settings.product_button_hover_bg};` : ''}
            ${website.settings?.product_button_hover_text ? `--product-button-hover-text: ${website.settings.product_button_hover_text};` : ''}
            ${website.settings?.variant_button_selected_bg ? `--variant-button-selected-bg: ${website.settings.variant_button_selected_bg};` : ''}
            ${website.settings?.variant_button_selected_text ? `--variant-button-selected-text: ${website.settings.variant_button_selected_text};` : ''}
            ${website.settings?.variant_button_hover_bg ? `--variant-button-hover-bg: ${website.settings.variant_button_hover_bg};` : ''}
            ${website.settings?.variant_button_hover_text ? `--variant-button-hover-text: ${website.settings.variant_button_hover_text};` : ''}
          }
        `}</style>
            <WebsiteHeader website={website} />
            <main className="flex-1">
              <Outlet />
            </main>
            {(website.settings?.floating_cart?.enabled ?? true) && (
              <FloatingCartButton 
                position={website.settings?.floating_cart?.position ?? 'bottom-right'} 
                color={website.settings?.floating_cart?.color}
              />
            )}
            {website.settings?.support_widget?.enabled && (
              <SupportWidget website={website} />
            )}
            {website.settings?.fomo?.enabled && (
              <FOMOManager 
                websiteId={website.id}
                settings={website.settings.fomo}
                onProductClick={(productName) => {
                  // Navigate to products page or search for product
                  console.log('Clicked product:', productName);
                }}
              />
            )}
            <WebsiteFooter website={website} />
          </div>
      </PixelManager>
    </WebsiteProvider>
  );
};

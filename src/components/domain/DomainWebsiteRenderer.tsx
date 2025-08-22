import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO } from '@/lib/seo';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { DomainWebsiteRouter } from './DomainWebsiteRouter';
import { WebsiteProvider } from '@/contexts/WebsiteContext';

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings?: any;
  stores?: any;
}

interface DomainWebsiteRendererProps {
  websiteId: string;
  customDomain: string;
}

export const DomainWebsiteRenderer: React.FC<DomainWebsiteRendererProps> = ({ 
  websiteId, 
  customDomain 
}) => {
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadStoreById } = useStore();
  const { updatePixels } = usePixelContext();

  useEffect(() => {
    const fetchWebsiteData = async () => {
      try {
        // Fetch website data
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', websiteId)
          .eq('is_published', true)
          .eq('is_active', true)
          .single();

        if (websiteError) {
          throw websiteError;
        }

        // Fetch the related store data
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', websiteData.store_id)
          .eq('is_active', true)
          .single();

        if (storeError) {
          throw storeError;
        }

        // Combine the data
        const combinedWebsiteData = {
          ...websiteData,
          stores: storeData
        };

        setWebsite(combinedWebsiteData as WebsiteData);

        // Load the store into context
        if (storeData) {
          await loadStoreById(storeData.id);
        }

        // Update pixels with website-specific settings
        if (updatePixels && combinedWebsiteData.settings) {
          console.debug('[DomainWebsiteRenderer] Updating pixels with website settings:', combinedWebsiteData.settings);
          const settings = combinedWebsiteData.settings as any;
          updatePixels({
            facebook_pixel_id: settings?.facebook_pixel_id,
            google_analytics_id: settings?.google_analytics_id,
            google_ads_id: settings?.google_ads_id,
          });
        }
      } catch (error) {
        console.error('Error fetching website data:', error);
        setError('Failed to load website');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteData();
  }, [websiteId, loadStoreById]);

  // Set global currency when store data is available
  React.useEffect(() => {
    const code = (website?.settings?.currency?.code as string) || 'BDT';
    try { setGlobalCurrency(code as any); } catch {}
  }, [website?.settings?.currency?.code]);

  // Set favicon - check website first, then store fallback
  React.useEffect(() => {
    const faviconUrl = website?.settings?.favicon_url || website?.stores?.favicon_url;
    if (faviconUrl) {
      setSEO({
        favicon: faviconUrl,
      });
    }
  }, [website?.settings?.favicon_url, website?.stores?.favicon_url]);

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error if website not found or error occurred
  if (error || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Website Not Found</h1>
          <p className="text-muted-foreground">
            {error || 'The requested website could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  // Set CSS variables for primary/secondary colors if store has them
  const storeData = website.stores;
  
  // Render the website with proper layout structure matching WebsiteLayout
  return (
    <WebsiteProvider websiteId={websiteId} websiteSlug={website.slug}>
      <div className="min-h-screen flex flex-col bg-background">
        <style>{`
          :root {
            ${storeData?.primary_color ? `--store-primary: ${storeData.primary_color};` : '--store-primary: #10B981;'}
            ${storeData?.secondary_color ? `--store-secondary: ${storeData.secondary_color};` : '--store-secondary: #059669;'}
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
        <DomainWebsiteRouter 
          websiteId={websiteId} 
          customDomain={customDomain}
          website={website}
        />
      </div>
    </WebsiteProvider>
  );
};
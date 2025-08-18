import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { setSEO, buildCanonical } from '@/lib/seo';
import { Loader2 } from 'lucide-react';
import { DomainFunnelRouter } from './DomainFunnelRouter';

interface DomainFunnelRendererProps {
  funnelId: string;
  customDomain: string;
}

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  meta_robots?: string;
  canonical_domain?: string;
  seo_keywords?: string[];
  meta_author?: string;
  canonical_url?: string;
  custom_meta_tags?: any;
  social_image_url?: string;
  language_code?: string;
}

export const DomainFunnelRenderer: React.FC<DomainFunnelRendererProps> = ({ 
  funnelId, 
  customDomain 
}) => {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadStoreById, store } = useStore();

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the funnel
        const { data: funnelData, error: funnelError } = await supabase
          .from('funnels')
          .select('*')
          .eq('id', funnelId)
          .eq('is_published', true)
          .eq('is_active', true)
          .maybeSingle();

        if (funnelError) {
          console.error('Error fetching funnel:', funnelError);
          setError('Failed to load funnel');
          return;
        }

        if (!funnelData) {
          setError('Funnel not found or not available');
          return;
        }

        setFunnel(funnelData);

        // Load store data for ecommerce elements
        try {
          await loadStoreById(funnelData.store_id);
        } catch (e) {
          console.warn('Failed to load store data:', e);
        }
      } catch (err) {
        console.error('Error in DomainFunnelRenderer:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelData();
  }, [funnelId, loadStoreById]);

  // Set up SEO metadata
  useEffect(() => {
    if (!funnel) return;

    const title = funnel.seo_title || funnel.name || undefined;
    const description = funnel.seo_description || funnel.description || undefined;
    const image = funnel.social_image_url || funnel.og_image;
    const canonical = funnel.canonical_url || buildCanonical(undefined, customDomain);
    const keywords = funnel.seo_keywords || [];
    const author = funnel.meta_author;
    const robots = funnel.meta_robots || 'index, follow';
    const languageCode = funnel.language_code || 'en';
    const customMetaTags = Object.entries((funnel.custom_meta_tags as Record<string, string>) || {}).map(([name, content]) => ({ name, content }));

    setSEO({
      title,
      description,
      image,
      socialImageUrl: funnel.social_image_url,
      keywords,
      canonical,
      robots,
      author,
      languageCode,
      customMetaTags,
      siteName: funnel.name,
      ogType: 'website',
      favicon: funnel?.settings?.favicon_url || store?.favicon_url,
    });
  }, [funnel, customDomain, store]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Funnel Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested funnel could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <DomainFunnelRouter funnel={funnel} />
  );
};
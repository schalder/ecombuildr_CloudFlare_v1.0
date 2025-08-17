import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { useStore } from '@/contexts/StoreContext';
import { setSEO, buildCanonical } from '@/lib/seo';
import { PixelManager } from '@/components/pixel/PixelManager';
import { FunnelHeader } from '@/components/storefront/FunnelHeader';
import { FunnelFooter } from '@/components/storefront/FunnelFooter';
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
}

export const FunnelStepPage: React.FC = () => {
  const { funnelId, stepSlug } = useParams<{ funnelId: string; stepSlug: string }>();
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [step, setStep] = useState<FunnelStepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadStoreById, store } = useStore();
  useEffect(() => {
    const fetchFunnelAndStep = async () => {
      if (!funnelId || !stepSlug) {
        setError('Invalid funnel or step URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('FunnelStepPage: Fetching funnel and step:', { funnelId, stepSlug });

        // First fetch the funnel to check if it's published and active
        const { data: funnelData, error: funnelError } = await supabase
          .from('funnels')
          .select('*')
          .eq('id', funnelId)
          .eq('is_published', true)
          .eq('is_active', true)
          .maybeSingle();

        if (funnelError) {
          console.error('FunnelStepPage: Error fetching funnel:', funnelError);
          setError('Failed to load funnel');
          return;
        }

        if (!funnelData) {
          console.log('FunnelStepPage: Funnel not found or not published:', funnelId);
          setError('Funnel not found or not available');
          return;
        }

        setFunnel(funnelData);

        // Ensure StoreContext is populated for ecommerce elements
        try {
          await loadStoreById(funnelData.store_id);
        } catch (e) {
          console.warn('FunnelStepPage: loadStoreById failed', e);
        }

        // Then fetch the funnel step
        const { data: stepData, error: stepError } = await supabase
          .from('funnel_steps')
          .select('*')
          .eq('funnel_id', funnelId)
          .eq('slug', stepSlug)
          .eq('is_published', true)
          .maybeSingle();

        if (stepError) {
          console.error('FunnelStepPage: Error fetching step:', stepError);
          setError('Failed to load step');
          return;
        }

        if (!stepData) {
          console.log('FunnelStepPage: Step not found:', stepSlug);
          setError(`Step "${stepSlug}" not found`);
          return;
        }

        console.log('FunnelStepPage: Funnel and step loaded successfully:', { funnelData, stepData });
        setStep(stepData);
      } catch (err) {
        console.error('FunnelStepPage: Error fetching data:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelAndStep();
  }, [funnelId, stepSlug, loadStoreById]);

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
      favicon: store?.favicon_url || '/favicon.ico',
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
      favicon: store?.favicon_url || '/favicon.ico',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !step || !funnel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested page could not be found.'}</p>
          <p className="text-sm text-muted-foreground mt-2">Funnel: {funnelId} | Step: {stepSlug}</p>
        </div>
      </div>
    );
  }

  return (
    <PixelManager storeId={funnel.store_id}>
      <div className="w-full min-h-screen">
        <FunnelHeader funnel={funnel} />
        {/* Render funnel step content using PageBuilderRenderer */}
        {step.content?.sections ? (
          <PageBuilderRenderer data={step.content} />
        ) : (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">{step.title}</h1>
            <p className="text-muted-foreground">This step is still being set up.</p>
          </div>
        )}
        <FunnelFooter funnel={funnel} />
      </div>
    </PixelManager>
  );
};
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { useStore } from '@/contexts/StoreContext';
import { buildCanonical } from '@/lib/seo';
import { SEOHead } from '@/components/SEOHead';
import { PixelManager } from '@/components/pixel/PixelManager';
import { FunnelHeader } from '@/components/storefront/FunnelHeader';
import { FunnelFooter } from '@/components/storefront/FunnelFooter';
import { FunnelStepProvider } from '@/contexts/FunnelStepContext';
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
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [step, setStep] = useState<FunnelStepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadStoreById, store } = useStore();
  useEffect(() => {
    const fetchFunnelAndStep = async () => {
      if (!funnelId) {
        setError('Invalid funnel URL');
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

        // If no stepSlug provided, redirect to first published step
        if (!stepSlug) {
          const { data: firstStep, error: firstStepError } = await supabase
            .from('funnel_steps')
            .select('slug')
            .eq('funnel_id', funnelId)
            .eq('is_published', true)
            .order('step_order', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstStepError || !firstStep) {
            setError('No published steps found');
            return;
          }

          // Redirect to the first step
          window.location.replace(`/funnel/${funnelId}/${firstStep.slug}`);
          return;
        }

        // Fetch the specific funnel step
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

  // Inject custom scripts if they exist
  useEffect(() => {
    if (!step?.custom_scripts) return;

    const scriptElement = document.createElement('div');
    scriptElement.innerHTML = step.custom_scripts;
    document.head.appendChild(scriptElement);
    return () => {
      document.head.removeChild(scriptElement);
    };
  }, [step?.custom_scripts]);

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
    <FunnelStepProvider stepId={step.id} funnelId={funnel.id}>
      <PixelManager storeId={funnel.store_id}>
        <SEOHead
          title={step.seo_title || (step.title && funnel.name ? `${step.title} - ${funnel.name}` : step.title)}
          description={step.seo_description || (funnel as any)?.seo_description || funnel.description}
          ogImage={step.og_image}
          socialImageUrl={step.social_image_url}
          keywords={step.seo_keywords}
          canonical={buildCanonical(undefined, (funnel as any)?.canonical_domain)}
          metaRobots={(funnel as any)?.meta_robots}
          siteName={funnel.name}
          ogType="website"
          useUserData={true}
        />
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
    </FunnelStepProvider>
  );
};
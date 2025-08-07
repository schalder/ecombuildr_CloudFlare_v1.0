import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';

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
}

export const FunnelStepPage: React.FC = () => {
  const { funnelId, stepSlug } = useParams<{ funnelId: string; stepSlug: string }>();
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [step, setStep] = useState<FunnelStepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [funnelId, stepSlug]);

  // Set up SEO metadata
  useEffect(() => {
    if (step) {
      if (step.seo_title) {
        document.title = step.seo_title;
      } else if (step.title && funnel?.name) {
        document.title = `${step.title} - ${funnel.name}`;
      }

      if (step.seo_description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', step.seo_description);
      }

      if (step.og_image) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', step.og_image);
      }

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
    }
  }, [step, funnel]);

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
    <div className="w-full min-h-screen">
      {/* Render funnel step content using PageBuilderRenderer */}
      {step.content?.sections ? (
        <PageBuilderRenderer data={step.content} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">{step.title}</h1>
          <p className="text-muted-foreground">This step is still being set up.</p>
        </div>
      )}
    </div>
  );
};
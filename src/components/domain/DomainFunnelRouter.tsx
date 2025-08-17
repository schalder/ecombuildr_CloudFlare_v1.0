import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { FunnelHeader } from '@/components/storefront/FunnelHeader';
import { FunnelFooter } from '@/components/storefront/FunnelFooter';
import { setSEO, buildCanonical } from '@/lib/seo';
import { useStore } from '@/contexts/StoreContext';
import { Loader2 } from 'lucide-react';

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  store_id: string;
  settings: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  meta_robots?: string;
  canonical_domain?: string;
}

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
  is_published: boolean;
}

interface DomainFunnelRouterProps {
  funnel: FunnelData;
}

export const DomainFunnelRouter: React.FC<DomainFunnelRouterProps> = ({ funnel }) => {
  const [step, setStep] = useState<FunnelStepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store } = useStore();

  useEffect(() => {
    const fetchStep = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentPath = window.location.pathname;
        let stepSlug = '';

        if (currentPath === '/') {
          // Homepage - get the first published step (lowest step_order)
          const { data: firstStep, error: firstStepError } = await supabase
            .from('funnel_steps')
            .select('*')
            .eq('funnel_id', funnel.id)
            .eq('is_published', true)
            .order('step_order', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstStepError) {
            console.error('Error fetching first step:', firstStepError);
            setError('Failed to load homepage');
            return;
          }

          if (!firstStep) {
            setError('No published steps found');
            return;
          }

          setStep(firstStep);
        } else {
          // Specific step - extract stepSlug from path
          stepSlug = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
          
          const { data: stepData, error: stepError } = await supabase
            .from('funnel_steps')
            .select('*')
            .eq('funnel_id', funnel.id)
            .eq('slug', stepSlug)
            .eq('is_published', true)
            .maybeSingle();

          if (stepError) {
            console.error('Error fetching step:', stepError);
            setError('Failed to load step');
            return;
          }

          if (!stepData) {
            setError(`Step "${stepSlug}" not found`);
            return;
          }

          setStep(stepData);
        }
      } catch (err) {
        console.error('Error in DomainFunnelRouter:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchStep();
  }, [funnel.id]);

  // Set up step-specific SEO metadata
  useEffect(() => {
    if (!step || !funnel) return;

    const title = step.seo_title || (step.title && funnel.name ? `${step.title} - ${funnel.name}` : step.title);
    const description = step.seo_description || funnel.seo_description || funnel.description;
    const image = step.og_image || funnel.og_image;
    const canonical = buildCanonical(undefined, funnel.canonical_domain);

    setSEO({
      title: title || undefined,
      description,
      image,
      canonical,
      robots: funnel.meta_robots || 'index, follow',
      siteName: funnel.name,
      ogType: 'website',
      favicon: store?.favicon_url || '/favicon.ico',
    });

    // Inject custom scripts if they exist
    if (step.custom_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = step.custom_scripts;
      document.head.appendChild(scriptElement);

      // Cleanup function
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

  if (error || !step) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested page could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <FunnelHeader funnel={funnel} />
      {/* Render funnel step content */}
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
  );
};
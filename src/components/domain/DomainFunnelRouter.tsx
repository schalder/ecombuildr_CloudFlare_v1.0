import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { FunnelHeader } from '@/components/storefront/FunnelHeader';
import { FunnelFooter } from '@/components/storefront/FunnelFooter';
import { setSEO } from '@/lib/seo';
import { FunnelStepProvider } from '@/contexts/FunnelStepContext';
import { useStore } from '@/contexts/StoreContext';

interface FunnelData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: any;
  // Add any other funnel properties you need
}

interface FunnelStepData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  social_image_url?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  meta_robots?: string;
  meta_author?: string;
  language_code?: string;
  custom_meta_tags?: any;
  custom_scripts?: string;
  is_published: boolean;
  is_homepage?: boolean;
}

interface DomainFunnelRouterProps {
  funnel: FunnelData;
}

export const DomainFunnelRouter: React.FC<DomainFunnelRouterProps> = ({ funnel }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<FunnelStepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store } = useStore();

  const isPreview = searchParams.get('preview') === '1';

  // Extract step slug from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const stepSlug = pathSegments[pathSegments.length - 1]; // Last segment

  useEffect(() => {
    const fetchStep = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('funnel_steps')
          .select('*')
          .eq('funnel_id', funnel.id);

        // If no specific step slug or it's empty/homepage, get the first published step by step_order
        if (!stepSlug || stepSlug === '' || stepSlug === 'home') {
          query = query.eq('is_published', true).order('step_order', { ascending: true }).limit(1);
        } else {
          // Get specific step by slug
          query = query.eq('slug', stepSlug);
          if (!isPreview) {
            query = query.eq('is_published', true);
          }
        }

        const { data, error: fetchError } = await query.maybeSingle();

        if (fetchError) {
          console.error('Error fetching funnel step:', fetchError);
          setError('Failed to load funnel step');
          return;
        }

        if (!data) {
          setError('Step not found');
          return;
        }

        setStep(data as any);
      } catch (err) {
        console.error('Error in fetchStep:', err);
        setError('Failed to load funnel step');
      } finally {
        setLoading(false);
      }
    };

    if (funnel?.id) {
      fetchStep();
    }
  }, [funnel.id, stepSlug, isPreview]);

  // SEO and script management - using only step-level SEO data
  useEffect(() => {
    if (!step || !funnel) return;

    // Use only step-level SEO - no funnel fallbacks
    const title = step.seo_title || `${step.title} - ${funnel.name}`;
    const description = step.seo_description;
    const image = step.social_image_url || step.og_image;
    const canonical = step.canonical_url;
    const keywords = step.seo_keywords || [];
    const author = step.meta_author;
    const robots = step.meta_robots || 'index, follow';
    const languageCode = step.language_code || 'en';
    const customMetaTags = Object.entries((step.custom_meta_tags as Record<string, string>) || {}).map(([name, content]) => ({ name, content }));

    setSEO({
      title: title || undefined,
      description,
      image,
      socialImageUrl: step.social_image_url,
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
          <p className="text-muted-foreground">{error || 'The requested funnel step could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <FunnelStepProvider stepId={step.id} funnelId={funnel.id}>
      <div className="w-full min-h-screen flex flex-col">
        <FunnelHeader funnel={funnel} />
        <main className="flex-1">
          {step.content?.sections ? (
            <PageBuilderRenderer data={step.content} />
          ) : (
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold mb-6">{step.title}</h1>
              <p className="text-muted-foreground">This funnel step is still being set up.</p>
            </div>
          )}
        </main>
        <FunnelFooter funnel={funnel} />
      </div>
    </FunnelStepProvider>
  );
};
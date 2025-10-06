import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { StorefrontPageBuilder } from '@/components/storefront/renderer/StorefrontPageBuilder';
import { ScriptManager } from '@/components/storefront/optimized/ScriptManager';
import { setGlobalCurrency } from '@/lib/currency';
import { setSEO, buildCanonical } from '@/lib/seo';
import { optimizedWebsitePageQuery } from '@/components/storefront/optimized/DataOptimizer';
import { PerformanceMonitor } from '@/components/storefront/optimized/PerformanceMonitor';
import { FontOptimizer } from '@/components/storefront/optimized/FontOptimizer';

interface DynamicHomePageProps {
  websiteId: string;
  fallback: React.ReactElement;
}

interface HomePageData {
  id: string;
  slug: string;
  title: string;
  content: any;
  is_published: boolean;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  custom_scripts?: string;
  seo_keywords?: string[];
  meta_author?: string;
  canonical_url?: string;
  custom_meta_tags?: any;
  social_image_url?: string;
  language_code?: string;
  meta_robots?: string;
}

export const DynamicHomePage: React.FC<DynamicHomePageProps> = ({ 
  websiteId, 
  fallback 
}) => {
  console.log('🚀 DynamicHomePage: Component initialized with websiteId:', websiteId);
  
  const [homePage, setHomePage] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteMeta, setWebsiteMeta] = useState<any>(null);

  useEffect(() => {
    const fetchHomePage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find the page marked as homepage for this website
        const { data: homePageData, error: homePageError } = await supabase
          .from('website_pages')
          .select(`
            ${optimizedWebsitePageQuery.select},
            is_published,
            is_homepage
          `)
          .eq('website_id', websiteId)
          .eq('is_homepage', true)
          .eq('is_published', true)
          .maybeSingle();

        if (homePageError) {
          console.error('Error fetching home page:', homePageError);
          setError('Failed to load home page');
          return;
        }

        if (homePageData) {
          console.log('✅ DynamicHomePage: Found home page:', {
            slug: (homePageData as any).slug,
            title: (homePageData as any).title,
            hasContent: !!(homePageData as any).content?.sections,
            websiteId
          });
          setHomePage(homePageData as unknown as HomePageData);
        } else {
          console.log('❌ DynamicHomePage: No home page found for websiteId:', websiteId, 'using fallback');
          setHomePage(null);
        }

        // Fetch website meta for currency and SEO
        const { data: websiteData } = await supabase
          .from('websites')
          .select('name, settings, domain')
          .eq('id', websiteId)
          .maybeSingle();
        
        if (websiteData) {
          setWebsiteMeta(websiteData);
          const code = (websiteData.settings as any)?.currency?.code || 'BDT';
          setGlobalCurrency(code as any);
        }
      } catch (err) {
        console.error('Error in DynamicHomePage:', err);
        setError('Failed to load home page');
      } finally {
        setLoading(false);
      }
    };

    fetchHomePage();
  }, [websiteId]);

  // SEO is now handled by server-side middleware for custom domains
  // No client-side SEO needed here to avoid conflicts

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state
  if (error) {
    console.warn('DynamicHomePage error, using fallback:', error);
    return fallback;
  }

  // If no home page found, use fallback
  if (!homePage) {
    console.log('🔄 DynamicHomePage: No home page data, using fallback');
    return fallback;
  }

  console.log('🎨 DynamicHomePage: Rendering home page:', {
    slug: homePage.slug,
    title: homePage.title,
    hasContent: !!homePage.content?.sections,
    contentSections: homePage.content?.sections?.length || 0
  });

  // Render the home page content directly
  return (
    <>
      <FontOptimizer />
      <PerformanceMonitor page={`website-home-${homePage.slug}`} />
      <main>
        {homePage.content?.sections ? (
          <>
            <PageBuilderRenderer data={homePage.content} />
            <ScriptManager customScripts={homePage.custom_scripts} />
          </>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">{homePage.title}</h1>
            <p className="text-muted-foreground">This page is still being set up.</p>
          </div>
        )}
      </main>
    </>
  );
};

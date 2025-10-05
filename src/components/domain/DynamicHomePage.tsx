import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { WebsiteOverrideRoute } from '@/pages/storefront/WebsiteOverrideRoute';
import { StorefrontHome } from '@/pages/storefront/StorefrontHome';

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
}

export const DynamicHomePage: React.FC<DynamicHomePageProps> = ({ 
  websiteId, 
  fallback 
}) => {
  const [homePage, setHomePage] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomePage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find the page marked as homepage for this website
        const { data: homePageData, error: homePageError } = await supabase
          .from('website_pages')
          .select('id, slug, title, content, is_published')
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
          console.log('Found home page:', homePageData.slug);
          setHomePage(homePageData);
        } else {
          console.log('No home page found, using fallback');
          setHomePage(null);
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
    return fallback;
  }

  // Render the home page using WebsiteOverrideRoute with the actual slug
  return (
    <WebsiteOverrideRoute 
      slug={homePage.slug} 
      websiteId={websiteId}
      fallback={fallback} 
    />
  );
};

import React, { useEffect, useState } from 'react';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { WebsiteProvider } from '@/contexts/WebsiteContext';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CourseStorefrontLayoutProps {
  children: React.ReactNode;
}

export const CourseStorefrontLayout: React.FC<CourseStorefrontLayoutProps> = ({ children }) => {
  const { store } = useStore();
  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!store?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('websites')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .eq('is_published', true)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setWebsite(data);
        }
      } catch (error) {
        console.error('Error fetching website:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [store?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If website exists, use WebsiteHeader/Footer with configuration
  if (website) {
    return (
      <div className="min-h-screen bg-background">
        <WebsiteProvider websiteId={website.id} websiteSlug={website.slug}>
          {(website.settings?.header?.enabled !== false) && (
            <WebsiteHeader website={website} />
          )}
          <main>
            {children}
          </main>
          {(website.settings?.footer?.enabled !== false) && (
            <WebsiteFooter website={website} />
          )}
        </WebsiteProvider>
      </div>
    );
  }

  // Fallback to StorefrontHeader/Footer if no website configured
  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />
      <main>
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
};
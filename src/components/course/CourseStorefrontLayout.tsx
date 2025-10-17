import React, { useEffect, useState } from 'react';
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
          .maybeSingle();

        if (error) throw error;
        setWebsite(data);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If website exists and is configured, use WebsiteHeader/Footer
  if (website) {
    return (
      <WebsiteProvider websiteId={website.id} websiteSlug={website.slug}>
        <div className="min-h-screen bg-background">
          {website.settings?.global_header?.enabled !== false && <WebsiteHeader website={website} />}
          <main>
            {children}
          </main>
          {website.settings?.global_footer?.enabled !== false && <WebsiteFooter website={website} />}
        </div>
      </WebsiteProvider>
    );
  }

  // Fallback: render children without header/footer
  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
    </div>
  );
};
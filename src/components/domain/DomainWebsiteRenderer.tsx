import React from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { setGlobalCurrency } from '@/lib/currency';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings?: any;
}

interface WebsitePageData {
  id: string;
  title: string;
  slug: string;
  meta_description?: string;
  content: any;
  is_published: boolean;
  is_homepage: boolean;
}

interface DomainWebsiteRendererProps {
  websiteId: string;
  path: string;
  isHomepage: boolean;
}

export const DomainWebsiteRenderer: React.FC<DomainWebsiteRendererProps> = ({ 
  websiteId, 
  path, 
  isHomepage 
}) => {
  const [website, setWebsite] = React.useState<WebsiteData | null>(null);
  const [page, setPage] = React.useState<WebsitePageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { store, loadStoreById } = useStore();

  React.useEffect(() => {
    const fetchWebsiteData = async () => {
      try {
        setLoading(true);
        
        // Fetch website data
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', websiteId)
          .eq('is_active', true)
          .single();

        if (websiteError) throw websiteError;
        
        setWebsite(websiteData);
        
        // Load the store
        if (websiteData.store_id) {
          await loadStoreById(websiteData.store_id);
        }

        // Fetch page content
        let pageQuery = supabase
          .from('website_pages')
          .select('*')
          .eq('website_id', websiteId)
          .eq('is_published', true);

        if (isHomepage || path === '/') {
          pageQuery = pageQuery.eq('is_homepage', true);
        } else {
          pageQuery = pageQuery.eq('slug', path.replace('/', ''));
        }

        const { data: pageData, error: pageError } = await pageQuery.maybeSingle();
        
        if (pageError) throw pageError;
        
        setPage(pageData);
        
        // Set global currency if store has settings
        if (store?.settings?.currency) {
          setGlobalCurrency(store.settings.currency);
        }
        
      } catch (err) {
        console.error('Error loading website data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteData();
  }, [websiteId, path, isHomepage, loadStoreById, store?.settings?.currency]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Website Not Found</h1>
          <p className="text-muted-foreground">
            {error || 'The requested website could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  // Set CSS variables for primary/secondary colors if store has them
  const primaryColor = store?.settings?.primary_color;
  const secondaryColor = store?.settings?.secondary_color;

  return (
    <div 
      className="min-h-screen bg-background text-foreground"
      style={{
        ...(primaryColor && { '--primary': primaryColor }),
        ...(secondaryColor && { '--secondary': secondaryColor }),
      } as React.CSSProperties}
    >
      <WebsiteHeader website={website} />
      <main>
        {page?.content ? (
          <PageBuilderRenderer data={page.content} />
        ) : (
          <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">{website.name}</h1>
            <p className="text-muted-foreground">
              {isHomepage ? 'Welcome to our homepage!' : `Page: ${path}`}
            </p>
          </div>
        )}
      </main>
      <WebsiteFooter website={website} />
    </div>
  );
};
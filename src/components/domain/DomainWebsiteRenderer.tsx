import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { DomainWebsiteRouter } from './DomainWebsiteRouter';

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_active: boolean;
  store_id: string;
  settings?: any;
  stores?: any;
}

interface DomainWebsiteRendererProps {
  websiteId: string;
  customDomain: string;
}

export const DomainWebsiteRenderer: React.FC<DomainWebsiteRendererProps> = ({ 
  websiteId, 
  customDomain 
}) => {
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadStoreById } = useStore();

  useEffect(() => {
    const fetchWebsiteData = async () => {
      try {
        // Fetch website data
        const { data: websiteData, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', websiteId)
          .eq('is_published', true)
          .eq('is_active', true)
          .single();

        if (websiteError) {
          throw websiteError;
        }

        // Fetch the related store data
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', websiteData.store_id)
          .eq('is_active', true)
          .single();

        if (storeError) {
          throw storeError;
        }

        // Combine the data
        const combinedWebsiteData = {
          ...websiteData,
          stores: storeData
        };

        setWebsite(combinedWebsiteData as WebsiteData);

        // Load the store into context
        if (storeData) {
          await loadStoreById(storeData.id);
        }
      } catch (error) {
        console.error('Error fetching website data:', error);
        setError('Failed to load website');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteData();
  }, [websiteId, loadStoreById]);

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error if website not found or error occurred
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
  const storeData = website.stores;
  const primaryColor = storeData?.primary_color;
  const secondaryColor = storeData?.secondary_color;
  
  const styles: React.CSSProperties = {};
  if (primaryColor) styles['--primary' as any] = primaryColor;
  if (secondaryColor) styles['--secondary' as any] = secondaryColor;

  // Render the website with full routing
  return (
    <div 
      className="min-h-screen bg-background text-foreground"
      style={styles}
    >
      <WebsiteHeader website={website} />
      <main>
        <DomainWebsiteRouter 
          websiteId={websiteId} 
          customDomain={customDomain} 
        />
      </main>
      <WebsiteFooter website={website} />
    </div>
  );
};
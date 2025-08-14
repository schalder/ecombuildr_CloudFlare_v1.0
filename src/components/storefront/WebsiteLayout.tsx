import React from 'react';
import { Outlet, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { setGlobalCurrency } from '@/lib/currency';
import { PixelManager } from '@/components/pixel/PixelManager';

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

export const WebsiteLayout: React.FC = () => {
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get('preview') === '1';
  const [website, setWebsite] = React.useState<WebsiteData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { store, loadStoreById } = useStore();

  React.useEffect(() => {
    const loadWebsite = async () => {
      if (!websiteId && !websiteSlug) return;
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('websites')
          .select('*')
          .eq(websiteId ? 'id' : 'slug', (websiteId || websiteSlug) as string)
          .eq('is_active', true);
        // For preview, don't filter by is_published; RLS will allow owners
        if (!isPreview) {
          // no extra filter; RLS already restricts public to is_published=true
        }
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (!data) {
          setError('Website not found or not available');
          return;
        }
        setWebsite(data as WebsiteData);
        try {
          await loadStoreById((data as WebsiteData).store_id);
        } catch (e) {
          console.warn('WebsiteLayout: loadStoreById failed', e);
        }
      } catch (e: any) {
        console.error('WebsiteLayout: Error loading website', e);
        setError('Failed to load website');
      } finally {
        setLoading(false);
      }
    };
    loadWebsite();
  }, [websiteId, websiteSlug, isPreview, loadStoreById]);

  // Redirect legacy /website/:id to clean /site/:slug while preserving the rest of the path
  React.useEffect(() => {
    if (website && websiteId && !websiteSlug) {
      const current = window.location.pathname + window.location.search + window.location.hash;
      const next = current.replace(`/website/${websiteId}`, `/site/${website.slug}`);
      if (next !== current) {
        navigate(next, { replace: true });
      }
    }
  }, [website, websiteId, websiteSlug, navigate]);

  React.useEffect(() => {
    const code = (website?.settings?.currency?.code as string) || 'BDT';
    try { setGlobalCurrency(code as any); } catch {}
  }, [website?.settings?.currency?.code]);

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
          <h1 className="text-2xl font-bold text-destructive mb-2">Website Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested website could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <PixelManager websitePixels={website.settings}>
      <div className="min-h-screen flex flex-col bg-background">
          <style>{`
            :root {
              --store-primary: ${store?.primary_color ?? '#10B981'};
              --store-secondary: ${store?.secondary_color ?? '#059669'};
            }
          `}</style>
          <WebsiteHeader website={website} />
          <main className="flex-1">
            <Outlet />
          </main>
          <WebsiteFooter website={website} />
        </div>
    </PixelManager>
  );
};

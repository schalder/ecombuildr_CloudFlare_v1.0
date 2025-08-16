import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useWebsiteContext } from '@/contexts/WebsiteContext';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { Loader2 } from 'lucide-react';
import { PixelManager } from '@/components/pixel/PixelManager';
import { shouldHideChrome } from '@/lib/systemChrome';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ children }) => {
  const { store, loading, error } = useStore();
  const location = useLocation();
  const { websiteId } = useWebsiteContext();
  
  // Check if we should hide chrome (system pages or website context)
  const isSystemPage = shouldHideChrome(location.pathname);
  const isInWebsiteContext = !!websiteId;
  const shouldHideChromeElements = isSystemPage || isInWebsiteContext;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested store could not be found.'}</p>
        </div>
      </div>
    );
  }

  // If in website context, don't wrap with PixelManager (website handles it)
  const content = (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        :root {
          --store-primary: ${store.primary_color};
          --store-secondary: ${store.secondary_color};
        }
      `}</style>
      {!shouldHideChromeElements && <StorefrontHeader />}
      <main className="flex-1">
        {children}
      </main>
      {!shouldHideChromeElements && <StorefrontFooter />}
    </div>
  );

  // Only wrap with PixelManager if not in website context
  return isInWebsiteContext ? content : (
    <PixelManager websitePixels={store?.settings} storeId={store?.id}>
      {content}
    </PixelManager>
  );
};
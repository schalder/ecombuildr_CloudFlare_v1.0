import React from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { Loader2 } from 'lucide-react';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ children }) => {
  const { store, loading, error } = useStore();
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const isWebsiteContext = Boolean(websiteId || websiteSlug);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        :root {
          --store-primary: ${store.primary_color};
          --store-secondary: ${store.secondary_color};
        }
      `}</style>
      {!isWebsiteContext && <StorefrontHeader />}
      <main className="flex-1">
        {children}
      </main>
      {!isWebsiteContext && <StorefrontFooter />}
    </div>
  );
};
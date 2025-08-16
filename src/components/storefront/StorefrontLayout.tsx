import React from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { Loader2 } from 'lucide-react';
import { PixelManager } from '@/components/pixel/PixelManager';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ children }) => {
  const { store, loading, error } = useStore();

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
    <PixelManager websitePixels={store?.settings} storeId={store?.id}>
      <div className="min-h-screen flex flex-col bg-background">
          <style>{`
            :root {
              ${store.primary_color ? `--store-primary: ${store.primary_color};` : ''}
              ${store.secondary_color ? `--store-secondary: ${store.secondary_color};` : ''}
              ${store.settings?.product_button_bg ? `--product-button-bg: ${store.settings.product_button_bg};` : ''}
              ${store.settings?.product_button_text ? `--product-button-text: ${store.settings.product_button_text};` : ''}
              ${store.settings?.product_button_hover_bg ? `--product-button-hover-bg: ${store.settings.product_button_hover_bg};` : ''}
              ${store.settings?.product_button_hover_text ? `--product-button-hover-text: ${store.settings.product_button_hover_text};` : ''}
              ${store.settings?.variant_button_selected_bg ? `--variant-button-selected-bg: ${store.settings.variant_button_selected_bg};` : ''}
              ${store.settings?.variant_button_selected_text ? `--variant-button-selected-text: ${store.settings.variant_button_selected_text};` : ''}
              ${store.settings?.variant_button_hover_bg ? `--variant-button-hover-bg: ${store.settings.variant_button_hover_bg};` : ''}
              ${store.settings?.variant_button_hover_text ? `--variant-button-hover-text: ${store.settings.variant_button_hover_text};` : ''}
            }
          `}</style>
          <StorefrontHeader />
          <main className="flex-1">
            {children}
          </main>
          <StorefrontFooter />
        </div>
    </PixelManager>
  );
};
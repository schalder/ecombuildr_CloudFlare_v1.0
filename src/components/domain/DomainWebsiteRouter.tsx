import React, { useEffect } from 'react';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { PaymentProcessing } from '@/pages/storefront/PaymentProcessing';
import { OrderConfirmation } from '@/pages/storefront/OrderConfirmation';
import { WebsiteOverrideRoute } from '@/pages/storefront/WebsiteOverrideRoute';
import { DomainWebsiteProductDetailRoute } from '@/pages/storefront/DomainWebsiteProductDetailRoute';
import { SearchResults } from '@/pages/storefront/SearchResults';
import { StorefrontHome } from '@/pages/storefront/StorefrontHome';
import { StorefrontProducts } from '@/pages/storefront/StorefrontProducts';
import { CollectionPage } from '@/pages/storefront/CollectionPage';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { FloatingCartButton } from '@/components/storefront/FloatingCartButton';
import { SupportWidget } from '@/components/storefront/SupportWidget';
import { WebsiteProvider } from '@/contexts/WebsiteContext';

const DynamicWebsiteRoute: React.FC<{ fallback: React.ReactElement; websiteId: string }> = ({ fallback, websiteId }) => {
  const { slug } = useParams<{ slug: string }>();
  return <WebsiteOverrideRoute slug={slug || ''} fallback={fallback} websiteId={websiteId} />;
};

interface DomainWebsiteRouterProps {
  websiteId: string;
  customDomain: string;
  website: any;
}

export const DomainWebsiteRouter: React.FC<DomainWebsiteRouterProps> = ({ 
  websiteId, 
  customDomain,
  website
}) => {
  const location = useLocation();
  const { pixels } = usePixelContext();
  const { trackPageView } = usePixelTracking(pixels, website?.store_id, websiteId);

  // Track page views on route changes
  useEffect(() => {
    
    const timer = setTimeout(() => {
      trackPageView({
        page_title: document.title,
        page_location: window.location.href
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, trackPageView]);

  return (
    <WebsiteProvider websiteId={websiteId} websiteSlug={website.slug}>
      <WebsiteHeader website={website} />
      <main className="flex-1">
        <Routes>
      {/* Homepage */}
      <Route path="/" element={
        <WebsiteOverrideRoute 
          slug="home" 
          websiteId={websiteId}
          fallback={<StorefrontHome />} 
        />
      } />
      
      {/* Products */}
      <Route path="/products" element={
        <WebsiteOverrideRoute 
          slug="products" 
          websiteId={websiteId}
          fallback={<StorefrontProducts />} 
        />
      } />
      <Route path="/products/:productSlug" element={<DomainWebsiteProductDetailRoute websiteId={websiteId} website={website} />} />
      <Route path="/collections/:collectionSlug" element={<CollectionPage />} />
      
      {/* Cart & Checkout - using website pages */}
      <Route path="/cart" element={
        <WebsiteOverrideRoute 
          slug="cart" 
          websiteId={websiteId}
          fallback={<CartPage />} 
        />
      } />
      <Route path="/checkout" element={
        <WebsiteOverrideRoute 
          slug="checkout" 
          websiteId={websiteId}
          fallback={<CheckoutPage />} 
        />
      } />
      <Route path="/payment-processing" element={<PaymentProcessing />} />
      <Route path="/order-confirmation" element={
        <WebsiteOverrideRoute 
          slug="order-confirmation" 
          websiteId={websiteId}
          fallback={<OrderConfirmation />} 
        />
      } />
      
      {/* Search */}
      <Route path="/search" element={<SearchResults />} />
      
      {/* Website Pages - catch all other routes */}
      <Route 
        path="/:slug" 
        element={
          <DynamicWebsiteRoute fallback={<div className="min-h-screen flex items-center justify-center">Page not found</div>} websiteId={websiteId} />
        } 
      />
        </Routes>
      </main>
      {(website.settings?.floating_cart?.enabled ?? true) && (
        <FloatingCartButton 
          position={website.settings?.floating_cart?.position ?? 'bottom-right'} 
          color={website.settings?.floating_cart?.color}
        />
      )}
      {website.settings?.support_widget?.enabled && (
        <SupportWidget website={website} />
      )}
      <WebsiteFooter website={website} />
    </WebsiteProvider>
  );
};
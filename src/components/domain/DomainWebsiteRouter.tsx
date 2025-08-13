import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { PaymentProcessing } from '@/pages/storefront/PaymentProcessing';
import { OrderConfirmation } from '@/pages/storefront/OrderConfirmation';
import { WebsiteOverrideRoute } from '@/pages/storefront/WebsiteOverrideRoute';
import { WebsiteProductDetailRoute } from '@/pages/storefront/WebsiteProductDetailRoute';
import { SearchResults } from '@/pages/storefront/SearchResults';
import { StorefrontHome } from '@/pages/storefront/StorefrontHome';
import { StorefrontProducts } from '@/pages/storefront/StorefrontProducts';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';

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
  return (
    <>
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
      <Route path="/products/:productSlug" element={<WebsiteProductDetailRoute />} />
      
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
      <WebsiteFooter website={website} />
    </>
  );
};
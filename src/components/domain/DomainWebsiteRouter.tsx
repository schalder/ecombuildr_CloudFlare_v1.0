import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { PaymentProcessing } from '@/pages/storefront/PaymentProcessing';
import { OrderConfirmation } from '@/pages/storefront/OrderConfirmation';
import { WebsiteOverrideRoute } from '@/pages/storefront/WebsiteOverrideRoute';
import { WebsiteProductDetailRoute } from '@/pages/storefront/WebsiteProductDetailRoute';
import { SearchResults } from '@/pages/storefront/SearchResults';

const DynamicWebsiteRoute: React.FC<{ fallback: React.ReactElement; websiteId: string }> = ({ fallback, websiteId }) => {
  const { slug } = useParams<{ slug: string }>();
  return <WebsiteOverrideRoute slug={slug || ''} fallback={fallback} websiteId={websiteId} />;
};

interface DomainWebsiteRouterProps {
  websiteId: string;
  customDomain: string;
}

export const DomainWebsiteRouter: React.FC<DomainWebsiteRouterProps> = ({ 
  websiteId, 
  customDomain 
}) => {
  return (
    <Routes>
      {/* Homepage */}
      <Route path="/" element={
        <WebsiteOverrideRoute 
          slug="home" 
          websiteId={websiteId}
          fallback={<div className="min-h-screen flex items-center justify-center">Page not found</div>} 
        />
      } />
      
      {/* Products */}
      <Route path="/products" element={
        <WebsiteOverrideRoute 
          slug="products" 
          websiteId={websiteId}
          fallback={<div className="min-h-screen flex items-center justify-center">Products page not found</div>} 
        />
      } />
      <Route path="/products/:productSlug" element={<WebsiteProductDetailRoute />} />
      
      {/* Cart & Checkout - using website pages */}
      <Route path="/cart" element={
        <WebsiteOverrideRoute 
          slug="cart" 
          websiteId={websiteId}
          fallback={<div className="min-h-screen flex items-center justify-center">Cart page not found</div>} 
        />
      } />
      <Route path="/checkout" element={
        <WebsiteOverrideRoute 
          slug="checkout" 
          websiteId={websiteId}
          fallback={<div className="min-h-screen flex items-center justify-center">Checkout page not found</div>} 
        />
      } />
      <Route path="/payment-processing" element={<PaymentProcessing />} />
      <Route path="/order-confirmation" element={
        <WebsiteOverrideRoute 
          slug="order-confirmation" 
          websiteId={websiteId}
          fallback={<div className="min-h-screen flex items-center justify-center">Order confirmation page not found</div>} 
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
  );
};
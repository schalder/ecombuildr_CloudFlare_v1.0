import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { StorefrontHome } from '@/pages/storefront/StorefrontHome';
import { StorefrontProducts } from '@/pages/storefront/StorefrontProducts';
import { ProductDetail } from '@/pages/storefront/ProductDetail';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { PaymentProcessing } from '@/pages/storefront/PaymentProcessing';
import { OrderConfirmation } from '@/pages/storefront/OrderConfirmation';
import { WebsiteOverrideRoute } from '@/pages/storefront/WebsiteOverrideRoute';
import { WebsiteProductDetailRoute } from '@/pages/storefront/WebsiteProductDetailRoute';
import { SearchResults } from '@/pages/storefront/SearchResults';

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
      <Route path="/" element={<StorefrontHome />} />
      
      {/* Products */}
      <Route path="/products" element={<StorefrontProducts />} />
      <Route path="/products/:productSlug" element={<WebsiteProductDetailRoute />} />
      
      {/* Cart & Checkout */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment-processing" element={<PaymentProcessing />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      
      {/* Search */}
      <Route path="/search" element={<SearchResults />} />
      
      {/* Website Pages - catch all other routes */}
      <Route 
        path="/:slug" 
        element={
          <WebsiteOverrideRoute 
            slug="" 
            fallback={<div className="min-h-screen flex items-center justify-center">Page not found</div>} 
          />
        } 
      />
    </Routes>
  );
};
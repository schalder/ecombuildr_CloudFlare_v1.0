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
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { shouldHideChrome } from '@/lib/systemChrome';

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
  const { trackPageView } = usePixelTracking(pixels);
  const hideChromeElements = shouldHideChrome(location.pathname);

  // Track page views on route changes
  useEffect(() => {
    console.debug('[DomainWebsiteRouter] Route changed:', location.pathname);
    const timer = setTimeout(() => {
      trackPageView({
        page_title: document.title,
        page_location: window.location.href
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, trackPageView]);

  return (
    <>
      {!hideChromeElements && <WebsiteHeader website={website} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<StorefrontHome />} />
          <Route path="/products" element={<StorefrontProducts />} />
          <Route 
            path="/products/:productSlug" 
            element={<DomainWebsiteProductDetailRoute websiteId={websiteId} />}
          />
          <Route path="/cart" element={<CartPage />} />
          <Route 
            path="/checkout" 
            element={<CheckoutPage />} 
          />
          <Route 
            path="/payment-processing" 
            element={<PaymentProcessing />}
          />
          <Route 
            path="/order-confirmation" 
            element={<OrderConfirmation />}
          />
          <Route 
            path="/search" 
            element={<SearchResults />} 
          />
          <Route 
            path="/*" 
            element={<DynamicWebsiteRoute fallback={<div>Page not found</div>} websiteId={websiteId} />} 
          />
        </Routes>
      </main>
      {!hideChromeElements && <WebsiteFooter website={website} />}
    </>
  );
};
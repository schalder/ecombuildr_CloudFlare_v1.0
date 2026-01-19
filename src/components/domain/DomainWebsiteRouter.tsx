import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { supabase } from '@/integrations/supabase/client';
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
import StorefrontCourseLibrary from '@/components/storefront/StorefrontCourseLibrary';
import StorefrontCourseDetail from '@/components/storefront/StorefrontCourseDetail';
import { WebsiteHeader } from '@/components/storefront/WebsiteHeader';
import { WebsiteFooter } from '@/components/storefront/WebsiteFooter';
import { FloatingCartButton } from '@/components/storefront/FloatingCartButton';
import { SupportWidget } from '@/components/storefront/SupportWidget';
import { FOMOManager } from '@/components/storefront/FOMOManager';
import { WebsiteProvider } from '@/contexts/WebsiteContext';
import CourseMemberLoginPage from '@/pages/CourseMemberLoginPage';
import CourseMemberDashboard from '@/components/course/CourseMemberDashboard';
import { MemberAuthProvider } from '@/hooks/useMemberAuth';
import CoursePlayerPage from '@/pages/CoursePlayerPage';
import { StorefrontCourseCheckoutWrapper } from '@/components/course/CourseRouteWrappers';
import { DynamicHomePage } from './DynamicHomePage';

const DynamicWebsiteRoute: React.FC<{ fallback: React.ReactElement; websiteId: string }> = ({ fallback, websiteId }) => {
  const { slug } = useParams<{ slug: string }>();
  return <WebsiteOverrideRoute slug={slug || ''} fallback={fallback} websiteId={websiteId} />;
};

interface DomainWebsiteRouterProps {
  websiteId: string;
  customDomain: string;
  website: any;
}

interface PageData {
  hide_header?: boolean;
  hide_footer?: boolean;
}

export const DomainWebsiteRouter: React.FC<DomainWebsiteRouterProps> = ({ 
  websiteId, 
  customDomain,
  website
}) => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);

  // ✅ REMOVED: PageView tracking - PixelManager already handles this
  // PixelManager tracks PageView on mount and navigation changes
  // No need to track again here to avoid duplicate events

  // Fetch current page data to check hide_header/hide_footer settings
  useEffect(() => {
    const fetchCurrentPage = async () => {
      if (!websiteId) {
        setCurrentPage(null);
        return;
      }

      try {
        // Extract page slug from location pathname
        // For custom domains, path format: /:pageSlug
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const slug = pathSegments[0]; // First segment after domain

        // Skip known system routes that aren't pages
        const systemRoutes = ['products', 'cart', 'checkout', 'search', 'collections', 'payment-processing', 'order-confirmation', 'courses'];
        if (systemRoutes.includes(slug)) {
          setCurrentPage(null);
          return;
        }

        // If no slug or homepage, fetch homepage
        let pageQuery = supabase
          .from('website_pages')
          .select('hide_header, hide_footer')
          .eq('website_id', websiteId)
          .eq('is_published', true);

        if (slug) {
          pageQuery = pageQuery.eq('slug', slug);
        } else {
          pageQuery = pageQuery.eq('is_homepage', true);
        }

        const { data: pageData } = await pageQuery.maybeSingle();
        setCurrentPage(pageData || null);
      } catch (error) {
        console.warn('DomainWebsiteRouter: Error fetching page data:', error);
        setCurrentPage(null);
      }
    };

    fetchCurrentPage();
  }, [websiteId, location.pathname]);

  return (
    <WebsiteProvider websiteId={websiteId} websiteSlug={website.slug}>
      {/* Show header if global header is enabled AND page doesn't hide it */}
      {website.settings?.global_header?.enabled !== false && !currentPage?.hide_header && (
        <WebsiteHeader website={website} />
      )}
      <main className="flex-1">
        <Routes>
      {/* Homepage - Dynamic Home Page */}
      <Route path="/" element={
        <DynamicHomePage 
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
      
      {/* Courses */}
      <Route path="/courses" element={
        <WebsiteOverrideRoute 
          slug="courses" 
          websiteId={websiteId}
          fallback={<StorefrontCourseLibrary />} 
        />
      } />
      <Route path="/courses/order-confirmation" element={
        <WebsiteOverrideRoute 
          slug="order-confirmation" 
          websiteId={websiteId}
          fallback={<OrderConfirmation />} 
        />
      } />
      <Route path="/courses/payment-processing" element={<PaymentProcessing />} />
      <Route path="/courses/members/login" element={<CourseMemberLoginPage />} />
      <Route path="/courses/members" element={<MemberAuthProvider><CourseMemberDashboard /></MemberAuthProvider>} />
      <Route path="/courses/learn/:courseId" element={<CoursePlayerPage />} />
      <Route path="/courses/:courseId/checkout" element={<StorefrontCourseCheckoutWrapper />} />
      <Route path="/courses/:courseId" element={<StorefrontCourseDetail />} />
      
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
      {website.settings?.fomo?.enabled && (
        <FOMOManager 
          websiteId={websiteId} 
          settings={website.settings.fomo} 
        />
      )}
      {/* Show footer if global footer is enabled AND page doesn't hide it */}
      {website.settings?.global_footer?.enabled !== false && !currentPage?.hide_footer && (
        <WebsiteFooter website={website} />
      )}
    </WebsiteProvider>
  );
};
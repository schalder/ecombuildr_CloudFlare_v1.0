import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, useLocation, useSearchParams } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';

const DynamicWebsiteRoute: React.FC<{ fallback: React.ReactElement; websiteId: string }> = ({ fallback, websiteId }) => {
  const { slug } = useParams<{ slug: string }>();
  return <WebsiteOverrideRoute slug={slug || ''} fallback={fallback} websiteId={websiteId} />;
};

// Funnel-aware PaymentProcessing wrapper for custom domains
const FunnelAwarePaymentProcessing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [funnelContext, setFunnelContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const tempId = searchParams.get('tempId');
  const orderId = searchParams.get('orderId');
  
  useEffect(() => {
    const detectFunnelContext = async () => {
      if (!tempId && !orderId) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('FunnelAwarePaymentProcessing: Detecting funnel context', { tempId, orderId });
        
        // Check if this is a funnel order by looking at stored checkout data
        const pendingCheckout = sessionStorage.getItem('pending_checkout');
        if (pendingCheckout) {
          const checkoutData = JSON.parse(pendingCheckout);
          const orderFunnelId = checkoutData.orderData?.funnel_id;
          const currentStepId = checkoutData.orderData?.currentStepId;
          
          if (orderFunnelId && currentStepId) {
            console.log('FunnelAwarePaymentProcessing: Funnel order detected', { 
              funnelId: orderFunnelId, 
              currentStepId: currentStepId 
            });
            
            // Find the current funnel step using the stored currentStepId
            const { data: currentStep, error: stepError } = await supabase
              .from('funnel_steps')
              .select('id, on_success_step_id, funnel_id')
              .eq('id', currentStepId)
              .single();
            
            if (!stepError && currentStep?.on_success_step_id) {
              // Get the next step details
              const { data: nextStep, error: nextStepError } = await supabase
                .from('funnel_steps')
                .select('slug, funnel_id')
                .eq('id', currentStep.on_success_step_id)
                .single();
              
              if (!nextStepError && nextStep?.slug) {
                setFunnelContext({
                  funnelId: orderFunnelId,
                  nextStepSlug: nextStep.slug,
                  currentStepId: currentStep.id
                });
                console.log('FunnelAwarePaymentProcessing: Next funnel step found', { 
                  nextStepSlug: nextStep.slug, 
                  funnelId: orderFunnelId,
                  currentStepId: currentStep.id
                });
              } else {
                console.log('FunnelAwarePaymentProcessing: Next step not found for current step', { 
                  currentStepId: currentStep.id,
                  onSuccessStepId: currentStep.on_success_step_id
                });
              }
            } else {
              console.log('FunnelAwarePaymentProcessing: Current step not found or no next step configured', { 
                currentStepId: currentStepId,
                error: stepError?.message
              });
            }
          } else {
            console.log('FunnelAwarePaymentProcessing: Missing funnel context', { 
              hasFunnelId: !!orderFunnelId, 
              hasCurrentStepId: !!currentStepId 
            });
          }
        }
        
        // Also check existing orders for funnel context
        if (orderId) {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('funnel_id')
            .eq('id', orderId)
            .maybeSingle();
          
          if (!orderError && order?.funnel_id) {
            console.log('FunnelAwarePaymentProcessing: Existing funnel order detected', { 
              orderId, 
              funnelId: order.funnel_id 
            });
            
            // Find next step for existing funnel order
            const { data: currentStep, error: stepError } = await supabase
              .from('funnel_steps')
              .select('id, on_success_step_id, funnel_id')
              .eq('funnel_id', order.funnel_id)
              .eq('is_published', true)
              .order('step_order', { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (!stepError && currentStep?.on_success_step_id) {
              const { data: nextStep, error: nextStepError } = await supabase
                .from('funnel_steps')
                .select('slug, funnel_id')
                .eq('id', currentStep.on_success_step_id)
                .single();
              
              if (!nextStepError && nextStep?.slug) {
                setFunnelContext({
                  funnelId: order.funnel_id,
                  nextStepSlug: nextStep.slug,
                  currentStepId: currentStep.id
                });
                console.log('FunnelAwarePaymentProcessing: Next funnel step found for existing order', { 
                  nextStepSlug: nextStep.slug, 
                  funnelId: order.funnel_id 
                });
              }
            }
          }
        }
        
      } catch (error) {
        console.error('FunnelAwarePaymentProcessing: Error detecting funnel context:', error);
      } finally {
        setLoading(false);
      }
    };
    
    detectFunnelContext();
  }, [tempId, orderId]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return <PaymentProcessing funnelContext={funnelContext} />;
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
      <Route path="/payment-processing" element={<FunnelAwarePaymentProcessing />} />
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
      <Route path="/courses/payment-processing" element={<FunnelAwarePaymentProcessing />} />
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
      <WebsiteFooter website={website} />
    </WebsiteProvider>
  );
};
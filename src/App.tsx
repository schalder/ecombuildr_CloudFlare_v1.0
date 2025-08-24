import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { DomainRouter } from "@/components/domain/DomainRouter";
import { AuthProvider } from "@/hooks/useAuth";
import { StoreProvider } from "@/contexts/StoreContext";
import { PixelManager } from "@/components/pixel/PixelManager";
import { CartProvider } from "@/contexts/CartContext";
import { AddToCartProvider } from "@/contexts/AddToCartProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductView from "./pages/ProductView";
import EditProduct from "./pages/EditProduct";
import Categories from "./pages/Categories";
import ProductLibrary from "./pages/ProductLibrary";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import Reviews from "./pages/Reviews";
import MediaStorage from "./pages/MediaStorage";

import PageBuilder from "./pages/PageBuilder";
import Websites from "./pages/Websites";
import CreateWebsite from "./pages/CreateWebsite";
import WebsiteManagement from "./pages/WebsiteManagement";
import Funnels from "./pages/Funnels";
import CreateFunnel from "./pages/CreateFunnel";
import FunnelManagement from "./pages/FunnelManagement";
import Marketing from "./pages/Marketing";
import FacebookAds from "./pages/FacebookAds";
import EmailCampaigns from "./pages/EmailCampaigns";
import Discounts from "./pages/Discounts";
import StoreSettings from "./pages/StoreSettings";
import ProfileSettings from "./pages/ProfileSettings";
import BillingSettings from "./pages/BillingSettings";
import Domains from "./pages/Domains";
import NotFound from "./pages/NotFound";
import DemoPreview from "./pages/DemoPreview";
import DashboardOverview from "./pages/DashboardOverview";
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import BillingManagement from "./pages/admin/BillingManagement";
import PlanManagement from "./pages/admin/PlanManagement";
import SitePricingManagement from "./pages/admin/SitePricingManagement";
import AdminSites from "./pages/admin/AdminSites";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSupport from "./pages/admin/AdminSupport";
import SEOSettings from "./pages/admin/SEOSettings";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import AdminProductLibrary from "./pages/admin/AdminProductLibrary";
import AdminAddLibraryProduct from "./pages/admin/AdminAddLibraryProduct";
import AdminLibraryOrders from "./pages/admin/AdminLibraryOrders";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminLibraryOrdersSummary from "./pages/admin/AdminLibraryOrdersSummary";
import AdminTemplateManagement from "./pages/admin/AdminTemplateManagement";
import AdminTemplateEditor from "./pages/admin/AdminTemplateEditor";
import AdminTemplatePreview from "./pages/admin/AdminTemplatePreview";
import { StorefrontHome } from "./pages/storefront/StorefrontHome";
import { StorefrontProducts } from "./pages/storefront/StorefrontProducts";
import ProductDetail from "./pages/storefront/ProductDetail";
import { SearchResults } from "./pages/storefront/SearchResults";
import { CheckoutPage } from "./pages/storefront/CheckoutPage";
import { PaymentProcessing } from "./pages/storefront/PaymentProcessing";
import { OrderConfirmation } from "./pages/storefront/OrderConfirmation";
import { CartPage } from "./pages/storefront/CartPage";
import { StorefrontPage } from "./pages/storefront/StorefrontPage";
import { FunnelStepPage } from "./pages/storefront/FunnelStepPage";
import { WebsitePage } from "./pages/storefront/WebsitePage";
import { WebsiteLayout } from "@/components/storefront/WebsiteLayout";
import { WebsiteOverrideRoute } from "./pages/storefront/WebsiteOverrideRoute";
import { WebsiteProductDetailRoute } from "./pages/storefront/WebsiteProductDetailRoute";
import { OnboardingGate } from "@/components/dashboard/OnboardingGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <StoreProvider>
          <PixelManager>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
            <BrowserRouter>
              <AddToCartProvider>
              <DomainRouter>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Single Store Dashboard Routes - Protected */}
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<Navigate to="/dashboard/overview" replace />} />
                  <Route element={<OnboardingGate />}>
                    <Route path="overview" element={<DashboardOverview />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/add" element={<AddProduct />} />
                    <Route path="products/:id" element={<ProductView />} />
                    <Route path="products/:id/edit" element={<EditProduct />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="product-library" element={<ProductLibrary />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:orderId" element={<Orders />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="media" element={<MediaStorage />} />
                    <Route path="websites" element={<Websites />} />
                    <Route path="funnels" element={<Funnels />} />
                    <Route path="funnels/:id" element={<FunnelManagement />} />
                    
                    {/* Context-aware page builder routes */}
                    <Route path="websites/:websiteId/pages/:pageId/builder" element={<PageBuilder />} />
                    <Route path="funnels/:funnelId/steps/:stepId/builder" element={<PageBuilder />} />
                    <Route path="marketing" element={<Marketing />} />
                    <Route path="marketing/facebook" element={<FacebookAds />} />
                    <Route path="marketing/email" element={<EmailCampaigns />} />
                    <Route path="marketing/discounts" element={<Discounts />} />
                    <Route path="settings" element={<StoreSettings />} />
                    <Route path="settings/store" element={<StoreSettings />} />
                    <Route path="settings/profile" element={<ProfileSettings />} />
                    <Route path="settings/billing" element={<BillingSettings />} />
                    <Route path="domains" element={<Domains />} />
                  </Route>
                  
                  {/* These routes are outside OnboardingGate so new users can access them */}
                  <Route path="websites/create" element={<CreateWebsite />} />
                  <Route path="websites/:id" element={<WebsiteManagement />} />
                  <Route path="funnels/create" element={<CreateFunnel />} />
                </Route>
                
                
                {/* Admin Routes */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/billing" element={<BillingManagement />} />
                <Route path="/admin/plans" element={<PlanManagement />} />
                <Route path="/admin/site-pricing" element={<SitePricingManagement />} />
                <Route path="/admin/sites" element={<AdminSites />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/revenue" element={<AdminRevenue />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/seo" element={<SEOSettings />} />
                <Route path="/admin/settings" element={<AdminSystemSettings />} />
                <Route path="/admin/product-library" element={<AdminProductLibrary />} />
                <Route path="/admin/product-library/add" element={<AdminAddLibraryProduct />} />
                <Route path="/admin/product-library/edit/:id" element={<AdminAddLibraryProduct />} />
                <Route path="/admin/product-library/orders/:id" element={<AdminLibraryOrders />} />
                <Route path="/admin/shipping" element={<AdminShipping />} />
                <Route path="/admin/library-orders" element={<AdminLibraryOrdersSummary />} />
                <Route path="/admin/templates" element={<AdminTemplateManagement />} />
                <Route path="/admin/templates/create" element={<AdminTemplateEditor />} />
                <Route path="/admin/templates/edit/:templateId" element={<AdminTemplateEditor />} />
                <Route path="/admin/templates/preview/:templateId" element={<AdminTemplatePreview />} />
                
                {/* Demo and Preview Routes */}
                <Route path="/preview/demo" element={<DemoPreview />} />
                
                {/* Public Storefront Routes */}
                <Route path="/store/:slug/products" element={<StorefrontProducts />} />
                <Route path="/store/:slug/products/:productSlug" element={<ProductDetail />} />
                <Route path="/store/:slug/search" element={<SearchResults />} />
                <Route path="/store/:slug/cart" element={<CartPage />} />
                <Route path="/store/:slug/checkout" element={<CheckoutPage />} />
                <Route path="/store/:slug/payment-processing/:orderId" element={<PaymentProcessing />} />
                <Route path="/store/:slug/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/store/:slug/:pageSlug" element={<StorefrontPage />} />
                <Route path="/store/:slug" element={<StorefrontHome />} />
                
                {/* Funnel Routes */}
                <Route path="/funnel/:funnelId/:stepSlug" element={<FunnelStepPage />} />
                <Route path="/funnel/:funnelId" element={<FunnelStepPage />} />

                {/* Website Routes */}
                <Route path="/website/:websiteId" element={<WebsiteLayout />}>
                  <Route index element={<WebsitePage />} />
                  <Route
                    path="products"
                    element={<WebsiteOverrideRoute slug="products" fallback={<StorefrontProducts />} />}
                  />
                  <Route path="products/:productSlug" element={<WebsiteProductDetailRoute />} />
                  <Route
                    path="search"
                    element={<WebsiteOverrideRoute slug="search" fallback={<SearchResults />} />}
                  />
                  <Route
                    path="cart"
                    element={<WebsiteOverrideRoute slug="cart" fallback={<CartPage />} />}
                  />
                  <Route
                    path="checkout"
                    element={<WebsiteOverrideRoute slug="checkout" fallback={<CheckoutPage />} />}
                  />
                  {/* Support both param and query styles for order-related pages with override */}
                  <Route
                    path="payment-processing"
                    element={<WebsiteOverrideRoute slug="payment-processing" fallback={<PaymentProcessing />} />}
                  />
                  <Route
                    path="payment-processing/:orderId"
                    element={<WebsiteOverrideRoute slug="payment-processing" fallback={<PaymentProcessing />} />}
                  />
                  <Route
                    path="order-confirmation"
                    element={<WebsiteOverrideRoute slug="order-confirmation" fallback={<OrderConfirmation />} />}
                  />
                  <Route
                    path="order-confirmation/:orderId"
                    element={<WebsiteOverrideRoute slug="order-confirmation" fallback={<OrderConfirmation />} />}
                  />
                  <Route path=":pageSlug" element={<WebsitePage />} />
                </Route>

                {/* Clean slug-based Website Routes */}
                <Route path="/site/:websiteSlug" element={<WebsiteLayout />}>
                  <Route index element={<WebsitePage />} />
                  <Route
                    path="products"
                    element={<WebsiteOverrideRoute slug="products" fallback={<StorefrontProducts />} />}
                  />
                  <Route path="products/:productSlug" element={<WebsiteProductDetailRoute />} />
                  <Route
                    path="search"
                    element={<WebsiteOverrideRoute slug="search" fallback={<SearchResults />} />}
                  />
                  <Route
                    path="cart"
                    element={<WebsiteOverrideRoute slug="cart" fallback={<CartPage />} />}
                  />
                  <Route
                    path="checkout"
                    element={<WebsiteOverrideRoute slug="checkout" fallback={<CheckoutPage />} />}
                  />
                  {/* Support both param and query styles for order-related pages with override */}
                  <Route
                    path="payment-processing"
                    element={<WebsiteOverrideRoute slug="payment-processing" fallback={<PaymentProcessing />} />}
                  />
                  <Route
                    path="payment-processing/:orderId"
                    element={<WebsiteOverrideRoute slug="payment-processing" fallback={<PaymentProcessing />} />}
                  />
                  <Route
                    path="order-confirmation"
                    element={<WebsiteOverrideRoute slug="order-confirmation" fallback={<OrderConfirmation />} />}
                  />
                  <Route
                    path="order-confirmation/:orderId"
                    element={<WebsiteOverrideRoute slug="order-confirmation" fallback={<OrderConfirmation />} />}
                  />
                  <Route path=":pageSlug" element={<WebsitePage />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </DomainRouter>
              </AddToCartProvider>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </PixelManager>
        </StoreProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

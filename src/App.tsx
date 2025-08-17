import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                
                {/* Single Store Dashboard Routes */}
                <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard/overview" element={<DashboardOverview />} />
                <Route path="/dashboard/products" element={<Products />} />
                <Route path="/dashboard/products/add" element={<AddProduct />} />
                <Route path="/dashboard/products/:id" element={<ProductView />} />
                <Route path="/dashboard/products/:id/edit" element={<EditProduct />} />
                <Route path="/dashboard/categories" element={<Categories />} />
                <Route path="/dashboard/product-library" element={<ProductLibrary />} />
                 <Route path="/dashboard/orders" element={<Orders />} />
                 <Route path="/dashboard/orders/:orderId" element={<Orders />} />
                <Route path="/dashboard/customers" element={<Customers />} />
                <Route path="/dashboard/analytics" element={<Analytics />} />
                <Route path="/dashboard/reviews" element={<Reviews />} />
                <Route path="/dashboard/websites" element={<Websites />} />
                <Route path="/dashboard/websites/create" element={<CreateWebsite />} />
                <Route path="/dashboard/websites/:id" element={<WebsiteManagement />} />
                <Route path="/dashboard/funnels" element={<Funnels />} />
                <Route path="/dashboard/funnels/create" element={<CreateFunnel />} />
                <Route path="/dashboard/funnels/:id" element={<FunnelManagement />} />
                
                {/* Context-aware page builder routes */}
                <Route path="/dashboard/websites/:websiteId/pages/:pageId/builder" element={<PageBuilder />} />
                <Route path="/dashboard/funnels/:funnelId/steps/:stepId/builder" element={<PageBuilder />} />
                <Route path="/dashboard/marketing" element={<Marketing />} />
                <Route path="/dashboard/marketing/facebook" element={<FacebookAds />} />
                <Route path="/dashboard/marketing/email" element={<EmailCampaigns />} />
                <Route path="/dashboard/marketing/discounts" element={<Discounts />} />
                <Route path="/dashboard/settings" element={<StoreSettings />} />
                <Route path="/dashboard/settings/store" element={<StoreSettings />} />
                <Route path="/dashboard/settings/profile" element={<ProfileSettings />} />
                <Route path="/dashboard/settings/billing" element={<BillingSettings />} />
                <Route path="/dashboard/domains" element={<Domains />} />
                
                
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
                <Route path="/admin/settings" element={<AdminSystemSettings />} />
                
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
  </QueryClientProvider>
);

export default App;

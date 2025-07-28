import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import Pages from "./pages/Pages";
import PageBuilder from "./pages/PageBuilder";
import Marketing from "./pages/Marketing";
import FacebookAds from "./pages/FacebookAds";
import EmailCampaigns from "./pages/EmailCampaigns";
import Discounts from "./pages/Discounts";
import StoreSettings from "./pages/StoreSettings";
import ProfileSettings from "./pages/ProfileSettings";
import BillingSettings from "./pages/BillingSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/products/add" element={<AddProduct />} />
            <Route path="/dashboard/products/:id" element={<ProductView />} />
            <Route path="/dashboard/products/:id/edit" element={<EditProduct />} />
            <Route path="/dashboard/categories" element={<Categories />} />
            <Route path="/dashboard/product-library" element={<ProductLibrary />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/customers" element={<Customers />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/pages" element={<Pages />} />
            <Route path="/dashboard/pages/builder" element={<PageBuilder />} />
            <Route path="/dashboard/pages/homepage" element={<PageBuilder />} />
            <Route path="/dashboard/marketing" element={<Marketing />} />
            <Route path="/dashboard/marketing/facebook" element={<FacebookAds />} />
            <Route path="/dashboard/marketing/email" element={<EmailCampaigns />} />
            <Route path="/dashboard/marketing/discounts" element={<Discounts />} />
            <Route path="/dashboard/settings" element={<StoreSettings />} />
            <Route path="/dashboard/settings/store" element={<StoreSettings />} />
            <Route path="/dashboard/settings/profile" element={<ProfileSettings />} />
            <Route path="/dashboard/settings/billing" element={<BillingSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

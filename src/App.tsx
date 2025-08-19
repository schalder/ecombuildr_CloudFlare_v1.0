import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';

// Core pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Dashboard from '@/pages/Dashboard';
import ProductLibrary from '@/pages/ProductLibrary';
import Auth from '@/pages/Auth';
import DashboardOverview from '@/pages/DashboardOverview';

// Admin imports
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminRevenue from '@/pages/admin/AdminRevenue';
import AdminSites from '@/pages/admin/AdminSites';
import AdminSupport from '@/pages/admin/AdminSupport';
import UserManagement from '@/pages/admin/UserManagement';
import BillingManagement from '@/pages/admin/BillingManagement';
import PlanManagement from '@/pages/admin/PlanManagement';
import SEOSettings from '@/pages/admin/SEOSettings';
import SitePricingManagement from '@/pages/admin/SitePricingManagement';
import AdminSystemSettings from '@/pages/admin/AdminSystemSettings';
import AdminProductLibrary from '@/pages/admin/AdminProductLibrary';
import AdminProductLibraryCategories from '@/pages/admin/AdminProductLibraryCategories';
import AdminAddLibraryProduct from '@/pages/admin/AdminAddLibraryProduct';
import AdminOrders from '@/pages/admin/AdminOrders';

function App() {
  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/*" element={<DashboardOverview />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/library" element={<ProductLibrary />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/sites" element={<AdminSites />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/billing" element={<BillingManagement />} />
          <Route path="/admin/plans" element={<PlanManagement />} />
          <Route path="/admin/seo" element={<SEOSettings />} />
          <Route path="/admin/pricing" element={<SitePricingManagement />} />
          <Route path="/admin/system" element={<AdminSystemSettings />} />
          
          {/* Admin Product Library Routes */}
          <Route path="/admin/product-library" element={<AdminProductLibrary />} />
          <Route path="/admin/product-library/categories" element={<AdminProductLibraryCategories />} />
          <Route path="/admin/product-library/add" element={<AdminAddLibraryProduct />} />
          <Route path="/admin/product-library/edit/:id" element={<AdminAddLibraryProduct />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
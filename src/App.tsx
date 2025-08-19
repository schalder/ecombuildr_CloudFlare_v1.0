import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { SiteHome } from '@/pages/SiteHome';
import { PricingPage } from '@/pages/PricingPage';
import { ContactPage } from '@/pages/ContactPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Dashboard } from '@/pages/Dashboard';
import { Storefront } from '@/pages/Storefront';
import { ProductDetail } from '@/pages/ProductDetail';
import { CategoryPage } from '@/pages/CategoryPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { PasswordResetPage } from '@/pages/PasswordResetPage';
import { Settings } from '@/pages/Settings';
import { Sites } from '@/pages/Sites';
import { Builder } from '@/pages/Builder';
import { ProductLibrary } from '@/pages/ProductLibrary';
import { BuilderHome } from '@/pages/builder/BuilderHome';
import { BuilderProducts } from '@/pages/builder/BuilderProducts';
import { BuilderCategories } from '@/pages/builder/BuilderCategories';
import { BuilderPages } from '@/pages/builder/BuilderPages';
import { BuilderSettings } from '@/pages/builder/BuilderSettings';
import { BuilderAnalytics } from '@/pages/builder/BuilderAnalytics';
import { BuilderIntegrations } from '@/pages/builder/BuilderIntegrations';
import { BuilderThemes } from '@/pages/builder/BuilderThemes';
import { BuilderCode } from '@/pages/builder/BuilderCode';
import { BuilderAI } from '@/pages/builder/BuilderAI';
import { BuilderBlog } from '@/pages/builder/BuilderBlog';
import { BuilderBlogDetail } from '@/pages/builder/BuilderBlogDetail';
import { BuilderMedia } from '@/pages/builder/BuilderMedia';
import { BuilderStoreSettings } from '@/pages/builder/BuilderStoreSettings';
import { BuilderDomainSettings } from '@/pages/builder/BuilderDomainSettings';
import { BuilderShippingSettings } from '@/pages/builder/BuilderShippingSettings';
import { BuilderPaymentSettings } from '@/pages/builder/BuilderPaymentSettings';
import { BuilderTaxSettings } from '@/pages/builder/BuilderTaxSettings';
import { BuilderFulfillmentSettings } from '@/pages/builder/BuilderFulfillmentSettings';
import { BuilderEmailSettings } from '@/pages/builder/BuilderEmailSettings';
import { BuilderLegalSettings } from '@/pages/builder/BuilderLegalSettings';
import { BuilderTeamSettings } from '@/pages/builder/BuilderTeamSettings';
import { BuilderAccountSettings } from '@/pages/builder/BuilderAccountSettings';
import { BuilderNotificationsSettings } from '@/pages/builder/BuilderNotificationsSettings';
import { BuilderIntegrationsSettings } from '@/pages/builder/BuilderIntegrationsSettings';
import { BuilderAIHome } from '@/pages/builder/ai/BuilderAIHome';
import { BuilderAIText } from '@/pages/builder/ai/BuilderAIText';
import { BuilderAIImage } from '@/pages/builder/ai/BuilderAIImage';
import { BuilderAIAudio } from '@/pages/builder/ai/BuilderAIAudio';
import { BuilderAIVideo } from '@/pages/builder/ai/BuilderAIVideo';
import { BuilderAITools } from '@/pages/builder/ai/BuilderAITools';
import { BuilderAIToolsDetail } from '@/pages/builder/ai/BuilderAIToolsDetail';
import { BuilderAIToolsPrompts } from '@/pages/builder/ai/BuilderAIToolsPrompts';
import { BuilderAIToolsPromptsDetail } from '@/pages/builder/ai/BuilderAIToolsPromptsDetail';
import { BuilderAIToolsHistory } from '@/pages/builder/ai/BuilderAIToolsHistory';
import { BuilderAIToolsTemplates } from '@/pages/builder/ai/BuilderAIToolsTemplates';
import { BuilderAIToolsTemplatesDetail } from '@/pages/builder/ai/BuilderAIToolsTemplatesDetail';
import { BuilderAIToolsCommunity } from '@/pages/builder/ai/BuilderAIToolsCommunity';
import { BuilderAIToolsCommunityDetail } from '@/pages/builder/ai/BuilderAIToolsCommunityDetail';
import { BuilderAIToolsPricing } from '@/pages/builder/ai/BuilderAIToolsPricing';
import { BuilderAIToolsFaq } from '@/pages/builder/ai/BuilderAIToolsFaq';
import { BuilderAIToolsContact } from '@/pages/builder/ai/BuilderAIToolsContact';
import { BuilderAIToolsTerms } from '@/pages/builder/ai/BuilderAIToolsTerms';
import { BuilderAIToolsPrivacy } from '@/pages/builder/ai/BuilderAIToolsPrivacy';
import { BuilderAIToolsSupport } from '@/pages/builder/ai/BuilderAIToolsSupport';
import { BuilderAIToolsBlog } from '@/pages/builder/ai/BuilderAIToolsBlog';
import { BuilderAIToolsBlogDetail } from '@/pages/builder/ai/BuilderAIToolsBlogDetail';
import { BuilderAIToolsMedia } from '@/pages/builder/ai/BuilderAIToolsMedia';
import { BuilderAIToolsSettings } from '@/pages/builder/ai/BuilderAIToolsSettings';
import { BuilderAIToolsIntegrations } from '@/pages/builder/ai/BuilderAIToolsIntegrations';
import { BuilderAIToolsThemes } from '@/pages/builder/ai/BuilderAIToolsThemes';
import { BuilderAIToolsCode } from '@/pages/builder/ai/BuilderAIToolsCode';
import { BuilderAIIntegrationsSettings } from '@/pages/builder/ai/BuilderAIIntegrationsSettings';
import { BuilderAIPlans } from '@/pages/builder/ai/BuilderAIPlans';
import { BuilderAIUsage } from '@/pages/builder/ai/BuilderAIUsage';
import { BuilderAIOnboarding } from '@/pages/builder/ai/BuilderAIOnboarding';
import { BuilderAIOnboardingDetail } from '@/pages/builder/ai/BuilderAIOnboardingDetail';
import { BuilderAIOnboardingTemplates } from '@/pages/builder/ai/BuilderAIOnboardingTemplates';
import { BuilderAIOnboardingTemplatesDetail } from '@/pages/builder/ai/BuilderAIOnboardingTemplatesDetail';
import { BuilderAIOnboardingCommunity } from '@/pages/builder/ai/BuilderAIOnboardingCommunity';
import { BuilderAIOnboardingCommunityDetail } from '@/pages/builder/ai/BuilderAIOnboardingCommunityDetail';
import { BuilderAIOnboardingPricing } from '@/pages/builder/ai/BuilderAIOnboardingPricing';
import { BuilderAIOnboardingFaq } from '@/pages/builder/ai/BuilderAIOnboardingFaq';
import { BuilderAIOnboardingContact } from '@/pages/builder/ai/BuilderAIOnboardingContact';
import { BuilderAIOnboardingTerms } from '@/pages/builder/ai/BuilderAIOnboardingTerms';
import { BuilderAIOnboardingPrivacy } from '@/pages/builder/ai/BuilderAIOnboardingPrivacy';
import { BuilderAIOnboardingSupport } from '@/pages/builder/ai/BuilderAIOnboardingSupport';
import { BuilderAIOnboardingBlog } from '@/pages/builder/ai/BuilderAIOnboardingBlog';
import { BuilderAIOnboardingBlogDetail } from '@/pages/builder/ai/BuilderAIOnboardingBlogDetail';
import { BuilderAIOnboardingMedia } from '@/pages/builder/ai/BuilderAIOnboardingMedia';
import { BuilderAIOnboardingSettings } from '@/pages/builder/ai/BuilderAIOnboardingSettings';
import { BuilderAIOnboardingIntegrations } from '@/pages/builder/ai/BuilderAIOnboardingIntegrations';
import { BuilderAIOnboardingThemes } from '@/pages/builder/ai/BuilderAIOnboardingThemes';
import { BuilderAIOnboardingCode } from '@/pages/builder/ai/BuilderAIOnboardingCode';
import { useUserStore } from '@/hooks/useUserStore';
import { useEffect } from 'react';

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

// New Admin Product Library imports
import AdminProductLibrary from '@/pages/admin/AdminProductLibrary';
import AdminProductLibraryCategories from '@/pages/admin/AdminProductLibraryCategories';
import AdminAddLibraryProduct from '@/pages/admin/AdminAddLibraryProduct';
import AdminOrders from '@/pages/admin/AdminOrders';

function App() {
  const { setUser, user } = useUserStore();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [setUser]);

  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <Router>
        <Routes>
          <Route path="/" element={<SiteHome />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/library" element={<ProductLibrary />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />

          {/* Storefront */}
          <Route path="/store/:storeSlug" element={<Storefront />} />
          <Route path="/store/:storeSlug/product/:productSlug" element={<ProductDetail />} />
          <Route path="/store/:storeSlug/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/store/:storeSlug/checkout" element={<CheckoutPage />} />
          <Route path="/store/:storeSlug/order-confirmation" element={<OrderConfirmationPage />} />

          {/* Builder */}
          <Route path="/builder/:websiteId" element={<Builder />} >
            <Route index element={<BuilderHome />} />
            <Route path="home" element={<BuilderHome />} />
            <Route path="products" element={<BuilderProducts />} />
            <Route path="categories" element={<BuilderCategories />} />
            <Route path="pages" element={<BuilderPages />} />
            <Route path="settings" element={<BuilderSettings />} />
            <Route path="analytics" element={<BuilderAnalytics />} />
            <Route path="integrations" element={<BuilderIntegrations />} />
            <Route path="themes" element={<BuilderThemes />} />
            <Route path="code" element={<BuilderCode />} />
            <Route path="ai" element={<BuilderAI />} />
            <Route path="blog" element={<BuilderBlog />} />
            <Route path="blog/:blogSlug" element={<BuilderBlogDetail />} />
            <Route path="media" element={<BuilderMedia />} />

            <Route path="store" element={<BuilderStoreSettings />} />
            <Route path="store/domain" element={<BuilderDomainSettings />} />
            <Route path="store/shipping" element={<BuilderShippingSettings />} />
            <Route path="store/payments" element={<BuilderPaymentSettings />} />
            <Route path="store/tax" element={<BuilderTaxSettings />} />
            <Route path="store/fulfillment" element={<BuilderFulfillmentSettings />} />
            <Route path="store/email" element={<BuilderEmailSettings />} />
            <Route path="store/legal" element={<BuilderLegalSettings />} />

            <Route path="team" element={<BuilderTeamSettings />} />
            <Route path="account" element={<BuilderAccountSettings />} />
            <Route path="notifications" element={<BuilderNotificationsSettings />} />
            <Route path="integrations" element={<BuilderIntegrationsSettings />} />
          </Route>

          {/* Builder AI */}
          <Route path="/builder/:websiteId/ai" element={<BuilderAI />} >
            <Route index element={<BuilderAIHome />} />
            <Route path="home" element={<BuilderAIHome />} />
            <Route path="text" element={<BuilderAIText />} />
            <Route path="image" element={<BuilderAIImage />} />
            <Route path="audio" element={<BuilderAIAudio />} />
            <Route path="video" element={<BuilderAIVideo />} />
            <Route path="tools" element={<BuilderAITools />} />
              <Route path="tools/:toolSlug" element={<BuilderAIToolsDetail />} />
              <Route path="tools/:toolSlug/prompts" element={<BuilderAIToolsPrompts />} />
                <Route path="tools/:toolSlug/prompts/:promptSlug" element={<BuilderAIToolsPromptsDetail />} />
              <Route path="tools/history" element={<BuilderAIToolsHistory />} />
              <Route path="tools/templates" element={<BuilderAIToolsTemplates />} />
                <Route path="tools/templates/:templateSlug" element={<BuilderAIToolsTemplatesDetail />} />
              <Route path="tools/community" element={<BuilderAIToolsCommunity />} />
                <Route path="tools/community/:communitySlug" element={<BuilderAIToolsCommunityDetail />} />
              <Route path="tools/pricing" element={<BuilderAIToolsPricing />} />
              <Route path="tools/faq" element={<BuilderAIToolsFaq />} />
              <Route path="tools/contact" element={<BuilderAIToolsContact />} />
              <Route path="tools/terms" element={<BuilderAIToolsTerms />} />
              <Route path="tools/privacy" element={<BuilderAIToolsPrivacy />} />
              <Route path="tools/support" element={<BuilderAIToolsSupport />} />
              <Route path="tools/blog" element={<BuilderAIToolsBlog />} />
                <Route path="tools/blog/:blogSlug" element={<BuilderAIToolsBlogDetail />} />
              <Route path="tools/media" element={<BuilderAIToolsMedia />} />
              <Route path="tools/settings" element={<BuilderAIToolsSettings />} />
              <Route path="tools/integrations" element={<BuilderAIToolsIntegrations />} />
              <Route path="tools/themes" element={<BuilderAIToolsThemes />} />
              <Route path="tools/code" element={<BuilderAIToolsCode />} />
            <Route path="integrations" element={<BuilderAIIntegrationsSettings />} />
            <Route path="plans" element={<BuilderAIPlans />} />
            <Route path="usage" element={<BuilderAIUsage />} />
            <Route path="onboarding" element={<BuilderAIOnboarding />} />
              <Route path="onboarding/:onboardingSlug" element={<BuilderAIOnboardingDetail />} />
              <Route path="onboarding/templates" element={<BuilderAIOnboardingTemplates />} />
                <Route path="onboarding/templates/:templateSlug" element={<BuilderAIOnboardingTemplatesDetail />} />
              <Route path="onboarding/community" element={<BuilderAIOnboardingCommunity />} />
                <Route path="onboarding/community/:communitySlug" element={<BuilderAIOnboardingCommunityDetail />} />
              <Route path="onboarding/pricing" element={<BuilderAIOnboardingPricing />} />
              <Route path="onboarding/faq" element={<BuilderAIOnboardingFaq />} />
              <Route path="onboarding/contact" element={<BuilderAIOnboardingContact />} />
              <Route path="onboarding/terms" element={<BuilderAIOnboardingTerms />} />
              <Route path="onboarding/privacy" element={<BuilderAIOnboardingPrivacy />} />
              <Route path="onboarding/support" element={<BuilderAIOnboardingSupport />} />
              <Route path="onboarding/blog" element={<BuilderAIOnboardingBlog />} />
                <Route path="onboarding/blog/:blogSlug" element={<BuilderAIOnboardingBlogDetail />} />
              <Route path="onboarding/media" element={<BuilderAIOnboardingMedia />} />
              <Route path="onboarding/settings" element={<BuilderAIOnboardingSettings />} />
              <Route path="onboarding/integrations" element={<BuilderAIOnboardingIntegrations />} />
              <Route path="onboarding/themes" element={<BuilderAIOnboardingThemes />} />
              <Route path="onboarding/code" element={<BuilderAIOnboardingCode />} />
          </Route>

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
          
          {/* New Admin Product Library Routes */}
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

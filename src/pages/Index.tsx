import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { SEOHead } from "@/components/SEOHead";
import { MetaTags } from "@/components/MetaTags";
import { SocialDebugger } from "@/components/SocialDebugger";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ToolsShowcase } from "@/components/ToolsShowcase";
import { AddonAppsShowcase } from "@/components/AddonAppsShowcase";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { ScrollToHash } from "@/components/ScrollToHash";
import { FAQ } from "@/components/FAQ";

const Index = () => {
  const { user, loading } = useAuth();
  const { seoData, loading: seoLoading } = useSEO('/');

  // Don't redirect authenticated users - let them see the home page

  return (
    <div className="min-h-screen">
      <ScrollToHash />
      <MetaTags
        title={seoData?.title || 'EcomBuildr - Build Your E-commerce Empire in Minutes'}
        description={seoData?.description || 'Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers.'}
        image={seoData?.og_image || 'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg'}
        keywords={seoData?.keywords || ['ecommerce builder', 'online store', 'no code', 'bangladesh ecommerce']}
        type="website"
        siteName="EcomBuildr"
      />
      <Navbar />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <ProcessSteps />
      <div id="tools">
        <ToolsShowcase />
      </div>
      <div id="addon-apps">
        <AddonAppsShowcase />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <div id="support">
        <FAQ />
      </div>
      <Footer />
      <WhatsAppWidget />
      <SocialDebugger />
    </div>
  );
};

export default Index;

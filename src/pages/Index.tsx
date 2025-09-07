import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ToolsShowcase } from "@/components/ToolsShowcase";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { FAQ } from "@/components/FAQ";

const Index = () => {
  const { user, loading } = useAuth();
  const { seoData, loading: seoLoading } = useSEO('/');

  // Don't redirect authenticated users - let them see the home page

  return (
    <div className="min-h-screen">
      <SEOHead
        title={seoData?.title}
        description={seoData?.description}
        ogImage={seoData?.og_image}
        keywords={seoData?.keywords}
      />
      <Navbar />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <ProcessSteps />
      <ToolsShowcase />
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <FAQ />
      <Footer />
      <WhatsAppWidget />
    </div>
  );
};

export default Index;

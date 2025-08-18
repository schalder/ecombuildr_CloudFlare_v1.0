import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ToolsShowcase } from "@/components/ToolsShowcase";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";

const Index = () => {
  const { user, loading } = useAuth();

  // Don't redirect authenticated users - let them see the home page

  return (
    <div className="min-h-screen">
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
      <Footer />
      <WhatsAppWidget />
    </div>
  );
};

export default Index;

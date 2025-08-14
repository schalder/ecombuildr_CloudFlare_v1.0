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

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

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
    </div>
  );
};

export default Index;

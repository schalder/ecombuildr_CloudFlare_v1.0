import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, MousePointerClick, Palette, Zap, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    title: "Create Your Website",
    description: "Set up your online website with our intuitive website creation wizard",
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: Zap,
    title: "Add Your Products",
    description: "Upload your products with descriptions, images, and pricing information",
    color: "text-success",
    bgColor: "bg-success-light"
  },
  {
    icon: Palette,
    title: "Design Your Pages",
    description: "Use our visual page builder to create custom landing pages and product pages",
    color: "text-accent",
    bgColor: "bg-accent-light"
  },
  {
    icon: TrendingUp,
    title: "Launch & Start Selling",
    description: "Go live with your website and start accepting orders from customers",
    color: "text-primary",
    bgColor: "bg-primary-light"
  }
];

export const ProcessSteps = () => {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            From Idea to Sales in <span className="text-accent">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our streamlined process gets you from zero to selling online faster than any other platform
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="p-6 text-center hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card h-full">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className={`w-16 h-16 rounded-lg ${step.bgColor} flex items-center justify-center mb-6 mx-auto mt-4`}>
                  <step.icon className={`h-8 w-8 ${step.color}`} />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
              
              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-accent" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="accent" size="lg" className="group">
            <Link to="/#pricing">
              Start Your Website Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
};
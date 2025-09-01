import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  ShoppingBag, 
  PaintBucket, 
  Smartphone, 
  ArrowRight,
  Zap,
  Target,
  CreditCard,
  Truck,
  Calculator
} from "lucide-react";

const tools = [
  {
    icon: PaintBucket,
    title: "Visual Page Builder",
    description: "Drag-and-drop interface for creating stunning product pages and landing pages",
    features: ["Drag & Drop Editor", "Mobile-Responsive Design", "Custom Branding Options"],
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: BarChart3,
    title: "Store Analytics",
    description: "Track your store performance with detailed insights and reporting",
    features: ["Sales Tracking", "Order Analytics", "Website Performance"],
    color: "text-accent",
    bgColor: "bg-accent-light"
  },
  {
    icon: ShoppingBag,
    title: "Product Management",
    description: "Complete product catalog management with inventory tracking",
    features: ["Product Catalog", "Inventory Management", "Category Organization"],
    color: "text-success",
    bgColor: "bg-success-light"
  },
  {
    icon: CreditCard,
    title: "Payment Integration",
    description: "Accept payments through popular local and digital payment methods",
    features: ["bKash Integration", "Nagad Support", "Cash on Delivery"],
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: Truck,
    title: "Integrate with Shipping Partner",
    description: "Connect with trusted delivery partners like SteadFast to handle your product shipping",
    features: ["SteadFast Integration", "Real-time Tracking", "Automated Order Processing"],
    color: "text-success",
    bgColor: "bg-success-light"
  },
  {
    icon: Calculator,
    title: "Setup Shipping Fee",
    description: "Configure flexible shipping options to match your business needs",
    features: ["Global Shipping Rates", "Product-wise Fees", "Weight-based Pricing", "Free Shipping Options"],
    color: "text-accent",
    bgColor: "bg-accent-light"
  }
];

export const ToolsShowcase = () => {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Tools for <span className="text-accent">Smart Entrepreneurs</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every feature is designed with one goal in mind: helping you make more sales and grow your business faster
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {tools.map((tool, index) => (
            <Card key={index} className="p-8 hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card">
              
              <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-lg ${tool.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon className={`h-8 w-8 ${tool.color}`} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    {tool.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {tool.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {tool.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 text-foreground">
                        <Zap className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-primary rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <Smartphone className="h-16 w-16 text-white mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h3>
            <p className="text-xl text-primary-light mb-8">
              Join thousands of entrepreneurs who've already built their online empire with our platform
            </p>
            <Button 
              variant="accent" 
              size="lg" 
              className="group"
              onClick={() => {
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Start Your Success Story
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};
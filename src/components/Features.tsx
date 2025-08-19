import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Store, 
  Palette, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  Globe, 
  Users, 
  BarChart3,
  Zap,
  Shield,
  Smartphone,
  Truck
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Professional Storefronts",
    description: "Create stunning, conversion-optimized online stores that represent your brand perfectly",
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: Palette,
    title: "Visual Page Builder",
    description: "Design beautiful landing pages and product pages with our intuitive drag-and-drop builder",
    color: "text-accent",
    bgColor: "bg-accent-light"
  },
  {
    icon: ShoppingCart,
    title: "Complete E-commerce Suite",
    description: "Everything you need to sell online - from product management to order fulfillment",
    color: "text-success",
    bgColor: "bg-success-light"
  },
  {
    icon: CreditCard,
    title: "Multiple Payment Options",
    description: "Accept payments via bKash, Nagad, and cash on delivery",
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: TrendingUp,
    title: "Conversion Analytics",
    description: "Track performance with detailed analytics and optimize for maximum conversions",
    color: "text-accent",
    bgColor: "bg-accent-light"
  },
  {
    icon: Truck,
    title: "Automated Fulfillment",
    description: "Streamline order processing with automated shipping and inventory management",
    color: "text-success",
    bgColor: "bg-success-light"
  }
];

const stats = [
  { value: "10,000+", label: "Active Stores", icon: Store },
  { value: "500%", label: "Average ROI Increase", icon: TrendingUp },
  { value: "98%", label: "Customer Satisfaction", icon: Users },
  { value: "24/7", label: "Support Available", icon: Shield }
];

export const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need <span className="text-accent">In One Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From store creation to conversion optimization - all the tools successful entrepreneurs need to build and scale their online business
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-medium transition-all duration-300 border-border/50 hover:border-accent/30 bg-gradient-card">
              <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
            Success by the Numbers
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-primary-light text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">
            Enterprise-Grade Technology
          </h3>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-5 w-5" />
              <span className="font-medium">Multi-tenant Architecture</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5" />
              <span className="font-medium">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-5 w-5" />
              <span className="font-medium">Mobile Optimized</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
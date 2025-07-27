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
    title: "নিজস্ব অনলাইন স্টোর",
    description: "আপনার ব্র্যান্ডের সাথে মানানসই কাস্টমাইজড স্টোর তৈরি করুন",
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: Palette,
    title: "Drag & Drop Page Builder",
    description: "কোডিং ছাড়াই প্রফেশনাল ল্যান্ডিং পেজ ডিজাইন করুন",
    color: "text-accent",
    bgColor: "bg-accent-light"
  },
  {
    icon: ShoppingCart,
    title: "Product Library",
    description: "হাজারো ট্রেন্ডিং প্রোডাক্ট আমাদের লাইব্রেরি থেকে ইমপোর্ট করুন",
    color: "text-success",
    bgColor: "bg-success-light"
  },
  {
    icon: CreditCard,
    title: "Cash on Delivery",
    description: "bKash, Nagad, SSLCommerz সহ সব পেমেন্ট মেথড একসাথে",
    color: "text-primary",
    bgColor: "bg-primary-light"
  },
  {
    icon: TrendingUp,
    title: "Facebook Marketing Tools",
    description: "Pixel integration, CAPI, এবং ad copy generator",
    color: "text-accent",
    bgColor: "bg-accent-light"
  },
  {
    icon: Truck,
    title: "Courier Integration",
    description: "RedX, Paperfly, Pathao - সব কুরিয়ার সার্ভিস একসাথে",
    color: "text-success",
    bgColor: "bg-success-light"
  }
];

const stats = [
  { value: "১০,০০০+", label: "Active Stores", icon: Store },
  { value: "৫০০%", label: "Average ROI Increase", icon: TrendingUp },
  { value: "৯৮%", label: "Customer Satisfaction", icon: Users },
  { value: "২৪/৭", label: "Support Available", icon: Shield }
];

export const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            সব ফিচার <span className="text-accent">এক জায়গায়</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            বাংলাদেশী F-Commerce ব্যবসায়ীদের জন্য বিশেষভাবে ডিজাইন করা সব টুলস এবং ফিচার
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
            আমাদের সাফল্যের গল্প
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
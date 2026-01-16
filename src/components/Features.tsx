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

        {/* Why Choose eComBuildr Section */}
        <div className="bg-gradient-primary rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              উদ্যোক্তারা কেন eComBuildr বেছে নিচ্ছেন?
            </h3>
            <p className="text-lg text-primary-light max-w-3xl mx-auto leading-relaxed">
              eComBuildr বানানো হয়েছে এমন একটি সিস্টেম হিসেবে, যেটা বাংলাদেশের উদ্যোক্তাদের বাস্তব সেলস ও ডেলিভারি সমস্যার সমাধান করে। আপনি নতুন হোন বা অভিজ্ঞ, এই প্ল্যাটফর্ম আপনাকে সহজভাবে বিক্রি করতে সাহায্য করবে।
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <p className="text-white font-semibold text-lg">
                বাংলা ল্যান্ডিং পেজ টেমপ্লেট
              </p>
            </Card>
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <p className="text-white font-semibold text-lg">
                ফানেল, আপসেল ও অর্ডার বাম্প
              </p>
            </Card>
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <p className="text-white font-semibold text-lg">
                কুরিয়ার ইন্টিগ্রেশন
              </p>
            </Card>
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center">
              <p className="text-white font-semibold text-lg">
                Facebook Pixel & CAPI রেডি
              </p>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <div className="space-y-2 text-primary-light">
              <p className="text-lg font-medium">কোনো setup নাটক না।</p>
              <p className="text-lg font-medium">কোনো অপ্রয়োজনীয় টেকনিক্যাল ঝামেলা না।</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-white font-semibold text-lg">
              <span>👉 শুধু সেটআপ করুন। বিক্রি শুরু করুন।</span>
            </div>
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
              <span className="font-medium">Drag & Drop Builder</span>
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
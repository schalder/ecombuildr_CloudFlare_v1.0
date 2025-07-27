import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "০",
    period: "/মাস",
    description: "নতুন ব্যবসায়ীদের জন্য",
    icon: Zap,
    color: "text-muted-foreground",
    buttonVariant: "outline" as const,
    popular: false,
    features: [
      "১টি স্টোর",
      "১০০টি প্রোডাক্ট",
      "বেসিক ল্যান্ডিং পেজ",
      "COD সাপোর্ট",
      "Email সাপোর্ট",
      "৭ দিন ফ্রি ট্রায়াল"
    ]
  },
  {
    name: "Professional",
    price: "১,৯৯৯",
    period: "/মাস",
    description: "গ্রোয়িং ব্যবসার জন্য",
    icon: Crown,
    color: "text-accent",
    buttonVariant: "accent" as const,
    popular: true,
    features: [
      "৫টি স্টোর",
      "আনলিমিটেড প্রোডাক্ট",
      "Advanced Page Builder",
      "সব Payment Methods",
      "Facebook Pixel & CAPI",
      "Courier Integration",
      "Product Library Access",
      "Priority Support",
      "Custom Domain"
    ]
  },
  {
    name: "Enterprise",
    price: "৪,৯৯৯",
    period: "/মাস",
    description: "বড় ব্যবসায়িক প্রতিষ্ঠানের জন্য",
    icon: Rocket,
    color: "text-primary",
    buttonVariant: "premium" as const,
    popular: false,
    features: [
      "আনলিমিটেড স্টোর",
      "আনলিমিটেড প্রোডাক্ট",
      "White-label Solution",
      "Advanced Analytics",
      "API Access",
      "Custom Integrations",
      "Dedicated Manager",
      "24/7 Phone Support",
      "Multi-location Shipping"
    ]
  }
];

export const Pricing = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-muted/30 to-background">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            আপনার বাজেট অনুযায়ী <span className="text-accent">প্ল্যান বেছে নিন</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            ছোট থেকে বড় - সব ধরনের ব্যবসায়ীর জন্য উপযুক্ত প্ল্যান
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative p-8 transition-all duration-300 hover:shadow-large ${
                plan.popular 
                  ? 'border-accent shadow-accent bg-gradient-card ring-2 ring-accent/20 scale-105' 
                  : 'border-border/50 hover:border-accent/30 bg-gradient-card'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground px-4 py-1 font-semibold">
                  সবচেয়ে জনপ্রিয়
                </Badge>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-${plan.color.split('-')[1]}/10 to-${plan.color.split('-')[1]}/20 flex items-center justify-center`}>
                  <plan.icon className={`h-8 w-8 ${plan.color}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                
                <p className="text-muted-foreground mb-4">
                  {plan.description}
                </p>

                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ৳{plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button 
                variant={plan.buttonVariant}
                className="w-full"
                size="lg"
              >
                {plan.price === "০" ? "ফ্রি শুরু করুন" : "এই প্ল্যান নিন"}
              </Button>

              {/* Additional Info */}
              <p className="text-center text-xs text-muted-foreground mt-4">
                {plan.price === "০" 
                  ? "ক্রেডিট কার্ড লাগবে না" 
                  : "যেকোনো সময় বাতিল করুন"
                }
              </p>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            কোন প্ল্যান আপনার জন্য উপযুক্ত তা নিশ্চিত নন?
          </p>
          <Button variant="outline" size="lg">
            বিক্রয় দলের সাথে কথা বলুন
          </Button>
        </div>

        {/* Money Back Guarantee */}
        <div className="mt-12 text-center p-6 bg-success-light/20 rounded-lg border border-success/20">
          <h4 className="font-semibold text-success mb-2">
            ১০০% Money Back Guarantee
          </h4>
          <p className="text-sm text-muted-foreground">
            ৩০ দিনের মধ্যে সন্তুষ্ট না হলে সম্পূর্ণ টাকা ফেরত
          </p>
        </div>

      </div>
    </section>
  );
};
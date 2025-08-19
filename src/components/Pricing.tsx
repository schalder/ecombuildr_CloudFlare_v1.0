import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Rocket, Star, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PricingPlan {
  id: string;
  plan_name: string;
  display_name: string;
  price_bdt: number;
  description: string;
  features: string[];
  is_popular: boolean;
  icon: string;
  color_class: string;
  button_variant: string;
}

const iconMap = {
  Zap,
  Crown,
  Rocket,
  Star,
} as const;

type IconName = keyof typeof iconMap;

export const Pricing = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('site_pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching pricing plans:', error);
        return;
      }

      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features.map(f => String(f)) : []
      })));
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('bn-BD').format(price);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName as IconName] || Crown;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-muted/30 to-background">
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
          {plans.map((plan) => {
            const IconComponent = getIcon(plan.icon);
            
            return (
              <Card 
                key={plan.id}
                className={`relative p-8 transition-all duration-300 hover:shadow-large ${
                  plan.is_popular 
                    ? 'border-accent shadow-accent bg-gradient-card ring-2 ring-accent/20 scale-105' 
                    : 'border-border/50 hover:border-accent/30 bg-gradient-card'
                }`}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground px-4 py-1 font-semibold">
                    সবচেয়ে জনপ্রিয়
                  </Badge>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center`}>
                    <IconComponent className={`h-8 w-8 ${plan.color_class}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.display_name}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ৳{formatPrice(plan.price_bdt)}
                    </span>
                    <span className="text-muted-foreground">
                      /মাস
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
                  variant={plan.button_variant as any}
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/auth?plan=${plan.plan_name}`)}
                >
                  {plan.price_bdt === 0 ? "ফ্রি শুরু করুন" : "এই প্ল্যান নিন"}
                </Button>

                {/* Additional Info */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  {plan.price_bdt === 0
                    ? "ক্রেডিট কার্ড লাগবে না" 
                    : "যেকোনো সময় বাতিল করুন"
                  }
                </p>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            কোন প্ল্যান আপনার জন্য উপযুক্ত তা নিশ্চিত নন?
          </p>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => {
              const message = encodeURIComponent("Hi, I'm interested in learning more about your pricing plans. Can you help me choose the right plan for my business?");
              const whatsappUrl = `https://wa.me/+8801234567890?text=${message}`;
              window.open(whatsappUrl, '_blank');
            }}
          >
            Contact Sales Team
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
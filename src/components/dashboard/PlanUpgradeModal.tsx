import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planData = [
  {
    name: 'starter',
    displayName: 'স্টার্টার',
    price: 500,
    icon: Zap,
    description: 'ছোট ব্যবসার জন্য',
    features: [
      '১টি স্টোর',
      '১টি ওয়েবসাইট',
      '১টি ফানেল',
      '২০টি পেজ',
      '৫০টি পণ্য',
      '১০০ অর্ডার/মাস',
      '৭ দিন ফ্রি ট্রায়াল'
    ],
    popular: false,
  },
  {
    name: 'professional',
    displayName: 'প্রফেশনাল',
    price: 1500,
    icon: Crown,
    description: 'ক্রমবর্ধমান ব্যবসার জন্য',
    features: [
      '৫টি স্টোর',
      '৫টি ওয়েবসাইট',
      '১০টি ফানেল',
      '৫০টি পেজ প্রতি স্টোর',
      '১০০টি পণ্য প্রতি স্টোর',
      '৩০০ অর্ডার/মাস',
      'কাস্টম ডোমেইন',
      'অগ্রাধিকার সাপোর্ট',
      '৭ দিন ফ্রি ট্রায়াল'
    ],
    popular: true,
  },
  {
    name: 'enterprise',
    displayName: 'এন্টারপ্রাইজ',
    price: 2999,
    icon: Star,
    description: 'বড় ব্যবসার জন্য',
    features: [
      'সীমাহীন স্টোর',
      'সীমাহীন ওয়েবসাইট',
      'সীমাহীন ফানেল',
      'সীমাহীন পেজ',
      'সীমাহীন পণ্য',
      'সীমাহীন অর্ডার',
      'কাস্টম ডোমেইন',
      'অগ্রাধিকার সাপোর্ট',
      'হোয়াইট লেবেল',
      '৭ দিন ফ্রি ট্রায়াল'
    ],
    popular: false,
  },
];

export const PlanUpgradeModal = ({ open, onOpenChange }: PlanUpgradeModalProps) => {
  const { userProfile, refetch } = usePlanLimits();
  const { user } = useAuth();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (planName: string) => {
    if (!user) return;

    setUpgrading(planName);

    try {
      // Start trial for the selected plan
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: planName as any,
          account_status: 'trial',
          trial_started_at: new Date().toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'প্ল্যান আপগ্রেড সফল!',
        description: `আপনার ${planData.find(p => p.name === planName)?.displayName} প্ল্যানের ৭ দিনের ফ্রি ট্রায়াল শুরু হয়েছে।`,
      });

      refetch();
      onOpenChange(false);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'প্ল্যান আপগ্রেড ব্যর্থ',
        description: 'দয়া করে আবার চেষ্টা করুন।',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = userProfile?.subscription_plan || 'free';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>প্ল্যান আপগ্রেড করুন</DialogTitle>
          <DialogDescription>
            আপনার ব্যবসার প্রয়োজন অনুযায়ী সেরা প্ল্যান বেছে নিন
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {planData.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.name;
            const canUpgrade = currentPlan === 'free' || 
              (currentPlan === 'starter' && (plan.name === 'professional' || plan.name === 'enterprise')) ||
              (currentPlan === 'professional' && plan.name === 'enterprise');

            return (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="px-3 py-1">
                      জনপ্রিয়
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">৳{plan.price}</span>
                    <span className="text-muted-foreground">/মাস</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isCurrentPlan || !canUpgrade || !!upgrading}
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {upgrading === plan.name ? 'আপগ্রেড হচ্ছে...' :
                     isCurrentPlan ? 'বর্তমান প্ল্যান' : 
                     !canUpgrade ? 'ডাউনগ্রেড সম্ভব নয়' : 
                     '৭ দিন ফ্রি ট্রায়াল শুরু করুন'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">গুরুত্বপূর্ণ তথ্য:</p>
              <ul className="space-y-1">
                <li>• সকল প্রিমিয়াম প্ল্যানে ৭ দিনের ফ্রি ট্রায়াল আছে</li>
                
                <li>• যে কোনো সময় প্ল্যান পরিবর্তন বা বাতিল করা যাবে</li>
                <li>• পেমেন্ট bKash, Nagad, ও ব্যাংক ট্রান্সফারের মাধ্যমে সম্ভব</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, CreditCard, Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentOptions } from '@/hooks/usePaymentOptions';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanUpgradeModal2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanWithLimits {
  plan_name: string;
  display_name: string;
  price_bdt: number;
  features: string[];
  limits: {
    max_stores: number | null;
    max_websites: number | null;
    max_funnels: number | null;
    max_products_per_store: number | null;
    max_orders_per_month: number | null;
    custom_domain_allowed: boolean;
    priority_support: boolean;
    white_label: boolean;
  };
}

export const PlanUpgradeModal2: React.FC<PlanUpgradeModal2Props> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { paymentOptions } = usePaymentOptions();
  const { userProfile } = usePlanLimits();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<PlanWithLimits[]>([]);
  const [loading, setLoading] = useState(true);

  const enabledPaymentOptions = paymentOptions.filter(option => option.is_enabled);

  useEffect(() => {
    if (open) {
      fetchPlansWithLimits();
    }
  }, [open]);

  const fetchPlansWithLimits = async () => {
    try {
      setLoading(true);
      
      // Fetch pricing plans and plan limits
      const [pricingResult, limitsResult] = await Promise.all([
        supabase
          .from('site_pricing_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('plan_limits')
          .select('*')
      ]);

      if (pricingResult.error) throw pricingResult.error;
      if (limitsResult.error) throw limitsResult.error;

      const pricingPlans = pricingResult.data || [];
      const planLimits = limitsResult.data || [];

      // Combine pricing and limits data
      const combinedPlans = pricingPlans
        .filter(plan => plan.plan_name !== 'free') // Exclude free plan from upgrade options
        .filter(plan => plan.plan_name !== userProfile?.subscription_plan) // Exclude current plan
        .map(plan => {
          const limits = planLimits.find(limit => limit.plan_name === plan.plan_name);
          return {
            plan_name: plan.plan_name,
            display_name: plan.display_name,
            price_bdt: plan.price_bdt,
            features: plan.features as string[],
            limits: {
              max_stores: limits?.max_stores || null,
              max_websites: limits?.max_websites || null,
              max_funnels: limits?.max_funnels || null,
              max_products_per_store: limits?.max_products_per_store || null,
              max_orders_per_month: limits?.max_orders_per_month || null,
              custom_domain_allowed: limits?.custom_domain_allowed || false,
              priority_support: limits?.priority_support || false,
              white_label: limits?.white_label || false,
            }
          };
        });

      setPlans(combinedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('প্ল্যান লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    setStep(2);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan || !selectedPaymentMethod || !transactionId.trim()) {
      toast.error('সব ফিল্ড পূরণ করুন');
      return;
    }

    setSubmitting(true);
    try {
      const selectedPlanData = plans.find(p => p.plan_name === selectedPlan);
      if (!selectedPlanData) throw new Error('Plan not found');

      const { error } = await supabase
        .from('saas_subscriptions')
        .insert({
          user_id: user?.id,
          plan_name: selectedPlan,
          plan_price_bdt: selectedPlanData.price_bdt,
          payment_method: selectedPaymentMethod,
          payment_reference: transactionId,
          subscription_status: 'pending',
          notes: `User submitted upgrade request to ${selectedPlanData.display_name}`
        });

      if (error) throw error;

      toast.success('আপনার পেমেন্ট অনুরোধ গ্রহণ করা হয়েছে। আমরা ম্যানুয়ালি যাচাই করে আপনার প্ল্যান আপগ্রেড করবো।');
      onOpenChange(false);
      
      // Reset form
      setStep(1);
      setSelectedPlan('');
      setSelectedPaymentMethod('');
      setTransactionId('');
    } catch (error: any) {
      console.error('Error submitting upgrade request:', error);
      toast.error('অনুরোধ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedPaymentMethod('');
      setTransactionId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? (
              <>
                <CreditCard className="h-5 w-5" />
                প্ল্যান নির্বাচন করুন
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                পেমেন্ট সম্পূর্ণ করুন
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin" />
                <span className="ml-2">প্ল্যান লোড করা হচ্ছে...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.plan_name}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedPlan === plan.plan_name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handlePlanSelect(plan.plan_name)}
                  >
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                      <CardDescription>
                        <span className="text-3xl font-bold text-primary">৳{plan.price_bdt}</span>
                        <span className="text-muted-foreground">/মাস</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Plan Limits */}
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">সীমা ও সুবিধা:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>স্টোর: {plan.limits.max_stores === null ? '∞' : plan.limits.max_stores}</div>
                          <div>ওয়েবসাইট: {plan.limits.max_websites === null ? '∞' : plan.limits.max_websites}</div>
                          <div>ফানেল: {plan.limits.max_funnels === null ? '∞' : plan.limits.max_funnels}</div>
                          <div>প্রোডাক্ট: {plan.limits.max_products_per_store === null ? '∞' : plan.limits.max_products_per_store}</div>
                          <div>অর্ডার/মাস: {plan.limits.max_orders_per_month === null ? '∞' : plan.limits.max_orders_per_month}</div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {plan.limits.custom_domain_allowed && (
                            <Badge variant="outline" className="text-xs">কাস্টম ডোমেইন</Badge>
                          )}
                          {plan.limits.priority_support && (
                            <Badge variant="outline" className="text-xs ml-1">প্রায়োরিটি সাপোর্ট</Badge>
                          )}
                          {plan.limits.white_label && (
                            <Badge variant="outline" className="text-xs ml-1">হোয়াইট লেবেল</Badge>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" onClick={() => handlePlanSelect(plan.plan_name)}>
                        এই প্ল্যান নির্বাচন করুন
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                পিছনে যান
              </Button>
              <Badge variant="outline">
                নির্বাচিত: {plans.find(p => p.plan_name === selectedPlan)?.display_name}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>পেমেন্ট পদ্ধতি নির্বাচন করুন</CardTitle>
                <CardDescription>
                  নিচের পেমেন্ট পদ্ধতি ব্যবহার করে টাকা পাঠান এবং Transaction ID প্রদান করুন
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enabledPaymentOptions.length === 0 ? (
                  <p className="text-muted-foreground">কোন পেমেন্ট পদ্ধতি সক্রিয় নেই</p>
                ) : (
                  enabledPaymentOptions.map((option) => (
                    <Card
                      key={option.provider}
                      className={`cursor-pointer transition-all ${
                        selectedPaymentMethod === option.provider ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedPaymentMethod(option.provider)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{option.display_name}</h4>
                          {selectedPaymentMethod === option.provider && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        {option.account_number && (
                          <p className="text-sm text-muted-foreground mb-2">
                            নম্বর: <span className="font-mono font-semibold">{option.account_number}</span>
                          </p>
                        )}
                        {option.instructions && (
                          <p className="text-sm text-muted-foreground">{option.instructions}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}

                {selectedPaymentMethod && (
                  <div className="space-y-4 mt-6">
                    <div>
                      <Label htmlFor="transaction-id">Transaction ID</Label>
                      <Input
                        id="transaction-id"
                        placeholder="আপনার Transaction ID এখানে লিখুন"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handlePaymentSubmit}
                      disabled={!transactionId.trim() || submitting}
                      className="w-full"
                    >
                      {submitting ? 'জমা দিচ্ছি...' : 'পেমেন্ট জমা দিন'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

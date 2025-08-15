
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentOptions } from '@/hooks/usePaymentOptions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanUpgradeModal2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    name: 'basic',
    title: 'বেসিক প্ল্যান',
    price: 500,
    features: [
      'অসীমিত প্রোডাক্ট',
      '২টি ওয়েবসাইট',
      '৫টি ফানেল',
      'বেসিক অ্যানালিটিক্স',
      'ইমেইল সাপোর্ট'
    ]
  },
  {
    name: 'pro',
    title: 'প্রো প্ল্যান',
    price: 1500,
    features: [
      'অসীমিত প্রোডাক্ট',
      '১০টি ওয়েবসাইট',
      'অসীমিত ফানেল',
      'অ্যাডভান্স অ্যানালিটিক্স',
      'প্রায়োরিটি সাপোর্ট',
      'কাস্টম ডোমেইন'
    ]
  },
  {
    name: 'enterprise',
    title: 'এন্টারপ্রাইজ প্ল্যান',
    price: 2999,
    features: [
      'অসীমিত সবকিছু',
      'হোয়াইট লেবেল',
      'ডেডিকেটেড সাপোর্ট',
      'কাস্টম ডেভেলপমেন্ট',
      'API অ্যাক্সেস'
    ]
  }
];

export const PlanUpgradeModal2: React.FC<PlanUpgradeModal2Props> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { paymentOptions } = usePaymentOptions();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const enabledPaymentOptions = paymentOptions.filter(option => option.is_enabled);

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
      const selectedPlanData = plans.find(p => p.name === selectedPlan);
      if (!selectedPlanData) throw new Error('Plan not found');

      const { error } = await supabase
        .from('saas_subscriptions')
        .insert({
          user_id: user?.id,
          plan_name: selectedPlan,
          plan_price_bdt: selectedPlanData.price,
          payment_method: selectedPaymentMethod,
          payment_reference: transactionId,
          subscription_status: 'pending',
          notes: `User submitted upgrade request to ${selectedPlanData.title}`
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedPlan === plan.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handlePlanSelect(plan.name)}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-primary">৳{plan.price}</span>
                      <span className="text-muted-foreground">/মাস</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-4" onClick={() => handlePlanSelect(plan.name)}>
                      এই প্ল্যান নির্বাচন করুন
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                নির্বাচিত: {plans.find(p => p.name === selectedPlan)?.title}
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

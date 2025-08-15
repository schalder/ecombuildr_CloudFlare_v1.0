import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { AlertTriangle, Clock, Crown, Zap } from 'lucide-react';

interface PlanStatusBannerProps {
  onUpgrade?: () => void;
}

export const PlanStatusBanner = ({ onUpgrade }: PlanStatusBannerProps) => {
  const { userProfile, getTrialDaysRemaining, isTrialExpired } = usePlanLimits();

  if (!userProfile) return null;

  const trialDaysRemaining = getTrialDaysRemaining();
  const trialExpired = isTrialExpired();

  // Account suspended
  if (userProfile.account_status === 'suspended') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">অ্যাকাউন্ট স্থগিত</span>
            <p className="text-sm mt-1">আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সাপোর্টের সাথে যোগাযোগ করুন।</p>
          </div>
          <Button variant="outline" size="sm">
            সাপোর্ট
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial expired
  if (trialExpired) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">ট্রায়াল সময় শেষ</span>
            <p className="text-sm mt-1">আপনার ট্রায়াল সময় শেষ হয়ে গেছে। পেমেন্ট করে প্ল্যান সক্রিয় করুন।</p>
          </div>
          <Button onClick={onUpgrade} size="sm">
            এখনই পেমেন্ট করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active trial with warning
  if (userProfile.account_status === 'trial' && trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
    return (
      <Alert className="mb-6 border-warning bg-warning/10">
        <Clock className="h-4 w-4 text-warning" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">ট্রায়াল শীঘ্রই শেষ</span>
            <p className="text-sm mt-1">
              আপনার ট্রায়াল আরও {trialDaysRemaining} দিন বাকি। নিরবচ্ছিন্ন সেবার জন্য এখনই পেমেন্ট করুন।
            </p>
          </div>
          <Button onClick={onUpgrade} size="sm">
            পেমেন্ট করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Free plan user
  if (userProfile.subscription_plan === 'free') {
    return (
      <Alert className="mb-6 border-primary bg-primary/10">
        <Zap className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">ফ্রি প্ল্যান ব্যবহার করছেন</span>
              <Badge variant="outline">ফ্রি</Badge>
            </div>
            <p className="text-sm mt-1">
              প্রিমিয়াম ফিচার ও আরও রিসোর্স পেতে প্ল্যান আপগ্রেড করুন। ৭ দিন ফ্রি ট্রায়াল!
            </p>
          </div>
          <Button onClick={onUpgrade} size="sm">
            আপগ্রেড করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active trial (early days)
  if (userProfile.account_status === 'trial' && trialDaysRemaining > 3) {
    const planIcon = userProfile.subscription_plan === 'enterprise' ? Crown : Zap;
    const PlanIcon = planIcon;

    return (
      <Alert className="mb-6 border-primary bg-primary/10">
        <PlanIcon className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">ফ্রি ট্রায়াল চলছে</span>
              <Badge variant="outline">{trialDaysRemaining} দিন বাকি</Badge>
            </div>
            <p className="text-sm mt-1">
              আপনার {userProfile.subscription_plan} প্ল্যানের ট্রায়াল চলছে। সব ফিচার উপভোগ করুন!
            </p>
          </div>
          <Button onClick={onUpgrade} variant="outline" size="sm">
            এখনই পেমেন্ট করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
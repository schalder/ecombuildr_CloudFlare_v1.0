import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { AlertTriangle, Clock, Crown, Zap } from 'lucide-react';

interface PlanStatusBannerProps {
  onUpgrade?: () => void;
}

export const PlanStatusBanner = ({ onUpgrade }: PlanStatusBannerProps) => {
  const { 
    userProfile, 
    getTrialDaysRemaining, 
    isTrialExpired, 
    getGraceDaysRemaining, 
    isInGracePeriod, 
    isAccountReadOnly 
  } = usePlanLimits();

  if (!userProfile) return null;

  const trialDaysRemaining = getTrialDaysRemaining();
  const trialExpired = isTrialExpired();
  const graceDaysRemaining = getGraceDaysRemaining();
  const inGracePeriod = isInGracePeriod();
  const accountReadOnly = isAccountReadOnly();

  // Account read-only (check actual database status)
  if (userProfile.account_status === 'read_only') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">অ্যাকাউন্ট সীমাবদ্ধ</span>
            <p className="text-sm mt-1">
              আপনার অ্যাকাউন্ট রিড-অনলি মোডে আছে। সব ওয়েবসাইট ও ফানেল প্রাইভেট হয়ে গেছে। অ্যাকাউন্ট আপগ্রেড করুন।
            </p>
          </div>
          <Button onClick={onUpgrade} size="sm">
            অ্যাকাউন্ট আপগ্রেড করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

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

  // Trial expired but in grace period
  if (trialExpired && inGracePeriod && userProfile.account_status === 'trial') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">ট্রায়াল শেষ - গ্রেস পিরিয়ড ({graceDaysRemaining} দিন বাকি)</span>
            <p className="text-sm mt-1">
              আপনার ট্রায়াল শেষ হয়েছে এবং আপনি এখন গ্রেস পিরিয়ডে আছেন। এই সময়ে আপনি নতুন পেজ, ফানেল বা অন্যান্য রিসোর্স তৈরি করতে পারবেন না। পেমেন্ট না করলে আরও {graceDaysRemaining} দিন পর অ্যাকাউন্ট রিড-অনলি হয়ে যাবে।
            </p>
          </div>
          <Button onClick={onUpgrade} size="sm">
            এখনই পেমেন্ট করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active subscription expired but in grace period
  if (userProfile.account_status === 'active' && userProfile.subscription_expires_at) {
    const subscriptionExpiry = new Date(userProfile.subscription_expires_at);
    const now = new Date();
    
    if (now > subscriptionExpiry && inGracePeriod) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium">সাবস্ক্রিপশন শেষ - {graceDaysRemaining} দিন বাকি</span>
              <p className="text-sm mt-1">
                আপনার সাবস্ক্রিপশন শেষ হয়েছে। পেমেন্ট না করলে আরও {graceDaysRemaining} দিন পর অ্যাকাউন্ট রিড-অনলি হয়ে যাবে।
              </p>
            </div>
            <Button onClick={onUpgrade} size="sm">
              পেমেন্ট করুন
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
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

  // No longer needed - "free" plan removed from system

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
            পেমেন্ট করুন
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
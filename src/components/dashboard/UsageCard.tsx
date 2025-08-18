
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { AlertTriangle, ArrowUp, Clock, Calendar } from 'lucide-react';

interface UsageCardProps {
  onUpgrade?: () => void;
}

export const UsageCard = ({ onUpgrade }: UsageCardProps) => {
  const { planLimits, userUsage, userProfile, loading, isAtLimit, getUsagePercentage, getTrialDaysRemaining } = usePlanLimits();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ব্যবহারের সীমা</CardTitle>
          <CardDescription>লোড হচ্ছে...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!planLimits || !userUsage) {
    return null;
  }

  const formatLimit = (limit: number | null): string => {
    return limit === null ? 'সীমাহীন' : limit.toString();
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'hsl(var(--destructive))';
    if (percentage >= 70) return 'hsl(var(--warning))';
    return 'hsl(var(--primary))';
  };

  const usageItems = [
    {
      label: 'স্টোর',
      current: userUsage.current_stores,
      limit: planLimits.max_stores,
      percentage: getUsagePercentage('current_stores'),
      isAtLimit: isAtLimit('current_stores'),
    },
    {
      label: 'ওয়েবসাইট',
      current: userUsage.current_websites,
      limit: planLimits.max_websites,
      percentage: getUsagePercentage('current_websites'),
      isAtLimit: isAtLimit('current_websites'),
    },
    {
      label: 'ফানেল',
      current: userUsage.current_funnels,
      limit: planLimits.max_funnels,
      percentage: getUsagePercentage('current_funnels'),
      isAtLimit: isAtLimit('current_funnels'),
    },
    {
      label: 'এই মাসের অর্ডার',
      current: userUsage.current_orders_this_month,
      limit: planLimits.max_orders_per_month,
      percentage: getUsagePercentage('current_orders_this_month'),
      isAtLimit: isAtLimit('current_orders_this_month'),
    },
  ];

  const hasAnyLimitReached = usageItems.some(item => item.isAtLimit);
  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ব্যবহারের সীমা</CardTitle>
            <CardDescription>
              বর্তমান প্ল্যান: <Badge variant="outline">{planLimits.plan_name}</Badge>
            </CardDescription>
          </div>
          {hasAnyLimitReached && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">সীমা পূর্ণ!</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.current} / {formatLimit(item.limit)}
                </span>
                {item.isAtLimit && (
                  <Badge variant="destructive" className="text-xs">
                    সীমা পূর্ণ
                  </Badge>
                )}
              </div>
            </div>
            <Progress 
              value={item.percentage} 
              className="h-2"
              style={{
                '--progress-foreground': getStatusColor(item.percentage),
              } as any}
            />
          </div>
        ))}

        {/* Trial Status */}
        {userProfile?.account_status === 'trial' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">ট্রায়াল অ্যাকাউন্ট</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600">
                    {trialDaysRemaining} দিন বাকি
                    {userProfile.trial_expires_at && 
                      ` (${new Date(userProfile.trial_expires_at).toLocaleDateString('bn-BD')})`
                    }
                  </span>
                </div>
              </div>
              <Badge variant="secondary">ট্রায়াল</Badge>
            </div>
          </div>
        )}

        {/* Active Subscription Status */}
        {userProfile?.account_status === 'active' && userProfile?.subscription_expires_at && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">সক্রিয় সাবস্ক্রিপশন</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  মেয়াদ শেষ: {new Date(userProfile.subscription_expires_at).toLocaleDateString('bn-BD')}
                </p>
              </div>
              <Badge variant="default">সক্রিয়</Badge>
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {(hasAnyLimitReached || userProfile?.account_status === 'trial') && (
          <Button 
            onClick={onUpgrade}
            className="w-full mt-4"
            variant="default"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            {userProfile?.account_status === 'trial' ? 'প্ল্যান আপগ্রেড করুন' : 'প্ল্যান পরিবর্তন করুন'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

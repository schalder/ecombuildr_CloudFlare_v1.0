import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimitsUpdated";

interface UsageCardProps {
  onUpgrade?: () => void;
}

export const UsageCard = ({ onUpgrade }: UsageCardProps) => {
  const { planLimits, userUsage, loading, getUsagePercentage, isAtLimit, getTrialDaysRemaining, isInGracePeriod } = usePlanLimits();

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
      label: 'মোট পণ্য',
      current: userUsage.current_products,
      limit: planLimits.max_products_per_store,
      percentage: getUsagePercentage('current_products'),
      isAtLimit: isAtLimit('current_products'),
    },
    {
      label: 'মোট পেজ',
      current: userUsage.current_pages,
      limit: planLimits.max_pages_per_store,
      percentage: getUsagePercentage('current_pages'),
      isAtLimit: isAtLimit('current_pages'),
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
                background: `linear-gradient(to right, ${getStatusColor(item.percentage)} ${item.percentage}%, hsl(var(--muted)) ${item.percentage}%)`
              }}
            />
          </div>
        ))}

        {/* Trial/Subscription Status */}
        <div className="pt-4 border-t">
          {trialDaysRemaining > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ট্রায়াল বাকি</span>
                <Badge variant={trialDaysRemaining <= 3 ? "destructive" : "secondary"}>
                  {trialDaysRemaining} দিন
                </Badge>
              </div>
              {(hasAnyLimitReached || trialDaysRemaining <= 3) && (
                <Button 
                  onClick={onUpgrade} 
                  size="sm" 
                  className="w-full"
                  variant={trialDaysRemaining <= 3 ? "destructive" : "default"}
                >
                  প্ল্যান আপগ্রেড করুন
                </Button>
              )}
            </div>
          ) : isInGracePeriod() ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-600">গ্রেস পিরিয়ড</span>
                <Badge variant="destructive">শীঘ্রই মেয়াদ উত্তীর্ণ</Badge>
              </div>
              <Button onClick={onUpgrade} size="sm" className="w-full" variant="destructive">
                এখনই পেমেন্ট করুন
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">সক্রিয় সাবস্ক্রিপশন</span>
                <Badge variant="default">সক্রিয়</Badge>
              </div>
              {hasAnyLimitReached && (
                <Button onClick={onUpgrade} size="sm" className="w-full">
                  প্ল্যান আপগ্রেড করুন
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
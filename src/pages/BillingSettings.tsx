
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Calendar, CheckCircle, Crown } from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useAuth } from '@/hooks/useAuth';
import { PlanUpgradeModal2 } from '@/components/dashboard/PlanUpgradeModal2';
import { useState } from 'react';

export default function BillingSettings() {
  const { planLimits, userProfile, loading } = usePlanLimits();
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getPlanDisplayName = (planName: string) => {
    const planNames: Record<string, string> = {
      starter: 'Starter Plan',
      basic: 'Professional Plan',
      professional: 'Professional Plan',
      pro: 'Enterprise Plan',
      enterprise: 'Enterprise Plan'
    };
    return planNames[planName] || planName;
  };

  const getNextBillingDate = () => {
    if (userProfile?.account_status === 'trial' && userProfile?.trial_expires_at) {
      const trialEndDate = new Date(userProfile.trial_expires_at);
      return trialEndDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    if (userProfile?.subscription_expires_at) {
      const subscriptionDate = new Date(userProfile.subscription_expires_at);
      return subscriptionDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    // If no specific date, show monthly renewal for active subscriptions
    if (userProfile?.account_status === 'active') {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    return 'Monthly renewal';
  };

  const getBillingStatus = () => {
    if (userProfile?.account_status === 'trial') {
      return 'Trial period';
    }

    return 'Monthly renewal';
  };

  if (loading) {
    return (
      <DashboardLayout title="Billing & Subscription" description="Manage your subscription and billing information">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Billing & Subscription" description="Manage your subscription and billing information">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <span>Current Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {getPlanDisplayName(userProfile?.subscription_plan || 'starter')}
                </h3>
                <p className="text-muted-foreground">
                  Advanced features included
                </p>
                <Badge 
                  variant={userProfile?.account_status === 'active' ? 'default' : 'secondary'} 
                  className="mt-2"
                >
                  {userProfile?.account_status === 'active' ? 'Active' : 
                   userProfile?.account_status === 'trial' ? 'Trial' : 'Inactive'}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  ৳{planLimits?.price_bdt || 0}
                </p>
                <p className="text-muted-foreground">per month</p>
                <Button className="mt-2" onClick={() => setShowUpgradeModal(true)}>
                  Change Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {planLimits?.max_websites === null ? 'Unlimited' : planLimits?.max_websites || 1} websites
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {planLimits?.max_funnels === null ? 'Unlimited' : planLimits?.max_funnels || 1} funnels
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {planLimits?.max_products_per_store === null ? 'Unlimited' : planLimits?.max_products_per_store || 100} products per store
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {planLimits?.max_orders_per_month === null ? 'Unlimited' : planLimits?.max_orders_per_month || 50} orders per month
                </span>
              </div>
              {planLimits?.custom_domain_allowed && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom domain support</span>
                </div>
              )}
              {planLimits?.priority_support && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
              )}
              {planLimits?.white_label && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">White label solution</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span>
                    {getNextBillingDate()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment method</span>
                  <span>
                    Manual payment
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing email</span>
                  <span>{user?.email || 'Not available'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No billing history</h3>
              <p className="mb-4">
                Your billing history will appear here after your first payment.
              </p>
              <Button onClick={() => setShowUpgradeModal(true)}>
                <Download className="mr-2 h-4 w-4" />
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PlanUpgradeModal2 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </DashboardLayout>
  );
}

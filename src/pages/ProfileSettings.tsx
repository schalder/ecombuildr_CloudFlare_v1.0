
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlanUpgradeModal2 } from '@/components/dashboard/PlanUpgradeModal2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Save, CreditCard, Crown } from 'lucide-react';

export default function ProfileSettings() {
  const { user } = useAuth();
  const { planLimits, userProfile, loading: planLoading } = usePlanLimits();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch profile",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanDisplayName = (planName: string) => {
    const planNames: Record<string, string> = {
      starter: 'স্টার্টার প্ল্যান',
      basic: 'বেসিক প্ল্যান',
      professional: 'প্রফেশনাল প্ল্যান',
      pro: 'প্রো প্ল্যান',
      enterprise: 'এন্টারপ্রাইজ প্ল্যান',
      pro_monthly: 'প্রো মাসিক',
      pro_yearly: 'প্রো বার্ষিক',
      reseller: 'রিসেলার প্ল্যান'
    };
    return planNames[planName] || planName;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      active: { label: 'সক্রিয়', variant: 'default' },
      trial: { label: 'ট্রায়াল', variant: 'secondary' },
      suspended: { label: 'স্থগিত', variant: 'destructive' },
      expired: { label: 'মেয়াদ শেষ', variant: 'destructive' }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout title="Profile Settings" description="Manage your personal information and account settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <span>Plan & Billing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Current Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      {getPlanDisplayName(userProfile?.subscription_plan || 'starter')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(userProfile?.account_status || 'active')}
                    {planLimits && (
                      <span className="text-sm font-mono">
                        ৳{planLimits.price_bdt}/month
                      </span>
                    )}
                  </div>
                </div>

                {planLimits && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Websites</p>
                      <p className="font-semibold">
                        {planLimits.max_websites === null ? '∞' : planLimits.max_websites}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Funnels</p>
                      <p className="font-semibold">
                        {planLimits.max_funnels === null ? '∞' : planLimits.max_funnels}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Products</p>
                      <p className="font-semibold">
                        {planLimits.max_products_per_store === null ? '∞' : planLimits.max_products_per_store}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Orders/Month</p>
                      <p className="font-semibold">
                        {planLimits.max_orders_per_month === null ? '∞' : planLimits.max_orders_per_month}
                      </p>
                    </div>
                  </div>
                )}

                <Button onClick={() => setShowUpgradeModal(true)} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">
                  Change your account password
                </p>
              </div>
              <Button variant="outline">
                Change Password
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">
                Enable 2FA
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

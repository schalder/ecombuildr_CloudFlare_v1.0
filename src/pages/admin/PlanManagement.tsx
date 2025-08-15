import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Save, 
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface PlanLimit {
  plan_name: string;
  price_bdt: number;
  trial_days: number;
  max_stores: number | null;
  max_websites: number | null;
  max_funnels: number | null;
  max_pages_per_store: number | null;
  max_products_per_store: number | null;
  max_orders_per_month: number | null;
  custom_domain_allowed: boolean;
  priority_support: boolean;
  white_label: boolean;
}

const PlanManagement = () => {
  const { isAdmin } = useAdminData();
  const { toast } = useToast();
  const [planLimits, setPlanLimits] = useState<PlanLimit[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing plan limits
  React.useEffect(() => {
    if (isAdmin) {
      loadPlanLimits();
    }
  }, [isAdmin]);

  const loadPlanLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .order('price_bdt', { ascending: true });

      if (error) throw error;

      setPlanLimits(data || []);
    } catch (err) {
      console.error('Error loading plan limits:', err);
      toast({
        title: 'Failed to Load',
        description: 'There was a problem loading plan information.',
        variant: 'destructive',
      });
    }
  };

  const savePlanLimit = async (plan: PlanLimit) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('plan_limits')
        .upsert([plan as any]);

      if (error) throw error;

      toast({
        title: 'Successfully Saved',
        description: `${plan.plan_name} plan information has been updated.`,
      });

      await loadPlanLimits();
    } catch (err) {
      console.error('Error saving plan:', err);
      toast({
        title: 'Save Failed',
        description: 'There was a problem saving plan information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlanField = (planName: string, field: keyof PlanLimit, value: any) => {
    setPlanLimits(prev => prev.map(plan => 
      plan.plan_name === planName 
        ? { ...plan, [field]: value }
        : plan
    ));
  };

  if (!isAdmin) {
    return (
      <AdminLayout title="Plan Management">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Plan Management" description="Subscription plan pricing and limits configuration">
      <div className="space-y-6">
        {planLimits.map((plan) => (
          <Card key={plan.plan_name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {plan.plan_name.charAt(0).toUpperCase() + plan.plan_name.slice(1)} Plan
                  </CardTitle>
                  <CardDescription>
                    Configure pricing and limits
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => savePlanLimit(plan)}
                  disabled={loading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pricing */}
                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-price`}>Monthly Price (BDT)</Label>
                  <Input
                    id={`${plan.plan_name}-price`}
                    type="number"
                    value={plan.price_bdt}
                    onChange={(e) => updatePlanField(plan.plan_name, 'price_bdt', Number(e.target.value))}
                    placeholder="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-trial`}>Trial Days</Label>
                  <Input
                    id={`${plan.plan_name}-trial`}
                    type="number"
                    value={plan.trial_days}
                    onChange={(e) => updatePlanField(plan.plan_name, 'trial_days', Number(e.target.value))}
                    placeholder="7"
                  />
                </div>

                {/* Resource Limits */}
                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-stores`}>Max Stores</Label>
                  <Input
                    id={`${plan.plan_name}-stores`}
                    type="number"
                    value={plan.max_stores || ''}
                    onChange={(e) => updatePlanField(plan.plan_name, 'max_stores', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-websites`}>Max Websites</Label>
                  <Input
                    id={`${plan.plan_name}-websites`}
                    type="number"
                    value={plan.max_websites || ''}
                    onChange={(e) => updatePlanField(plan.plan_name, 'max_websites', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-funnels`}>Max Funnels</Label>
                  <Input
                    id={`${plan.plan_name}-funnels`}
                    type="number"
                    value={plan.max_funnels || ''}
                    onChange={(e) => updatePlanField(plan.plan_name, 'max_funnels', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-pages`}>Pages per Store</Label>
                  <Input
                    id={`${plan.plan_name}-pages`}
                    type="number"
                    value={plan.max_pages_per_store || ''}
                    onChange={(e) => updatePlanField(plan.plan_name, 'max_pages_per_store', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-products`}>Products per Store</Label>
                  <Input
                    id={`${plan.plan_name}-products`}
                    type="number"
                    value={plan.max_products_per_store || ''}
                    onChange={(e) => updatePlanField(plan.plan_name, 'max_products_per_store', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.plan_name}-orders`}>Monthly Orders</Label>
                  <Input
                    id={`${plan.plan_name}-orders`}
                    type="number"
                    value={plan.max_orders_per_month || ''}
                    onChange={(e) => updatePlanField(plan.plan_name, 'max_orders_per_month', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${plan.plan_name}-domain`}
                      checked={plan.custom_domain_allowed}
                      onChange={(e) => updatePlanField(plan.plan_name, 'custom_domain_allowed', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`${plan.plan_name}-domain`}>Custom Domain</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${plan.plan_name}-support`}
                      checked={plan.priority_support}
                      onChange={(e) => updatePlanField(plan.plan_name, 'priority_support', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`${plan.plan_name}-support`}>Priority Support</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${plan.plan_name}-whitelabel`}
                      checked={plan.white_label}
                      onChange={(e) => updatePlanField(plan.plan_name, 'white_label', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`${plan.plan_name}-whitelabel`}>White Label</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default PlanManagement;
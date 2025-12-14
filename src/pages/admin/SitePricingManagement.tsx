import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminData } from '@/hooks/useAdminData';
import { Plus, Save, Trash2, Eye, EyeOff, Crown, Star, Zap, Rocket } from 'lucide-react';

interface SitePricingPlan {
  id: string;
  plan_name: string;
  display_name: string;
  display_name_en: string;
  price_bdt: number;
  price_yearly_bdt: number | null;
  period: string;
  description: string;
  description_en: string;
  is_active: boolean;
  is_popular: boolean;
  features: string[];
  features_en: string[];
  icon: string;
  color_class: string;
  button_variant: string;
  sort_order: number;
}

const iconOptions = [
  { value: 'Crown', label: 'Crown' },
  { value: 'Star', label: 'Star' },
  { value: 'Zap', label: 'Zap' },
  { value: 'Rocket', label: 'Rocket' },
];

const colorOptions = [
  { value: 'text-primary', label: 'Primary' },
  { value: 'text-accent', label: 'Accent' },
  { value: 'text-muted-foreground', label: 'Muted' },
  { value: 'text-success', label: 'Success' },
];

const buttonVariantOptions = [
  { value: 'default', label: 'Default' },
  { value: 'outline', label: 'Outline' },
  { value: 'accent', label: 'Accent' },
  { value: 'premium', label: 'Premium' },
];

export default function SitePricingManagement() {
  const { toast } = useToast();
  const { loading: userLoading, isAdmin } = useAdminData();
  const [plans, setPlans] = useState<SitePricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && isAdmin) {
      loadPlans();
    }
  }, [userLoading, isAdmin]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('site_pricing_plans')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features.map(f => String(f)) : [],
        features_en: Array.isArray(plan.features_en) ? plan.features_en.map(f => String(f)) : []
      })));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load pricing plans: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (plan: SitePricingPlan) => {
    setSaving(plan.id);
    try {
      const { error } = await supabase
        .from('site_pricing_plans')
        .upsert({
          id: plan.id === 'new' ? undefined : plan.id,
          plan_name: plan.plan_name,
          display_name: plan.display_name,
          display_name_en: plan.display_name_en,
          price_bdt: plan.price_bdt,
          price_yearly_bdt: plan.price_yearly_bdt,
          period: plan.period,
          description: plan.description,
          description_en: plan.description_en,
          is_active: plan.is_active,
          is_popular: plan.is_popular,
          features: plan.features,
          features_en: plan.features_en,
          icon: plan.icon,
          color_class: plan.color_class,
          button_variant: plan.button_variant,
          sort_order: plan.sort_order,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing plan saved successfully!",
      });

      await loadPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save plan: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const { error } = await supabase
        .from('site_pricing_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing plan deleted successfully!",
      });

      await loadPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete plan: " + error.message,
        variant: "destructive",
      });
    }
  };

  const addNewPlan = () => {
    const newPlan: SitePricingPlan = {
      id: 'new',
      plan_name: '',
      display_name: '',
      display_name_en: '',
      price_bdt: 0,
      price_yearly_bdt: null,
      period: 'month',
      description: '',
      description_en: '',
      is_active: true,
      is_popular: false,
      features: [],
      features_en: [],
      icon: 'Crown',
      color_class: 'text-primary',
      button_variant: 'default',
      sort_order: plans.length + 1,
    };
    setPlans([...plans, newPlan]);
  };

  const updatePlanField = (planId: string, field: keyof SitePricingPlan, value: any) => {
    setPlans(plans.map(plan => 
      plan.id === planId ? { ...plan, [field]: value } : plan
    ));
  };

  const updateFeatures = (planId: string, features: string[], isEnglish = false) => {
    const field = isEnglish ? 'features_en' : 'features';
    updatePlanField(planId, field, features);
  };

  if (userLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Site Pricing Management</h1>
            <p className="text-muted-foreground">Manage pricing plans displayed on the main website</p>
          </div>
          <Button onClick={addNewPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Plan
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="h-96 bg-muted/50 animate-pulse rounded-lg" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={plan.display_name}
                        onChange={(e) => updatePlanField(plan.id, 'display_name', e.target.value)}
                        placeholder="Plan Display Name"
                        className="text-lg font-bold"
                      />
                      {plan.is_popular && (
                        <Badge variant="default">Popular</Badge>
                      )}
                      {!plan.is_active && (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => savePlan(plan)}
                        disabled={saving === plan.id}
                        size="sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saving === plan.id ? 'Saving...' : 'Save'}
                      </Button>
                      {plan.id !== 'new' && (
                        <Button
                          onClick={() => deletePlan(plan.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Plan Name (Internal)</Label>
                        <Input
                          value={plan.plan_name}
                          onChange={(e) => updatePlanField(plan.id, 'plan_name', e.target.value)}
                          placeholder="e.g., basic, pro, enterprise"
                        />
                      </div>
                      <div>
                        <Label>English Display Name</Label>
                        <Input
                          value={plan.display_name_en}
                          onChange={(e) => updatePlanField(plan.id, 'display_name_en', e.target.value)}
                          placeholder="English name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Monthly Price (BDT)</Label>
                        <Input
                          type="number"
                          value={plan.price_bdt}
                          onChange={(e) => updatePlanField(plan.id, 'price_bdt', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Yearly Price (BDT)</Label>
                        <Input
                          type="number"
                          value={plan.price_yearly_bdt || ''}
                          onChange={(e) => updatePlanField(plan.id, 'price_yearly_bdt', e.target.value === '' ? null : parseFloat(e.target.value) || null)}
                          placeholder="Optional - leave empty if not available"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty if yearly pricing is not available for this plan
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        value={plan.sort_order}
                        onChange={(e) => updatePlanField(plan.id, 'sort_order', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Description (Bengali)</Label>
                      <Textarea
                        value={plan.description}
                        onChange={(e) => updatePlanField(plan.id, 'description', e.target.value)}
                        placeholder="Plan description in Bengali"
                      />
                    </div>

                    <div>
                      <Label>Description (English)</Label>
                      <Textarea
                        value={plan.description_en}
                        onChange={(e) => updatePlanField(plan.id, 'description_en', e.target.value)}
                        placeholder="Plan description in English"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Icon</Label>
                        <Select value={plan.icon} onValueChange={(value) => updatePlanField(plan.id, 'icon', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Color Class</Label>
                        <Select value={plan.color_class} onValueChange={(value) => updatePlanField(plan.id, 'color_class', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Button Variant</Label>
                        <Select value={plan.button_variant} onValueChange={(value) => updatePlanField(plan.id, 'button_variant', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {buttonVariantOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={(checked) => updatePlanField(plan.id, 'is_active', checked)}
                        />
                        <Label>Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={plan.is_popular}
                          onCheckedChange={(checked) => updatePlanField(plan.id, 'is_popular', checked)}
                        />
                        <Label>Popular</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Features (Bengali)</Label>
                      <Textarea
                        value={plan.features.join('\n')}
                        onChange={(e) => updateFeatures(plan.id, e.target.value.split('\n').filter(f => f.trim()))}
                        placeholder="One feature per line"
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground mt-1">One feature per line</p>
                    </div>

                    <div>
                      <Label>Features (English)</Label>
                      <Textarea
                        value={plan.features_en.join('\n')}
                        onChange={(e) => updateFeatures(plan.id, e.target.value.split('\n').filter(f => f.trim()), true)}
                        placeholder="One feature per line"
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground mt-1">One feature per line</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
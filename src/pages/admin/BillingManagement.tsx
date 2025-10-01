import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { usePaymentOptions } from '@/hooks/usePaymentOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Users, TrendingUp, RefreshCw, Download, AlertCircle, Plus, Check, X, Settings, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

type PlanName = "free" | "pro_monthly" | "pro_yearly" | "reseller" | "starter" | "professional" | "enterprise";

const isValidPlanName = (plan: string): plan is PlanName => {
  const validPlans: PlanName[] = ["free", "pro_monthly", "pro_yearly", "reseller", "starter", "professional", "enterprise"];
  return validPlans.includes(plan as PlanName);
};

export default function BillingManagement() {
  const { isAdmin, loading: adminLoading, platformStats, saasSubscribers, users, fetchUsers, fetchSaasSubscribers, createSubscription, updateSubscription, deleteSubscription } = useAdminData();
  const { paymentOptions, updatePaymentOption, refetch: refetchPaymentOptions } = usePaymentOptions({ enabled: true });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [paymentConfigData, setPaymentConfigData] = useState<Record<string, any>>({});
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [showEditSubscription, setShowEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    user_id: '',
    plan_name: '',
    plan_price_bdt: '',
    payment_method: '',
    payment_reference: '',
    notes: ''
  });
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSaasSubscribers();
      fetchUsers();
    }
  }, [isAdmin, statusFilter, tierFilter]);

  useEffect(() => {
    // Initialize payment config data
    const configData: Record<string, any> = {};
    paymentOptions.forEach(option => {
      let accountNumber = option.account_number;
      
      // For ebpay, ensure account_number is parsed as object if it's a JSON string
      if (option.provider === 'ebpay' && typeof accountNumber === 'string') {
        try {
          accountNumber = JSON.parse(accountNumber);
        } catch {
          // If parsing fails, keep as is
        }
      }
      
      configData[option.provider] = {
        is_enabled: option.is_enabled,
        display_name: option.display_name,
        account_number: accountNumber,
        instructions: option.instructions
      };
    });
    setPaymentConfigData(configData);
  }, [paymentOptions]);

  // Calculate SaaS revenue metrics from actual subscriptions
  const totalMRR = saasSubscribers
    .filter(s => s.subscription_status === 'active')
    .reduce((sum, sub) => sum + (sub.plan_price_bdt || 0), 0);
  
  const totalARR = totalMRR * 12;
  const activeSubscribers = saasSubscribers.filter(s => s.subscription_status === 'active').length;
  const averageARPU = activeSubscribers > 0 ? totalMRR / activeSubscribers : 0;

  // Filter subscribers based on search and filters
  const filteredSubscribers = saasSubscribers.filter(subscriber => {
    const matchesSearch = !searchTerm || 
      subscriber.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subscriber.subscription_status === statusFilter;
    const matchesTier = tierFilter === 'all' || subscriber.plan_name === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const handleApproveSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);

      const subscription = saasSubscribers.find(s => s.id === subscriptionId);
      if (!subscription) throw new Error('Subscription not found');

      // Update subscription status to active
      const { error: subError } = await supabase
        .from('saas_subscriptions')
        .update({
          subscription_status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        })
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Update user's profile plan - only if plan_name is valid
      const planName = isValidPlanName(subscription.plan_name) ? subscription.plan_name : 'starter';
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: planName,
          account_status: 'active'
        })
        .eq('id', subscription.user_id);

      if (profileError) throw profileError;

      toast.success('Subscription approved successfully!');
      fetchSaasSubscribers();
    } catch (error: any) {
      console.error('Error approving subscription:', error);
      toast.error('Failed to approve subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('saas_subscriptions')
        .update({
          subscription_status: 'declined'
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription declined');
      fetchSaasSubscribers();
    } catch (error: any) {
      console.error('Error declining subscription:', error);
      toast.error('Failed to decline subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    try {
      setLoading(true);

      // Validate EB Pay if enabled
      const ebpayConfig = paymentConfigData['ebpay'];
      if (ebpayConfig?.is_enabled) {
        const accountNumber = ebpayConfig.account_number || {};
        if (!accountNumber.brand_key || !accountNumber.api_key || !accountNumber.secret_key) {
          toast.error('EB Pay requires Brand Key, API Key, and Secret Key to be enabled');
          setLoading(false);
          return;
        }
      }

      for (const [provider, config] of Object.entries(paymentConfigData)) {
        await updatePaymentOption(provider, config);
      }

      toast.success('Payment options updated successfully!');
      setShowPaymentConfig(false);
      refetchPaymentOptions();
    } catch (error: any) {
      console.error('Error updating payment options:', error);
      toast.error('Failed to update payment options');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    try {
      setLoading(true);
      const success = await createSubscription({
        user_id: subscriptionForm.user_id,
        plan_name: subscriptionForm.plan_name,
        plan_price_bdt: parseFloat(subscriptionForm.plan_price_bdt),
        payment_method: subscriptionForm.payment_method,
        payment_reference: subscriptionForm.payment_reference,
        notes: subscriptionForm.notes
      });

      if (success) {
        toast.success('Subscription created successfully!');
        setShowAddSubscription(false);
        setSubscriptionForm({
          user_id: '',
          plan_name: '',
          plan_price_bdt: '',
          payment_method: '',
          payment_reference: '',
          notes: ''
        });
      } else {
        toast.error('Failed to create subscription');
      }
    } catch (error) {
      toast.error('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      setLoading(true);
      const success = await updateSubscription(selectedSubscription.id, {
        plan_name: subscriptionForm.plan_name,
        plan_price_bdt: parseFloat(subscriptionForm.plan_price_bdt),
        payment_method: subscriptionForm.payment_method,
        payment_reference: subscriptionForm.payment_reference,
        subscription_status: selectedSubscription.subscription_status,
        notes: subscriptionForm.notes
      });

      if (success) {
        toast.success('Subscription updated successfully!');
        setShowEditSubscription(false);
        setSelectedSubscription(null);
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (error) {
      toast.error('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This will revert the user to read-only status.')) {
      return;
    }

    try {
      setLoading(true);
      const success = await deleteSubscription(subscriptionId, userId);

      if (success) {
        toast.success('Subscription deleted successfully!');
      } else {
        toast.error('Failed to delete subscription');
      }
    } catch (error) {
      toast.error('Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (subscription: any) => {
    setSelectedSubscription(subscription);
    setSubscriptionForm({
      user_id: subscription.user_id,
      plan_name: subscription.plan_name,
      plan_price_bdt: subscription.plan_price_bdt.toString(),
      payment_method: subscription.payment_method,
      payment_reference: subscription.payment_reference || '',
      notes: subscription.notes || ''
    });
    setShowEditSubscription(true);
  };

  if (adminLoading || isAdmin === null) {
    return (
      <AdminLayout title="Billing & Payments (SaaS)" description="Manage SaaS subscription revenue and billing">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Billing & Payments (SaaS)">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only super admins can access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Billing & Payments (SaaS)" description="Manage SaaS subscription revenue and billing">
      <div className="space-y-6">
        {/* SaaS Revenue Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMRR, { code: 'BDT' })}</div>
              <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalARR, { code: 'BDT' })}</div>
              <p className="text-xs text-muted-foreground">Annual recurring revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscribers}</div>
              <p className="text-xs text-muted-foreground">Paying users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(averageARPU, { code: 'BDT' })}</div>
              <p className="text-xs text-muted-foreground">Average revenue per user</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Options Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Payment Options Configuration
              <Dialog open={showPaymentConfig} onOpenChange={setShowPaymentConfig}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Payment Options Settings</DialogTitle>
                    <DialogDescription>
                      Configure payment providers and their settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {paymentOptions.map((option) => (
                      <div key={option.provider} className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{option.display_name}</h4>
                          <Switch
                            checked={paymentConfigData[option.provider]?.is_enabled || false}
                            onCheckedChange={(checked) => 
                              setPaymentConfigData(prev => ({
                                ...prev,
                                [option.provider]: { ...prev[option.provider], is_enabled: checked }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`${option.provider}-name`}>Display Name</Label>
                            <Input
                              id={`${option.provider}-name`}
                              value={paymentConfigData[option.provider]?.display_name || ''}
                              onChange={(e) => 
                                setPaymentConfigData(prev => ({
                                  ...prev,
                                  [option.provider]: { ...prev[option.provider], display_name: e.target.value }
                                }))
                              }
                            />
                          </div>
                          
                          {option.provider === 'ebpay' ? (
                            <div className="col-span-2 space-y-3">
                              <p className="text-sm text-muted-foreground">Configure EB Pay Gateway Credentials:</p>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label htmlFor={`${option.provider}-brand-key`}>Brand Key</Label>
                                  <Input
                                    id={`${option.provider}-brand-key`}
                                    placeholder="Enter Brand Key"
                                    value={
                                      typeof paymentConfigData[option.provider]?.account_number === 'object'
                                        ? paymentConfigData[option.provider]?.account_number?.brand_key || ''
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const currentConfig = typeof paymentConfigData[option.provider]?.account_number === 'object'
                                        ? paymentConfigData[option.provider]?.account_number
                                        : {};
                                      setPaymentConfigData(prev => ({
                                        ...prev,
                                        [option.provider]: {
                                          ...prev[option.provider],
                                          account_number: { ...currentConfig, brand_key: e.target.value }
                                        }
                                      }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${option.provider}-api-key`}>API Key</Label>
                                  <Input
                                    id={`${option.provider}-api-key`}
                                    placeholder="Enter API Key"
                                    value={
                                      typeof paymentConfigData[option.provider]?.account_number === 'object'
                                        ? paymentConfigData[option.provider]?.account_number?.api_key || ''
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const currentConfig = typeof paymentConfigData[option.provider]?.account_number === 'object'
                                        ? paymentConfigData[option.provider]?.account_number
                                        : {};
                                      setPaymentConfigData(prev => ({
                                        ...prev,
                                        [option.provider]: {
                                          ...prev[option.provider],
                                          account_number: { ...currentConfig, api_key: e.target.value }
                                        }
                                      }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${option.provider}-secret-key`}>Secret Key</Label>
                                  <Input
                                    id={`${option.provider}-secret-key`}
                                    type="password"
                                    placeholder="Enter Secret Key"
                                    value={
                                      typeof paymentConfigData[option.provider]?.account_number === 'object'
                                        ? paymentConfigData[option.provider]?.account_number?.secret_key || ''
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const currentConfig = typeof paymentConfigData[option.provider]?.account_number === 'object'
                                        ? paymentConfigData[option.provider]?.account_number
                                        : {};
                                      setPaymentConfigData(prev => ({
                                        ...prev,
                                        [option.provider]: {
                                          ...prev[option.provider],
                                          account_number: { ...currentConfig, secret_key: e.target.value }
                                        }
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor={`${option.provider}-number`}>Account Number</Label>
                              <Input
                                id={`${option.provider}-number`}
                                value={paymentConfigData[option.provider]?.account_number || ''}
                                onChange={(e) => 
                                  setPaymentConfigData(prev => ({
                                    ...prev,
                                    [option.provider]: { ...prev[option.provider], account_number: e.target.value }
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor={`${option.provider}-instructions`}>Instructions</Label>
                          <Input
                            id={`${option.provider}-instructions`}
                            value={paymentConfigData[option.provider]?.instructions || ''}
                            onChange={(e) => 
                              setPaymentConfigData(prev => ({
                                ...prev,
                                [option.provider]: { ...prev[option.provider], instructions: e.target.value }
                              }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowPaymentConfig(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSavePaymentConfig} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              Current payment provider settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentOptions.map((option) => (
                <div key={option.provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{option.display_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.provider === 'ebpay' 
                        ? (option.account_number ? 'Configured (credentials hidden)' : 'Not configured')
                        : (option.account_number || 'Not configured')
                      }
                    </p>
                  </div>
                  <Badge variant={option.is_enabled ? 'default' : 'secondary'}>
                    {option.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual SaaS Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              SaaS Subscription Management
              <Dialog open={showAddSubscription} onOpenChange={setShowAddSubscription}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Subscription</DialogTitle>
                    <DialogDescription>
                      Manually create a subscription for a user
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-select">User</Label>
                      <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userSearchOpen}
                            className="w-full justify-between"
                          >
                            {subscriptionForm.user_id
                              ? users.find((user) => user.id === subscriptionForm.user_id)?.full_name + 
                                ` (${users.find((user) => user.id === subscriptionForm.user_id)?.email})`
                              : "Select a user..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search users by name or email..." />
                            <CommandList>
                              <CommandEmpty>No user found.</CommandEmpty>
                              <CommandGroup>
                                {users.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.full_name} ${user.email}`}
                                    onSelect={() => {
                                      setSubscriptionForm(prev => ({ ...prev, user_id: user.id }));
                                      setUserSearchOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.full_name}</span>
                                      <span className="text-sm text-muted-foreground">{user.email}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plan-select">Plan</Label>
                        <Select value={subscriptionForm.plan_name} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, plan_name: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="price">Price (BDT)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={subscriptionForm.plan_price_bdt}
                          onChange={(e) => setSubscriptionForm(prev => ({ ...prev, plan_price_bdt: e.target.value }))}
                          placeholder="500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select value={subscriptionForm.payment_method} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, payment_method: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bkash">bKash</SelectItem>
                            <SelectItem value="nagad">Nagad</SelectItem>
                            <SelectItem value="eps">EPS Payment Gateway</SelectItem>
                            <SelectItem value="manual">Manual Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="transaction-id">Transaction ID</Label>
                        <Input
                          id="transaction-id"
                          value={subscriptionForm.payment_reference}
                          onChange={(e) => setSubscriptionForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                          placeholder="Enter transaction ID"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Input
                        id="notes"
                        value={subscriptionForm.notes}
                        onChange={(e) => setSubscriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowAddSubscription(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateSubscription} disabled={loading || !subscriptionForm.user_id || !subscriptionForm.plan_name || !subscriptionForm.plan_price_bdt}>
                        {loading ? 'Creating...' : 'Create Subscription'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              Manage user subscriptions manually. Accept payments via bKash, Nagad, SSL Commerz, or manual transfer.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Edit Subscription Dialog */}
        <Dialog open={showEditSubscription} onOpenChange={setShowEditSubscription}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Update subscription details for {selectedSubscription?.user_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-plan-select">Plan</Label>
                  <Select value={subscriptionForm.plan_name} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, plan_name: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-price">Price (BDT)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={subscriptionForm.plan_price_bdt}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, plan_price_bdt: e.target.value }))}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-payment-method">Payment Method</Label>
                  <Select value={subscriptionForm.payment_method} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, payment_method: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="nagad">Nagad</SelectItem>
                      <SelectItem value="eps">EPS Payment Gateway</SelectItem>
                      <SelectItem value="manual">Manual Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-transaction-id">Transaction ID</Label>
                  <Input
                    id="edit-transaction-id"
                    value={subscriptionForm.payment_reference}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                    placeholder="Enter transaction ID"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Input
                  id="edit-notes"
                  value={subscriptionForm.notes}
                  onChange={(e) => setSubscriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditSubscription(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubscription} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Subscription'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Records</CardTitle>
            <CardDescription>
              Manage user subscriptions and payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search subscribers by email, name, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchSaasSubscribers}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Subscribers Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Payment Method</th>
                      <th className="text-left p-4 font-medium">Transaction ID</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Expires</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        </tr>
                      ))
                    ) : filteredSubscribers.length > 0 ? (
                      filteredSubscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{subscriber.user_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{subscriber.user_email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{subscriber.plan_name}</Badge>
                          </td>
                          <td className="p-4 font-medium">
                            {formatCurrency(subscriber.plan_price_bdt, { code: 'BDT' })}
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              subscriber.payment_method === 'bkash' ? 'default' :
                              subscriber.payment_method === 'nagad' ? 'secondary' :
                              subscriber.payment_method === 'eps' ? 'outline' : 'default'
                            }>
                              {subscriber.payment_method}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-xs">
                              {subscriber.payment_reference || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              subscriber.subscription_status === 'active' ? 'default' :
                              subscriber.subscription_status === 'pending' ? 'outline' :
                              subscriber.subscription_status === 'expired' ? 'destructive' : 'secondary'
                            }>
                              {subscriber.subscription_status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">
                            {subscriber.expires_at ? new Date(subscriber.expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {subscriber.subscription_status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleApproveSubscription(subscriber.id)}
                                    disabled={loading}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeclineSubscription(subscriber.id)}
                                    disabled={loading}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {subscriber.subscription_status !== 'pending' && (
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openEditDialog(subscriber)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteSubscription(subscriber.id, subscriber.user_id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                          <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No Subscribers Found</h3>
                          <p className="text-sm">Start by adding your first SaaS subscriber.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

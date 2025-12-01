import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  storeId: string;
};

interface PaymentSettings {
  bkash?: {
    enabled: boolean;
    mode: 'number';
    number?: string;
  };
  nagad?: {
    enabled: boolean;
    mode: 'number';
    number?: string;
  };
  eps?: {
    enabled: boolean;
    merchant_id?: string;
    store_id?: string;
    username?: string;
    password?: string;
    hash_key?: string;
    is_live?: boolean;
  };
  ebpay?: {
    enabled: boolean;
    brand_key?: string;
    api_key?: string;
    secret_key?: string;
    is_live?: boolean;
  };
  stripe?: {
    enabled: boolean;
    stripe_account_id?: string;
    access_token?: string; // Encrypted
    refresh_token?: string; // Encrypted
    account_email?: string; // For display
    account_name?: string; // For display
    publishable_key?: string;
    is_live?: boolean;
  };
}

export default function PaymentSettings({ storeId }: Props) {
  const { refetch } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    bkash: { enabled: false, mode: 'number' },
    nagad: { enabled: false, mode: 'number' },
    eps: { enabled: false, is_live: false },
    ebpay: { enabled: false, is_live: false },
    stripe: { enabled: false, is_live: false },
  });
  const [connectingStripe, setConnectingStripe] = useState(false);

  // Handle Stripe OAuth callback
  useEffect(() => {
    const stripeConnected = searchParams.get('stripe_connected');
    const stripeError = searchParams.get('stripe_error');
    const errorDescription = searchParams.get('error_description');
    const accountEmail = searchParams.get('account_email');
    const accountName = searchParams.get('account_name');

    if (stripeConnected === 'true') {
      toast({
        title: "Success",
        description: accountName || accountEmail 
          ? `Stripe account connected: ${accountName || accountEmail}`
          : "Stripe account connected successfully",
      });
      // Remove query params
      setSearchParams({});
      // Refetch settings to get updated Stripe connection
      refetch();
    } else if (stripeError) {
      toast({
        title: "Stripe Connection Error",
        description: errorDescription || "Failed to connect Stripe account",
        variant: "destructive",
      });
      // Remove query params
      setSearchParams({});
      setConnectingStripe(false);
    }
  }, [searchParams, setSearchParams, refetch]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stores')
          .select('settings')
          .eq('id', storeId)
          .single();

        if (error) throw error;

        if (data?.settings) {
          const paymentSettings = (data.settings as any).payment || {};
          setSettings({
            bkash: paymentSettings.bkash || { enabled: false, mode: 'number' },
            nagad: paymentSettings.nagad || { enabled: false, mode: 'number' },
            eps: paymentSettings.eps || { enabled: false, is_live: false },
            ebpay: paymentSettings.ebpay || { enabled: false, is_live: false },
            stripe: paymentSettings.stripe || { enabled: false, is_live: false },
          });
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        toast({
          title: "Error",
          description: "Failed to load payment settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchSettings();
    }
  }, [storeId]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // First get current store settings
      const { data: currentData, error: fetchError } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (currentData?.settings as Record<string, any>) || {};
      
      // Update payment settings while preserving other settings
      const updatedSettings = {
        ...currentSettings,
        payment: settings,
        // Also maintain backward compatibility with old structure
        bkash: settings.bkash,
        nagad: settings.nagad,
        eps: settings.eps,
        ebpay: settings.ebpay,
        stripe: settings.stripe,
      } as any;

      const { error } = await supabase
        .from('stores')
        .update({ settings: updatedSettings })
        .eq('id', storeId);

      if (error) throw error;

      // Refresh store data
      await refetch();

      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBkashSettings = (updates: Partial<NonNullable<PaymentSettings['bkash']>>) => {
    setSettings(prev => ({
      ...prev,
      bkash: { 
        enabled: false,
        mode: 'number' as const,
        ...(prev.bkash || {}), 
        ...updates 
      }
    }));
  };

  const updateNagadSettings = (updates: Partial<NonNullable<PaymentSettings['nagad']>>) => {
    setSettings(prev => ({
      ...prev,
      nagad: { 
        enabled: false,
        mode: 'number' as const,
        ...(prev.nagad || {}), 
        ...updates 
      }
    }));
  };

  const updateEPSSettings = (updates: Partial<NonNullable<PaymentSettings['eps']>>) => {
    setSettings(prev => ({
      ...prev,
      eps: { 
        enabled: false,
        is_live: false,
        ...(prev.eps || {}), 
        ...updates 
      }
    }));
  };

  const updateEBPaySettings = (updates: Partial<NonNullable<PaymentSettings['ebpay']>>) => {
    setSettings(prev => ({
      ...prev,
      ebpay: { 
        enabled: false,
        is_live: false,
        ...(prev.ebpay || {}), 
        ...updates 
      }
    }));
  };

  const updateStripeSettings = (updates: Partial<NonNullable<PaymentSettings['stripe']>>) => {
    setSettings(prev => ({
      ...prev,
      stripe: { 
        enabled: false,
        is_live: false,
        ...(prev.stripe || {}), 
        ...updates 
      }
    }));
  };

  const handleConnectStripe = async () => {
    try {
      setConnectingStripe(true);
      
      // Call stripe-connect Edge Function to initiate OAuth
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { storeId },
      });

      if (error) throw error;

      if (data?.success && data?.oauth_url) {
        // Redirect to Stripe OAuth page
        window.location.href = data.oauth_url;
      } else {
        throw new Error(data?.error || 'Failed to initiate Stripe connection');
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect Stripe account",
        variant: "destructive",
      });
      setConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    try {
      setSaving(true);
      
      // Get current store settings
      const { data: currentData, error: fetchError } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (currentData?.settings as Record<string, any>) || {};
      
      // Remove Stripe configuration
      const updatedSettings = {
        ...currentSettings,
        payment: {
          ...(currentSettings.payment || {}),
          stripe: {
            enabled: false,
            is_live: false,
          },
        },
        stripe: {
          enabled: false,
          is_live: false,
        },
      };

      const { error } = await supabase
        .from('stores')
        .update({ settings: updatedSettings })
        .eq('id', storeId);

      if (error) throw error;

      // Update local state
      updateStripeSettings({
        enabled: false,
        stripe_account_id: undefined,
        access_token: undefined,
        refresh_token: undefined,
        account_email: undefined,
        account_name: undefined,
        publishable_key: undefined,
      });

      await refetch();

      toast({
        title: "Success",
        description: "Stripe account disconnected successfully",
      });
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Stripe account",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* bKash Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            bKash Payment
            <Switch
              checked={settings.bkash?.enabled || false}
              onCheckedChange={(enabled) => updateBkashSettings({ enabled })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bkash-number">bKash Number</Label>
            <Input
              id="bkash-number"
              value={settings.bkash?.number || ''}
              onChange={(e) => updateBkashSettings({ number: e.target.value })}
              placeholder="Enter bKash number for manual payments"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nagad Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Nagad Payment
            <Switch
              checked={settings.nagad?.enabled || false}
              onCheckedChange={(enabled) => updateNagadSettings({ enabled })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nagad-number">Nagad Number</Label>
            <Input
              id="nagad-number"
              value={settings.nagad?.number || ''}
              onChange={(e) => updateNagadSettings({ number: e.target.value })}
              placeholder="Enter Nagad number for manual payments"
            />
          </div>
        </CardContent>
      </Card>

      {/* EPS Payment Gateway Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            EPS Payment Gateway
            <Switch
              checked={settings.eps?.enabled || false}
              onCheckedChange={(enabled) => updateEPSSettings({ enabled })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eps-merchant-id">Merchant ID</Label>
              <Input
                id="eps-merchant-id"
                value={settings.eps?.merchant_id || ''}
                onChange={(e) => updateEPSSettings({ merchant_id: e.target.value })}
                placeholder="Enter EPS Merchant ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eps-store-id">Store ID</Label>
              <Input
                id="eps-store-id"
                value={settings.eps?.store_id || ''}
                onChange={(e) => updateEPSSettings({ store_id: e.target.value })}
                placeholder="Enter EPS Store ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eps-username">Username</Label>
              <Input
                id="eps-username"
                value={settings.eps?.username || ''}
                onChange={(e) => updateEPSSettings({ username: e.target.value })}
                placeholder="Enter EPS Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eps-password">Password</Label>
              <Input
                id="eps-password"
                type="password"
                value={settings.eps?.password || ''}
                onChange={(e) => updateEPSSettings({ password: e.target.value })}
                placeholder="Enter EPS Password"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="eps-hash-key">Hash Key</Label>
              <Input
                id="eps-hash-key"
                type="password"
                value={settings.eps?.hash_key || ''}
                onChange={(e) => updateEPSSettings({ hash_key: e.target.value })}
                placeholder="Enter EPS Hash Key"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="eps-live-mode"
              checked={settings.eps?.is_live || false}
              onCheckedChange={(is_live) => updateEPSSettings({ is_live })}
            />
            <Label htmlFor="eps-live-mode">Live Mode (Uncheck for Sandbox)</Label>
          </div>
        </CardContent>
      </Card>

      {/* EB Pay Payment Gateway Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            EB Pay Payment Gateway
            <Switch
              checked={settings.ebpay?.enabled || false}
              onCheckedChange={(enabled) => updateEBPaySettings({ enabled })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ebpay-brand-key">Brand Key</Label>
              <Input
                id="ebpay-brand-key"
                type="password"
                value={settings.ebpay?.brand_key || ''}
                onChange={(e) => updateEBPaySettings({ brand_key: e.target.value })}
                placeholder="Enter EB Pay Brand Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebpay-api-key">API Key</Label>
              <Input
                id="ebpay-api-key"
                type="password"
                value={settings.ebpay?.api_key || ''}
                onChange={(e) => updateEBPaySettings({ api_key: e.target.value })}
                placeholder="Enter EB Pay API Key"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ebpay-secret-key">Secret Key</Label>
              <Input
                id="ebpay-secret-key"
                type="password"
                value={settings.ebpay?.secret_key || ''}
                onChange={(e) => updateEBPaySettings({ secret_key: e.target.value })}
                placeholder="Enter EB Pay Secret Key"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="ebpay-live-mode"
              checked={settings.ebpay?.is_live || false}
              onCheckedChange={(is_live) => updateEBPaySettings({ is_live })}
            />
            <Label htmlFor="ebpay-live-mode">Live Mode (Uncheck for Sandbox)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Payment Gateway Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Stripe Payment Gateway
            <Switch
              checked={settings.stripe?.enabled || false}
              onCheckedChange={(enabled) => updateStripeSettings({ enabled })}
              disabled={!settings.stripe?.stripe_account_id}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.stripe?.stripe_account_id ? (
            <>
              <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Connected to Stripe
                  </p>
                  {settings.stripe.account_email && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {settings.stripe.account_name || settings.stripe.account_email}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="stripe-live-mode"
                  checked={settings.stripe?.is_live || false}
                  onCheckedChange={(is_live) => updateStripeSettings({ is_live })}
                />
                <Label htmlFor="stripe-live-mode">Live Mode (Uncheck for Test Mode)</Label>
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnectStripe}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Disconnecting..." : "Disconnect Stripe Account"}
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Stripe account to accept international payments via credit cards, debit cards, and other payment methods supported by Stripe.
                </p>
                <Button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="w-full"
                >
                  {connectingStripe ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Stripe Account"
                  )}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="stripe-live-mode"
                  checked={settings.stripe?.is_live || false}
                  onCheckedChange={(is_live) => updateStripeSettings({ is_live })}
                  disabled={true}
                />
                <Label htmlFor="stripe-live-mode" className="text-muted-foreground">
                  Live Mode (Connect account first)
                </Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Payment Settings"}
        </Button>
      </div>
    </div>
  );
}
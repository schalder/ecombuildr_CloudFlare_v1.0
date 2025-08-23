import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";

type Props = {
  storeId: string;
};

interface PaymentSettings {
  bkash?: {
    enabled: boolean;
    mode: 'number' | 'api';
    number?: string;
    app_key?: string;
    app_secret?: string;
    username?: string;
    password?: string;
  };
  nagad?: {
    enabled: boolean;
    mode: 'number' | 'api';
    number?: string;
    merchant_id?: string;
    public_key?: string;
    private_key?: string;
  };
  sslcommerz?: {
    enabled: boolean;
    store_id?: string;
    store_password?: string;
    is_live?: boolean;
  };
}

export default function PaymentSettings({ storeId }: Props) {
  const { refetch } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    bkash: { enabled: false, mode: 'number' },
    nagad: { enabled: false, mode: 'number' },
    sslcommerz: { enabled: false, is_live: false },
  });

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
            sslcommerz: paymentSettings.sslcommerz || { enabled: false, is_live: false },
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
        sslcommerz: settings.sslcommerz,
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

  const updateSSLCommerzSettings = (updates: Partial<NonNullable<PaymentSettings['sslcommerz']>>) => {
    setSettings(prev => ({
      ...prev,
      sslcommerz: { 
        enabled: false,
        is_live: false,
        ...(prev.sslcommerz || {}), 
        ...updates 
      }
    }));
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
            <Label>Integration Mode</Label>
            <Select
              value={settings.bkash?.mode || 'number'}
              onValueChange={(mode: 'number' | 'api') => updateBkashSettings({ mode })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Manual (Phone Number)</SelectItem>
                <SelectItem value="api">API Integration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.bkash?.mode === 'number' && (
            <div className="space-y-2">
              <Label htmlFor="bkash-number">bKash Number</Label>
              <Input
                id="bkash-number"
                value={settings.bkash?.number || ''}
                onChange={(e) => updateBkashSettings({ number: e.target.value })}
                placeholder="Enter bKash number"
              />
            </div>
          )}

          {settings.bkash?.mode === 'api' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bkash-app-key">App Key</Label>
                <Input
                  id="bkash-app-key"
                  value={settings.bkash?.app_key || ''}
                  onChange={(e) => updateBkashSettings({ app_key: e.target.value })}
                  placeholder="Enter App Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bkash-app-secret">App Secret</Label>
                <Input
                  id="bkash-app-secret"
                  type="password"
                  value={settings.bkash?.app_secret || ''}
                  onChange={(e) => updateBkashSettings({ app_secret: e.target.value })}
                  placeholder="Enter App Secret"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bkash-username">Username</Label>
                <Input
                  id="bkash-username"
                  value={settings.bkash?.username || ''}
                  onChange={(e) => updateBkashSettings({ username: e.target.value })}
                  placeholder="Enter Username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bkash-password">Password</Label>
                <Input
                  id="bkash-password"
                  type="password"
                  value={settings.bkash?.password || ''}
                  onChange={(e) => updateBkashSettings({ password: e.target.value })}
                  placeholder="Enter Password"
                />
              </div>
            </div>
          )}
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
            <Label>Integration Mode</Label>
            <Select
              value={settings.nagad?.mode || 'number'}
              onValueChange={(mode: 'number' | 'api') => updateNagadSettings({ mode })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Manual (Phone Number)</SelectItem>
                <SelectItem value="api">API Integration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.nagad?.mode === 'number' && (
            <div className="space-y-2">
              <Label htmlFor="nagad-number">Nagad Number</Label>
              <Input
                id="nagad-number"
                value={settings.nagad?.number || ''}
                onChange={(e) => updateNagadSettings({ number: e.target.value })}
                placeholder="Enter Nagad number"
              />
            </div>
          )}

          {settings.nagad?.mode === 'api' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nagad-merchant-id">Merchant ID</Label>
                <Input
                  id="nagad-merchant-id"
                  value={settings.nagad?.merchant_id || ''}
                  onChange={(e) => updateNagadSettings({ merchant_id: e.target.value })}
                  placeholder="Enter Merchant ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nagad-public-key">Public Key</Label>
                <Input
                  id="nagad-public-key"
                  value={settings.nagad?.public_key || ''}
                  onChange={(e) => updateNagadSettings({ public_key: e.target.value })}
                  placeholder="Enter Public Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nagad-private-key">Private Key</Label>
                <Input
                  id="nagad-private-key"
                  type="password"
                  value={settings.nagad?.private_key || ''}
                  onChange={(e) => updateNagadSettings({ private_key: e.target.value })}
                  placeholder="Enter Private Key"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSLCommerz Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            SSLCommerz Payment Gateway
            <Switch
              checked={settings.sslcommerz?.enabled || false}
              onCheckedChange={(enabled) => updateSSLCommerzSettings({ enabled })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ssl-store-id">Store ID</Label>
              <Input
                id="ssl-store-id"
                value={settings.sslcommerz?.store_id || ''}
                onChange={(e) => updateSSLCommerzSettings({ store_id: e.target.value })}
                placeholder="Enter Store ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssl-store-password">Store Password</Label>
              <Input
                id="ssl-store-password"
                type="password"
                value={settings.sslcommerz?.store_password || ''}
                onChange={(e) => updateSSLCommerzSettings({ store_password: e.target.value })}
                placeholder="Enter Store Password"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="ssl-live-mode"
              checked={settings.sslcommerz?.is_live || false}
              onCheckedChange={(is_live) => updateSSLCommerzSettings({ is_live })}
            />
            <Label htmlFor="ssl-live-mode">Live Mode (Uncheck for Sandbox)</Label>
          </div>
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
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentGatewaySettingsProps {
  storeId: string;
}

interface PaymentSettings {
  bkash: {
    enabled: boolean;
    mode: string;
    number: string;
  };
  nagad: {
    enabled: boolean;
  };
  sslcommerz: {
    enabled: boolean;
  };
}

export function PaymentGatewaySettings({ storeId }: PaymentGatewaySettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    bkash: {
      enabled: false,
      mode: 'number_only',
      number: '',
    },
    nagad: {
      enabled: false,
    },
    sslcommerz: {
      enabled: false,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('settings')
          .eq('id', storeId)
          .single();

        if (error) throw error;

        const paymentSettings = (data?.settings as any)?.payment || {};
        setSettings({
          bkash: {
            enabled: paymentSettings.bkash?.enabled || false,
            mode: paymentSettings.bkash?.mode || 'number_only',
            number: paymentSettings.bkash?.number || '',
          },
          nagad: {
            enabled: paymentSettings.nagad?.enabled || false,
          },
          sslcommerz: {
            enabled: paymentSettings.sslcommerz?.enabled || false,
          },
        });
      } catch (error) {
        console.error('Error loading payment settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment settings.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      loadSettings();
    }
  }, [storeId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // First get current store settings
      const { data: store, error: fetchError } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment settings while preserving other settings
      const updatedSettings = {
        ...(store.settings as any || {}),
        payment: settings,
      };

      const { error } = await supabase
        .from('stores')
        .update({ settings: updatedSettings })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment gateway settings saved successfully.',
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBkashSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      bkash: {
        ...prev.bkash,
        [field]: value,
      },
    }));
  };

  const updateGatewayEnabled = (gateway: keyof PaymentSettings, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        enabled,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Gateway Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* bKash Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">bKash</h4>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Enabled</Label>
              <Switch
                checked={settings.bkash.enabled}
                onCheckedChange={(enabled) => updateGatewayEnabled('bkash', enabled)}
                disabled={saving}
              />
            </div>
          </div>

          {settings.bkash.enabled && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="bkash_mode">Mode</Label>
                <Select
                  value={settings.bkash.mode}
                  onValueChange={(value) => updateBkashSettings('mode', value)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number_only">Number only</SelectItem>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bkash_number">bKash Number</Label>
                <Input
                  id="bkash_number"
                  type="tel"
                  value={settings.bkash.number}
                  onChange={(e) => updateBkashSettings('number', e.target.value)}
                  placeholder="01303119151"
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nagad Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Nagad</h4>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Enabled</Label>
              <Switch
                checked={settings.nagad.enabled}
                onCheckedChange={(enabled) => updateGatewayEnabled('nagad', enabled)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* SSLCommerz Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">SSLCommerz</h4>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Enabled</Label>
              <Switch
                checked={settings.sslcommerz.enabled}
                onCheckedChange={(enabled) => updateGatewayEnabled('sslcommerz', enabled)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
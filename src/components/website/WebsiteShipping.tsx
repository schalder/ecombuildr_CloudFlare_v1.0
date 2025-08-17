import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Shipping settings types for per-website configuration
type ShippingCityRule = { city: string; fee: number; label?: string };
type ShippingAreaRule = { area: string; fee: number; label?: string };
type ShippingWeightTier = { maxWeight: number; fee: number; label?: string };
type ShippingSettings = {
  enabled: boolean;
  country?: string;
  restOfCountryFee: number;
  cityRules: ShippingCityRule[];
  areaRules?: ShippingAreaRule[];
  // Enhanced settings
  weightTiers?: ShippingWeightTier[];
  freeShippingThreshold?: number; // minimum order amount for free shipping
  freeShippingMinWeight?: number; // minimum weight for free shipping (in grams)
};

interface Website {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  settings: any;
}

interface WebsiteShippingProps {
  website: Website;
}

const shippingSettingsSchema = z.object({
  // This schema can be expanded if needed for form validation
});

export const WebsiteShipping: React.FC<WebsiteShippingProps> = ({ website }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Shipping settings state
  const [shippingSettings, setShippingSettings] = React.useState<ShippingSettings>(
    website.settings?.shipping || {
      enabled: false,
      country: '',
      restOfCountryFee: 0,
      cityRules: [],
      areaRules: [],
      weightTiers: [],
      freeShippingThreshold: 0,
      freeShippingMinWeight: 0,
    }
  );

  const form = useForm({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {},
  });

  const updateShippingMutation = useMutation({
    mutationFn: async () => {
      const settings = {
        ...website.settings,
        shipping: shippingSettings,
      };

      const { error } = await supabase
        .from('websites')
        .update({
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', website.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', website.id] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast({ 
        title: 'Shipping settings saved',
        description: 'Website shipping settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update shipping settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update shipping settings:', error);
    },
  });

  const onSubmit = () => {
    updateShippingMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Shipping & Delivery</h2>
        <p className="text-muted-foreground">Configure location-based delivery charges for this website.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Shipping Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Shipping Rules</FormLabel>
                <FormDescription>Turn on to apply fees by city and for the rest of the country.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={shippingSettings.enabled}
                  onCheckedChange={(v) => setShippingSettings((s) => ({ ...s, enabled: v }))}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Bangladesh"
                  value={shippingSettings.country || ''}
                  onChange={(e) => setShippingSettings((s) => ({ ...s, country: e.target.value }))}
                />
              </FormControl>
              <FormDescription>
                Used for your shipping context. Rules below apply within this country.
              </FormDescription>
            </FormItem>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Default fee (rest of country)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={shippingSettings.restOfCountryFee}
                  onChange={(e) => setShippingSettings((s) => ({ ...s, restOfCountryFee: Number(e.target.value) || 0 }))}
                />
              </FormControl>
              <FormDescription>
                Applied to all locations not matched by a city rule.
              </FormDescription>
            </FormItem>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>City-specific rules</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShippingSettings((s) => ({ ...s, cityRules: [...s.cityRules, { city: '', fee: 0 }] }))}
              >
                Add City Rule
              </Button>
            </div>

            {shippingSettings.cityRules.length === 0 && (
              <p className="text-sm text-muted-foreground">No city rules yet. Add one to override the default fee for a city.</p>
            )}

            {shippingSettings.cityRules.map((rule, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Dhaka"
                      value={rule.city}
                      onChange={(e) => setShippingSettings((s) => {
                        const cityRules = [...s.cityRules];
                        cityRules[idx] = { ...cityRules[idx], city: e.target.value };
                        return { ...s, cityRules };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rule.fee}
                      onChange={(e) => setShippingSettings((s) => {
                        const cityRules = [...s.cityRules];
                        cityRules[idx] = { ...cityRules[idx], fee: Number(e.target.value) || 0 };
                        return { ...s, cityRules };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="md:self-start"
                    onClick={() => setShippingSettings((s) => ({ ...s, cityRules: s.cityRules.filter((_, i) => i !== idx) }))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Zone/Area-specific rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Zone/Area-specific rules (Optional)</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShippingSettings((s) => ({ ...s, areaRules: [...(s.areaRules || []), { area: '', fee: 0 }] }))}
              >
                Add Area Rule
              </Button>
            </div>

            <FormDescription>
              Zone/Area rules have higher priority than city rules. Customer's Area field will be matched first.
            </FormDescription>

            {(!shippingSettings.areaRules || shippingSettings.areaRules.length === 0) && (
              <p className="text-sm text-muted-foreground">No area rules yet. Add one to override city and default fees for specific areas/zones.</p>
            )}

            {(shippingSettings.areaRules || []).map((rule, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <FormItem>
                  <FormLabel>Area/Zone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Gazipur"
                      value={rule.area}
                      onChange={(e) => setShippingSettings((s) => {
                        const areaRules = [...(s.areaRules || [])];
                        areaRules[idx] = { ...areaRules[idx], area: e.target.value };
                        return { ...s, areaRules };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rule.fee}
                      onChange={(e) => setShippingSettings((s) => {
                        const areaRules = [...(s.areaRules || [])];
                        areaRules[idx] = { ...areaRules[idx], fee: Number(e.target.value) || 0 };
                        return { ...s, areaRules };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShippingSettings((s) => ({ ...s, areaRules: (s.areaRules || []).filter((_, i) => i !== idx) }))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Free Shipping Thresholds */}
          <div className="space-y-4">
            <FormLabel>Free Shipping Rules</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Free shipping threshold (amount)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={shippingSettings.freeShippingThreshold || ''}
                    onChange={(e) => setShippingSettings((s) => ({ 
                      ...s, 
                      freeShippingThreshold: Number(e.target.value) || 0 
                    }))}
                  />
                </FormControl>
                <FormDescription>
                  Minimum order amount for free shipping. Set to 0 to disable.
                </FormDescription>
              </FormItem>
              
              <FormItem>
                <FormLabel>Free shipping min weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={shippingSettings.freeShippingMinWeight ? (shippingSettings.freeShippingMinWeight / 1000).toString() : ''}
                    onChange={(e) => setShippingSettings((s) => ({ 
                      ...s, 
                      freeShippingMinWeight: (Number(e.target.value) || 0) * 1000
                    }))}
                  />
                </FormControl>
                <FormDescription>
                  Minimum total weight for free shipping (e.g., 0.5 for 500g, 2 for 2kg). Set to 0 to disable.
                </FormDescription>
              </FormItem>
            </div>
          </div>

          <Separator />

          {/* Weight-based Shipping Tiers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Weight-based shipping tiers</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShippingSettings((s) => ({ 
                  ...s, 
                  weightTiers: [...(s.weightTiers || []), { maxWeight: 500, fee: 0, label: '' }] 
                }))}
              >
                Add Weight Tier
              </Button>
            </div>

            <FormDescription>
              Configure shipping fees based on total order weight. Enter weights in kg (e.g., 0.5 for 500g, 2 for 2kg).
            </FormDescription>

            {(!shippingSettings.weightTiers || shippingSettings.weightTiers.length === 0) && (
              <p className="text-sm text-muted-foreground">No weight tiers configured. Add one to charge based on total order weight.</p>
            )}

            {(shippingSettings.weightTiers || []).map((tier, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <FormItem>
                  <FormLabel>Max Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      placeholder="0.5"
                      value={(tier.maxWeight / 1000).toString()}
                      onChange={(e) => setShippingSettings((s) => {
                        const weightTiers = [...(s.weightTiers || [])];
                        weightTiers[idx] = { ...weightTiers[idx], maxWeight: (Number(e.target.value) || 0.01) * 1000 };
                        return { ...s, weightTiers };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="50.00"
                      value={tier.fee}
                      onChange={(e) => setShippingSettings((s) => {
                        const weightTiers = [...(s.weightTiers || [])];
                        weightTiers[idx] = { ...weightTiers[idx], fee: Number(e.target.value) || 0 };
                        return { ...s, weightTiers };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Label (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Light items"
                      value={tier.label || ''}
                      onChange={(e) => setShippingSettings((s) => {
                        const weightTiers = [...(s.weightTiers || [])];
                        weightTiers[idx] = { ...weightTiers[idx], label: e.target.value };
                        return { ...s, weightTiers };
                      })}
                    />
                  </FormControl>
                </FormItem>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShippingSettings((s) => ({ 
                      ...s, 
                      weightTiers: (s.weightTiers || []).filter((_, i) => i !== idx) 
                    }))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {(shippingSettings.weightTiers && shippingSettings.weightTiers.length > 0) && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Weight tiers are applied in ascending order. 
                  If order weight is ≤ max weight, that tier's fee is used. 
                  If weight exceeds all tiers, the highest tier fee applies.
                  <br />
                  <strong>Example:</strong> Up to 0.5kg = 60 taka, Up to 1kg = 70 taka
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={onSubmit} 
              disabled={updateShippingMutation.isPending}
            >
              {updateShippingMutation.isPending ? 'Saving...' : 'Save Shipping Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
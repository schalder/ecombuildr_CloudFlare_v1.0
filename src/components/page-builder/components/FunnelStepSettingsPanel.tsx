import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface FunnelStepSettingsPanelProps {
  stepId: string;
  funnelId: string;
  onClose: () => void;
}

interface FunnelStep {
  id: string;
  title: string;
  slug: string;
  step_type: string;
  step_order: number;
  on_accept_step_id?: string;
  on_decline_step_id?: string;
  offer_product_id?: string;
  offer_price?: number;
  offer_quantity?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export const FunnelStepSettingsPanel: React.FC<FunnelStepSettingsPanelProps> = ({
  stepId,
  funnelId,
  onClose,
}) => {
  const [step, setStep] = useState<FunnelStep | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [stepId, funnelId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current step
      const { data: stepData, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;
      setStep(stepData);

      // Load all funnel steps for navigation
      const { data: stepsData, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('id, title, slug, step_type, step_order')
        .eq('funnel_id', funnelId)
        .order('step_order');

      if (stepsError) throw stepsError;
      setFunnelSteps(stepsData || []);

      // Load products for offers
      const { data: funnel } = await supabase
        .from('funnels')
        .select('store_id')
        .eq('id', funnelId)
        .single();

      if (funnel) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price')
          .eq('store_id', funnel.store_id)
          .eq('is_active', true)
          .order('name');

        if (!productsError) {
          setProducts(productsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading step data:', error);
      toast({
        title: "Error",
        description: "Failed to load step settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!step) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('funnel_steps')
        .update({
          step_type: step.step_type,
          on_accept_step_id: step.on_accept_step_id || null,
          on_decline_step_id: step.on_decline_step_id || null,
          offer_product_id: step.offer_product_id || null,
          offer_price: step.offer_price || null,
          offer_quantity: step.offer_quantity || 1,
        })
        .eq('id', stepId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Step settings saved successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: "Error",
        description: "Failed to save step settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!step) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Step not found
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Step Settings</h2>
          <p className="text-muted-foreground">{step.title}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step Type</CardTitle>
          <CardDescription>
            Configure the behavior of this funnel step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-type">Step Type</Label>
            <Select
              value={step.step_type}
              onValueChange={(value) => setStep({ ...step, step_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="upsell">Upsell Offer</SelectItem>
                <SelectItem value="downsell">Downsell Offer</SelectItem>
                <SelectItem value="thank_you">Thank You Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {(step.step_type === 'upsell' || step.step_type === 'downsell') && (
        <Card>
          <CardHeader>
            <CardTitle>Offer Configuration</CardTitle>
            <CardDescription>
              Configure the product offer for this step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-product">Offer Product</Label>
              <Select
                value={step.offer_product_id || ''}
                onValueChange={(value) => setStep({ ...step, offer_product_id: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer-price">Offer Price</Label>
                <Input
                  id="offer-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={step.offer_price || ''}
                  onChange={(e) => setStep({ ...step, offer_price: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-quantity">Quantity</Label>
                <Input
                  id="offer-quantity"
                  type="number"
                  min="1"
                  value={step.offer_quantity || 1}
                  onChange={(e) => setStep({ ...step, offer_quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Step Navigation</CardTitle>
          <CardDescription>
            Configure where users go after accepting or declining offers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accept-step">On Accept (Go To Step)</Label>
            <Select
              value={step.on_accept_step_id || ''}
              onValueChange={(value) => setStep({ ...step, on_accept_step_id: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select next step" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">End Funnel</SelectItem>
                {funnelSteps
                  .filter(s => s.id !== stepId)
                  .map((funnelStep) => (
                    <SelectItem key={funnelStep.id} value={funnelStep.id}>
                      {funnelStep.title} ({funnelStep.step_type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decline-step">On Decline (Go To Step)</Label>
            <Select
              value={step.on_decline_step_id || ''}
              onValueChange={(value) => setStep({ ...step, on_decline_step_id: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select next step" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">End Funnel</SelectItem>
                {funnelSteps
                  .filter(s => s.id !== stepId)
                  .map((funnelStep) => (
                    <SelectItem key={funnelStep.id} value={funnelStep.id}>
                      {funnelStep.title} ({funnelStep.step_type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};
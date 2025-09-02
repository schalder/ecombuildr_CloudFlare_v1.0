import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '../types';
import { useStoreProducts } from '@/hooks/useStoreData';
import { useFunnelStepContext } from '@/contexts/FunnelStepContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FunnelOfferContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const FunnelOfferContentProperties: React.FC<FunnelOfferContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { products, loading: productsLoading } = useStoreProducts();
  const { stepId, funnelId } = useFunnelStepContext();
  const { toast } = useToast();
  const [funnelSteps, setFunnelSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [stepData, setStepData] = useState<any>(null);

  // Load funnel steps for redirect options
  useEffect(() => {
    if (!funnelId) return;

    const loadFunnelSteps = async () => {
      setLoadingSteps(true);
      try {
        const { data, error } = await supabase
          .from('funnel_steps')
          .select('id, title, slug, step_type')
          .eq('funnel_id', funnelId)
          .order('step_order');

        if (error) throw error;
        setFunnelSteps(data || []);
      } catch (error) {
        console.error('Error loading funnel steps:', error);
      } finally {
        setLoadingSteps(false);
      }
    };

    loadFunnelSteps();
  }, [funnelId]);

  // Load current step data
  useEffect(() => {
    if (!stepId) return;

    const loadStepData = async () => {
      try {
        const { data, error } = await supabase
          .from('funnel_steps')
          .select('offer_product_id, offer_price, on_accept_step_id, on_decline_step_id')
          .eq('id', stepId)
          .single();

        if (error) throw error;
        setStepData(data);
      } catch (error) {
        console.error('Error loading step data:', error);
      }
    };

    loadStepData();
  }, [stepId]);

  const handleStepSettingUpdate = async (field: string, value: any) => {
    if (!stepId) return;

    try {
      const { error } = await supabase
        .from('funnel_steps')
        .update({ [field]: value })
        .eq('id', stepId);

      if (error) throw error;
      
      setStepData(prev => ({ ...prev, [field]: value }));
      toast({
        title: "Updated",
        description: "Step settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating step:', error);
      toast({
        title: "Error",
        description: "Failed to update step settings",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Content */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Offer Content</h3>
        <div>
          <Label htmlFor="offer-title">Offer Title</Label>
          <Input
            id="offer-title"
            value={element.content.title || 'Special Offer'}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Special Offer"
          />
        </div>

        <div>
          <Label htmlFor="offer-description">Description</Label>
          <Textarea
            id="offer-description"
            value={element.content.description || "Don't miss this exclusive offer!"}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="Don't miss this exclusive offer!"
            className="min-h-[60px]"
          />
        </div>

        <div>
          <Label htmlFor="accept-text">Accept Button Text</Label>
          <Input
            id="accept-text"
            value={element.content.acceptText || 'Yes, I Want This!'}
            onChange={(e) => onUpdate('acceptText', e.target.value)}
            placeholder="Yes, I Want This!"
          />
        </div>

        <div>
          <Label htmlFor="decline-text">Decline Link Text</Label>
          <Input
            id="decline-text"
            value={element.content.declineText || 'No Thanks'}
            onChange={(e) => onUpdate('declineText', e.target.value)}
            placeholder="No Thanks"
          />
        </div>
      </div>

      {/* Offer Configuration */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium">Offer Configuration</h3>
        
        <div>
          <Label htmlFor="offer-product">Offer Product</Label>
          <Select
            value={stepData?.offer_product_id || ''}
            onValueChange={(value) => handleStepSettingUpdate('offer_product_id', value)}
            disabled={productsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product for this offer" />
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

        <div>
          <Label htmlFor="offer-price">Offer Price</Label>
          <Input
            id="offer-price"
            type="number"
            step="0.01"
            value={stepData?.offer_price || ''}
            onChange={(e) => handleStepSettingUpdate('offer_price', parseFloat(e.target.value) || 0)}
            placeholder="Enter special offer price"
          />
        </div>
      </div>

      {/* Redirect Settings */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium">Redirect Settings</h3>
        
        <div>
          <Label htmlFor="accept-redirect">Accept Button → Redirect To</Label>
          <Select
            value={stepData?.on_accept_step_id || 'order-confirmation'}
            onValueChange={(value) => handleStepSettingUpdate('on_accept_step_id', value === 'order-confirmation' ? null : value)}
            disabled={loadingSteps}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select step after accept" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order-confirmation">Order Confirmation</SelectItem>
              {funnelSteps.map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  {step.title} ({step.step_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="decline-redirect">Decline Link → Redirect To</Label>
          <Select
            value={stepData?.on_decline_step_id || 'order-confirmation'}
            onValueChange={(value) => handleStepSettingUpdate('on_decline_step_id', value === 'order-confirmation' ? null : value)}
            disabled={loadingSteps}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select step after decline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order-confirmation">Order Confirmation</SelectItem>
              {funnelSteps.map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  {step.title} ({step.step_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
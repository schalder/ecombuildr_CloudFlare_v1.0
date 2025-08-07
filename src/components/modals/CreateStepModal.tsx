import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  currentStepsCount: number;
}

export const CreateStepModal: React.FC<CreateStepModalProps> = ({
  isOpen,
  onClose,
  funnelId,
  currentStepsCount
}) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    stepType: 'landing',
    stepOrder: currentStepsCount + 1
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStepMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('funnel_steps')
        .insert({
          title: data.title,
          slug: data.slug,
          funnel_id: funnelId,
          step_type: data.stepType,
          step_order: data.stepOrder,
          content: { sections: [] },
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-steps', funnelId] });
      toast({ title: 'Funnel step created successfully' });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating funnel step:', error);
      toast({ 
        title: 'Error creating funnel step',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleClose = () => {
    setFormData({ 
      title: '', 
      slug: '', 
      stepType: 'landing', 
      stepOrder: currentStepsCount + 1 
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    createStepMutation.mutate(formData);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value)
    }));
  };

  const getStepTypeLabel = (type: string) => {
    switch (type) {
      case 'landing': return 'Landing Page';
      case 'checkout': return 'Checkout';
      case 'upsell': return 'Upsell';
      case 'downsell': return 'Downsell';
      case 'thank_you': return 'Thank You';
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Funnel Step</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Step Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Landing Page"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="landing-page"
              required
            />
          </div>

          <div>
            <Label htmlFor="stepType">Step Type</Label>
            <Select value={formData.stepType} onValueChange={(value) => setFormData(prev => ({ ...prev, stepType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select step type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">{getStepTypeLabel('landing')}</SelectItem>
                <SelectItem value="checkout">{getStepTypeLabel('checkout')}</SelectItem>
                <SelectItem value="upsell">{getStepTypeLabel('upsell')}</SelectItem>
                <SelectItem value="downsell">{getStepTypeLabel('downsell')}</SelectItem>
                <SelectItem value="thank_you">{getStepTypeLabel('thank_you')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stepOrder">Step Order</Label>
            <Input
              id="stepOrder"
              type="number"
              value={formData.stepOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, stepOrder: parseInt(e.target.value) || 1 }))}
              min="1"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createStepMutation.isPending}>
              {createStepMutation.isPending ? 'Creating...' : 'Create Step'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
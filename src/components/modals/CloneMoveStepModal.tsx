import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { generateUniqueSlug, checkFunnelStepSlugAvailability, getNextFunnelStepOrder } from '@/lib/cloneUtils';

interface Funnel {
  id: string;
  name: string;
}

interface CloneMoveStepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: string;
  stepTitle: string;
  currentFunnelId: string;
  mode: 'clone' | 'move';
  onSuccess?: () => void;
}

export const CloneMoveStepModal: React.FC<CloneMoveStepModalProps> = ({
  open,
  onOpenChange,
  stepId,
  stepTitle,
  currentFunnelId,
  mode,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>(currentFunnelId);
  const [newSlug, setNewSlug] = useState('');
  const [targetStepOrder, setTargetStepOrder] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFunnels, setIsLoadingFunnels] = useState(false);

  // Fetch available funnels
  useEffect(() => {
    if (open) {
      fetchFunnels();
    }
  }, [open]);

  // Fetch step data when cloning and set default selection
  useEffect(() => {
    if (open) {
      setSelectedFunnelId(currentFunnelId);
      if (mode === 'clone') {
        fetchStepData();
      }
    }
  }, [open, mode, stepId, currentFunnelId]);

  const fetchFunnels = async () => {
    setIsLoadingFunnels(true);
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setFunnels(data || []);
    } catch (error: any) {
      console.error('Error fetching funnels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load funnels.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFunnels(false);
    }
  };

  const fetchStepData = async () => {
    try {
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('slug, step_order')
        .eq('id', stepId)
        .single();

      if (error) throw error;
      if (data) {
        setNewSlug(data.slug);
      }
    } catch (error: any) {
      console.error('Error fetching step data:', error);
    }
  };

  const handleClone = async () => {
    if (!selectedFunnelId) {
      toast({
        title: 'Funnel required',
        description: 'Please select a funnel.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch source step
      const { data: sourceStep, error: fetchError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (fetchError || !sourceStep) {
        throw new Error('Source step not found');
      }

      // Generate unique slug
      const uniqueSlug = await generateUniqueSlug(
        newSlug || sourceStep.slug,
        (slug) => checkFunnelStepSlugAvailability(selectedFunnelId, slug)
      );

      // Get next step order
      const nextOrder = await getNextFunnelStepOrder(selectedFunnelId);

      // Create cloned step
      const { data: clonedStep, error: createError } = await supabase
        .from('funnel_steps')
        .insert({
          funnel_id: selectedFunnelId,
          title: sourceStep.title,
          slug: uniqueSlug,
          step_order: nextOrder,
          step_type: sourceStep.step_type,
          content: sourceStep.content || {},
          is_published: false,
          seo_title: sourceStep.seo_title,
          seo_description: sourceStep.seo_description,
          og_image: sourceStep.og_image,
          custom_scripts: sourceStep.custom_scripts,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Step cloned successfully',
        description: `"${clonedStep.title}" has been cloned to the selected funnel.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      setNewSlug('');
    } catch (error: any) {
      console.error('Error cloning step:', error);
      toast({
        title: 'Error cloning step',
        description: error.message || 'An error occurred while cloning the step.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async () => {
    if (!selectedFunnelId || selectedFunnelId === currentFunnelId) {
      toast({
        title: 'Invalid selection',
        description: 'Please select a different funnel.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch source step
      const { data: sourceStep, error: fetchError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (fetchError || !sourceStep) {
        throw new Error('Source step not found');
      }

      // Generate unique slug for target funnel
      const uniqueSlug = await generateUniqueSlug(
        sourceStep.slug,
        (slug) => checkFunnelStepSlugAvailability(selectedFunnelId, slug)
      );

      // Get step order (use provided or get next)
      let stepOrder = targetStepOrder;
      if (!stepOrder) {
        stepOrder = await getNextFunnelStepOrder(selectedFunnelId);
      }

      // Update step
      const { error: updateError } = await supabase
        .from('funnel_steps')
        .update({
          funnel_id: selectedFunnelId,
          slug: uniqueSlug,
          step_order: stepOrder,
        })
        .eq('id', stepId);

      if (updateError) throw updateError;

      toast({
        title: 'Step moved successfully',
        description: `"${sourceStep.title}" has been moved to the selected funnel.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error moving step:', error);
      toast({
        title: 'Error moving step',
        description: error.message || 'An error occurred while moving the step.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'clone' ? 'Clone Step' : 'Move Step'}</DialogTitle>
          <DialogDescription>
            {mode === 'clone'
              ? `Create a copy of "${stepTitle}" in another funnel.`
              : `Move "${stepTitle}" to another funnel.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="target-funnel">Target Funnel</Label>
            <Select
              value={selectedFunnelId}
              onValueChange={setSelectedFunnelId}
              disabled={isLoading || isLoadingFunnels}
            >
              <SelectTrigger id="target-funnel">
                <SelectValue placeholder="Select funnel" />
              </SelectTrigger>
              <SelectContent>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'clone' && (
            <div>
              <Label htmlFor="new-slug">Step Slug (optional)</Label>
              <Input
                id="new-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="Auto-generated if left empty"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If left empty, a unique slug will be generated automatically.
              </p>
            </div>
          )}

          {mode === 'move' && (
            <div>
              <Label htmlFor="step-order">Step Order (optional)</Label>
              <Input
                id="step-order"
                type="number"
                min="1"
                value={targetStepOrder || ''}
                onChange={(e) => setTargetStepOrder(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Auto-assigned if left empty"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If left empty, the step will be added at the end of the funnel.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={mode === 'clone' ? handleClone : handleMove}
              disabled={isLoading || isLoadingFunnels}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'clone' ? 'Clone Step' : 'Move Step'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


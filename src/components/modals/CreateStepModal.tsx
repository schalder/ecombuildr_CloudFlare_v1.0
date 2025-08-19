import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface CreateStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  existingSteps: Array<{ step_order: number }>;
}

export const CreateStepModal: React.FC<CreateStepModalProps> = ({
  isOpen,
  onClose,
  funnelId,
  existingSteps
}) => {
  // Calculate next available step order
  const getNextStepOrder = () => {
    if (existingSteps.length === 0) return 1;
    const maxOrder = Math.max(...existingSteps.map(step => step.step_order));
    return maxOrder + 1;
  };
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    stepType: 'landing',
    stepOrder: getNextStepOrder()
  });

  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [finalSlug, setFinalSlug] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate unique slug by appending random numbers
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let attempts = 0;
    let uniqueSlug = baseSlug;
    
    while (attempts < 10) {
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('slug')
        .eq('funnel_id', funnelId)
        .eq('slug', uniqueSlug)
        .maybeSingle();
      
      if (error || !data) {
        return uniqueSlug;
      }
      
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      uniqueSlug = `${baseSlug}-${randomNum}`;
      attempts++;
    }
    
    return uniqueSlug;
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) return;
    
    setSlugStatus('checking');
    
    try {
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('slug')
        .eq('funnel_id', funnelId)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) {
        setSlugStatus('error');
        return;
      }
      
      if (data) {
        const uniqueSlug = await generateUniqueSlug(slug);
        setSuggestedSlug(uniqueSlug);
        setFinalSlug(uniqueSlug);
        setSlugStatus('taken');
      } else {
        setFinalSlug(slug);
        setSuggestedSlug('');
        setSlugStatus('available');
      }
    } catch (error) {
      console.error('Slug check error:', error);
      setSlugStatus('error');
    }
  };

  // Debounced slug validation
  const debouncedCheckSlug = useCallback(
    debounce((slug: string) => checkSlugAvailability(slug), 500),
    [funnelId]
  );

  const createStepMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('funnel_steps')
        .insert({
          title: data.title,
          slug: finalSlug || data.slug,
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
    const nextOrder = getNextStepOrder();
    setFormData({ 
      title: '', 
      slug: '', 
      stepType: 'landing', 
      stepOrder: nextOrder
    });
    setSlugStatus('idle');
    setSuggestedSlug('');
    setFinalSlug('');
    setIsSlugModified(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slugToUse = finalSlug || formData.slug;
    
    if (!formData.title || !slugToUse) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (slugStatus === 'taken' && !finalSlug) {
      toast({
        title: "Please wait for slug validation to complete.",
        variant: "destructive",
      });
      return;
    }

    createStepMutation.mutate({
      ...formData,
      slug: slugToUse,
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
    
    // Auto-generate slug if slug is empty or hasn't been modified by user
    if (!formData.slug || !isSlugModified) {
      const slug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug }));
      
      // Reset validation state and trigger new validation
      setSlugStatus('idle');
      setSuggestedSlug('');
      setFinalSlug('');
      
      if (slug.trim()) {
        debouncedCheckSlug(slug);
      }
    }
  };

  const handleSlugChange = (value: string) => {
    const slug = generateSlug(value);
    setFormData(prev => ({ ...prev, slug }));
    setIsSlugModified(true);
    
    // Reset validation state and trigger new validation
    setSlugStatus('idle');
    setSuggestedSlug('');
    setFinalSlug('');
    
    if (slug.trim()) {
      debouncedCheckSlug(slug);
    }
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
            <div className="relative">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="landing-page"
                required
                className={`pr-10 ${
                  slugStatus === 'available' ? 'border-green-500' : 
                  slugStatus === 'taken' ? 'border-yellow-500' :
                  slugStatus === 'error' ? 'border-red-500' : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {slugStatus === 'available' && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
                {slugStatus === 'taken' && (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                {slugStatus === 'error' && (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            
            {/* Status Messages */}
            {slugStatus === 'checking' && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking availability...
              </p>
            )}
            {slugStatus === 'available' && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Slug is available
              </p>
            )}
            {slugStatus === 'taken' && suggestedSlug && (
              <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Slug already exists. Using "{suggestedSlug}" instead
              </p>
            )}
            {slugStatus === 'error' && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                Error checking slug availability
              </p>
            )}
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
import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';
import { TemplateSelectionModal } from '@/components/templates/TemplateSelectionModal';
import type { PageBuilderData } from '@/components/page-builder/types';
import { validateFunnelStepSlug, ensureUniqueSlug } from '@/lib/slugUtils';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_type: 'website_page' | 'funnel_step';
  content: PageBuilderData;
  preview_image: string | null;
  is_premium: boolean;
}

interface CreateStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  domainId?: string;
}

export const CreateStepModal: React.FC<CreateStepModalProps> = ({
  isOpen,
  onClose,
  funnelId,
  domainId
}) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    stepType: 'landing'
  });

  // Template selection state
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);

  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [finalSlug, setFinalSlug] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check slug availability with domain-wide validation
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) {
      setSlugStatus('idle');
      setFinalSlug(slug);
      setSuggestedSlug('');
      return;
    }
    
    setSlugStatus('checking');
    
    try {
      const validation = await validateFunnelStepSlug(slug, funnelId, undefined, domainId);
      
      if (validation.hasConflict) {
        setSuggestedSlug(validation.uniqueSlug);
        setFinalSlug(validation.uniqueSlug);
        setSlugStatus('taken');
      } else {
        setFinalSlug(validation.uniqueSlug);
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
      // Get the next step order by querying existing steps
      const { data: existingSteps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('step_order')
        .eq('funnel_id', funnelId)
        .order('step_order', { ascending: false })
        .limit(1);
      
      if (stepsError) throw stepsError;
      
      const nextOrder = (existingSteps?.[0]?.step_order ?? 0) + 1;
      
      // Use template content if selected, otherwise use default content
      let content: any;
      if (selectedTemplate) {
        content = selectedTemplate.content;
      } else {
        content = { sections: [] };
      }

      // Ensure slug is unique before creating
      const uniqueSlug = await ensureUniqueSlug(finalSlug || data.slug, funnelId, undefined, domainId);
      
      const { data: result, error } = await supabase
        .from('funnel_steps')
        .insert({
          title: data.title,
          slug: uniqueSlug,
          funnel_id: funnelId,
          step_type: data.stepType,
          step_order: nextOrder,
          content,
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
      stepType: 'landing'
    });
    setSlugStatus('idle');
    setSuggestedSlug('');
    setFinalSlug('');
    setIsSlugModified(false);
    setSelectedTemplate(null);
    onClose();
  };

  const handleTemplateSelect = (template: PageTemplate | null) => {
    setSelectedTemplate(template);
    setShowTemplateSelection(false);
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
                Slug already exists on this domain. Using "{suggestedSlug}" instead
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
            <Label>Template</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateSelection(true)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {selectedTemplate ? selectedTemplate.name : 'Choose Template'}
              </Button>
              {selectedTemplate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Clear
                </Button>
              )}
            </div>
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground mt-1">
                Using template: {selectedTemplate.name}
              </p>
            )}
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

        <TemplateSelectionModal
          open={showTemplateSelection}
          onOpenChange={setShowTemplateSelection}
          templateType="funnel_step"
          onSelectTemplate={handleTemplateSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
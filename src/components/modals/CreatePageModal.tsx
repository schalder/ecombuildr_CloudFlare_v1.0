import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, AlertCircle, FileText, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';
import { TemplateSelectionModal } from '@/components/templates/TemplateSelectionModal';
import type { PageBuilderData } from '@/components/page-builder/types';
import { TemplateType } from '@/constants/templateTypes';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

// System/E-commerce page types that should have fixed slugs and be unique per website
const SYSTEM_PAGE_TYPES = {
  'products': 'products',
  'cart': 'cart', 
  'checkout': 'checkout',
  'order-confirmation': 'order-confirmation',
  'payment-processing': 'payment-processing'
} as const;

type SystemPageType = keyof typeof SYSTEM_PAGE_TYPES;

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_type?: TemplateType;
  template_types?: TemplateType[];
  content: PageBuilderData;
  preview_image: string | null;
  is_premium: boolean;
}

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
}

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  websiteId
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    pageType: 'page'
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

  // Fetch existing pages to check for duplicates
  const { data: existingPages = [] } = useQuery({
    queryKey: ['website-pages', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_pages')
        .select('slug, title')
        .eq('website_id', websiteId);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!websiteId,
  });

  // Check if the selected page type already exists
  const isSystemPageType = (pageType: string): pageType is SystemPageType => {
    return pageType in SYSTEM_PAGE_TYPES;
  };

  const getSystemPageSlug = (pageType: string): string => {
    if (isSystemPageType(pageType)) {
      return SYSTEM_PAGE_TYPES[pageType];
    }
    return '';
  };

  const pageTypeAlreadyExists = (pageType: string): boolean => {
    if (!isSystemPageType(pageType)) return false;
    const expectedSlug = getSystemPageSlug(pageType);
    return existingPages.some(page => page.slug === expectedSlug);
  };

  const currentPageTypeExists = pageTypeAlreadyExists(formData.pageType);
  const isCurrentPageTypeSystem = isSystemPageType(formData.pageType);

  // Generate unique slug by appending random numbers
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let attempts = 0;
    let uniqueSlug = baseSlug;
    
    while (attempts < 10) {
      const { data, error } = await supabase
        .from('website_pages')
        .select('slug')
        .eq('website_id', websiteId)
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

  // Check slug availability (skip for system pages with fixed slugs)
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) return;
    
    // Skip validation for system pages since they have fixed slugs
    if (isCurrentPageTypeSystem) {
      setSlugStatus('available');
      setFinalSlug(slug);
      setSuggestedSlug('');
      return;
    }
    
    setSlugStatus('checking');
    
    try {
      const { data, error } = await supabase
        .from('website_pages')
        .select('slug')
        .eq('website_id', websiteId)
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
    [websiteId]
  );

  const createPageMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Prepare default content by page type
      const baseSection = (elements: any[] = []) => ({
        id: `section_${Date.now()}`,
        width: 'wide',
        rows: [
          {
            id: `row_${Date.now()}`,
            columnLayout: '1',
            columns: [
              { id: `col_${Date.now()}`, width: 12, elements } as any
            ]
          }
        ]
      });

      // Use template content if selected, otherwise use default content
      let content: any;
      if (selectedTemplate) {
        content = selectedTemplate.content;
      } else {
        content = { sections: [] };
        if (data.pageType === 'products') {
          content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'products-page', content: {} }])] };
        } else if (data.pageType === 'cart') {
          content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'cart-full', content: {} }])] };
        } else if (data.pageType === 'checkout') {
          content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'checkout-full', content: {} }])] };
        } else if (data.pageType === 'order-confirmation') {
          content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'order-confirmation', content: {} }])] };
        } else if (data.pageType === 'payment-processing') {
          content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'payment-processing', content: {} }])] };
        }
      }

      const { data: result, error } = await supabase
        .from('website_pages')
        .insert({
          title: data.title,
          slug: finalSlug || data.slug,
          website_id: websiteId,
          content,
          is_published: false,
          is_homepage: false
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['website-pages', websiteId] });
      toast({ title: 'Page created successfully' });
      handleClose();
      // Navigate directly to the page builder with the new page ID
      navigate(`/dashboard/websites/${websiteId}/pages/${result.id}/builder`);
    },
    onError: (error) => {
      console.error('Error creating page:', error);
      toast({ 
        title: 'Error creating page',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleClose = () => {
    setFormData({ title: '', slug: '', pageType: 'page' });
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
    
    // Check for duplicate system page types
    if (currentPageTypeExists) {
      toast({
        title: 'Page type already exists',
        description: `A ${formData.pageType} page already exists for this website.`,
        variant: 'destructive'
      });
      return;
    }
    
    const slugToUse = finalSlug || formData.slug;
    
    if (!formData.title || !slugToUse) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (slugStatus === 'taken' && !finalSlug && !isCurrentPageTypeSystem) {
      toast({
        title: "Please wait for slug validation to complete.",
        variant: "destructive",
      });
      return;
    }

    createPageMutation.mutate({
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

  const handlePageTypeChange = (value: string) => {
    setFormData(prev => {
      let nextSlug = prev.slug;
      
      // For system pages, always set the fixed slug
      if (isSystemPageType(value)) {
        nextSlug = getSystemPageSlug(value);
        setIsSlugModified(true); // Prevent auto-generation from title
      } else if (!prev.slug && prev.title) {
        // For non-system pages, generate slug from title if no slug exists
        nextSlug = generateSlug(prev.title);
      }
      
      return { ...prev, pageType: value, slug: nextSlug };
    });
    
    // Reset slug validation when page type changes
    setSlugStatus('idle');
    setSuggestedSlug('');
    setFinalSlug('');
  };

  // Effect to validate slug when page type or slug changes
  useEffect(() => {
    if (formData.slug && formData.slug.trim()) {
      debouncedCheckSlug(formData.slug);
    }
  }, [formData.pageType, formData.slug, debouncedCheckSlug]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="About Us"
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
                placeholder="about-us"
                required
                readOnly={isCurrentPageTypeSystem}
                className={`pr-10 ${
                  isCurrentPageTypeSystem ? 'bg-muted cursor-not-allowed' : ''
                } ${
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
            
            {/* System page slug notice */}
            {isCurrentPageTypeSystem && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                System pages have fixed URLs that cannot be changed
              </p>
            )}
            
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
            <Label htmlFor="pageType">Page Type</Label>
            <Select value={formData.pageType} onValueChange={handlePageTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select page type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Standard Page</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="contact">Contact Page</SelectItem>
                <SelectItem value="blog">Blog Page</SelectItem>
                <SelectItem 
                  value="products" 
                  disabled={pageTypeAlreadyExists('products')}
                  className={pageTypeAlreadyExists('products') ? 'opacity-50' : ''}
                >
                  Products Page (Ecommerce) {pageTypeAlreadyExists('products') && '✓ Exists'}
                </SelectItem>
                <SelectItem 
                  value="cart" 
                  disabled={pageTypeAlreadyExists('cart')}
                  className={pageTypeAlreadyExists('cart') ? 'opacity-50' : ''}
                >
                  Cart Page (Ecommerce) {pageTypeAlreadyExists('cart') && '✓ Exists'}
                </SelectItem>
                <SelectItem 
                  value="checkout" 
                  disabled={pageTypeAlreadyExists('checkout')}
                  className={pageTypeAlreadyExists('checkout') ? 'opacity-50' : ''}
                >
                  Checkout Page (Ecommerce) {pageTypeAlreadyExists('checkout') && '✓ Exists'}
                </SelectItem>
                <SelectItem 
                  value="order-confirmation" 
                  disabled={pageTypeAlreadyExists('order-confirmation')}
                  className={pageTypeAlreadyExists('order-confirmation') ? 'opacity-50' : ''}
                >
                  Order Confirmation Page (Ecommerce) {pageTypeAlreadyExists('order-confirmation') && '✓ Exists'}
                </SelectItem>
                <SelectItem 
                  value="payment-processing" 
                  disabled={pageTypeAlreadyExists('payment-processing')}
                  className={pageTypeAlreadyExists('payment-processing') ? 'opacity-50' : ''}
                >
                  Payment Processing Page (Ecommerce) {pageTypeAlreadyExists('payment-processing') && '✓ Exists'}
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Duplicate warning */}
            {currentPageTypeExists && (
              <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This page type already exists for this website
              </p>
            )}
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
            <Button 
              type="submit" 
              disabled={createPageMutation.isPending || currentPageTypeExists}
            >
              {createPageMutation.isPending ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </form>

        <TemplateSelectionModal
          open={showTemplateSelection}
          onOpenChange={setShowTemplateSelection}
          templateType="website_page"
          onSelectTemplate={handleTemplateSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
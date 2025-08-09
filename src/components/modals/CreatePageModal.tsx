import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    pageType: 'page'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      let content: any = { sections: [] };
      if (data.pageType === 'products') {
        content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'product-grid', content: {} }])] };
      } else if (data.pageType === 'cart') {
        content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'cart-full', content: {} }])] };
      } else if (data.pageType === 'checkout') {
        content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'checkout-full', content: {} }])] };
      } else if (data.pageType === 'order-confirmation') {
        content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'order-confirmation', content: {} }])] };
      } else if (data.pageType === 'payment-processing') {
        content = { sections: [baseSection([{ id: `el_${Date.now()}`, type: 'payment-processing', content: {} }])] };
      }

      const { data: result, error } = await supabase
        .from('website_pages')
        .insert({
          title: data.title,
          slug: data.slug,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages', websiteId] });
      toast({ title: 'Page created successfully' });
      handleClose();
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
    createPageMutation.mutate(formData);
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

  const handlePageTypeChange = (value: string) => {
    setFormData(prev => {
      let nextSlug = prev.slug;
      if (!prev.slug) {
        if (value === 'products') nextSlug = 'products';
        if (value === 'cart') nextSlug = 'cart';
        if (value === 'checkout') nextSlug = 'checkout';
        if (value === 'order-confirmation') nextSlug = 'order-confirmation';
        if (value === 'payment-processing') nextSlug = 'payment-processing';
      }
      return { ...prev, pageType: value, slug: nextSlug };
    });
  };

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
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="about-us"
              required
            />
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
                <SelectItem value="products">Products Page (Ecommerce)</SelectItem>
                <SelectItem value="cart">Cart Page (Ecommerce)</SelectItem>
                <SelectItem value="checkout">Checkout Page (Ecommerce)</SelectItem>
                <SelectItem value="order-confirmation">Order Confirmation Page (Ecommerce)</SelectItem>
                <SelectItem value="payment-processing">Payment Processing Page (Ecommerce)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPageMutation.isPending}>
              {createPageMutation.isPending ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Website {
  id: string;
  name: string;
  slug: string;
}

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  websites: Website[];
  onSuccess: () => void;
}

export function CreateCollectionModal({ isOpen, onClose, websites, onSuccess }: CreateCollectionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Collection name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.website_id) {
      toast({
        title: 'Error',
        description: 'Please select a website',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from('collections')
        .insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          website_id: formData.website_id,
          is_active: true,
          is_published: false,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collection created successfully',
      });

      setFormData({
        name: '',
        slug: '',
        description: '',
        website_id: '',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create collection',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        slug: '',
        description: '',
        website_id: '',
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="website">Website</Label>
            <Select
              value={formData.website_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, website_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a website" />
              </SelectTrigger>
              <SelectContent>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter collection name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="collection-slug"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter collection description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-glow">
              {isSubmitting ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { generateUniqueSlug, checkWebsitePageSlugAvailability, hasWebsiteHomepage } from '@/lib/cloneUtils';

interface Website {
  id: string;
  name: string;
}

interface CloneMovePageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  pageTitle: string;
  currentWebsiteId: string;
  mode: 'clone' | 'move';
  onSuccess?: () => void;
}

export const CloneMovePageModal: React.FC<CloneMovePageModalProps> = ({
  open,
  onOpenChange,
  pageId,
  pageTitle,
  currentWebsiteId,
  mode,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>(currentWebsiteId);
  const [newSlug, setNewSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(false);

  // Fetch available websites
  useEffect(() => {
    if (open) {
      fetchWebsites();
    }
  }, [open]);

  // Fetch page data when cloning and set default selection
  useEffect(() => {
    if (open) {
      setSelectedWebsiteId(currentWebsiteId);
      if (mode === 'clone') {
        fetchPageData();
      }
    }
  }, [open, mode, pageId, currentWebsiteId]);

  const fetchWebsites = async () => {
    setIsLoadingWebsites(true);
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setWebsites(data || []);
    } catch (error: any) {
      console.error('Error fetching websites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load websites.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingWebsites(false);
    }
  };

  const fetchPageData = async () => {
    try {
      const { data, error } = await supabase
        .from('website_pages')
        .select('slug')
        .eq('id', pageId)
        .single();

      if (error) throw error;
      if (data) {
        setNewSlug(data.slug);
      }
    } catch (error: any) {
      console.error('Error fetching page data:', error);
    }
  };

  const handleClone = async () => {
    if (!selectedWebsiteId) {
      toast({
        title: 'Website required',
        description: 'Please select a website.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch source page
      const { data: sourcePage, error: fetchError } = await supabase
        .from('website_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (fetchError || !sourcePage) {
        throw new Error('Source page not found');
      }

      // Generate unique slug
      const uniqueSlug = await generateUniqueSlug(
        newSlug || sourcePage.slug,
        (slug) => checkWebsitePageSlugAvailability(selectedWebsiteId, slug)
      );

      // Check homepage conflict
      const hasHomepage = await hasWebsiteHomepage(selectedWebsiteId);
      const isHomepage = sourcePage.is_homepage && !hasHomepage;

      // Create cloned page
      const { data: clonedPage, error: createError } = await supabase
        .from('website_pages')
        .insert({
          website_id: selectedWebsiteId,
          title: sourcePage.title,
          slug: uniqueSlug,
          content: sourcePage.content || {},
          is_published: false,
          is_homepage: isHomepage,
          seo_title: sourcePage.seo_title,
          seo_description: sourcePage.seo_description,
          og_image: sourcePage.og_image,
          custom_scripts: sourcePage.custom_scripts,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Page cloned successfully',
        description: `"${clonedPage.title}" has been cloned to the selected website.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      setNewSlug('');
    } catch (error: any) {
      console.error('Error cloning page:', error);
      toast({
        title: 'Error cloning page',
        description: error.message || 'An error occurred while cloning the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async () => {
    if (!selectedWebsiteId || selectedWebsiteId === currentWebsiteId) {
      toast({
        title: 'Invalid selection',
        description: 'Please select a different website.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch source page
      const { data: sourcePage, error: fetchError } = await supabase
        .from('website_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (fetchError || !sourcePage) {
        throw new Error('Source page not found');
      }

      // Generate unique slug for target website
      const uniqueSlug = await generateUniqueSlug(
        sourcePage.slug,
        (slug) => checkWebsitePageSlugAvailability(selectedWebsiteId, slug)
      );

      // Check homepage conflict
      const hasHomepage = await hasWebsiteHomepage(selectedWebsiteId);
      const isHomepage = sourcePage.is_homepage && !hasHomepage;

      // Update page
      const { error: updateError } = await supabase
        .from('website_pages')
        .update({
          website_id: selectedWebsiteId,
          slug: uniqueSlug,
          is_homepage: isHomepage,
        })
        .eq('id', pageId);

      if (updateError) throw updateError;

      toast({
        title: 'Page moved successfully',
        description: `"${sourcePage.title}" has been moved to the selected website.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error moving page:', error);
      toast({
        title: 'Error moving page',
        description: error.message || 'An error occurred while moving the page.',
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
          <DialogTitle>{mode === 'clone' ? 'Clone Page' : 'Move Page'}</DialogTitle>
          <DialogDescription>
            {mode === 'clone'
              ? `Create a copy of "${pageTitle}" in another website.`
              : `Move "${pageTitle}" to another website.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="target-website">Target Website</Label>
            <Select
              value={selectedWebsiteId}
              onValueChange={setSelectedWebsiteId}
              disabled={isLoading || isLoadingWebsites}
            >
              <SelectTrigger id="target-website">
                <SelectValue placeholder="Select website" />
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

          {mode === 'clone' && (
            <div>
              <Label htmlFor="new-slug">Page Slug (optional)</Label>
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
              disabled={isLoading || isLoadingWebsites}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'clone' ? 'Clone Page' : 'Move Page'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


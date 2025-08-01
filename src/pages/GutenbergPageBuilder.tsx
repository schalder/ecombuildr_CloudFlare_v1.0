import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, Eye } from 'lucide-react';
import { BlockEditor, Block } from '@/components/blocks';
import '@/components/blocks'; // Initialize block registry

interface PageFormData {
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  isPublished: boolean;
  isHomepage: boolean;
}

export default function GutenbergPageBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('pageId');
  const storeId = searchParams.get('storeId');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(!!pageId);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    isPublished: false,
    isHomepage: false,
  });

  useEffect(() => {
    if (pageId) {
      loadPage();
    } else {
      // Initialize with a default paragraph block
      setBlocks([{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'core/paragraph',
        content: { text: 'Start writing your page content...' },
      }]);
    }
  }, [pageId]);

  const loadPage = async () => {
    if (!pageId) return;

    try {
      setLoading(true);
      
      const { data: page, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;

      // Convert legacy content to blocks if needed
      let pageBlocks: Block[] = [];
      const content = page.content as any;
      
      if (content?.blocks && Array.isArray(content.blocks)) {
        pageBlocks = content.blocks as Block[];
      } else if (content?.sections && Array.isArray(content.sections)) {
        // Convert legacy sections to blocks
        pageBlocks = content.sections.map((section: any, index: number) => ({
          id: `legacy-${index}`,
          type: section.type === 'content' ? 'core/paragraph' : 'core/paragraph',
          content: section.content || {},
        }));
      }

      setBlocks(pageBlocks);
      setFormData({
        title: page.title,
        slug: page.slug,
        seoTitle: page.seo_title || '',
        seoDescription: page.seo_description || '',
        ogImage: page.og_image || '',
        isPublished: page.is_published,
        isHomepage: page.is_homepage,
      });
    } catch (error) {
      console.error('Error loading page:', error);
      toast({
        title: "Error",
        description: "Failed to load page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save pages",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Get user's stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id);

      if (!stores || stores.length === 0) {
        toast({
          title: "No store found",
          description: "Please create a store first",
          variant: "destructive",
        });
        return;
      }

      const targetStoreId = storeId || stores[0].id;

      // Generate slug if not provided
      const slug = formData.slug || formData.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const pageData = {
        title: formData.title,
        slug,
        content: { blocks } as any, // Store blocks in new format
        seo_title: formData.seoTitle,
        seo_description: formData.seoDescription,
        og_image: formData.ogImage,
        is_published: formData.isPublished,
        is_homepage: formData.isHomepage,
        store_id: targetStoreId,
      };

      let result;
      if (pageId) {
        result = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', pageId);
      } else {
        result = await supabase
          .from('pages')
          .insert([pageData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: pageId ? "Page updated successfully" : "Page created successfully",
      });

      navigate('/dashboard/pages');
    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="Loading Page..."
        description="Please wait while we load your page."
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={pageId ? "Edit Page" : "Create Page"}
      description="Create and edit pages with the visual block editor."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Page Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Page title"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">Page Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="page-url-slug"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="homepage"
                  checked={formData.isHomepage}
                  onCheckedChange={(checked) => setFormData({ ...formData, isHomepage: checked })}
                />
                <Label htmlFor="homepage">Set as Homepage</Label>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="SEO optimized title"
                />
              </div>
              
              <div>
                <Label htmlFor="seo-description">SEO Description</Label>
                <Textarea
                  id="seo-description"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="SEO meta description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input
                  id="og-image"
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {pageId ? 'Update Page' : 'Create Page'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard/pages')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
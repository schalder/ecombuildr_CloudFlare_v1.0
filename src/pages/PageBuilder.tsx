import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DragDropPageBuilder } from '@/components/page-builder/DragDropPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';

export default function PageBuilder() {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const { store: currentStore } = useUserStore();
  
  const [pageData, setPageData] = useState({
    title: 'New Page',
    slug: 'new-page',
    is_published: false,
    is_homepage: false,
    seo_title: '',
    seo_description: ''
  });
  
  const [builderData, setBuilderData] = useState<PageBuilderData>({ sections: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!pageId);
  const [showSettings, setShowSettings] = useState(false);

  // Load existing page if editing
  useEffect(() => {
    if (pageId && currentStore) {
      loadPage();
    }
  }, [pageId, currentStore]);

  const loadPage = async () => {
    if (!pageId || !currentStore) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .eq('store_id', currentStore.id)
        .single();

      if (error) throw error;

      if (data) {
        setPageData({
          title: data.title,
          slug: data.slug,
          is_published: data.is_published,
          is_homepage: data.is_homepage,
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || ''
        });

        // Convert page content to page builder format
        if (data.content) {
          try {
            const content = data.content as any;
            if (content.sections) {
              setBuilderData({ sections: content.sections });
            } else {
              // Convert legacy format if needed
              setBuilderData({ sections: [] });
            }
          } catch (error) {
            console.error('Error parsing page content:', error);
            setBuilderData({ sections: [] });
          }
        }
      }
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Failed to load page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentStore) {
      toast.error('No store selected');
      return;
    }

    try {
      setIsSaving(true);

      // Prepare page content for database
      const pageContent = {
        sections: builderData.sections,
        globalStyles: builderData.globalStyles || {}
      };

      const pagePayload = {
        title: pageData.title,
        slug: pageData.slug,
        content: JSON.parse(JSON.stringify(pageContent)),
        is_published: pageData.is_published,
        is_homepage: pageData.is_homepage,
        seo_title: pageData.seo_title,
        seo_description: pageData.seo_description,
        store_id: currentStore.id
      };

      let result;
      if (pageId) {
        // Update existing page
        result = await supabase
          .from('pages')
          .update(pagePayload)
          .eq('id', pageId)
          .eq('store_id', currentStore.id);
      } else {
        // Create new page
        result = await supabase
          .from('pages')
          .insert(pagePayload);
      }

      if (result.error) throw result.error;

      toast.success(pageId ? 'Page updated successfully!' : 'Page created successfully!');
      
      if (!pageId) {
        // Navigate to edit mode for new pages
        navigate('/dashboard/pages');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!currentStore) return;
    
    // Open preview in new tab
    const previewUrl = `/store/${currentStore.slug}/${pageData.slug}`;
    window.open(previewUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading page builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/pages')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pages
          </Button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{pageData.title}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Page Builder */}
        <div className="flex-1">
          <DragDropPageBuilder
            initialData={builderData}
            onChange={setBuilderData}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>

        {/* Settings Sidebar */}
        {showSettings && (
          <div className="w-80 border-l bg-card">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Page Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={pageData.title}
                    onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter page title"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={pageData.slug}
                    onChange={(e) => setPageData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="page-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentStore?.slug && `Will be available at: /store/${currentStore.slug}/${pageData.slug}`}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Published</Label>
                  <Switch
                    id="published"
                    checked={pageData.is_published}
                    onCheckedChange={(checked) => setPageData(prev => ({ ...prev, is_published: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="homepage">Set as Homepage</Label>
                  <Switch
                    id="homepage"
                    checked={pageData.is_homepage}
                    onCheckedChange={(checked) => setPageData(prev => ({ ...prev, is_homepage: checked }))}
                  />
                </div>

                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={pageData.seo_title}
                    onChange={(e) => setPageData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="SEO optimized title"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Input
                    id="seo_description"
                    value={pageData.seo_description}
                    onChange={(e) => setPageData(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="SEO meta description"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
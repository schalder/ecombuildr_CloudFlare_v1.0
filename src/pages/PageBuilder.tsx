import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { setGlobalCurrency } from '@/lib/currency';

export default function PageBuilder() {
  const navigate = useNavigate();
  const { pageId, websiteId, funnelId, stepId } = useParams();
  const location = useLocation();
  const { store: currentStore } = useUserStore();
  
  // Determine context based on URL parameters
  const context = websiteId ? 'website' : funnelId ? 'funnel' : 'store';
  const entityId = pageId || stepId;
  const parentId = websiteId || funnelId;
  
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
    if (entityId && currentStore) {
      loadPage();
    }
  }, [entityId, currentStore, context]);

  // Ensure currency is initialized in builder preview for website pages
  useEffect(() => {
    if (context === 'website' && parentId) {
      (async () => {
        try {
          const { data } = await supabase
            .from('websites')
            .select('settings')
            .eq('id', parentId)
            .maybeSingle();
          const code = (data as any)?.settings?.currency?.code || 'BDT';
          setGlobalCurrency(code as any);
        } catch {
          // ignore
        }
      })();
    }
  }, [context, parentId]);

  const loadPage = async () => {
    if (!entityId || !currentStore) return;
    
    try {
      setIsLoading(true);
      
      let query;
      if (context === 'website') {
        query = supabase
          .from('website_pages')
          .select('*')
          .eq('id', entityId)
          .eq('website_id', parentId);
      } else if (context === 'funnel') {
        query = supabase
          .from('funnel_steps')
          .select('*')
          .eq('id', entityId)
          .eq('funnel_id', parentId);
      } else {
        query = supabase
          .from('pages')
          .select('*')
          .eq('id', entityId)
          .eq('store_id', currentStore.id);
      }

      const { data, error } = await query.single();
      if (error) throw error;

      if (data) {
        setPageData({
          title: data.title,
          slug: data.slug,
          is_published: data.is_published,
          is_homepage: data.is_homepage || false,
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
        seo_title: pageData.seo_title,
        seo_description: pageData.seo_description,
        ...(context === 'website' && { is_homepage: pageData.is_homepage })
      };

      let result;
      if (entityId) {
        // Update existing page/step
        if (context === 'website') {
          result = await supabase
            .from('website_pages')
            .update(pagePayload)
            .eq('id', entityId)
            .eq('website_id', parentId);
        } else if (context === 'funnel') {
          result = await supabase
            .from('funnel_steps')
            .update(pagePayload)
            .eq('id', entityId)
            .eq('funnel_id', parentId);
        } else {
          result = await supabase
            .from('pages')
            .update({ ...pagePayload, store_id: currentStore.id })
            .eq('id', entityId)
            .eq('store_id', currentStore.id);
        }
      } else {
        // Create new page (shouldn't happen in this fixed version)
        result = await supabase
          .from('pages')
          .insert({ ...pagePayload, store_id: currentStore.id });
      }

      if (result.error) throw result.error;

      toast.success('Content updated successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  // Save on Cmd/Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isSaving) handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSaving, handleSave]);

  const handlePreview = () => {
    if (!currentStore) return;
    
    let previewUrl;
    if (context === 'website') {
      previewUrl = `/website/${parentId}/${pageData.slug}`;
    } else if (context === 'funnel') {
      previewUrl = `/funnel/${parentId}/${pageData.slug}`;
    } else {
      previewUrl = `/store/${currentStore.slug}/${pageData.slug}`;
    }
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
    <div className="h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (context === 'website') {
                navigate(`/dashboard/websites/${parentId}`);
              } else if (context === 'funnel') {
                navigate(`/dashboard/funnels/${parentId}`);
              } else {
                navigate('/dashboard/pages');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {context === 'website' ? 'Website' : context === 'funnel' ? 'Funnel' : 'Pages'}
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

      <div className="flex-1 min-h-0 flex">
        {/* Page Builder */}
        <div className="flex-1 min-h-0">
          <ElementorPageBuilder
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
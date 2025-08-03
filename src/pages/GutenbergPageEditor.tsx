import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { GutenbergEditor } from '@/components/gutenberg';
import { GutenbergBlock } from '@/components/gutenberg/types';

interface PageData {
  id?: string;
  title: string;
  slug: string;
  content: GutenbergBlock[];
  is_published: boolean;
  is_homepage: boolean;
  seo_title?: string;
  seo_description?: string;
}

export const GutenbergPageEditor: React.FC = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { store } = useUserStore();
  const [pageData, setPageData] = useState<PageData>({
    title: 'New Page',
    slug: 'new-page',
    content: [],
    is_published: false,
    is_homepage: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing page data
  useEffect(() => {
    if (pageId && pageId !== 'new') {
      loadPage();
    }
  }, [pageId]);

  const loadPage = async () => {
    if (!store?.id || !pageId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .eq('store_id', store.id)
        .single();

      if (error) throw error;

      if (data) {
        // Convert legacy content to blocks if needed
        let blocks: GutenbergBlock[] = [];
        
        if (data.content) {
          if (Array.isArray(data.content)) {
            blocks = data.content;
          } else if (typeof data.content === 'object' && data.content.blocks) {
            blocks = data.content.blocks;
          } else if (typeof data.content === 'string') {
            // Convert HTML content to a paragraph block
            blocks = [{
              id: `block-${Date.now()}`,
              type: 'core/paragraph',
              content: { content: data.content }
            }];
          }
        }

        setPageData({
          id: data.id,
          title: data.title,
          slug: data.slug,
          content: blocks,
          is_published: data.is_published || false,
          is_homepage: data.is_homepage || false,
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || ''
        });
      }
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (blocks: GutenbergBlock[]) => {
    if (!store?.id) {
      toast.error('No store selected');
      return;
    }

    try {
      setSaving(true);

      const pageContent = {
        title: pageData.title,
        slug: pageData.slug,
        content: blocks,
        is_published: pageData.is_published,
        is_homepage: pageData.is_homepage,
        seo_title: pageData.seo_title,
        seo_description: pageData.seo_description,
        store_id: store.id
      };

      if (pageData.id) {
        // Update existing page
        const { error } = await supabase
          .from('pages')
          .update(pageContent)
          .eq('id', pageData.id)
          .eq('store_id', store.id);

        if (error) throw error;
        toast.success('Page updated successfully');
      } else {
        // Create new page
        const { data, error } = await supabase
          .from('pages')
          .insert(pageContent)
          .select()
          .single();

        if (error) throw error;
        
        setPageData(prev => ({ ...prev, id: data.id }));
        toast.success('Page created successfully');
        
        // Update URL to reflect the new page ID
        navigate(`/dashboard/pages/edit/${data.id}`, { replace: true });
      }

      // Update local state
      setPageData(prev => ({ ...prev, content: blocks }));

    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (store?.slug && pageData.slug) {
      const previewUrl = `/${store.slug}/${pageData.slug}`;
      window.open(previewUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/pages')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{pageData.title}</h1>
              <p className="text-sm text-muted-foreground">
                {pageData.is_published ? 'Published' : 'Draft'} • 
                /{store?.slug}/{pageData.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={!pageData.is_published}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={() => handleSave(pageData.content)}
            >
              {saving ? (
                <>
                  <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <GutenbergEditor
          initialBlocks={pageData.content}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>
    </div>
  );
};
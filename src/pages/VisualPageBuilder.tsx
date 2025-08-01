import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { VisualPageBuilder } from '@/components/VisualPageBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, ArrowLeft } from 'lucide-react';

export default function VisualPageBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(!!pageId);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
    is_homepage: false,
    custom_scripts: '',
    og_image: '',
  });

  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  const loadPage = async () => {
    try {
      setLoadingPage(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        slug: data.slug,
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        is_published: data.is_published,
        is_homepage: data.is_homepage,
        custom_scripts: data.custom_scripts || '',
        og_image: data.og_image || '',
      });

      // Convert existing content to sections format
      if (data.content && typeof data.content === 'object' && 'sections' in data.content) {
        const contentObj = data.content as { sections: any[] };
        const convertedSections = contentObj.sections.map((section: any, index: number) => ({
          id: `section-${index}`,
          type: section.type === 'content' ? 'text' : section.type,
          content: section.content
        }));
        setSections(convertedSections);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load page",
        variant: "destructive",
      });
    } finally {
      setLoadingPage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!stores || stores.length === 0) {
        toast({
          title: "Error",
          description: "No store found. Please create a store first.",
          variant: "destructive",
        });
        return;
      }

      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Convert sections back to the expected format
      const content = {
        sections: sections.map(section => ({
          type: section.type === 'text' ? 'content' : section.type,
          content: section.content
        }))
      };

      const pageData = {
        ...formData,
        slug,
        store_id: stores[0].id,
        content,
      };

      let error;
      if (pageId) {
        // Update existing page
        const result = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', pageId);
        error = result.error;
      } else {
        // Create new page
        const result = await supabase
          .from('pages')
          .insert(pageData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Page ${pageId ? 'updated' : 'created'} successfully!`,
      });

      navigate('/dashboard/pages');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${pageId ? 'update' : 'create'} page`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <DashboardLayout title="Loading..." description="Loading page data">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">Loading page...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={pageId ? "Edit Page" : "Visual Page Builder"} 
      description="Create and design custom pages with drag-and-drop sections"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/pages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Builder */}
            <div className="lg:col-span-2 space-y-6">
              <VisualPageBuilder 
                initialSections={sections}
                onChange={setSections}
              />
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Page Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Page Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="Auto-generated from title"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                    />
                    <Label htmlFor="is_published">Publish page</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_homepage"
                      checked={formData.is_homepage}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_homepage: checked }))}
                    />
                    <Label htmlFor="is_homepage">Set as homepage</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="og_image">OG Image URL</Label>
                    <Input
                      id="og_image"
                      type="url"
                      value={formData.og_image}
                      onChange={(e) => setFormData(prev => ({ ...prev, og_image: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : pageId ? 'Update Page' : 'Save Page'}
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
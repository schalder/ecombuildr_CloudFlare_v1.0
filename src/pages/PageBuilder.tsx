import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, ArrowLeft } from 'lucide-react';

export default function PageBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
    is_homepage: false,
    content: '{}',
    custom_scripts: '',
    og_image: '',
  });

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

      const { error } = await supabase.from('pages').insert({
        ...formData,
        slug,
        store_id: stores[0].id,
        content: JSON.parse(formData.content || '{}'),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page created successfully!",
      });

      navigate('/dashboard/pages');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Page Builder" description="Create and design custom pages for your store">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/pages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Content</CardTitle>
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

                  <div className="space-y-2">
                    <Label htmlFor="content">Page Content (JSON)</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder='{"blocks": []}'
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter page content as JSON. Future versions will include a visual editor.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom_scripts">Custom Scripts</Label>
                    <Textarea
                      id="custom_scripts"
                      value={formData.custom_scripts}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_scripts: e.target.value }))}
                      placeholder="<script>...</script>"
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  {loading ? 'Saving...' : 'Save Page'}
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
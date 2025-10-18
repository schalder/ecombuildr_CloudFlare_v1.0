import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAllSEOPages } from '@/hooks/useSEO';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Globe, 
  Eye, 
  Edit, 
  Plus, 
  Trash2, 
  Save,
  ExternalLink,
  Hash,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SEOFormData {
  page_slug: string;
  title: string;
  description: string;
  og_image: string;
  keywords: string[] | string;
  is_active: boolean;
}

const SEOSettings = () => {
  const { seoPages, loading, createSEOPage, updateSEOPage, deleteSEOPage } = useAllSEOPages();
  const { toast } = useToast();
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SEOFormData>({
    page_slug: '',
    title: '',
    description: '',
    og_image: '',
    keywords: [],
    is_active: true
  });

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      page_slug: page.page_slug,
      title: page.title,
      description: page.description,
      og_image: page.og_image || '',
      keywords: page.keywords || [],
      is_active: page.is_active
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPage(null);
    setFormData({
      page_slug: '',
      title: '',
      description: '',
      og_image: '',
      keywords: [],
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const keywordsArray = typeof formData.keywords === 'string' 
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : formData.keywords;

      const pageData = {
        ...formData,
        keywords: keywordsArray
      };

      let success = false;
      if (editingPage) {
        success = await updateSEOPage(editingPage.id, pageData);
      } else {
        success = await createSEOPage(pageData);
      }

      if (success) {
        toast({
          title: "Success",
          description: `SEO page ${editingPage ? 'updated' : 'created'} successfully.`
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SEO page.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this SEO page?')) {
      const success = await deleteSEOPage(id);
      if (success) {
        toast({
          title: "Success",
          description: "SEO page deleted successfully."
        });
      }
    }
  };

  const getPageIcon = (slug: string) => {
    if (slug === '/') return <Globe className="h-4 w-4" />;
    if (slug === 'features') return <Hash className="h-4 w-4" />;
    if (slug === 'pricing') return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SEO Settings</h1>
            <p className="text-muted-foreground">
              Manage on-page SEO for your SaaS website pages
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add SEO Page
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Global SEO Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Overview
              </CardTitle>
              <CardDescription>
                Monitor your website's search engine optimization status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{seoPages.length}</div>
                  <div className="text-sm text-muted-foreground">Total Pages</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {seoPages.filter(p => p.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Pages</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {seoPages.filter(p => !p.og_image).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Missing OG Images</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Pages List */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Pages</CardTitle>
              <CardDescription>
                Manage meta titles, descriptions, and social media previews for each page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoPages.map((page) => (
                  <div key={page.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          {getPageIcon(page.page_slug)}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {page.page_slug === '/' ? 'Home Page' : `/${page.page_slug}`}
                            </span>
                            <Badge variant={page.is_active ? 'default' : 'secondary'}>
                              {page.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Title: </span>
                            <span className="text-sm">{page.title}</span>
                            {page.title.length > 60 && (
                              <span className="text-xs text-orange-600 ml-2">
                                (Too long - {page.title.length} chars)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-medium">Description: </span>
                            <span className="text-sm text-muted-foreground">
                              {page.description}
                            </span>
                            {page.description.length > 160 && (
                              <span className="text-xs text-orange-600 ml-2">
                                (Too long - {page.description.length} chars)
                              </span>
                            )}
                          </div>
                          {page.keywords && page.keywords.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Keywords: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {page.keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = page.page_slug === '/' 
                              ? window.location.origin 
                              : `${window.location.origin}${page.page_slug.startsWith('/') ? '' : '/'}${page.page_slug}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(page)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(page.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Edit SEO Page' : 'Add SEO Page'}
              </DialogTitle>
              <DialogDescription>
                Configure SEO settings for this page. Optimal title length is 50-60 characters, 
                description should be 150-160 characters.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="page_slug">Page Slug</Label>
                <Input
                  id="page_slug"
                  value={formData.page_slug}
                  onChange={(e) => setFormData({ ...formData, page_slug: e.target.value })}
                  placeholder="e.g., /, features, pricing"
                  disabled={!!editingPage}
                />
              </div>

              <div>
                <Label htmlFor="title">Meta Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Page title for search engines"
                />
                <span className={`text-xs ${formData.title.length > 60 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  {formData.title.length}/60 characters
                </span>
              </div>

              <div>
                <Label htmlFor="description">Meta Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the page content"
                  rows={3}
                />
                <span className={`text-xs ${formData.description.length > 160 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  {formData.description.length}/160 characters
                </span>
              </div>

              <div>
                <Label htmlFor="og_image">Open Graph Image URL</Label>
                <Input
                  id="og_image"
                  value={formData.og_image}
                  onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0)
                  })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingPage ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default SEOSettings;
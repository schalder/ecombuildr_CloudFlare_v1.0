import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MoreVertical, Edit, Eye, Trash2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Page {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  is_homepage: boolean;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}

export default function Pages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user]);

  const fetchPages = async () => {
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (!stores || stores.length === 0) return;

      const storeIds = stores.map(store => store.id);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .in('store_id', storeIds)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Page ${!page.is_published ? 'published' : 'unpublished'} successfully!`,
      });

      fetchPages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update page status",
        variant: "destructive",
      });
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page deleted successfully!",
      });

      fetchPages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Pages" description="Manage your store pages and content">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{pages.length} pages</Badge>
            <Badge variant="outline">
              {pages.filter(p => p.is_published).length} published
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/pages/homepage')}>
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Button>
            <Button onClick={() => navigate('/dashboard/pages/builder')}>
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pages found. Create your first page to get started.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/dashboard/pages/builder')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.is_published ? "default" : "secondary"}>
                          {page.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {page.is_homepage && (
                          <Badge variant="outline">
                            <Home className="mr-1 h-3 w-3" />
                            Homepage
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(page.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/pages/builder/${page.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // Get the store slug from the current stores
                              const storeSlug = stores?.[0]?.slug; // Assuming single store for now
                              const previewUrl = page.is_homepage 
                                ? `/${storeSlug}` 
                                : `/${storeSlug}/${page.slug}`;
                              window.open(previewUrl, '_blank');
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublishStatus(page)}>
                              {page.is_published ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this page?')) {
                                  deletePage(page.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
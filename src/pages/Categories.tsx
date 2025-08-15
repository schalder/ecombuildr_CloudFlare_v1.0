import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { useStoreWebsitesForSelection, useCategoryWebsiteVisibility } from '@/hooks/useWebsiteVisibility';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string;
  store_id: string;
  created_at: string;
}

interface Website {
  id: string;
  name: string;
  slug: string;
}

interface CategoryWithWebsites extends Category {
  websites?: Website[];
}

export default function Categories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesByWebsite, setCategoriesByWebsite] = useState<{[key: string]: CategoryWithWebsites[]}>({});
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [editSelectedWebsites, setEditSelectedWebsites] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });

  // Get websites for store
  const { websites: storeWebsites } = useStoreWebsitesForSelection(storeId);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (!stores || stores.length === 0) return;

      setStoreId(stores[0].id); // Set the first store as default
      const storeIds = stores.map(store => store.id);

      // Fetch websites
      const { data: websitesData } = await supabase
        .from('websites')
        .select('id, name, slug')
        .in('store_id', storeIds)
        .eq('is_active', true)
        .order('name');

      setWebsites(websitesData || []);

      // Fetch categories
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .in('store_id', storeIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch category visibility data separately
      const { data: visibilityData } = await supabase
        .from('category_website_visibility')
        .select(`
          category_id,
          website_id,
          websites(id, name, slug)
        `);

      const processedCategories = (categoriesData || []).map(cat => ({
        ...cat,
        websites: (visibilityData || [])
          .filter(v => v.category_id === cat.id)
          .map((v: any) => v.websites)
          .filter(Boolean)
      }));

      setCategories(processedCategories);

      // Group categories by website
      const grouped: {[key: string]: CategoryWithWebsites[]} = {
        'all': processedCategories.filter(cat => cat.websites.length === 0)
      };

      websitesData?.forEach(website => {
        grouped[website.id] = processedCategories.filter(cat => 
          cat.websites.some((w: Website) => w.id === website.id)
        );
      });

      setCategoriesByWebsite(grouped);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!stores || stores.length === 0) {
        toast({
          title: "Error",
          description: "No store found",
          variant: "destructive",
        });
        return;
      }

      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const { data: categoryData, error: insertError } = await supabase.from('categories').insert({
        ...formData,
        slug,
        store_id: stores[0].id,
      }).select('id').single();

      if (insertError) throw insertError;

      // Add website visibility records
      if (selectedWebsites.length > 0 && categoryData?.id) {
        const visibilityRecords = selectedWebsites.map(websiteId => ({
          category_id: categoryData.id,
          website_id: websiteId
        }));

        const { error: visibilityError } = await supabase
          .from('category_website_visibility')
          .insert(visibilityRecords);

        if (visibilityError) throw visibilityError;
      }

      toast({
        title: "Success",
        description: "Category created successfully!",
      });

      setFormData({ name: '', description: '', image_url: '' });
      setSelectedWebsites([]);
      setIsAddModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const slug = editFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const { error } = await supabase
        .from('categories')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          image_url: editFormData.image_url,
          slug,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully!",
      });

      setIsEditDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully!",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Categories" description="Manage your product categories">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{categories.length} categories</Badge>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="image_url">Image URL</Label>
                   <Input
                     id="image_url"
                     type="url"
                     value={formData.image_url}
                     onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Website Visibility</Label>
                   <MultiSelect
                     options={storeWebsites.map(w => ({ label: w.name, value: w.id }))}
                     selected={selectedWebsites}
                     onChange={setSelectedWebsites}
                     placeholder="Select websites to show this category on..."
                   />
                   <p className="text-sm text-muted-foreground">
                     Choose which websites this category will be visible on. Leave empty to show on all websites.
                   </p>
                 </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories by Website */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              {/* All Websites Categories */}
              {categoriesByWebsite.all && categoriesByWebsite.all.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>All Websites ({categoriesByWebsite.all.length} categories)</CardTitle>
                    <p className="text-sm text-muted-foreground">Categories visible on all websites</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {categoriesByWebsite.all.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                              {category.slug}
                            </code>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                               onClick={() => {
                                   setEditingCategory(category);
                                   setEditFormData({
                                     name: category.name,
                                     description: category.description,
                                     image_url: category.image_url || '',
                                   });
                                   setIsEditDialogOpen(true);
                                 }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Website-specific Categories */}
              {websites.map((website) => (
                <Card key={website.id}>
                  <CardHeader>
                    <CardTitle>{website.name} ({categoriesByWebsite[website.id]?.length || 0} categories)</CardTitle>
                    <p className="text-sm text-muted-foreground">Categories visible only on {website.name}</p>
                  </CardHeader>
                  <CardContent>
                    {!categoriesByWebsite[website.id] || categoriesByWebsite[website.id].length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No categories specific to {website.name}
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {categoriesByWebsite[website.id].map((category) => (
                          <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{category.name}</h4>
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                                {category.slug}
                              </code>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                 onClick={() => {
                                     setEditingCategory(category);
                                     setEditFormData({
                                       name: category.name,
                                       description: category.description,
                                       image_url: category.image_url || '',
                                     });
                                     setIsEditDialogOpen(true);
                                   }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* No categories at all */}
              {categories.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    No categories found. Create your first category to get started.
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image-url">Image URL</Label>
                <Input
                  id="edit-image-url"
                  type="url"
                  value={editFormData.image_url}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, image_url: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
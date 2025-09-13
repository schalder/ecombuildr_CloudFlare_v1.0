import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MoreHorizontal, Plus, Search, Edit, Trash2, ChevronRight, Globe, Eye } from 'lucide-react';
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';
import { useCategories } from '@/hooks/useCategories';
import { CategoryWebsiteVisibilityDialog } from '@/components/categories/CategoryWebsiteVisibilityDialog';
import { supabase } from '@/integrations/supabase/client';

// Data interfaces
interface Website {
  id: string;
  name: string;
  slug: string;
}

export default function Categories() {
  const { user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const { websites } = useStoreWebsitesForSelection(selectedStoreId);
  const { 
    categories, 
    flatCategories, 
    categoriesWithWebsites,
    loading, 
    error, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    updateCategoryVisibility 
  } = useCategories(selectedStoreId);

  // Get first store on component mount
  useEffect(() => {
    const fetchFirstStore = async () => {
      if (!user) return;
      
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
        
      if (stores && stores.length > 0) {
        setSelectedStoreId(stores[0].id);
      }
    };
    
    fetchFirstStore();
  }, [user]);

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [visibilityCategory, setVisibilityCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_category_id: 'none'
  });

  // Get parent categories for dropdown (only categories without parents)
  const parentCategories = flatCategories.filter(cat => !cat.parent_category_id);

  // Handle form submission for creating categories
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    createCategory.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parent_category_id: formData.parent_category_id === 'none' ? undefined : formData.parent_category_id || undefined
    });

    // Reset form and close modal
    setFormData({ name: '', description: '', parent_category_id: 'none' });
    setIsAddModalOpen(false);
  };

  // Handle form submission for updating categories
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    updateCategory.mutate({
      id: editingCategory.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parent_category_id: formData.parent_category_id === 'none' ? undefined : formData.parent_category_id || undefined
    });

    // Reset form and close modal
    setFormData({ name: '', description: '', parent_category_id: 'none' });
    setIsEditModalOpen(false);
    setEditingCategory(null);
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    deleteCategory.mutate(categoryId);
  };

  // Handle edit button click
  const handleEditClick = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_category_id: category.parent_category_id || 'none'
    });
    setIsEditModalOpen(true);
  };

  // Organize categories by website visibility
  const categoriesByWebsite = useMemo(() => {
    if (!categoriesWithWebsites || categoriesWithWebsites.length === 0) return {};
    
    const result: { [key: string]: any[] } = {};
    
    // Group categories by their website visibility
    categoriesWithWebsites.forEach(category => {
      const rawVisibility = (category as any).category_website_visibility;
      const visibleWebsites = Array.isArray(rawVisibility) ? rawVisibility : [];
      
      if (visibleWebsites.length === 0) {
        // Category not visible on any website - show in "Not Visible" group
        if (!result['Not Visible']) result['Not Visible'] = [];
        result['Not Visible'].push(category);
      } else if (websites.length > 0 && visibleWebsites.length === websites.length) {
        // Category visible on all websites
        if (!result['All Websites']) result['All Websites'] = [];
        result['All Websites'].push(category);
      } else {
        // Category visible on specific websites
        visibleWebsites.forEach((visibility: any) => {
          const websiteName = visibility.websites?.name || 'Unknown Website';
          if (!result[websiteName]) result[websiteName] = [];
          if (!result[websiteName].find((cat: any) => cat.id === category.id)) {
            result[websiteName].push(category);
          }
        });
      }
    });
    
    // Filter by search term
    if (searchTerm.trim()) {
      Object.keys(result).forEach(key => {
        result[key] = result[key].filter((category: any) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (result[key].length === 0) delete result[key];
      });
    }
    
    return result;
  }, [categoriesWithWebsites, websites, searchTerm]);

  // Get subcategories for a parent
  const getSubcategories = (parentId: string, categoriesList: any[]) => {
    return categoriesList.filter(cat => cat.parent_category_id === parentId);
  };

  // Handle visibility management
  const handleManageVisibility = (category: any) => {
    setVisibilityCategory(category);
    setIsVisibilityModalOpen(true);
  };

  const handleUpdateVisibility = (categoryId: string, websiteIds: string[]) => {
    updateCategoryVisibility.mutate({ categoryId, websiteIds });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Categories" description="Manage your product categories and subcategories">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="secondary">{categories.length} categories</Badge>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
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
                <DialogDescription>
                  Add a new category or subcategory to organize your products.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Category name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Category description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parent_category">Parent Category (Optional)</Label>
                  <Select 
                    value={formData.parent_category_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent (Main category)</SelectItem>
                      {parentCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCategory.isPending}>
                    {createCategory.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List by Website */}
        <div className="space-y-6">
          {Object.keys(categoriesByWebsite).length > 0 ? (
            Object.entries(categoriesByWebsite).map(([websiteName, websiteCategories]) => (
              <Card key={websiteName} className="border-l-4 border-l-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {websiteName}
                    <Badge variant="secondary" className="text-xs">
                      {websiteCategories.length} categories
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {websiteCategories
                      .filter(cat => !cat.parent_category_id) // Show only parent categories
                      .map((category) => {
                        const subcategories = getSubcategories(category.id, websiteCategories);
                        
                        return (
                          <Card key={category.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center">
                                  {category.name}
                                  {subcategories.length > 0 && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {subcategories.length} sub
                                    </Badge>
                                  )}
                                </CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditClick(category)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleManageVisibility(category)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Manage Visibility
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <CardDescription className="text-sm">
                                Slug: /{category.slug}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                              {category.description && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                              )}
                              
                              {/* Subcategories */}
                              {subcategories.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Subcategories
                                  </h4>
                                  <div className="space-y-1">
                                    {subcategories.map((subcat) => (
                                      <div key={subcat.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                                        <div className="flex items-center">
                                          <ChevronRight className="h-3 w-3 text-muted-foreground mr-1" />
                                          <span>{subcat.name}</span>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditClick(subcat)}>
                                              <Edit className="mr-2 h-3 w-3" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleManageVisibility(subcat)}>
                                              <Eye className="mr-2 h-3 w-3" />
                                              Manage Visibility
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => handleDeleteCategory(subcat.id)}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="mr-2 h-3 w-3" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No categories found matching your search.' : 'No categories found. Create your first category to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Edit Category Dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information and hierarchy.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Category name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Category description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-parent-category">Parent Category (Optional)</Label>
                <Select 
                  value={formData.parent_category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (Main category)</SelectItem>
                    {parentCategories
                      .filter(cat => cat.id !== editingCategory?.id) // Don't allow self as parent
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCategory.isPending}>
                  {updateCategory.isPending ? 'Updating...' : 'Update Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Website Visibility Dialog */}
        <CategoryWebsiteVisibilityDialog
          open={isVisibilityModalOpen}
          onOpenChange={setIsVisibilityModalOpen}
          category={visibilityCategory}
          storeId={selectedStoreId}
          onUpdateVisibility={handleUpdateVisibility}
          isLoading={updateCategoryVisibility.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
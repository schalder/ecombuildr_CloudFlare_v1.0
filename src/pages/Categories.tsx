import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Plus, Search, Edit, Trash2, ChevronRight, Eye, Filter } from 'lucide-react';
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';
import { useCategories } from '@/hooks/useCategories';
import { CategoryWebsiteVisibilityDialog } from '@/components/categories/CategoryWebsiteVisibilityDialog';
import { ImageUpload } from '@/components/ui/image-upload';
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
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('all');
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
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [visibilityCategory, setVisibilityCategory] = useState<any | null>(null);
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_category_id: 'none',
    website_ids: [] as string[],
    image_url: ''
  });

  // Filter categories by selected website and include necessary ancestors
  const filteredCategories = useMemo(() => {
    if (!categoriesWithWebsites || categoriesWithWebsites.length === 0) return [];
    
    if (selectedWebsiteId === 'all') {
      return categoriesWithWebsites;
    }
    
    // Get categories directly assigned to the selected website
    const directlyVisible = categoriesWithWebsites.filter(category => {
      const rawVisibility = (category as any).category_website_visibility;
      const visibleWebsites = Array.isArray(rawVisibility) ? rawVisibility : [];
      return visibleWebsites.some((v: any) => v.website_id === selectedWebsiteId);
    });
    
    // Find all ancestor categories needed to maintain hierarchy
    const neededAncestors = new Set();
    directlyVisible.forEach(category => {
      let current = category;
      while (current.parent_category_id) {
        neededAncestors.add(current.parent_category_id);
        current = categoriesWithWebsites.find(c => c.id === current.parent_category_id);
        if (!current) break;
      }
    });
    
    // Include both directly visible categories and their ancestors
    const result = categoriesWithWebsites.filter(category => {
      const isDirectlyVisible = directlyVisible.some(c => c.id === category.id);
      const isNeededAncestor = neededAncestors.has(category.id);
      return isDirectlyVisible || isNeededAncestor;
    });
    
    // Mark categories as directly visible or ancestor-only
    return result.map(category => ({
      ...category,
      isDirectlyVisible: directlyVisible.some(c => c.id === category.id),
      isAncestorOnly: neededAncestors.has(category.id)
    }));
  }, [categoriesWithWebsites, selectedWebsiteId]);

  // Get hierarchical structure for display
  const hierarchicalCategories = useMemo(() => {
    const filtered = filteredCategories.filter(cat => 
      !searchTerm.trim() || 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const filteredIds = new Set(filtered.map(c => c.id));
    const roots = filtered.filter(cat => !cat.parent_category_id || !filteredIds.has(cat.parent_category_id));
    
    return roots.map(root => ({
      ...root,
      subcategories: filtered.filter(cat => cat.parent_category_id === root.id)
    }));
  }, [filteredCategories, searchTerm]);

  // Get parent categories for dropdown (only categories without parents from current website)
  const parentCategories = filteredCategories.filter(cat => !cat.parent_category_id);

  // Handle form submission for creating categories
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parent_category_id: formData.parent_category_id === 'none' ? undefined : formData.parent_category_id || undefined,
      image_url: formData.image_url || undefined
    };

    // Create category with selected websites
    const websiteIds = formData.website_ids.length > 0 ? formData.website_ids : 
      (selectedWebsiteId !== 'all' ? [selectedWebsiteId] : []);
    
    if (websiteIds.length === 0) {
      alert('Please select at least one website for this category.');
      return;
    }
    
    createCategory.mutate({ ...categoryData, websiteIds });

    // Reset form and close modal
    setFormData({ 
      name: '', 
      description: '', 
      parent_category_id: 'none',
      website_ids: [],
      image_url: ''
    });
    setIsAddModalOpen(false);
  };

  // Handle subcategory creation
  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !addingSubcategoryTo) return;

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parent_category_id: addingSubcategoryTo,
      image_url: formData.image_url || undefined
    };

    // Use selected websites from form
    const websiteIds = formData.website_ids;
    
    if (websiteIds.length === 0) {
      alert('Please select at least one website for this subcategory.');
      return;
    }
    
    createCategory.mutate({ ...categoryData, websiteIds });

    // Reset form and close modal
    setFormData({ 
      name: '', 
      description: '', 
      parent_category_id: 'none',
      website_ids: [],
      image_url: ''
    });
    setIsAddSubcategoryModalOpen(false);
    setAddingSubcategoryTo(null);
  };

  // Handle form submission for updating categories
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    if (formData.website_ids.length === 0) {
      alert('Please select at least one website for this category.');
      return;
    }

    // Update category details
    updateCategory.mutate({
      id: editingCategory.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parent_category_id: formData.parent_category_id === 'none' ? undefined : formData.parent_category_id || undefined,
      image_url: formData.image_url || undefined
    });

    // Update website visibility
    updateCategoryVisibility.mutate({
      categoryId: editingCategory.id,
      websiteIds: formData.website_ids
    });

    // Reset form and close modal
    setFormData({ 
      name: '', 
      description: '', 
      parent_category_id: 'none',
      website_ids: [],
      image_url: ''
    });
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
    // Get current website assignments for this category
    const visibility = Array.isArray((category as any)?.category_website_visibility) ? 
      (category as any).category_website_visibility : [];
    const websiteIds = visibility.map((v: any) => v.website_id);
    
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_category_id: category.parent_category_id || 'none',
      website_ids: websiteIds,
      image_url: category.image_url || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle add subcategory click
  const handleAddSubcategory = (parentId: string) => {
    setAddingSubcategoryTo(parentId);
    // Inherit parent's website assignments
    const parent = categoriesWithWebsites.find(c => c.id === parentId);
    const parentVisibility = Array.isArray((parent as any)?.category_website_visibility) ? 
      (parent as any).category_website_visibility : [];
    const parentWebsiteIds = parentVisibility.map((v: any) => v.website_id);
    
    setFormData({
      name: '',
      description: '',
      parent_category_id: parentId,
      website_ids: parentWebsiteIds,
      image_url: ''
    });
    setIsAddSubcategoryModalOpen(true);
  };

  // Get current website name
  const getCurrentWebsiteName = () => {
    if (selectedWebsiteId === 'all') return 'All Websites';
    const website = websites.find(w => w.id === selectedWebsiteId);
    return website?.name || 'Unknown Website';
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
            <Badge variant="secondary">{hierarchicalCategories.length} categories</Badge>
            
            {/* Website Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedWebsiteId} onValueChange={setSelectedWebsiteId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by website" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Websites</SelectItem>
                  {websites.map((website) => (
                    <SelectItem key={website.id} value={website.id}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
                  Add a new category and assign it to website(s).
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

                <ImageUpload
                  label="Category Image (Optional)"
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  accept="image/*"
                  maxSize={5}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="websites">Websites *</Label>
                  <div className="space-y-2">
                    {websites.map((website) => (
                      <div key={website.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`website-${website.id}`}
                          checked={formData.website_ids.includes(website.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              website_ids: isChecked 
                                ? [...prev.website_ids, website.id]
                                : prev.website_ids.filter(id => id !== website.id)
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`website-${website.id}`} className="text-sm font-normal">
                          {website.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.website_ids.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Select at least one website for this category
                    </p>
                  )}
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

        {/* Website Info */}
        {selectedWebsiteId !== 'all' && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Categories for</h3>
            <p className="font-semibold">{getCurrentWebsiteName()}</p>
          </div>
        )}

        {/* Categories Table */}
        {hierarchicalCategories.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchicalCategories.map((category) => (
                  <>
                    {/* Parent Category Row */}
                    <TableRow key={category.id} className="group">
                       <TableCell className="font-medium text-foreground">
                         <div className="flex items-center gap-2">
                           {category.name}
                           {category.subcategories.length > 0 && (
                             <Badge variant="secondary" className="text-xs">
                               {category.subcategories.length} sub
                             </Badge>
                           )}
                           {selectedWebsiteId !== 'all' && (category as any).isAncestorOnly && (
                             <Badge variant="outline" className="text-xs text-muted-foreground">
                               ancestor only
                             </Badge>
                           )}
                         </div>
                       </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          /{category.slug}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddSubcategory(category.id)}
                            className="h-8 px-2"
                            title="Add Subcategory"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
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
                      </TableCell>
                    </TableRow>
                    
                    {/* Subcategory Rows */}
                    {category.subcategories.map((subcat) => (
                      <TableRow key={subcat.id} className="group bg-muted/25">
                         <TableCell className="font-medium text-foreground">
                           <div className="flex items-center gap-2 pl-6">
                             <ChevronRight className="h-4 w-4 text-muted-foreground" />
                             {subcat.name}
                             {selectedWebsiteId !== 'all' && (subcat as any).isAncestorOnly && (
                               <Badge variant="outline" className="text-xs text-muted-foreground">
                                 ancestor only
                               </Badge>
                             )}
                           </div>
                         </TableCell>
                        <TableCell className="text-muted-foreground">
                          {subcat.description || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            /{subcat.slug}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(subcat)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageVisibility(subcat)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Manage Visibility
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCategory(subcat.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No categories found</p>
              <p className="text-sm">
                {searchTerm ? 
                  'No categories match your search. Try a different search term.' : 
                  (selectedWebsiteId === 'all' 
                    ? 'Select a website and create your first category.'
                    : 'Create your first category to organize your products.'
                  )
                }
              </p>
            </div>
          </div>
        )}

        {/* Add Subcategory Dialog */}
        <Dialog open={isAddSubcategoryModalOpen} onOpenChange={setIsAddSubcategoryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subcategory</DialogTitle>
              <DialogDescription>
                Add a subcategory under the selected parent category.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubcategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sub-name">Name *</Label>
                <Input
                  id="sub-name"
                  placeholder="Subcategory name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sub-description">Description</Label>
                <Textarea
                  id="sub-description"
                  placeholder="Subcategory description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <ImageUpload
                label="Category Image (Optional)"
                value={formData.image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                accept="image/*"
                maxSize={5}
              />

              <div className="space-y-2">
                <Label htmlFor="sub-websites">Websites *</Label>
                <div className="space-y-2">
                  {websites.map((website) => (
                    <div key={website.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`sub-website-${website.id}`}
                        checked={formData.website_ids.includes(website.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            website_ids: isChecked 
                              ? [...prev.website_ids, website.id]
                              : prev.website_ids.filter(id => id !== website.id)
                          }));
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`sub-website-${website.id}`} className="text-sm font-normal">
                        {website.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.website_ids.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select at least one website for this subcategory
                  </p>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddSubcategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending ? 'Creating...' : 'Create Subcategory'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information.
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

              <ImageUpload
                label="Category Image (Optional)"
                value={formData.image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                accept="image/*"
                maxSize={5}
              />

              <div className="space-y-2">
                <Label htmlFor="edit-websites">Websites *</Label>
                <div className="space-y-2">
                  {websites.map((website) => (
                    <div key={website.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-website-${website.id}`}
                        checked={formData.website_ids.includes(website.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            website_ids: isChecked 
                              ? [...prev.website_ids, website.id]
                              : prev.website_ids.filter(id => id !== website.id)
                          }));
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-website-${website.id}`} className="text-sm font-normal">
                        {website.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.website_ids.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select at least one website for this category
                  </p>
                )}
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
                      .filter(category => category.id !== editingCategory?.id) // Don't allow self as parent
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
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings,
  FileText,
  Tag,
  Calendar
} from 'lucide-react';
import { usePromptManagement, CreatePromptData, UpdatePromptData, CreateCategoryData, UpdateCategoryData } from '@/hooks/usePromptManagement';
import { Prompt, PromptCategory } from '@/hooks/usePrompts';
import { CategoryManagerDialog } from '@/components/admin/CategoryManagerDialog';
import { PromptEditorDialog } from '@/components/admin/PromptEditorDialog';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';

const AdminPromptManagement: React.FC = () => {
  const { toast } = useToast();
  const {
    prompts,
    categories,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    togglePromptPublished,
    createCategory,
    updateCategory,
    deleteCategory,
    refetchPrompts,
    refetchCategories
  } = usePromptManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<PromptCategory | null>(null);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || prompt.category_id === selectedCategory;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && prompt.is_published) ||
      (statusFilter === 'draft' && !prompt.is_published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreatePrompt = () => {
    setSelectedPrompt(null);
    setIsPromptDialogOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsPromptDialogOpen(true);
  };

  const handleCreateCategory = () => {
    setSelectedCategoryForEdit(null);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: PromptCategory) => {
    setSelectedCategoryForEdit(category);
    setIsCategoryDialogOpen(true);
  };

  const handleSavePrompt = async (data: CreatePromptData | UpdatePromptData): Promise<boolean> => {
    let result;
    if (selectedPrompt) {
      result = await updatePrompt(data as UpdatePromptData);
    } else {
      result = await createPrompt(data as CreatePromptData);
    }
    
    const success = result !== null;
    if (success) {
      setIsPromptDialogOpen(false);
      setSelectedPrompt(null);
    }
    return success;
  };

  const handleSaveCategory = async (data: CreateCategoryData | UpdateCategoryData): Promise<boolean> => {
    let result;
    if (selectedCategoryForEdit) {
      result = await updateCategory(data as UpdateCategoryData);
    } else {
      result = await createCategory(data as CreateCategoryData);
    }
    
    const success = result !== null;
    if (success) {
      setIsCategoryDialogOpen(false);
      setSelectedCategoryForEdit(null);
    }
    return success;
  };

  const handleDeletePrompt = async (id: string) => {
    const success = await deletePrompt(id);
    if (success) {
      setIsPromptDialogOpen(false);
      setSelectedPrompt(null);
    }
    return success;
  };

  const handleDeleteCategory = async (id: string) => {
    const success = await deleteCategory(id);
    if (success) {
      setIsCategoryDialogOpen(false);
      setSelectedCategoryForEdit(null);
    }
    return success;
  };

  const handleTogglePublished = async (prompt: Prompt) => {
    const success = await togglePromptPublished(prompt.id, !prompt.is_published);
    if (success) {
      toast({
        title: "Success",
        description: `Prompt ${!prompt.is_published ? 'published' : 'unpublished'} successfully`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading prompt management...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error loading data: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Prompt Management" 
      description="Manage AI prompt templates and categories"
    >
      <div className="container mx-auto px-4 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prompts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.filter(p => p.is_published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.filter(p => !p.is_published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Categories Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Button onClick={handleCreateCategory} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        
        {categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first category to organize your prompts
              </p>
              <Button onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Slug</th>
                      <th className="text-left p-4 font-medium">Description</th>
                      <th className="text-left p-4 font-medium">Icon</th>
                      <th className="text-left p-4 font-medium">Order</th>
                      <th className="text-left p-4 font-medium">Prompts</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const promptCount = prompts.filter(p => p.category_id === category.id).length;
                      return (
                        <tr key={category.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="p-4">
                            <div className="font-medium">{category.name}</div>
                          </td>
                          <td className="p-4">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {category.slug}
                            </code>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {category.description || 'No description'}
                            </div>
                          </td>
                          <td className="p-4">
                            {category.icon ? (
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {category.icon}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{category.display_order}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              {promptCount} prompt{promptCount !== 1 ? 's' : ''}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prompts Table */}
      <div className="space-y-4 mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Prompts</h2>
          <Button onClick={handleCreatePrompt} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Prompt
          </Button>
        </div>
        
        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first prompt to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPrompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{prompt.title}</CardTitle>
                    {prompt.description && (
                      <CardDescription className="mt-1">
                        {prompt.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={prompt.is_published ? 'default' : 'secondary'}>
                      {prompt.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Switch
                      checked={prompt.is_published}
                      onCheckedChange={() => handleTogglePublished(prompt)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {prompt.category && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <span>{prompt.category.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(prompt.created_at)}</span>
                    </div>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>{prompt.tags.length} tags</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPrompt(prompt)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <PromptEditorDialog
        prompt={selectedPrompt}
        categories={categories}
        isOpen={isPromptDialogOpen}
        onClose={() => {
          setIsPromptDialogOpen(false);
          setSelectedPrompt(null);
        }}
        onSave={handleSavePrompt}
        onDelete={handleDeletePrompt}
      />

      <CategoryManagerDialog
        category={selectedCategoryForEdit}
        isOpen={isCategoryDialogOpen}
        onClose={() => {
          setIsCategoryDialogOpen(false);
          setSelectedCategoryForEdit(null);
        }}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />
      </div>
    </AdminLayout>
  );
};

export default AdminPromptManagement;

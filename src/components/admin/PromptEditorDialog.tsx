import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Prompt, PromptCategory, CreatePromptData, UpdatePromptData } from '@/hooks/usePromptManagement';
import { useToast } from '@/hooks/use-toast';

interface PromptEditorDialogProps {
  prompt: Prompt | null;
  categories: PromptCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePromptData | UpdatePromptData) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export const PromptEditorDialog: React.FC<PromptEditorDialogProps> = ({
  prompt,
  categories,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    tags: [] as string[],
    is_published: false,
    display_order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const isEditing = !!prompt;

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        description: prompt.description || '',
        content: prompt.content,
        category_id: prompt.category_id || 'none',
        tags: prompt.tags || [],
        is_published: prompt.is_published,
        display_order: prompt.display_order,
      });
      setTagsInput((prompt.tags || []).join(', '));
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        category_id: 'none',
        tags: [],
        is_published: false,
        display_order: 0,
      });
      setTagsInput('');
    }
  }, [prompt]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags,
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Prompt title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Prompt content is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isEditing
        ? { 
            id: prompt!.id, 
            ...formData,
            category_id: formData.category_id === 'none' ? null : formData.category_id
          }
        : {
            ...formData,
            category_id: formData.category_id === 'none' ? null : formData.category_id
          };

      const success = await onSave(data);
      
      if (success) {
        toast({
          title: "Success",
          description: `Prompt ${isEditing ? 'updated' : 'created'} successfully`,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} prompt`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!prompt || !onDelete) return;

    setIsSubmitting(true);
    try {
      const success = await onDelete(prompt.id);
      
      if (success) {
        toast({
          title: "Success",
          description: "Prompt deleted successfully",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Prompt' : 'Create Prompt'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the prompt details below.'
                : 'Create a new AI prompt template for your users.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., High-Converting Landing Page"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of what this prompt does..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="e.g., landing page, conversion, sales"
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <div className="border rounded-md">
                  <RichTextEditor
                    content={formData.content}
                    onChange={handleContentChange}
                    placeholder="Enter your prompt content here..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_published">Published</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                    />
                    <Label htmlFor="is_published" className="text-sm">
                      {formData.is_published ? 'Published' : 'Draft'}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Published prompts are visible to users
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <div>
                {isEditing && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{prompt?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

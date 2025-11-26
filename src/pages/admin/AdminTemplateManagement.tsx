import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Image } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TemplateType,
  TEMPLATE_TYPE_OPTIONS,
  TEMPLATE_TYPE_VALUES,
  humanizeTemplateType,
} from '@/constants/templateTypes';

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_type?: TemplateType; // Legacy field
  template_types?: TemplateType[]; // New field
  preview_image: string | null;
  is_published: boolean;
  is_premium: boolean;
  created_at: string;
}

const mapToKnownTemplateTypes = (template: PageTemplate): TemplateType[] => {
  const types = template.template_types?.length
    ? template.template_types
    : template.template_type
      ? [template.template_type]
      : [];

  return types.filter((type): type is TemplateType => TEMPLATE_TYPE_VALUES.includes(type));
};

export default function AdminTemplateManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | TemplateType>('all');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_templates')
        .select('id, name, description, category, template_type, template_types, preview_image, is_published, is_premium, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PageTemplate[];
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('page_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ templateId, isPublished }: { templateId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('page_templates')
        .update({ is_published: !isPublished })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Template updated successfully');
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    if (selectedType !== 'all') {
      const templateTypes = mapToKnownTemplateTypes(template);
      if (!templateTypes.includes(selectedType)) return false;
    }
    return true;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  type TypeFilterOption = { value: 'all' | TemplateType; label: string };
  const typeFilterOptions: TypeFilterOption[] = [
    { value: 'all', label: 'All Types' },
    ...TEMPLATE_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Template Management</h1>
            <p className="text-muted-foreground">
              Manage page templates for websites and funnels
            </p>
          </div>
          <Button onClick={() => navigate('/admin/templates/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium">Category:</span>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">Type:</span>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'all' | TemplateType)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {typeFilterOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {template.preview_image ? (
                  <img 
                    src={template.preview_image} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  {/* Display template types */}
                  {mapToKnownTemplateTypes(template).map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {humanizeTemplateType(type)}
                    </Badge>
                  ))}
                  {template.is_premium && (
                    <Badge className="text-xs bg-gradient-to-r from-primary to-primary/80">
                      Premium
                    </Badge>
                  )}
                  {template.is_published && (
                    <Badge variant="default" className="text-xs">
                      Published
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => navigate(`/admin/templates/edit/${template.id}`)}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={template.is_published ? "secondary" : "default"}
                    onClick={() => togglePublishMutation.mutate({ 
                      templateId: template.id, 
                      isPublished: template.is_published 
                    })}
                  >
                    {template.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="px-2">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{template.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {templates.length === 0 ? 'No templates created yet' : 'No templates match your filters'}
            </div>
            {templates.length === 0 && (
              <Button onClick={() => navigate('/admin/templates/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Template
              </Button>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
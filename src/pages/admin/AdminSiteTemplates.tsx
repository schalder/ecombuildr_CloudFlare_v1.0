import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAdminData } from "@/hooks/useAdminData";

interface SiteTemplate {
  id: string;
  name: string;
  image_url: string;
  demo_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface TemplateFormData {
  name: string;
  image_url: string;
  demo_url: string;
  is_active: boolean;
  sort_order: number;
}

const AdminSiteTemplates = () => {
  const { isAdmin } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SiteTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    image_url: '',
    demo_url: '',
    is_active: true,
    sort_order: 0,
  });

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-site-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_templates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SiteTemplate[];
    },
    enabled: !!isAdmin, // Convert to boolean to ensure it's never undefined
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { error } = await supabase.from('site_templates').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-templates'] });
      queryClient.invalidateQueries({ queryKey: ['site-templates'] });
      toast.success('Template created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      const { error } = await supabase
        .from('site_templates')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-templates'] });
      queryClient.invalidateQueries({ queryKey: ['site-templates'] });
      toast.success('Template updated successfully');
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-templates'] });
      queryClient.invalidateQueries({ queryKey: ['site-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      image_url: '',
      demo_url: '',
      is_active: true,
      sort_order: 0,
    });
  };

  const handleOpenDialog = (template?: SiteTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        image_url: template.image_url,
        demo_url: template.demo_url || '',
        is_active: template.is_active,
        sort_order: template.sort_order,
      });
    } else {
      setEditingTemplate(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.image_url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      demo_url: formData.demo_url.trim() || null,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (!isAdmin) {
    return (
      <AdminLayout title="Access Denied">
        <div className="text-center py-8">
          <p>You don't have permission to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Site Templates" 
      description="Manage marketing site templates"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] md:h-[300px] lg:h-[340px] bg-muted rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate">{template.name}</span>
                    <div className="flex items-center gap-2">
                      {!template.is_active && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        #{template.sort_order}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="h-[240px] md:h-[300px] lg:h-[340px] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {template.demo_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <a
                          href={template.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Demo
                        </a>
                      </Button>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(template)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">No templates found</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Template
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/template-image.jpg"
                  required
                />
              </div>

              <div>
                <Label htmlFor="demo_url">Demo URL (Optional)</Label>
                <Input
                  id="demo_url"
                  value={formData.demo_url}
                  onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                  placeholder="https://example.com/demo"
                />
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
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

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? 'Saving...' 
                    : editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSiteTemplates;
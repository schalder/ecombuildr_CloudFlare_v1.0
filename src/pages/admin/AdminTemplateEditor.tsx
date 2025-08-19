import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';
import { ArrowLeft, Save, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  template_type: 'website_page' | 'funnel_step';
  is_published: boolean;
  is_premium: boolean;
}

const defaultBuilderData: PageBuilderData = {
  sections: [],
  globalStyles: {},
  pageStyles: {}
};

export default function AdminTemplateEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(templateId);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'general',
    template_type: 'website_page',
    is_published: false,
    is_premium: false,
  });

  const [builderData, setBuilderData] = useState<PageBuilderData>(defaultBuilderData);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        template_type: template.template_type as 'website_page' | 'funnel_step',
        is_published: template.is_published,
        is_premium: template.is_premium,
      });
      setBuilderData((template.content as any) || defaultBuilderData);
    }
  }, [template]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { formData: TemplateFormData; content: PageBuilderData; previewImage?: string }) => {
      const templateData = {
        ...data.formData,
        content: data.content as any,
        preview_image: data.previewImage || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('page_templates')
          .update(templateData)
          .eq('id', templateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_templates')
          .insert([templateData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success(`Template ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/admin/templates');
    },
    onError: (error: any) => {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} template: ${error.message}`);
    },
  });

  const generatePreviewImage = async (): Promise<string | null> => {
    try {
      // Find the preview element
      const previewElement = document.querySelector('[data-preview="true"]') as HTMLElement;
      if (!previewElement) return null;

      const canvas = await html2canvas(previewElement, {
        width: 1200,
        height: 675,
        scale: 0.5,
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Failed to generate preview image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push('name');
    if (!formData.category.trim()) missingFields.push('category');
    if (!formData.template_type) missingFields.push('type');

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      setShowSettings(true);
      return;
    }

    setIsSaving(true);
    try {
      const previewImage = await generatePreviewImage();
      await saveTemplateMutation.mutateAsync({
        formData,
        content: builderData,
        previewImage: previewImage || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading template...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout fluid>
      <div className="h-screen bg-background flex flex-col">
        {/* Fixed Header */}
        <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/templates')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {isEditing ? 'Edit Template' : 'Create Template'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Design a reusable template for pages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Page Builder - Viewport Bounded */}
        <div className="flex-1 min-h-0" data-preview="true">
          <ElementorPageBuilder
            initialData={builderData}
            onChange={setBuilderData}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
      {/* Settings Sidebar - Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowSettings(false)} />
          <div className="w-80 bg-background border-l shadow-lg h-full overflow-y-auto">
            <Card className="border-0 shadow-none">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Template Settings</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Template name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Template description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value: 'website_page' | 'funnel_step') => 
                      setFormData({ ...formData, template_type: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website_page">Website Page</SelectItem>
                      <SelectItem value="funnel_step">Funnel Step</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Published</Label>
                  <Switch
                    id="published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="premium">Premium</Label>
                  <Switch
                    id="premium"
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
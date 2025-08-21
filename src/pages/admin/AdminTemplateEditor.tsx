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
import { Checkbox } from '@/components/ui/checkbox';
import { MediaSelector } from '@/components/page-builder/components/MediaSelector';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { ArrowLeft, Save, Eye, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  template_types: ('website_page' | 'funnel_step')[];
  auto_generate_preview: boolean;
  manual_preview_image: string;
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
    template_types: ['website_page'],
    auto_generate_preview: true,
    manual_preview_image: '',
    is_published: false,
    is_premium: false,
  });

  const [builderData, setBuilderData] = useState<PageBuilderData>(defaultBuilderData);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

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
      // Handle legacy template_type or new template_types
      const templateTypes = (template as any).template_types?.length > 0 
        ? (template as any).template_types 
        : [template.template_type];
      
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        template_types: templateTypes,
        auto_generate_preview: (template as any).auto_generate_preview ?? true,
        manual_preview_image: template.preview_image || '',
        is_published: template.is_published,
        is_premium: template.is_premium,
      });
      setBuilderData((template.content as any) || defaultBuilderData);
    }
  }, [template]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { formData: TemplateFormData; content: PageBuilderData; previewImage?: string }) => {
      const { template_types, auto_generate_preview, manual_preview_image, ...otherFormData } = data.formData;
      
      const templateData = {
        ...otherFormData,
        template_types,
        auto_generate_preview,
        // For backward compatibility, set template_type to the first type
        template_type: template_types[0] || 'website_page',
        content: data.content as any,
        preview_image: auto_generate_preview 
          ? (data.previewImage || null)
          : (manual_preview_image || null),
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
      // Removed automatic navigation - user can continue editing
    },
    onError: (error: any) => {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} template: ${error.message}`);
    },
  });

  const uploadImageToSupabase = async (imageBlob: Blob): Promise<string | null> => {
    try {
      const fileName = `template-preview-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(`templates/${fileName}`, imageBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.warn('Failed to upload to storage:', error);
      return null;
    }
  };

  const waitForImagesAndFonts = async (): Promise<void> => {
    // Wait for images to load
    const images = document.querySelectorAll('#template-preview-hidden img');
    const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails to load
        setTimeout(resolve, 3000); // Timeout after 3 seconds
      });
    });

    await Promise.all(imagePromises);

    // Wait a bit for fonts to render
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const generatePreviewImage = async (): Promise<string | null> => {
    try {
      setIsGeneratingThumbnail(true);
      
      // Wait for images and fonts to load
      await waitForImagesAndFonts();

      // Find the hidden preview element
      const previewElement = document.getElementById('template-preview-hidden');
      if (!previewElement) {
        console.warn('Preview element not found');
        return null;
      }

      const canvas = await html2canvas(previewElement, {
        width: 1200,
        height: 675,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });

      // Try to upload to Supabase Storage
      const publicUrl = await uploadImageToSupabase(blob);
      
      if (publicUrl) {
        return publicUrl;
      } else {
        // Fallback to data URL
        return canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.warn('Failed to generate preview image:', error);
      return null;
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleRegenerateThumbnail = async () => {
    const previewImage = await generatePreviewImage();
    if (previewImage) {
      toast.success('Thumbnail generated successfully');
    } else {
      toast.error('Failed to generate thumbnail');
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push('name');
    if (!formData.category.trim()) missingFields.push('category');
    if (!formData.template_types.length) missingFields.push('types');

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      setShowSettings(true);
      return;
    }

    setIsSaving(true);
    try {
      let previewImage = undefined;
      if (formData.auto_generate_preview) {
        previewImage = await generatePreviewImage();
      }
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
            <Button 
              onClick={handleRegenerateThumbnail} 
              disabled={isGeneratingThumbnail}
              variant="outline" 
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGeneratingThumbnail ? 'animate-spin' : ''}`} />
              {isGeneratingThumbnail ? 'Generating...' : 'Regenerate Thumbnail'}
            </Button>
            <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/templates')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Close
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Page Builder - Viewport Bounded */}
        <div className="flex-1 min-h-0">
          {showPreview ? (
            <div className="h-full overflow-auto bg-muted/30 p-6">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 text-sm text-muted-foreground border-b">
                    Template Preview
                  </div>
                  <PageBuilderRenderer data={builderData} />
                </div>
              </div>
            </div>
          ) : (
            <ElementorPageBuilder
              initialData={builderData}
              onChange={setBuilderData}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Hidden Preview for Screenshot Generation */}
        <div 
          id="template-preview-hidden"
          className="fixed -top-[10000px] left-0 bg-white"
          style={{ 
            width: '1200px', 
            height: '675px',
            overflow: 'hidden'
          }}
        >
          <PageBuilderRenderer data={builderData} />
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
                  <Label>Template Types *</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="website_page"
                        checked={formData.template_types.includes('website_page')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              template_types: [...formData.template_types, 'website_page']
                            });
                          } else {
                            setFormData({
                              ...formData,
                              template_types: formData.template_types.filter(t => t !== 'website_page')
                            });
                          }
                        }}
                      />
                      <Label htmlFor="website_page">Website Page</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="funnel_step"
                        checked={formData.template_types.includes('funnel_step')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              template_types: [...formData.template_types, 'funnel_step']
                            });
                          } else {
                            setFormData({
                              ...formData,
                              template_types: formData.template_types.filter(t => t !== 'funnel_step')
                            });
                          }
                        }}
                      />
                      <Label htmlFor="funnel_step">Funnel Step</Label>
                    </div>
                  </div>
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

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="auto_generate">Auto-generate thumbnail</Label>
                    <Switch
                      id="auto_generate"
                      checked={formData.auto_generate_preview}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_generate_preview: checked })}
                    />
                  </div>
                  
                  {!formData.auto_generate_preview && (
                    <div>
                      <Label>Manual Thumbnail</Label>
                      <MediaSelector
                        label="Select thumbnail image"
                        value={formData.manual_preview_image}
                        onChange={(url) => setFormData({ ...formData, manual_preview_image: url })}
                      />
                    </div>
                  )}
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
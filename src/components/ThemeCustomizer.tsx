import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Save, ArrowLeft, Palette, Layout, Settings, ExternalLink } from 'lucide-react';
import { Block } from '@/components/blocks/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';

interface ThemeTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  config: Record<string, any>;
  sections: any[];
  is_premium: boolean;
}

interface ThemeCustomizerProps {
  template: ThemeTemplate;
  storeId: string;
  onBack: () => void;
  onSave: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  template,
  storeId,
  onBack,
  onSave
}) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [customConfig, setCustomConfig] = useState(template.config);
  const [activeTab, setActiveTab] = useState<'design' | 'preview'>('design');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { store: currentStore } = useUserStore();

  useEffect(() => {
    // Convert template sections to blocks
    const templateBlocks: Block[] = template.sections.map((section, index) => ({
      id: `block_${index}`,
      type: section.type,
      content: section.content,
      attributes: {}
    }));
    setBlocks(templateBlocks);
  }, [template]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert blocks back to sections format
      const sections = blocks.map(block => ({
        type: block.type,
        content: block.content
      }));

      // Save or update store customization
      const { error } = await supabase
        .from('store_customizations')
        .upsert({
          store_id: storeId,
          theme_template_id: template.id,
          sections,
          custom_config: customConfig,
          is_active: true
        }, {
          onConflict: 'store_id'
        });

      if (error) throw error;

      toast({
        title: "Theme Saved",
        description: "Your theme customizations have been saved successfully.",
      });

      onSave();
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: "Failed to save theme customizations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  const handlePreview = () => {
    // Open preview in new tab
    const storeSlug = currentStore?.slug;
    if (storeSlug) {
      window.open(`/store/${storeSlug}`, '_blank');
    } else {
      toast({
        title: "Preview Unavailable",
        description: "Please ensure your store has a valid slug to preview changes.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                Customizing: {template.name}
                {template.is_premium && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Premium
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'design' | 'preview')}>
              <TabsList>
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" onClick={handlePreview}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Store
            </Button>
            
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Theme'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'design' | 'preview')}>
          <TabsContent value="design" className="mt-0">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Main Editor */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Page Sections
                    </CardTitle>
                    <CardDescription>
                      Drag and drop sections to customize your homepage layout. Click on any section to edit its content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BlockEditor blocks={blocks} onChange={updateBlocks} />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Theme Colors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Primary</label>
                        <div 
                          className="w-full h-10 rounded border"
                          style={{ backgroundColor: customConfig.colors?.primary }}
                        ></div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Secondary</label>
                        <div 
                          className="w-full h-10 rounded border"
                          style={{ backgroundColor: customConfig.colors?.secondary }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Color customization coming soon. For now, colors are inherited from your store settings.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Theme Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">Sections</div>
                      <div className="text-sm text-muted-foreground">{blocks.length} sections configured</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Typography</div>
                      <div className="text-sm text-muted-foreground">
                        {customConfig.typography?.heading || 'Default'} / {customConfig.typography?.body || 'Default'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Layout Style</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {customConfig.spacing || 'Default'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  This is how your homepage will look to visitors
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <BlockRenderer blocks={blocks} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
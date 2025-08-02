import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Eye, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThemeTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  preview_image?: string;
  config: any;
  sections: any;
  is_premium: boolean;
}

interface ThemeTemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: ThemeTemplate) => void;
  onPreview?: (template: ThemeTemplate) => void;
}

export const ThemeTemplateSelector: React.FC<ThemeTemplateSelectorProps> = ({
  selectedTemplateId,
  onTemplateSelect,
  onPreview
}) => {
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('theme_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching theme templates:', error);
      toast({
        title: "Error",
        description: "Failed to load theme templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded mb-4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getThemePreviewColor = (template: ThemeTemplate) => {
    return template.config?.colors?.primary || '#10B981';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Store Theme</h2>
        <p className="text-muted-foreground">
          Select a professional theme template and customize it to match your brand
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplateId === template.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.is_premium && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                {onPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(template);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Theme Preview */}
              <div className="aspect-video bg-gradient-to-br from-background to-muted rounded-lg border mb-4 overflow-hidden">
                {template.preview_image ? (
                  <img 
                    src={template.preview_image} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col">
                    {/* Mock theme preview based on template type */}
                    {template.slug === 'tech-modern' ? (
                      <div className="h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex flex-col">
                        <div className="h-8 bg-white/90 border-b border-gray-200"></div>
                        <div className="flex-1 p-4 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-24 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded mb-2"></div>
                            <div className="w-32 h-3 bg-gray-300 rounded mb-4"></div>
                            <div className="w-20 h-8 bg-blue-600 rounded"></div>
                          </div>
                        </div>
                        <div className="h-16 bg-gray-50 grid grid-cols-4 gap-2 p-2">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="bg-white rounded shadow-sm"></div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full bg-gradient-to-br from-green-400/10 to-emerald-400/10 flex flex-col">
                        <div className="h-8 bg-white/90 border-b border-green-200"></div>
                        <div className="flex-1 p-4 flex items-center">
                          <div className="flex-1">
                            <div className="w-28 h-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded mb-2"></div>
                            <div className="w-36 h-3 bg-green-300 rounded mb-4"></div>
                            <div className="w-24 h-8 bg-green-600 rounded-full"></div>
                          </div>
                          <div className="w-16 h-16 bg-green-200 rounded-full"></div>
                        </div>
                        <div className="h-12 bg-green-50 flex justify-center items-center gap-4">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 bg-green-200 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Theme Color Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: getThemePreviewColor(template) }}
                  ></div>
                  <span className="text-sm text-muted-foreground">Primary Color</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  {template.sections?.length || 0} sections
                </div>
              </div>

              {selectedTemplateId === template.id && (
                <div className="mt-4 p-3 bg-primary/10 text-primary text-sm rounded-lg text-center font-medium">
                  ✓ Selected Theme
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No theme templates available.</p>
        </div>
      )}
    </div>
  );
};
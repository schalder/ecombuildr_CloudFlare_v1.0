import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Search, Sparkles, Eye } from 'lucide-react';
import { PageBuilderData } from '@/components/page-builder/types';
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
  content: PageBuilderData;
  preview_image: string | null;
  is_premium: boolean;
}

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType: 'website_page' | 'funnel_step';
  onSelectTemplate: (template: PageTemplate | null) => void;
}

export function TemplateSelectionModal({ 
  open, 
  onOpenChange, 
  templateType, 
  onSelectTemplate 
}: TemplateSelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplateType, setSelectedTemplateType] = useState<'all' | TemplateType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<PageTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', templateType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter templates that support the requested type
      const filteredData = (data || []).filter(item => {
        // Check new template_types array first, then fallback to legacy template_type
        const supportedTypes = item.template_types?.length > 0 
          ? item.template_types 
          : (item.template_type ? [item.template_type] : []);
        return supportedTypes.includes(templateType);
      });
      
      return filteredData.map(item => ({
        ...item,
        content: (item.content as any) || { sections: [], globalStyles: {}, pageStyles: {} }
      })) as PageTemplate[];
    },
    enabled: open,
  });

  const filteredTemplates = templates.filter(template => {
    if (selectedTemplateType !== 'all') {
      const templateTypes = template.template_types?.length
        ? template.template_types
        : template.template_type
          ? [template.template_type]
          : [];
      const normalizedTypes = templateTypes.filter((type): type is TemplateType =>
        TEMPLATE_TYPE_VALUES.includes(type)
      );
      if (!normalizedTypes.includes(selectedTemplateType)) {
        return false;
      }
    }
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleSelectTemplate = (template: PageTemplate | null) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  const handleStartFromScratch = () => {
    onSelectTemplate(null);
    onOpenChange(false);
  };

  if (previewTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{previewTemplate.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {previewTemplate.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Back
                </Button>
                <Button onClick={() => handleSelectTemplate(previewTemplate)}>
                  Use This Template
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {previewTemplate.preview_image ? (
                <img 
                  src={previewTemplate.preview_image} 
                  alt={previewTemplate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No preview available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Choose a Template - {templateType === 'website_page' ? 'Website Page' : 'Funnel Step'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-1 gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : 
                       category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTemplateType} onValueChange={(value) => setSelectedTemplateType(value as 'all' | TemplateType)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Template Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {TEMPLATE_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {/* Start from Scratch Option */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
                onClick={handleStartFromScratch}
              >
                <div className="aspect-video bg-muted/50 flex items-center justify-center border-dashed border-2 border-muted-foreground/30 rounded-t-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">Start from Scratch</p>
                    <p className="text-xs text-muted-foreground">Begin with a blank page</p>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium">Blank Template</h3>
                  <p className="text-xs text-muted-foreground">
                    Start with an empty canvas and build your page from scratch
                  </p>
                </div>
              </Card>

              {/* Template Cards */}
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </Card>
                ))
              ) : (
                filteredTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <div 
                      className="aspect-video bg-muted relative group"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      {template.preview_image ? (
                        <img 
                          src={template.preview_image} 
                          alt={template.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" className="gap-2">
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{template.name}</h3>
                        {template.is_premium && (
                          <Badge className="text-xs bg-gradient-to-r from-primary to-primary/80">
                            Premium
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {(template.template_types?.length
                            ? template.template_types
                            : template.template_type
                              ? [template.template_type]
                              : []
                          )
                            .filter((type): type is TemplateType => TEMPLATE_TYPE_VALUES.includes(type))
                            .map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {humanizeTemplateType(type)}
                              </Badge>
                            ))}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {filteredTemplates.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No templates found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleStartFromScratch}
              >
                Start from Scratch Instead
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
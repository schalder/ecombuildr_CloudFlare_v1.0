import React from 'react';
import { 
  Type, 
  Palette, 
  Layout, 
  Monitor,
  Tablet,
  Smartphone,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageUpload } from '@/components/ui/image-upload';
import { 
  EcommerceContentProperties,
  FeaturedProductsContentProperties,
  ProductCategoriesContentProperties,
  PriceContentProperties
} from './EcommerceProperties';

import { PageBuilderElement } from '../types';

interface PropertiesPanelProps {
  selectedElement?: PageBuilderElement | null;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  deviceType,
  onUpdateElement
}) => {
  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Select an element to edit its properties</p>
      </div>
    );
  }

  const handleStyleUpdate = (property: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      styles: {
        ...selectedElement.styles,
        [property]: value
      }
    });
  };

  const handleContentUpdate = (property: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      content: {
        ...selectedElement.content,
        [property]: value
      }
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Element Info */}
        <div>
          <h3 className="font-medium text-sm mb-2">Element Properties</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Type: <span className="capitalize">{selectedElement.type}</span></p>
            <p>ID: {selectedElement.id.slice(-8)}</p>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Content Properties */}
            {selectedElement.type === 'heading' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input
                    value={selectedElement.content.text || ''}
                    onChange={(e) => handleContentUpdate('text', e.target.value)}
                    placeholder="Enter heading text"
                  />
                </div>
                <div>
                  <Label className="text-xs">Heading Level</Label>
                  <Select
                    value={selectedElement.content.level?.toString() || '2'}
                    onValueChange={(value) => handleContentUpdate('level', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">H1</SelectItem>
                      <SelectItem value="2">H2</SelectItem>
                      <SelectItem value="3">H3</SelectItem>
                      <SelectItem value="4">H4</SelectItem>
                      <SelectItem value="5">H5</SelectItem>
                      <SelectItem value="6">H6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedElement.type === 'text' && (
              <div>
                <Label className="text-xs">Text Content</Label>
                <textarea
                  className="w-full h-24 p-2 border border-border rounded text-sm resize-none"
                  value={selectedElement.content.text || ''}
                  onChange={(e) => handleContentUpdate('text', e.target.value)}
                  placeholder="Enter your text content here..."
                />
              </div>
            )}

            {selectedElement.type === 'image' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Image</Label>
                  <ImageUpload
                    value={selectedElement.content.src || ''}
                    onChange={(url) => handleContentUpdate('src', url)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Alt Text</Label>
                  <Input
                    value={selectedElement.content.alt || ''}
                    onChange={(e) => handleContentUpdate('alt', e.target.value)}
                    placeholder="Describe the image"
                  />
                </div>
                <div>
                  <Label className="text-xs">Caption</Label>
                  <Input
                    value={selectedElement.content.caption || ''}
                    onChange={(e) => handleContentUpdate('caption', e.target.value)}
                    placeholder="Image caption (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      value={selectedElement.content.width || ''}
                      onChange={(e) => handleContentUpdate('width', e.target.value)}
                      placeholder="auto"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      value={selectedElement.content.height || ''}
                      onChange={(e) => handleContentUpdate('height', e.target.value)}
                      placeholder="auto"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedElement.type === 'button' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Button Text</Label>
                  <Input
                    value={selectedElement.content.text || ''}
                    onChange={(e) => handleContentUpdate('text', e.target.value)}
                    placeholder="Click here"
                  />
                </div>
                <div>
                  <Label className="text-xs">Link URL</Label>
                  <Input
                    value={selectedElement.content.url || ''}
                    onChange={(e) => handleContentUpdate('url', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">Link Target</Label>
                  <Select
                    value={selectedElement.content.target || '_blank'}
                    onValueChange={(value) => handleContentUpdate('target', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_blank">New Tab</SelectItem>
                      <SelectItem value="_self">Same Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Button Style</Label>
                  <Select
                    value={selectedElement.content.variant || 'default'}
                    onValueChange={(value) => handleContentUpdate('variant', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="destructive">Destructive</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="hero">Hero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Button Size</Label>
                  <Select
                    value={selectedElement.content.size || 'default'}
                    onValueChange={(value) => handleContentUpdate('size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="icon">Icon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedElement.type === 'video' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Video URL</Label>
                  <Input
                    value={selectedElement.content.src || ''}
                    onChange={(e) => handleContentUpdate('src', e.target.value)}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="controls"
                    checked={selectedElement.content.controls !== false}
                    onChange={(e) => handleContentUpdate('controls', e.target.checked)}
                  />
                  <Label htmlFor="controls" className="text-xs">Show controls</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoplay"
                    checked={selectedElement.content.autoplay || false}
                    onChange={(e) => handleContentUpdate('autoplay', e.target.checked)}
                  />
                  <Label htmlFor="autoplay" className="text-xs">Auto play</Label>
                </div>
              </div>
            )}

            {selectedElement.type === 'spacer' && (
              <div>
                <Label className="text-xs">Height</Label>
                <Input
                  value={selectedElement.content.height || '50px'}
                  onChange={(e) => handleContentUpdate('height', e.target.value)}
                  placeholder="50px"
                />
              </div>
            )}

            {selectedElement.type === 'divider' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Style</Label>
                  <Select
                    value={selectedElement.content.style || 'solid'}
                    onValueChange={(value) => handleContentUpdate('style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    value={selectedElement.content.color || '#e5e7eb'}
                    onChange={(e) => handleContentUpdate('color', e.target.value)}
                    className="w-full h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input
                    value={selectedElement.content.width || '100%'}
                    onChange={(e) => handleContentUpdate('width', e.target.value)}
                    placeholder="100%"
                  />
                </div>
              </div>
            )}

            {/* Ecommerce Elements */}
            {selectedElement.type === 'product-grid' && (
              <EcommerceContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'featured-products' && (
              <FeaturedProductsContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'product-categories' && (
              <ProductCategoriesContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'price' && (
              <PriceContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* Typography */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
              
              <div>
                <Label className="text-xs">Font Size</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[parseInt(selectedElement.styles?.fontSize?.replace(/\D/g, '') || '16')]}
                    onValueChange={(value) => handleStyleUpdate('fontSize', `${value[0]}px`)}
                    max={72}
                    min={8}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {selectedElement.styles?.fontSize || '16px'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs">Text Align</Label>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant={selectedElement.styles?.textAlign === 'left' ? 'default' : 'outline'}
                    onClick={() => handleStyleUpdate('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElement.styles?.textAlign === 'center' ? 'default' : 'outline'}
                    onClick={() => handleStyleUpdate('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElement.styles?.textAlign === 'right' ? 'default' : 'outline'}
                    onClick={() => handleStyleUpdate('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Line Height</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[parseFloat(selectedElement.styles?.lineHeight?.toString() || '1.6')]}
                    onValueChange={(value) => handleStyleUpdate('lineHeight', value[0].toString())}
                    max={3}
                    min={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {selectedElement.styles?.lineHeight || '1.6'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement.styles?.color || '#000000'}
                  onChange={(e) => handleStyleUpdate('color', e.target.value)}
                  className="w-full h-10"
                />
              </div>
            </div>

            <Separator />

            {/* Background */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</h4>
              
              <div>
                <Label className="text-xs">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement.styles?.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                  className="w-full h-10"
                />
              </div>
            </div>

            <Separator />

            {/* Spacing */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
              
              <div>
                <Label className="text-xs">Margin</Label>
                <Input
                  value={selectedElement.styles?.margin || ''}
                  onChange={(e) => handleStyleUpdate('margin', e.target.value)}
                  placeholder="e.g., 10px 20px"
                />
              </div>

              <div>
                <Label className="text-xs">Padding</Label>
                <Input
                  value={selectedElement.styles?.padding || ''}
                  onChange={(e) => handleStyleUpdate('padding', e.target.value)}
                  placeholder="e.g., 10px 20px"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Advanced</h4>
              
              <div>
                <Label className="text-xs">Element ID</Label>
                <Input
                  value={selectedElement.content.customId || selectedElement.id}
                  onChange={(e) => handleContentUpdate('customId', e.target.value)}
                  placeholder="my-custom-id"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom ID for CSS targeting and scripting
                </p>
              </div>

              <div>
                <Label className="text-xs">Custom CSS</Label>
                <textarea
                  className="w-full h-20 p-2 border border-border rounded text-sm resize-none font-mono"
                  placeholder="color: red; font-weight: bold; border-radius: 8px;"
                  value={selectedElement.content.customCSS || ''}
                  onChange={(e) => handleContentUpdate('customCSS', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom CSS will override default styles
                </p>
              </div>

              {selectedElement.type === 'button' && (
                <div>
                  <Label className="text-xs">Button States</Label>
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Hover Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.content.hoverColor || '#000000'}
                          onChange={(e) => handleContentUpdate('hoverColor', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Hover Background</Label>
                        <Input
                          type="color"
                          value={selectedElement.content.hoverBackground || '#ffffff'}
                          onChange={(e) => handleContentUpdate('hoverBackground', e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
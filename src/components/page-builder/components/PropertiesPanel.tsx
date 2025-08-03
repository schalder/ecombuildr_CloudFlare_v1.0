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
  AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { PageBuilderElement } from '../types';

interface PropertiesPanelProps {
  selectedElement?: PageBuilderElement;
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
            <p>ID: {selectedElement.id}</p>
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
                  <Label className="text-xs">Tag</Label>
                  <Select
                    value={selectedElement.content.tag || 'h2'}
                    onValueChange={(value) => handleContentUpdate('tag', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h1">H1</SelectItem>
                      <SelectItem value="h2">H2</SelectItem>
                      <SelectItem value="h3">H3</SelectItem>
                      <SelectItem value="h4">H4</SelectItem>
                      <SelectItem value="h5">H5</SelectItem>
                      <SelectItem value="h6">H6</SelectItem>
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
                  <Label className="text-xs">Image URL</Label>
                  <Input
                    value={selectedElement.content.src || ''}
                    onChange={(e) => handleContentUpdate('src', e.target.value)}
                    placeholder="https://example.com/image.jpg"
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
                    value={selectedElement.content.href || ''}
                    onChange={(e) => handleContentUpdate('href', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
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
                    value={[parseInt(selectedElement.styles?.fontSize?.replace('px', '') || '16')]}
                    onValueChange={(value) => handleStyleUpdate('fontSize', `${value[0]}px`)}
                    max={72}
                    min={8}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10">
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
                <Label className="text-xs">Custom CSS Class</Label>
                <Input
                  placeholder="custom-class"
                />
              </div>

              <div>
                <Label className="text-xs">Element ID</Label>
                <Input
                  placeholder="unique-id"
                />
              </div>

              <div>
                <Label className="text-xs">Custom CSS</Label>
                <textarea
                  className="w-full h-20 p-2 border border-border rounded text-sm resize-none font-mono"
                  placeholder="color: red; font-weight: bold;"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
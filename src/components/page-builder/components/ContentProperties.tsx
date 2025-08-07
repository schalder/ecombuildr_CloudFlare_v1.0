import React from 'react';
import { Plus, Trash2, Star, Upload, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { PageBuilderElement } from '../types';
import { ImageContentProperties } from './ImageContentProperties';
import { VideoContentProperties } from './VideoContentProperties';

interface ContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  // Image element content
  if (element.type === 'image') {
    return <ImageContentProperties element={element} onUpdate={onUpdate} />;
  }

  // Heading element content
  if (element.type === 'heading') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="heading-text">Heading Text</Label>
          <Input
            id="heading-text"
            value={element.content.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="Enter heading text..."
          />
        </div>
        <div>
          <Label htmlFor="heading-level">Heading Level</Label>
          <Select
            value={element.content.level?.toString() || '2'}
            onValueChange={(value) => onUpdate('level', parseInt(value))}
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
    );
  }

  // Paragraph/Text element content
  if (element.type === 'text') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="text-content">Text Content</Label>
          <Textarea
            id="text-content"
            value={element.content.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="Enter your text content..."
            className="min-h-[100px]"
          />
        </div>
      </div>
    );
  }

  // Button element content
  if (element.type === 'button') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="button-text">Button Text</Label>
          <Input
            id="button-text"
            value={element.content.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="Button text..."
          />
        </div>
        <div>
          <Label htmlFor="button-url">Button URL</Label>
          <Input
            id="button-url"
            value={element.content.url || ''}
            onChange={(e) => onUpdate('url', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label htmlFor="button-variant">Button Style</Label>
          <Select
            value={element.content.variant || 'default'}
            onValueChange={(value) => onUpdate('variant', value)}
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
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="button-size">Button Size</Label>
          <Select
            value={element.content.size || 'default'}
            onValueChange={(value) => onUpdate('size', value)}
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
        <div>
          <Label htmlFor="button-target">Link Target</Label>
          <Select
            value={element.content.target || '_blank'}
            onValueChange={(value) => onUpdate('target', value)}
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
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="button-full-width"
            checked={element.content.fullWidth || false}
            onChange={(e) => onUpdate('fullWidth', e.target.checked)}
          />
          <Label htmlFor="button-full-width">Full Width (Legacy - use Style tab)</Label>
        </div>
      </div>
    );
  }

  // Video element content
  if (element.type === 'video') {
    return <VideoContentProperties element={element} onUpdate={onUpdate} />;
  }

  // Spacer element content
  if (element.type === 'spacer') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="spacer-height">Height</Label>
          <Input
            id="spacer-height"
            value={element.content.height || '50px'}
            onChange={(e) => onUpdate('height', e.target.value)}
            placeholder="50px"
          />
        </div>
      </div>
    );
  }

  // Divider element content
  if (element.type === 'divider') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="divider-style">Style</Label>
          <Select
            value={element.content.style || 'solid'}
            onValueChange={(value) => onUpdate('style', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
              <SelectItem value="double">Double</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="divider-color">Color</Label>
          <Input
            id="divider-color"
            type="color"
            value={element.content.color || '#e5e7eb'}
            onChange={(e) => onUpdate('color', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="divider-width">Width</Label>
          <Input
            id="divider-width"
            value={element.content.width || '100%'}
            onChange={(e) => onUpdate('width', e.target.value)}
            placeholder="100%"
          />
        </div>
      </div>
    );
  }

  // List element content
  if (element.type === 'list') {
    const items = element.content.items || [];
    
    const addItem = () => {
      const newItems = [...items, `List item ${items.length + 1}`];
      onUpdate('items', newItems);
    };

    const removeItem = (index: number) => {
      const newItems = items.filter((_: any, i: number) => i !== index);
      onUpdate('items', newItems);
    };

    const updateItem = (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      onUpdate('items', newItems);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="list-ordered"
            checked={element.content.ordered || false}
            onChange={(e) => onUpdate('ordered', e.target.checked)}
          />
          <Label htmlFor="list-ordered" className="text-sm">Numbered list</Label>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">List Items</Label>
            <Button size="sm" onClick={addItem} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </div>
          
          {items.map((item: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeItem(index)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No items. Click "Add Item" to get started.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="text-center text-muted-foreground text-sm py-4">
      No content properties available for this element type.
    </div>
  );
};

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
    const rawItems = element.content.items || [];

    const setStyle = (value: 'bullets' | 'numbers' | 'icons') => {
      onUpdate('style', value);
      if (value === 'numbers') onUpdate('ordered', true);
      if (value !== 'numbers') onUpdate('ordered', false);
    };

    const addItem = () => {
      const newItems = [...rawItems, `List item ${rawItems.length + 1}`];
      onUpdate('items', newItems);
    };

    const removeItem = (index: number) => {
      const newItems = rawItems.filter((_: any, i: number) => i !== index);
      onUpdate('items', newItems);
    };

    const updateItemText = (index: number, value: string) => {
      const newItems = [...rawItems];
      if (typeof newItems[index] === 'string') newItems[index] = value;
      else newItems[index] = { ...(newItems[index] || {}), text: value };
      onUpdate('items', newItems);
    };

    const updateItemIcon = (index: number, icon: string) => {
      const newItems = [...rawItems];
      if (typeof newItems[index] === 'string') newItems[index] = { text: newItems[index], icon };
      else newItems[index] = { ...(newItems[index] || {}), icon };
      onUpdate('items', newItems);
    };

    const style = element.content.style || (element.content.ordered ? 'numbers' : 'bullets');

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="list-style">List Style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullets">Bullets</SelectItem>
              <SelectItem value="numbers">Numbers</SelectItem>
              <SelectItem value="icons">Icons</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="list-ordered"
            checked={(style === 'numbers') || (element.content.ordered || false)}
            onChange={(e) => setStyle(e.target.checked ? 'numbers' : 'bullets')}
          />
          <Label htmlFor="list-ordered" className="text-sm">Numbered list (legacy)</Label>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">List Items</Label>
            <Button size="sm" onClick={addItem} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2 mt-2">
            {rawItems.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={typeof item === 'string' ? item : (item.text || '')}
                  onChange={(e) => updateItemText(index, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                />
                {style === 'icons' && (
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-32"
                      value={typeof item === 'object' ? (item.icon || '') : ''}
                      onChange={(e) => updateItemIcon(index, e.target.value)}
                      placeholder="fa icon"
                    />
                    <div className="w-8 text-center">
                      <i className={`fa-solid fa-${typeof item === 'object' ? (item.icon || 'check') : 'check'}`}></i>
                    </div>
                  </div>
                )}
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

            {rawItems.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-4">
                No items. Click "Add Item" to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Navigation Menu element content
  if (element.type === 'navigation-menu') {
    type MenuItem = { id: string; label: string; type?: 'url' | 'page'; url?: string; pagePath?: string; children?: MenuItem[] };
    const items: MenuItem[] = element.content.items || [];

    const addRootItem = () => {
      const next: MenuItem[] = [...items, { id: `mi-${Date.now()}`, label: 'Menu Item', type: 'url', url: '#', children: [] }];
      onUpdate('items', next);
    };

    const updateRootItem = (idx: number, updates: Partial<MenuItem>) => {
      const next = [...items];
      next[idx] = { ...next[idx], ...updates };
      onUpdate('items', next);
    };

    const removeRootItem = (idx: number) => {
      const next = items.filter((_, i) => i !== idx);
      onUpdate('items', next);
    };

    const addChild = (idx: number) => {
      const next = [...items];
      const children = next[idx].children || [];
      next[idx] = { ...next[idx], children: [...children, { id: `mi-${Date.now()}`, label: 'Sub Item', type: 'url', url: '#', children: [] }] };
      onUpdate('items', next);
    };

    const updateChild = (parentIdx: number, childIdx: number, updates: Partial<MenuItem>) => {
      const next = [...items];
      const children = next[parentIdx].children || [];
      children[childIdx] = { ...children[childIdx], ...updates };
      next[parentIdx] = { ...next[parentIdx], children: [...children] };
      onUpdate('items', next);
    };

    const removeChild = (parentIdx: number, childIdx: number) => {
      const next = [...items];
      const children = (next[parentIdx].children || []).filter((_, i) => i !== childIdx);
      next[parentIdx] = { ...next[parentIdx], children };
      onUpdate('items', next);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Logo</Label>
          <ImageUpload value={element.content.logoUrl || ''} onChange={(url) => onUpdate('logoUrl', url)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Menu Items</Label>
            <p className="text-xs text-muted-foreground">Add items and optional sub items (one level)</p>
          </div>
          <Button size="sm" onClick={addRootItem} className="h-7">
            <Plus className="h-3 w-3 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="border rounded-md p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input value={item.label} onChange={(e) => updateRootItem(idx, { label: e.target.value })} placeholder="Label" />
                <Select value={item.type || 'url'} onValueChange={(v) => updateRootItem(idx, { type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">Custom URL</SelectItem>
                    <SelectItem value="page">Page path</SelectItem>
                  </SelectContent>
                </Select>
                { (item.type || 'url') === 'url' ? (
                  <Input className="col-span-2" value={item.url || ''} onChange={(e) => updateRootItem(idx, { url: e.target.value })} placeholder="https:// or /path" />
                ) : (
                  <Input className="col-span-2" value={item.pagePath || ''} onChange={(e) => updateRootItem(idx, { pagePath: e.target.value })} placeholder="/page-slug" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => addChild(idx)}>Add Subitem</Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeRootItem(idx)}>Delete</Button>
              </div>

              {item.children && item.children.length > 0 && (
                <div className="mt-2 pl-3 border-l space-y-2">
                  {item.children.map((child, cIdx) => (
                    <div key={child.id} className="grid grid-cols-2 gap-2 items-center">
                      <Input value={child.label} onChange={(e) => updateChild(idx, cIdx, { label: e.target.value })} placeholder="Sub label" />
                      <Select value={child.type || 'url'} onValueChange={(v) => updateChild(idx, cIdx, { type: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="url">Custom URL</SelectItem>
                          <SelectItem value="page">Page path</SelectItem>
                        </SelectContent>
                      </Select>
                      { (child.type || 'url') === 'url' ? (
                        <Input className="col-span-2" value={child.url || ''} onChange={(e) => updateChild(idx, cIdx, { url: e.target.value })} placeholder="https:// or /path" />
                      ) : (
                        <Input className="col-span-2" value={child.pagePath || ''} onChange={(e) => updateChild(idx, cIdx, { pagePath: e.target.value })} placeholder="/page-slug" />
                      )}
                      <div className="col-span-2 flex items-center justify-end">
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeChild(idx, cIdx)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No menu items yet. Click "Add Item" to create one.
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

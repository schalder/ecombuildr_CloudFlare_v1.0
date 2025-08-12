import React from 'react';
import { Plus, Trash2, Star, Upload, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MediaSelector } from './MediaSelector';
import { PageBuilderElement } from '../types';
import { ImageContentProperties } from './ImageContentProperties';
import { VideoContentProperties } from './VideoContentProperties';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconPicker } from '@/components/ui/icon-picker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS_MAP } from '@/components/icons/fontawesome-list';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { websiteId } = useParams();
  const [pages, setPages] = React.useState<Array<{ id: string; title: string; slug: string; is_homepage?: boolean }>>([]);
  const [sectionOptions, setSectionOptions] = React.useState<Array<{ id: string; label: string }>>([]);

  React.useEffect(() => {
    if (element.type === 'button' && websiteId) {
      supabase
        .from('website_pages')
        .select('id,title,slug,is_homepage')
        .eq('website_id', websiteId)
        .order('is_homepage', { ascending: false })
        .order('created_at', { ascending: false })
        .then(({ data }) => setPages((data as any) || []));
    }
  }, [element.type, websiteId]);

  React.useEffect(() => {
    if (element.type === 'button') {
      const scan = () => {
        const nodes = Array.from(document.querySelectorAll(
          '[data-pb-section-id],[data-pb-row-id],[data-pb-column-id],[data-pb-element-id]'
        )) as HTMLElement[];
        const opts = nodes.map((node) => {
          let type = 'Section';
          if (node.hasAttribute('data-pb-row-id')) type = 'Row';
          else if (node.hasAttribute('data-pb-column-id')) type = 'Column';
          else if (node.hasAttribute('data-pb-element-id')) type = 'Element';
          return {
            id: node.id,
            label: `${type}: #${node.id}`,
          };
        }).filter(o => o.id);
        setSectionOptions(opts);
      };
      scan();
      const observer = new MutationObserver(() => scan());
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [element.type]);
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
    const linkType = element.content.linkType || (element.content.url ? 'url' : 'page');
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
          <Label>Link to</Label>
          <Select
            value={linkType}
            onValueChange={(value) => onUpdate('linkType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">Page</SelectItem>
              <SelectItem value="url">Custom URL</SelectItem>
              <SelectItem value="scroll">Scroll to section</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {linkType === 'page' && (
          <div>
            <Label htmlFor="button-page">Select Page</Label>
            <Select
              value={element.content.pageSlug || pages.find(p=>p.is_homepage)?.slug || ''}
              onValueChange={(value) => onUpdate('pageSlug', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map(p => (
                  <SelectItem key={p.id} value={p.slug}>{p.title || p.slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {linkType === 'url' && (
          <div>
            <Label htmlFor="button-url">Custom URL</Label>
            <Input
              id="button-url"
              value={element.content.url || ''}
              onChange={(e) => onUpdate('url', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        )}

        {linkType === 'scroll' && (
          <div>
            <Label htmlFor="button-scroll">Scroll Target</Label>
            <Select
              value={element.content.scrollTarget || ''}
              onValueChange={(value) => onUpdate('scrollTarget', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a section on this page" />
              </SelectTrigger>
              <SelectContent>
                {sectionOptions.map(opt => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Select a section to scroll to on click.</p>
          </div>
        )}

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
              <SelectItem value="xl">Extra Large</SelectItem>
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
      // Single-source of truth: use only `content.style` to avoid overwrite races
      onUpdate('style', value);
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
    const defaultIconName: string = element.content.defaultIcon || 'check';

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
            checked={style === 'numbers'}
            onChange={(e) => setStyle(e.target.checked ? 'numbers' : 'bullets')}
          />
          <Label htmlFor="list-ordered" className="text-sm">Numbered list (legacy)</Label>
        </div>

        {style === 'icons' && (
          <div>
            <IconPicker
              label="Default Icon"
              value={defaultIconName}
              onChange={(name) => onUpdate('defaultIcon', name)}
            />
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">List Items</Label>
            <Button size="sm" onClick={addItem} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2 mt-2">
            {rawItems.map((item: any, index: number) => {
              const iconName = typeof item === 'object' ? (item.icon || defaultIconName) : defaultIconName;
              const faIcon = ICONS_MAP[iconName];
              return (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={typeof item === 'string' ? item : (item.text || '')}
                    onChange={(e) => updateItemText(index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                  />
                  {style === 'icons' && (
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <span className="mr-2">Icon</span>
                            {faIcon ? <FontAwesomeIcon icon={faIcon} /> : null}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[360px]">
                          <IconPicker
                            value={iconName}
                            onChange={(name) => updateItemIcon(index, name)}
                          />
                        </PopoverContent>
                      </Popover>
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
              );
            })}

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
          <MediaSelector
            value={element.content.logoUrl || ''}
            onChange={(url) => onUpdate('logoUrl', url)}
            label="Logo image"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nav-link-color">Menu Item Color</Label>
            <Input
              id="nav-link-color"
              type="color"
              value={element.content.linkColor || '#333333'}
              onChange={(e) => onUpdate('linkColor', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="nav-link-hover-color">Hover Color</Label>
            <Input
              id="nav-link-hover-color"
              type="color"
              value={element.content.linkHoverColor || '#111111'}
              onChange={(e) => onUpdate('linkHoverColor', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="submenu-hover-bg">Submenu Hover Background</Label>
          <Input
            id="submenu-hover-bg"
            type="color"
            value={element.content.submenuHoverBgColor || '#f5f5f5'}
            onChange={(e) => onUpdate('submenuHoverBgColor', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hamburger-icon-color">Hamburger Icon Color</Label>
            <Input
              id="hamburger-icon-color"
              type="color"
              value={element.content.hamburgerIconColor || element.content.linkColor || '#333333'}
              onChange={(e) => onUpdate('hamburgerIconColor', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="hamburger-icon-hover-color">Hamburger Hover Color</Label>
            <Input
              id="hamburger-icon-hover-color"
              type="color"
              value={element.content.hamburgerIconHoverColor || element.content.linkHoverColor || '#111111'}
              onChange={(e) => onUpdate('hamburgerIconHoverColor', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="nav-gap">Menu Item Gap (px)</Label>
          <Input
            id="nav-gap"
            type="number"
            min={0}
            value={element.content.menuGap ?? 24}
            onChange={(e) => onUpdate('menuGap', Number(e.target.value))}
          />
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            id="nav-show-cart"
            checked={!!element.content.showCart}
            onChange={(e) => onUpdate('showCart', e.target.checked)}
          />
          <Label htmlFor="nav-show-cart" className="text-sm">Show Cart Icon</Label>
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

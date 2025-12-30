import React from 'react';
import { Plus, Trash2, Star, Upload, GripVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MediaSelector } from './MediaSelector';
import { PageBuilderElement, ElementVisibility } from '../types';
import { ImageContentProperties } from './ImageContentProperties';
import { VideoContentProperties } from './VideoContentProperties';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconPicker } from '@/components/ui/icon-picker';
import { getIconByName } from '@/components/icons/icon-sources';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ColorPicker } from '@/components/ui/color-picker';
import { VisibilityControl } from './VisibilityControl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { websiteId, funnelId } = useParams();
  const [pages, setPages] = React.useState<Array<{ id: string; title: string; slug: string; is_homepage?: boolean }>>([]);
  const [funnelSteps, setFunnelSteps] = React.useState<Array<{ id: string; title: string; slug: string; step_order: number }>>([]);
  const [sectionOptions, setSectionOptions] = React.useState<Array<{ id: string; label: string }>>([]);
  const [scrollSearch, setScrollSearch] = React.useState('');
  const [dividerDevice, setDividerDevice] = React.useState<'desktop' | 'mobile'>('desktop');

  // Default visibility settings
  const defaultVisibility: ElementVisibility = {
    desktop: true,
    tablet: true,
    mobile: true
  };

  const currentVisibility = element.visibility || defaultVisibility;

  const handleVisibilityChange = (visibility: ElementVisibility) => {
    onUpdate('visibility', visibility);
  };

  // Fetch website pages when in website context
  React.useEffect(() => {
    if (element.type === 'button' && websiteId && !funnelId) {
      supabase
        .from('website_pages')
        .select('id,title,slug,is_homepage')
        .eq('website_id', websiteId)
        .order('is_homepage', { ascending: false })
        .order('created_at', { ascending: false })
        .then(({ data }) => setPages((data as any) || []));
    }
  }, [element.type, websiteId, funnelId]);

  // Fetch funnel steps when in funnel context
  React.useEffect(() => {
    if (element.type === 'button' && funnelId) {
      supabase
        .from('funnel_steps')
        .select('id,title,slug,step_order')
        .eq('funnel_id', funnelId)
        .order('step_order', { ascending: true })
        .then(({ data }) => setFunnelSteps((data as any) || []));
    }
  }, [element.type, funnelId]);

  React.useEffect(() => {
    if (element.type === 'button') {
      const scan = () => {
        const nodes = Array.from(document.querySelectorAll(
          '[data-pb-section-id],[data-pb-row-id],[data-pb-column-id],[data-pb-element-id]'
        )) as HTMLElement[];
        const optsMap = new Map<string, { id: string; label: string }>();
        nodes.forEach((node) => {
          const id = node.id || node.getAttribute('id') || '';
          if (!id || /^pb-/.test(id)) return;
          let type = 'Section';
          if (node.hasAttribute('data-pb-row-id')) type = 'Row';
          else if (node.hasAttribute('data-pb-column-id')) type = 'Column';
          else if (node.hasAttribute('data-pb-element-id')) type = 'Element';
          const label = `${type}: #${id}`;
          optsMap.set(id, { id, label });
        });
        setSectionOptions(Array.from(optsMap.values()));
      };
      
      // Initial scan only - disable MutationObserver to prevent performance issues
      scan();
      
      // TODO: Re-enable MutationObserver with proper debouncing if needed
      // const observer = new MutationObserver(() => {
      //   setTimeout(scan, 100);
      // });
      // const pageBuilderContainer = document.querySelector('[data-page-builder]') || document.body;
      // observer.observe(pageBuilderContainer, { 
      //   childList: true, 
      //   subtree: true, 
      //   attributes: true, 
      //   attributeFilter: ['id'] 
      // });
      // return () => observer.disconnect();
    }
  }, [element.type]);

  // Universal visibility control component
  const VisibilitySection = () => (
    <VisibilityControl
      visibility={currentVisibility}
      onVisibilityChange={handleVisibilityChange}
    />
  );

  // Image element content
  if (element.type === 'image') {
    return (
      <div className="space-y-4">
        <VisibilitySection />
        <ImageContentProperties element={element} onUpdate={onUpdate} />
      </div>
    );
  }

  // Heading element content
  if (element.type === 'heading') {
    return (
      <div className="space-y-4">
        <VisibilitySection />
        <div>
          <Label htmlFor="heading-text">Heading Text</Label>
          <Textarea
            id="heading-text"
            value={element.content.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="Enter heading text..."
            className="min-h-[100px] resize-y"
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
        <VisibilitySection />
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
        <VisibilitySection />
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
          <Label htmlFor="button-subtext">Subtext (Optional)</Label>
          <Input
            id="button-subtext"
            value={element.content.subtext || ''}
            onChange={(e) => onUpdate('subtext', e.target.value)}
            placeholder="Add subtext below button..."
          />
        </div>

        {element.content.subtext && (
          <div>
            <Label>Subtext Position</Label>
            <Select
              value={element.content.subtextPosition || 'below'}
              onValueChange={(value) => onUpdate('subtextPosition', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below">Below Main Text</SelectItem>
                <SelectItem value="above">Above Main Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
            <Label htmlFor="button-page">
              {funnelId ? 'Select Funnel Step' : 'Select Page'}
            </Label>
            <Select
              value={element.content.pageSlug || (funnelId ? funnelSteps[0]?.slug : pages.find(p=>p.is_homepage)?.slug) || ''}
              onValueChange={(value) => onUpdate('pageSlug', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={funnelId ? "Choose a funnel step" : "Choose a page"} />
              </SelectTrigger>
              <SelectContent>
                {funnelId ? (
                  funnelSteps.map(step => (
                    <SelectItem key={step.id} value={step.slug}>
                      Step {step.step_order}: {step.title || step.slug}
                    </SelectItem>
                  ))
                ) : (
                  pages.map(p => (
                    <SelectItem key={p.id} value={p.slug}>{p.title || p.slug}</SelectItem>
                  ))
                )}
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
            <Input
              placeholder="Search targets..."
              value={scrollSearch}
              onChange={(e) => setScrollSearch(e.target.value)}
              className="mb-2"
            />
            <Select
              value={element.content.scrollTarget ? `#${element.content.scrollTarget.replace(/^#/, '')}` : ''}
              onValueChange={(value) => onUpdate('scrollTarget', value.replace(/^#/, ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a target on this page" />
              </SelectTrigger>
              <SelectContent>
                {sectionOptions
                  .filter(opt => opt.label.toLowerCase().includes(scrollSearch.toLowerCase()))
                  .map(opt => (
                    <SelectItem key={opt.id} value={`#${opt.id}`}>{opt.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Select a target. Value saved without the #.</p>
          </div>
        )}

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
    return (
      <div className="space-y-4">
        <VisibilitySection />
        <VideoContentProperties element={element} onUpdate={onUpdate} />
      </div>
    );
  }

  // Spacer element content
  if (element.type === 'spacer') {
    // Handle both numeric and string height values
    const currentHeight = element.content.height;
    const heightValue = typeof currentHeight === 'number' ? currentHeight : parseInt(String(currentHeight || '50px').replace('px', '')) || 50;
    
    return (
      <div className="space-y-4">
        <VisibilitySection />
        <div>
          <Label htmlFor="spacer-height">Height</Label>
          <div className="space-y-2">
            <Slider
              value={[heightValue]}
              onValueChange={([value]) => onUpdate('height', value)}
              min={0}
              max={500}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {heightValue}px
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Divider element content
  if (element.type === 'divider') {
    
    return (
      <div className="space-y-4">
        <VisibilitySection />
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
        
        <ColorPicker
          color={element.content.color || '#e5e7eb'}
          onChange={(color) => onUpdate('color', color)}
          label="Color"
        />
        
        <div>
          <Label>Thickness: {element.content.thickness || 1}px</Label>
          <Slider
            value={[element.content.thickness || 1]}
            onValueChange={([value]) => onUpdate('thickness', value)}
            min={1}
            max={20}
            step={1}
            className="mt-2"
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

        {/* Device Selector */}
        <div className="space-y-2">
          <Label>Device</Label>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={dividerDevice === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDividerDevice('desktop')}
              className="flex-1"
            >
              Desktop
            </Button>
            <Button
              variant={dividerDevice === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDividerDevice('mobile')}
              className="flex-1"
            >
              Mobile
            </Button>
          </div>
        </div>

        {/* Alignment Options */}
        <div>
          <Label>Alignment</Label>
          <Select
            value={element.content.responsive?.[dividerDevice]?.alignment || 'center'}
            onValueChange={(value) => {
              const currentResponsive = element.content.responsive || {};
              const currentDevice = currentResponsive[dividerDevice] || {};
              onUpdate('responsive', {
                ...currentResponsive,
                [dividerDevice]: {
                  ...currentDevice,
                  alignment: value
                }
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
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
        <VisibilitySection />
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
              const IconComponent = getIconByName(iconName);
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
                            {IconComponent ? <IconComponent className="h-4 w-4" /> : null}
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

    // State for collapsible sections
    const [logoOpen, setLogoOpen] = React.useState(true);
    const [colorsOpen, setColorsOpen] = React.useState(true);
    const [settingsOpen, setSettingsOpen] = React.useState(true);
    const [menuItemsOpen, setMenuItemsOpen] = React.useState(true);
    const [itemOpenStates, setItemOpenStates] = React.useState<Record<string, boolean>>({});

    const toggleItem = (itemId: string) => {
      setItemOpenStates(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

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
        <VisibilitySection />
        
        {/* Logo Section */}
        <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Logo</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${logoOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <MediaSelector
              value={element.content.logoUrl || ''}
              onChange={(url) => onUpdate('logoUrl', url)}
              label="Logo image"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Colors Section */}
        <Collapsible open={colorsOpen} onOpenChange={setColorsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colors</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${colorsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Settings Section */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settings</h4>
            <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="nav-show-cart"
                checked={!!element.content.showCart}
                onChange={(e) => onUpdate('showCart', e.target.checked)}
              />
              <Label htmlFor="nav-show-cart" className="text-sm">Show Cart Icon</Label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Menu Items Section */}
        <Collapsible open={menuItemsOpen} onOpenChange={setMenuItemsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Menu Items</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Add items and optional sub items (one level)</p>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${menuItemsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex justify-end">
              <Button size="sm" onClick={addRootItem} className="h-7">
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const isItemOpen = itemOpenStates[item.id] !== false; // Default to true
                return (
                  <Collapsible key={item.id} open={isItemOpen} onOpenChange={() => toggleItem(item.id)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded border">
                      <span className="text-sm font-medium">{item.label || `Menu Item ${idx + 1}`}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isItemOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2 border border-t-0 rounded-b-md p-3">
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
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {items.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No menu items yet. Click "Add Item" to create one.
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="space-y-4">
      <VisibilitySection />
      <div className="text-center text-muted-foreground text-sm py-4">
        No content properties available for this element type.
      </div>
    </div>
  );
};

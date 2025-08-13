import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ColorPicker } from '@/components/ui/color-picker';
import { MediaSelector } from '@/components/page-builder/components/MediaSelector';

interface Website {
  id: string;
  settings?: any;
  name: string;
}

interface WebsitePageLite {
  id: string;
  title: string;
  slug: string;
  is_homepage: boolean;
}

export type HeaderNavItem = {
  id: string;
  label: string;
  type: 'page' | 'custom';
  page_slug?: string;
  url?: string;
  new_tab?: boolean;
};

export interface GlobalHeaderConfig {
  enabled: boolean;
  logo_url?: string;
  nav_items: HeaderNavItem[];
  show_search: boolean;
  show_cart: boolean;
  sticky: boolean;
  font_size?: string;
  style?: {
    bg_color?: string;
    text_color?: string;
    hover_color?: string;
    hamburger_color?: string;
  };
}

interface Props {
  website: Website;
}

export const WebsiteHeaderBuilder: React.FC<Props> = ({ website }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<WebsitePageLite[]>([]);
  const initial: GlobalHeaderConfig = useMemo(() => {
    const cfg = (website.settings?.global_header as GlobalHeaderConfig | undefined);
    return cfg ?? {
      enabled: true,
      logo_url: '',
      nav_items: [],
      show_search: true,
      show_cart: true,
      sticky: true,
      font_size: 'medium',
      style: {
        bg_color: '',
        text_color: '',
        hover_color: '',
        hamburger_color: '',
      },
    };
  }, [website.settings]);

  const [config, setConfig] = useState<GlobalHeaderConfig>(initial);

  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('website_pages')
        .select('id,title,slug,is_homepage')
        .eq('website_id', website.id)
        .order('is_homepage', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error && data) setPages(data as WebsitePageLite[]);
    };
    fetchPages();
  }, [website.id]);

  const setField = (patch: Partial<GlobalHeaderConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const addMenuItem = () => {
    setConfig(prev => ({
      ...prev,
      nav_items: [
        ...prev.nav_items,
        { id: Math.random().toString(36).slice(2), label: 'Menu', type: 'page', page_slug: pages.find(p=>p.is_homepage)?.slug || '' }
      ]
    }));
  };

  const removeMenuItem = (id: string) => setConfig(prev => ({ ...prev, nav_items: prev.nav_items.filter(i => i.id !== id) }));

  const moveItem = (index: number, dir: -1 | 1) => {
    setConfig(prev => {
      const items = [...prev.nav_items];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return { ...prev, nav_items: items };
    });
  };

  const loadPreset = () => {
    const home = pages.find(p => p.is_homepage);
    const about = pages.find(p => p.slug === 'about');
    const contact = pages.find(p => p.slug === 'contact');
    setConfig(prev => ({
      ...prev,
      enabled: true,
      nav_items: [
        home && { id: 'home', label: 'Home', type: 'page', page_slug: home.slug },
        about && { id: 'about', label: 'About', type: 'page', page_slug: 'about' },
        contact && { id: 'contact', label: 'Contact', type: 'page', page_slug: 'contact' },
      ].filter(Boolean) as HeaderNavItem[]
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(website.settings || {}), global_header: config };
      const { error } = await supabase.from('websites').update({ settings: newSettings }).eq('id', website.id);
      if (error) throw error;
      toast({ title: 'Header saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save header settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Header</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Enable Global Header</Label>
              <p className="text-xs text-muted-foreground">When enabled, this header appears on all pages of this website.</p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => setField({ enabled: v })} />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <MediaSelector label="Logo" value={config.logo_url} onChange={(url) => setField({ logo_url: url })} />
            </div>

            <div className="space-y-4">
              <Label>Typography & Behavior</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Font Size</Label>
                  <Select value={config.font_size || 'medium'} onValueChange={(v) => setField({ font_size: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sticky header</span>
                  <Switch checked={config.sticky} onCheckedChange={(v)=>setField({ sticky: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show search</span>
                  <Switch checked={config.show_search} onCheckedChange={(v)=>setField({ show_search: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show cart</span>
                  <Switch checked={config.show_cart} onCheckedChange={(v)=>setField({ show_cart: v })} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Navigation Menu</Label>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={loadPreset}>Use default preset</Button>
                <Button size="sm" onClick={addMenuItem}><Plus className="w-4 h-4 mr-2"/>Add item</Button>
              </div>
            </div>

            {config.nav_items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No menu items yet. Add items or load the preset.</p>
            ) : (
              <div className="space-y-3">
                {config.nav_items.map((item, idx) => (
                  <div key={item.id} className="border rounded-md p-3 grid gap-3 md:grid-cols-12 items-end">
                    <div className="md:col-span-3">
                      <Label>Label</Label>
                      <Input value={item.label} onChange={(e)=>{
                        const label = e.target.value; setConfig(prev=>({
                          ...prev, nav_items: prev.nav_items.map(it=> it.id===item.id ? { ...it, label } : it)
                        }));
                      }} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Link Type</Label>
                      <Select value={item.type} onValueChange={(v: 'page'|'custom')=>{
                        setConfig(prev=>({
                          ...prev, nav_items: prev.nav_items.map(it=> it.id===item.id ? { ...it, type: v } : it)
                        }));
                      }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Website Page</SelectItem>
                          <SelectItem value="custom">Custom URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {item.type === 'page' ? (
                      <div className="md:col-span-4">
                        <Label>Page</Label>
                        <Select value={item.page_slug || ''} onValueChange={(slug)=>{
                          setConfig(prev=>({
                            ...prev, nav_items: prev.nav_items.map(it=> it.id===item.id ? { ...it, page_slug: slug, url: undefined } : it)
                          }));
                        }}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select page" /></SelectTrigger>
                          <SelectContent>
                            {pages.map(p => (
                              <SelectItem key={p.id} value={p.slug || ''}>{p.title}{p.is_homepage ? ' (Home)' : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="md:col-span-4">
                        <Label>URL</Label>
                        <Input placeholder="https://example.com" value={item.url || ''} onChange={(e)=>{
                          const url = e.target.value; setConfig(prev=>({
                            ...prev, nav_items: prev.nav_items.map(it=> it.id===item.id ? { ...it, url, page_slug: undefined } : it)
                          }));
                        }} />
                      </div>
                    )}
                    <div className="md:col-span-1 flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={()=>moveItem(idx,-1)}><ArrowUp className="w-4 h-4"/></Button>
                      <Button variant="outline" size="icon" onClick={()=>moveItem(idx,1)}><ArrowDown className="w-4 h-4"/></Button>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">New tab</Label>
                        <Switch checked={!!item.new_tab} onCheckedChange={(v)=>{
                          setConfig(prev=>({
                            ...prev, nav_items: prev.nav_items.map(it=> it.id===item.id ? { ...it, new_tab: v } : it)
                          }));
                        }} />
                      </div>
                      <Button variant="destructive" size="icon" onClick={()=>removeMenuItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <ColorPicker label="Background color" color={config.style?.bg_color || '#ffffff'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), bg_color: v } }))} />
            <ColorPicker label="Text color" color={config.style?.text_color || '#000000'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), text_color: v } }))} />
            <ColorPicker label="Hover color" color={config.style?.hover_color || '#555555'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), hover_color: v } }))} />
            <ColorPicker label="Hamburger icon color" color={config.style?.hamburger_color || '#000000'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), hamburger_color: v } }))} />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={loadPreset}>Reset to preset</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Header'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
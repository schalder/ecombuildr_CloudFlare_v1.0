import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ColorPicker } from '@/components/ui/color-picker';
import { ImageUpload } from '@/components/ui/image-upload';

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

export type FooterLinkItem = {
  id: string;
  label: string;
  type: 'page' | 'custom';
  page_slug?: string;
  url?: string;
  new_tab?: boolean;
};

export interface GlobalFooterConfig {
  enabled: boolean;
  logo_url?: string;
  description?: string;
  links: FooterLinkItem[];
  style?: {
    bg_color?: string;
    text_color?: string;
    heading_color?: string;
    link_hover_color?: string;
  };
}

interface Props {
  website: Website;
}

export const WebsiteFooterBuilder: React.FC<Props> = ({ website }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<WebsitePageLite[]>([]);
  const initial: GlobalFooterConfig = useMemo(() => {
    const cfg = (website.settings?.global_footer as GlobalFooterConfig | undefined);
    return cfg ?? {
      enabled: true,
      logo_url: '',
      description: '',
      links: [],
      style: {
        bg_color: '',
        text_color: '',
        heading_color: '',
        link_hover_color: '',
      },
    };
  }, [website.settings]);

  const [config, setConfig] = useState<GlobalFooterConfig>(initial);

  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('website_pages')
        .select('id,title,slug,is_homepage')
        .eq('website_id', website.id)
        .order('created_at', { ascending: false });
      if (!error && data) setPages(data as WebsitePageLite[]);
    };
    fetchPages();
  }, [website.id]);

  const setField = (patch: Partial<GlobalFooterConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const addLink = () => {
    setConfig(prev => ({
      ...prev,
      links: [
        ...prev.links,
        { id: Math.random().toString(36).slice(2), label: 'Link', type: 'page', page_slug: pages.find(p=>p.is_homepage)?.slug || '' }
      ]
    }));
  };

  const removeLink = (id: string) => setConfig(prev => ({ ...prev, links: prev.links.filter(i => i.id !== id) }));

  const loadPreset = () => {
    const privacy = pages.find(p => p.slug === 'privacy');
    const terms = pages.find(p => p.slug === 'terms');
    const contact = pages.find(p => p.slug === 'contact');
    setConfig(prev => ({
      ...prev,
      enabled: true,
      links: [
        privacy && { id: 'privacy', label: 'Privacy Policy', type: 'page', page_slug: 'privacy' },
        terms && { id: 'terms', label: 'Terms of Service', type: 'page', page_slug: 'terms' },
        contact && { id: 'contact', label: 'Contact', type: 'page', page_slug: 'contact' },
      ].filter(Boolean) as FooterLinkItem[]
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(website.settings || {}), global_footer: config };
      const { error } = await supabase.from('websites').update({ settings: newSettings }).eq('id', website.id);
      if (error) throw error;
      toast({ title: 'Footer saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save footer settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Enable Global Footer</Label>
              <p className="text-xs text-muted-foreground">When enabled, this footer appears on all pages of this website.</p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => setField({ enabled: v })} />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Logo</Label>
              <ImageUpload value={config.logo_url} onChange={(url) => setField({ logo_url: url })} />
            </div>
            <div className="space-y-4">
              <Label>Short description</Label>
              <Input placeholder="Add a short description" value={config.description || ''} onChange={(e)=> setField({ description: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Links</Label>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={loadPreset}>Use default preset</Button>
                <Button size="sm" onClick={addLink}><Plus className="w-4 h-4 mr-2"/>Add link</Button>
              </div>
            </div>
            {config.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">No links yet. Add links or load the preset.</p>
            ) : (
              <div className="space-y-3">
                {config.links.map((item) => (
                  <div key={item.id} className="border rounded-md p-3 grid gap-3 md:grid-cols-12 items-end">
                    <div className="md:col-span-3">
                      <Label>Label</Label>
                      <Input value={item.label} onChange={(e)=>{
                        const label = e.target.value; setConfig(prev=>({
                          ...prev, links: prev.links.map(it=> it.id===item.id ? { ...it, label } : it)
                        }));
                      }} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Link Type</Label>
                      <Select value={item.type} onValueChange={(v: 'page'|'custom')=>{
                        setConfig(prev=>({
                          ...prev, links: prev.links.map(it=> it.id===item.id ? { ...it, type: v } : it)
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
                      <div className="md:col-span-5">
                        <Label>Page</Label>
                        <Select value={item.page_slug || ''} onValueChange={(slug)=>{
                          setConfig(prev=>({
                            ...prev, links: prev.links.map(it=> it.id===item.id ? { ...it, page_slug: slug, url: undefined } : it)
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
                      <div className="md:col-span-5">
                        <Label>URL</Label>
                        <Input placeholder="https://example.com" value={item.url || ''} onChange={(e)=>{
                          const url = e.target.value; setConfig(prev=>({
                            ...prev, links: prev.links.map(it=> it.id===item.id ? { ...it, url, page_slug: undefined } : it)
                          }));
                        }} />
                      </div>
                    )}
                    <div className="md:col-span-2 flex items-center justify-end">
                      <Button variant="destructive" size="icon" onClick={()=>removeLink(item.id)}><Trash2 className="w-4 h-4"/></Button>
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
            <ColorPicker label="Heading color" color={config.style?.heading_color || '#000000'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), heading_color: v } }))} />
            <ColorPicker label="Link hover color" color={config.style?.link_hover_color || '#555555'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), link_hover_color: v } }))} />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={loadPreset}>Reset to preset</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Footer'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
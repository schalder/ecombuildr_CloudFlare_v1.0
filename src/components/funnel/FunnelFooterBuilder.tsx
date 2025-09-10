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
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface Funnel {
  id: string;
  settings?: any;
  name: string;
}

interface FunnelStepLite {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  step_order: number;
}

export type FooterLinkItem = {
  id: string;
  label: string;
  type: 'step' | 'custom';
  step_slug?: string;
  url?: string;
  new_tab?: boolean;
};

export interface FooterLinkSection {
  id: string;
  title: string;
  links: FooterLinkItem[];
}

export interface GlobalFooterConfig {
  enabled: boolean;
  logo_url?: string;
  description?: string;
  disclaimer_content?: string;
  copyright_text?: string;
  link_sections: FooterLinkSection[];
  style?: {
    bg_color?: string;
    text_color?: string;
    heading_color?: string;
    link_hover_color?: string;
  };
}

interface Props {
  funnel: Funnel;
}

export const FunnelFooterBuilder: React.FC<Props> = ({ funnel }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<FunnelStepLite[]>([]);
  const initial: GlobalFooterConfig = useMemo(() => {
    const cfg = (funnel.settings?.global_footer as any);
    
    let linkSections: FooterLinkSection[] = [];
    
    if (cfg?.link_sections) {
      linkSections = cfg.link_sections;
    } else if (cfg?.links && Array.isArray(cfg.links)) {
      linkSections = [{
        id: 'quick-links',
        title: 'Quick Links',
        links: cfg.links
      }];
    }
    
    return {
      enabled: cfg?.enabled ?? true,
      logo_url: cfg?.logo_url || '',
      description: cfg?.description || '',
      disclaimer_content: cfg?.disclaimer_content || '',
      copyright_text: cfg?.copyright_text || '© {year} {funnel_name}. All rights reserved.',
      link_sections: linkSections,
      style: {
        bg_color: cfg?.style?.bg_color || '',
        text_color: cfg?.style?.text_color || '',
        heading_color: cfg?.style?.heading_color || '',
        link_hover_color: cfg?.style?.link_hover_color || '',
      },
    };
  }, [funnel.settings]);

  const [config, setConfig] = useState<GlobalFooterConfig>(initial);

  // Sync config with funnel settings when they change
  React.useEffect(() => {
    setConfig(initial);
  }, [initial]);

  useEffect(() => {
    const fetchSteps = async () => {
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('id,title,slug,is_published,step_order')
        .eq('funnel_id', funnel.id)
        .order('step_order');
      if (!error && data) setSteps(data as FunnelStepLite[]);
    };
    fetchSteps();
  }, [funnel.id]);

  const setField = (patch: Partial<GlobalFooterConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const addSection = () => {
    setConfig(prev => ({
      ...prev,
      link_sections: [
        ...prev.link_sections,
        { 
          id: Math.random().toString(36).slice(2), 
          title: 'New Section',
          links: []
        }
      ]
    }));
  };

  const removeSection = (id: string) => setConfig(prev => ({ ...prev, link_sections: prev.link_sections.filter(s => s.id !== id) }));

  const moveSection = (index: number, dir: -1 | 1) => {
    setConfig(prev => {
      const sections = [...prev.link_sections];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= sections.length) return prev;
      const [moved] = sections.splice(index, 1);
      sections.splice(newIndex, 0, moved);
      return { ...prev, link_sections: sections };
    });
  };

  const updateSection = (sectionId: string, updates: Partial<FooterLinkSection>) => {
    setConfig(prev => ({
      ...prev,
      link_sections: prev.link_sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      )
    }));
  };

  const addLinkToSection = (sectionId: string) => {
    const newLink: FooterLinkItem = {
      id: Math.random().toString(36).slice(2),
      label: 'New Link',
      type: 'step',
      step_slug: steps[0]?.slug || ''
    };

    setConfig(prev => ({
      ...prev,
      link_sections: prev.link_sections.map(section =>
        section.id === sectionId
          ? { ...section, links: [...section.links, newLink] }
          : section
      )
    }));
  };

  const removeLinkFromSection = (sectionId: string, linkId: string) => {
    setConfig(prev => ({
      ...prev,
      link_sections: prev.link_sections.map(section =>
        section.id === sectionId
          ? { ...section, links: section.links.filter(l => l.id !== linkId) }
          : section
      )
    }));
  };

  const updateLinkInSection = (sectionId: string, linkId: string, updates: Partial<FooterLinkItem>) => {
    setConfig(prev => ({
      ...prev,
      link_sections: prev.link_sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              links: section.links.map(link =>
                link.id === linkId ? { ...link, ...updates } : link
              )
            }
          : section
      )
    }));
  };

  const loadPreset = () => {
    if (steps.length === 0) {
      toast({ title: 'No steps available', description: 'Please create funnel steps first.', variant: 'destructive' });
      return;
    }

    const firstStep = steps.find(s => s.step_order === 1) || steps[0];

    setConfig(prev => ({
      ...prev,
      enabled: true,
      link_sections: [
        {
          id: 'quick-links',
          title: 'Quick Links',
          links: [
            { id: 'home', label: 'Home', type: 'step', step_slug: firstStep.slug },
          ]
        }
      ]
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(funnel.settings || {}), global_footer: config };
      const { error } = await supabase.from('funnels').update({ settings: newSettings }).eq('id', funnel.id);
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
          <CardTitle>Funnel Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Enable Global Footer</Label>
              <p className="text-xs text-muted-foreground">When enabled, this footer appears on all steps of this funnel.</p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => setField({ enabled: v })} />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <MediaSelector label="Logo" value={config.logo_url || ''} onChange={(url) => setField({ logo_url: url })} compact />
            </div>
            <div className="space-y-4">
              <Label>Short description</Label>
              <Input placeholder="Add a short description" value={config.description || ''} onChange={(e)=> setField({ description: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Funnel Disclaimer</Label>
            <RichTextEditor
              value={config.disclaimer_content || ''}
              onChange={(content) => setField({ disclaimer_content: content })}
              placeholder="Add legal disclaimers, terms, or other important information..."
              className="min-h-[120px]"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Custom Copyright Text</Label>
            <Input 
              placeholder="© {year} {funnel_name}. All rights reserved."
              value={config.copyright_text || ''}
              onChange={(e) => setField({ copyright_text: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Use {`{year}`} and {`{funnel_name}`} as variables that will be automatically replaced.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Link Sections</Label>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={loadPreset} disabled={steps.length === 0}>Use default preset</Button>
                <Button size="sm" onClick={addSection}><Plus className="w-4 h-4 mr-2"/>Add section</Button>
              </div>
            </div>

            {steps.length === 0 && (
              <p className="text-sm text-muted-foreground">No funnel steps available. Create steps first to build footer links.</p>
            )}

            {(config.link_sections && config.link_sections.length === 0) ? (
              <p className="text-sm text-muted-foreground">No link sections yet. Add sections or load the preset.</p>
            ) : config.link_sections ? (
              <div className="space-y-6">
                {config.link_sections.map((section, sectionIdx) => (
                  <div key={section.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <Label>Section Title</Label>
                        <Input 
                          value={section.title} 
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Section title"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => moveSection(sectionIdx, -1)}
                          disabled={sectionIdx === 0}
                        >
                          <ArrowUp className="w-4 h-4"/>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => moveSection(sectionIdx, 1)}
                          disabled={sectionIdx === (config.link_sections?.length || 0) - 1}
                        >
                          <ArrowDown className="w-4 h-4"/>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => removeSection(section.id)}>
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Links in this section</Label>
                        <Button size="sm" variant="outline" onClick={() => addLinkToSection(section.id)} disabled={steps.length === 0}>
                          <Plus className="w-4 h-4 mr-2"/>Add link
                        </Button>
                      </div>
                      
                      {section.links.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No links in this section yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {section.links.map((link) => (
                            <div key={link.id} className="border rounded-md p-3 grid gap-3 md:grid-cols-12 items-end bg-muted/30">
                              <div className="md:col-span-3">
                                <Label className="text-xs">Label</Label>
                                <Input 
                                  value={link.label} 
                                  onChange={(e) => updateLinkInSection(section.id, link.id, { label: e.target.value })}
                                  className="text-sm"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-xs">Type</Label>
                                <Select 
                                  value={link.type} 
                                  onValueChange={(v: 'step'|'custom') => updateLinkInSection(section.id, link.id, { type: v })}
                                >
                                  <SelectTrigger className="w-full text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="step">Step</SelectItem>
                                    <SelectItem value="custom">URL</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {link.type === 'step' ? (
                                <div className="md:col-span-5">
                                  <Label className="text-xs">Step</Label>
                                  <Select 
                                    value={link.step_slug || ''} 
                                    onValueChange={(slug) => updateLinkInSection(section.id, link.id, { step_slug: slug, url: undefined })}
                                  >
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue placeholder="Select step" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {steps.filter(s => s.slug && s.slug.trim() !== '').map(s => (
                                         <SelectItem key={s.id} value={s.slug}>{s.title} (Step {s.step_order})</SelectItem>
                                       ))}
                                     </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <div className="md:col-span-5">
                                  <Label className="text-xs">URL</Label>
                                  <Input 
                                    placeholder="https://example.com" 
                                    value={link.url || ''} 
                                    onChange={(e) => updateLinkInSection(section.id, link.id, { url: e.target.value, step_slug: undefined })}
                                    className="text-sm"
                                  />
                                </div>
                              )}
                              <div className="md:col-span-1 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Label className="text-xs">New tab</Label>
                                  <Switch 
                                    checked={!!link.new_tab} 
                                    onCheckedChange={(v) => updateLinkInSection(section.id, link.id, { new_tab: v })}
                                  />
                                </div>
                              </div>
                              <div className="md:col-span-1 flex justify-end">
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  onClick={() => removeLinkFromSection(section.id, link.id)}
                                >
                                  <Trash2 className="w-4 h-4"/>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <ColorPicker label="Background color" color={config.style?.bg_color || '#ffffff'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), bg_color: v } }))} />
            <ColorPicker label="Text color" color={config.style?.text_color || '#000000'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), text_color: v } }))} />
            <ColorPicker label="Heading color" color={config.style?.heading_color || '#000000'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), heading_color: v } }))} />
            <ColorPicker label="Link hover color" color={config.style?.link_hover_color || '#555555'} onChange={(v)=> setConfig(prev=>({ ...prev, style: { ...(prev.style||{}), link_hover_color: v } }))} />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button variant="outline" onClick={loadPreset} className="w-full sm:w-auto" disabled={steps.length === 0}>Reset to preset</Button>
            <Button onClick={save} disabled={saving} className="w-full sm:w-auto">{saving ? 'Saving...' : 'Save Footer'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
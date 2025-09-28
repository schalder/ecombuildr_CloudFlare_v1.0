import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  theme_settings?: any;
}

export type NavigationItem = {
  id: string;
  label: string;
  url: string;
  new_tab: boolean;
};

export interface NavigationMenuConfig {
  enabled: boolean;
  items: NavigationItem[];
  fontSize?: string;
  fontWeight?: string;
}

interface Props {
  course: Course;
  onSettingsUpdate?: (settings: any) => void;
}

export const CourseNavigationBuilder: React.FC<Props> = ({ course, onSettingsUpdate }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const initialConfig: NavigationMenuConfig = {
    enabled: course.theme_settings?.navigation_menu?.enabled || false,
    items: course.theme_settings?.navigation_menu?.items || [],
    fontSize: course.theme_settings?.navigation_menu?.fontSize || 'text-sm',
    fontWeight: course.theme_settings?.navigation_menu?.fontWeight || 'font-normal',
  };

  const [config, setConfig] = useState<NavigationMenuConfig>(initialConfig);

  const setField = (patch: Partial<NavigationMenuConfig>) => 
    setConfig(prev => ({ ...prev, ...patch }));

  const addMenuItem = () => {
    setConfig(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          id: Math.random().toString(36).slice(2), 
          label: 'New Link', 
          url: '', 
          new_tab: false 
        }
      ]
    }));
  };

  const removeMenuItem = (id: string) => 
    setConfig(prev => ({ 
      ...prev, 
      items: prev.items.filter(i => i.id !== id) 
    }));

  const moveItem = (index: number, direction: -1 | 1) => {
    setConfig(prev => {
      const items = [...prev.items];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return { ...prev, items };
    });
  };

  const updateMenuItem = (id: string, updates: Partial<NavigationItem>) => {
    setConfig(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const newThemeSettings = { 
        ...(course.theme_settings || {}), 
        navigation_menu: config 
      };
      
      const { error } = await supabase
        .from('courses')
        .update({ theme_settings: newThemeSettings })
        .eq('id', course.id);
        
      if (error) throw error;
      
      onSettingsUpdate?.(newThemeSettings);
      toast({ title: 'Navigation menu saved successfully' });
    } catch (e) {
      toast({ 
        title: 'Save failed', 
        description: 'Could not save navigation menu settings', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Enable Navigation Menu</Label>
          <p className="text-xs text-muted-foreground">
            Add custom links to the course header
          </p>
        </div>
        <Switch 
          checked={config.enabled} 
          onCheckedChange={(enabled) => setField({ enabled })} 
        />
      </div>

      {config.enabled && (
        <>
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Menu Items</Label>
              <Button size="sm" onClick={addMenuItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>

            {config.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No menu items yet. Add links to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {config.items.map((item, idx) => (
                  <div key={item.id} className="border rounded-md p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Label</Label>
                        <Input 
                          value={item.label} 
                          onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                          placeholder="Menu item name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">URL</Label>
                        <Input 
                          value={item.url} 
                          onChange={(e) => updateMenuItem(item.id, { url: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Open in new tab</Label>
                        <Switch 
                          checked={item.new_tab} 
                          onCheckedChange={(new_tab) => updateMenuItem(item.id, { new_tab })}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => moveItem(idx, -1)} 
                          disabled={idx === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => moveItem(idx, 1)} 
                          disabled={idx === config.items.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => removeMenuItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Font Styling Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Font Styling</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Font Size</Label>
                <Select
                  value={config.fontSize}
                  onValueChange={(fontSize) => setField({ fontSize })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-xs">Extra Small</SelectItem>
                    <SelectItem value="text-sm">Small</SelectItem>
                    <SelectItem value="text-base">Medium</SelectItem>
                    <SelectItem value="text-lg">Large</SelectItem>
                    <SelectItem value="text-xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Font Weight</Label>
                <Select
                  value={config.fontWeight}
                  onValueChange={(fontWeight) => setField({ fontWeight })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="font-light">Light</SelectItem>
                    <SelectItem value="font-normal">Normal</SelectItem>
                    <SelectItem value="font-medium">Medium</SelectItem>
                    <SelectItem value="font-semibold">Semi Bold</SelectItem>
                    <SelectItem value="font-bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Navigation'}
        </Button>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { 
  Menu, 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  Save,
  ExternalLink
} from 'lucide-react';
import { PlatformNavItem, PlatformNavigationSettings } from '@/types/platformNavigation';

export const PlatformNavigationManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformNavigationSettings | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [navItems, setNavItems] = useState<PlatformNavItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch navigation settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to user-scoped path in Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(`${user.id}/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(`${user.id}/${fileName}`);

      setLogoUrl(publicUrl);
      
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_navigation_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
        setLogoUrl(data.logo_url || '');
        setNavItems(data.nav_items || []);
      }
    } catch (error) {
      console.error('Error fetching navigation settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load navigation settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_navigation_settings')
        .update({
          logo_url: logoUrl,
          nav_items: navItems,
        })
        .eq('id', settings?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Navigation settings updated successfully',
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error saving navigation settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save navigation settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = (parentId?: string) => {
    const newItem: PlatformNavItem = {
      id: `nav-${Date.now()}`,
      label: 'New Menu Item',
      href: '/',
      enabled: true,
      children: [],
    };

    if (!parentId) {
      setNavItems([...navItems, newItem]);
    } else {
      const addToParent = (items: PlatformNavItem[]): PlatformNavItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return { ...item, children: [...item.children, newItem] };
          }
          if (item.children.length > 0) {
            return { ...item, children: addToParent(item.children) };
          }
          return item;
        });
      };
      setNavItems(addToParent(navItems));
    }
  };

  const updateMenuItem = (id: string, updates: Partial<PlatformNavItem>) => {
    const updateItem = (items: PlatformNavItem[]): PlatformNavItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children.length > 0) {
          return { ...item, children: updateItem(item.children) };
        }
        return item;
      });
    };
    setNavItems(updateItem(navItems));
  };

  const deleteMenuItem = (id: string) => {
    const removeItem = (items: PlatformNavItem[]): PlatformNavItem[] => {
      return items.filter(item => {
        if (item.id === id) return false;
        if (item.children.length > 0) {
          item.children = removeItem(item.children);
        }
        return true;
      });
    };
    setNavItems(removeItem(navItems));
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderMenuItem = (item: PlatformNavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id} className="space-y-2">
        <div 
          className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
          
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mt-1"
              onClick={() => toggleExpanded(item.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={item.label}
                  onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                  placeholder="Menu label"
                />
              </div>
              <div>
                <Label className="text-xs">URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={item.href}
                    onChange={(e) => updateMenuItem(item.id, { href: e.target.value })}
                    placeholder="/path or https://..."
                  />
                  {item.external && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground mt-2" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(checked) => updateMenuItem(item.id, { enabled: checked })}
                />
                <Label className="text-xs">Enabled</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.external || false}
                  onCheckedChange={(checked) => updateMenuItem(item.id, { external: checked })}
                />
                <Label className="text-xs">External Link</Label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => addMenuItem(item.id)}
              title="Add submenu"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => deleteMenuItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {item.children.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Platform Navigation
        </CardTitle>
        <CardDescription>
          Manage the main website navigation menu, logo, and submenu structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-3">
          <Label>Logo</Label>
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-16 bg-muted rounded-lg overflow-hidden border">
                <img 
                  src={logoUrl} 
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Handle file upload here - you can reuse the ImageUpload logic
                        handleLogoUpload(file);
                      }
                    };
                    input.click();
                  }}
                >
                  Change Logo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogoUrl('')}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-32 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      handleLogoUpload(file);
                    }
                  };
                  input.click();
                }}
              >
                Upload Logo
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Navigation Items</Label>
            <Button onClick={() => addMenuItem()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
          
          <div className="space-y-2">
            {navItems.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Navigation'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

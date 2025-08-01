import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface NavigationItem {
  label: string;
  url: string;
  type: 'page' | 'external' | 'category';
  target?: '_blank' | '_self';
}

interface NavigationMenu {
  id: string;
  name: string;
  position: string;
  items: NavigationItem[];
  is_active: boolean;
}

interface NavigationBuilderProps {
  storeId: string;
}

export const NavigationBuilder = ({ storeId }: NavigationBuilderProps) => {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMenu, setEditingMenu] = useState<NavigationMenu | null>(null);
  const [newItem, setNewItem] = useState<NavigationItem>({
    label: '',
    url: '',
    type: 'page',
    target: '_self'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNavigationMenus();
  }, [storeId]);

  const fetchNavigationMenus = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('navigation_menus')
        .select('*')
        .eq('store_id', storeId)
        .order('position');

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Error fetching navigation menus:', error);
      toast({
        title: "Error",
        description: "Failed to load navigation menus",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addNavigationItem = () => {
    if (!editingMenu || !newItem.label || !newItem.url) return;

    const updatedItems = [...editingMenu.items, newItem];
    setEditingMenu({
      ...editingMenu,
      items: updatedItems
    });
    setNewItem({ label: '', url: '', type: 'page', target: '_self' });
  };

  const removeNavigationItem = (index: number) => {
    if (!editingMenu) return;

    const updatedItems = editingMenu.items.filter((_, i) => i !== index);
    setEditingMenu({
      ...editingMenu,
      items: updatedItems
    });
  };

  const saveNavigationMenu = async () => {
    if (!editingMenu) return;

    try {
      const { error } = await (supabase as any)
        .from('navigation_menus')
        .update({
          items: editingMenu.items,
          is_active: editingMenu.is_active
        })
        .eq('id', editingMenu.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Navigation menu updated successfully"
      });

      fetchNavigationMenus();
      setEditingMenu(null);
    } catch (error) {
      console.error('Error saving navigation menu:', error);
      toast({
        title: "Error",
        description: "Failed to save navigation menu",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2].map(i => <Card key={i} className="h-32" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Navigation Menus</h3>
          <p className="text-sm text-muted-foreground">
            Manage your store's navigation menus and links
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {menus.map((menu) => (
          <Card key={menu.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{menu.name}</CardTitle>
                <CardDescription>
                  {menu.position} • {menu.items.length} items
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMenu(menu)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit {menu.name}</DialogTitle>
                    <DialogDescription>
                      Add, remove, or reorder navigation items
                    </DialogDescription>
                  </DialogHeader>
                  
                  {editingMenu && (
                    <div className="space-y-4">
                      {/* Current Items */}
                      <div className="space-y-2">
                        <Label>Current Menu Items</Label>
                        {editingMenu.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                → {item.url}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNavigationItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Add New Item */}
                      <div className="border-t pt-4">
                        <Label>Add New Item</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input
                            placeholder="Label (e.g., Home)"
                            value={newItem.label}
                            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                          />
                          <Input
                            placeholder="URL (e.g., /)"
                            value={newItem.url}
                            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                          />
                          <Select
                            value={newItem.type}
                            onValueChange={(value: any) => setNewItem({ ...newItem, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="page">Page</SelectItem>
                              <SelectItem value="external">External Link</SelectItem>
                              <SelectItem value="category">Category</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={addNavigationItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setEditingMenu(null)}>
                          Cancel
                        </Button>
                        <Button onClick={saveNavigationMenu}>
                          Save Menu
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {menu.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {item.label} → {item.url}
                  </div>
                ))}
                {menu.items.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{menu.items.length - 3} more items
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
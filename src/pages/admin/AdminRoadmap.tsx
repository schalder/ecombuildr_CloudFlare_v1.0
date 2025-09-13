import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineRTE } from "@/components/page-builder/components/InlineRTE";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'shipped' | 'backlog';
  priority: number;
  target_date: string | null;
  is_published: boolean;
  created_at: string;
}

const roadmapSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'shipped', 'backlog']),
  priority: z.number().min(0).max(100),
  target_date: z.string().optional(),
  is_published: z.boolean(),
});

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'backlog', label: 'Backlog' },
];

const statusColors = {
  planned: 'bg-blue-500 text-white',
  in_progress: 'bg-warning text-warning-foreground',
  shipped: 'bg-success text-success-foreground',
  backlog: 'bg-muted-foreground text-white',
};

const AdminRoadmap = () => {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof roadmapSchema>>({
    resolver: zodResolver(roadmapSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "planned",
      priority: 0,
      target_date: "",
      is_published: false,
    },
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_roadmap_items')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching roadmap items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roadmap items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof roadmapSchema>) => {
    try {
      const data = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        is_published: values.is_published,
        target_date: values.target_date || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('platform_roadmap_items')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Success", description: "Roadmap item updated successfully" });
      } else {
        const { error } = await supabase
          .from('platform_roadmap_items')
          .insert(data);

        if (error) throw error;
        toast({ title: "Success", description: "Roadmap item created successfully" });
      }

      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      fetchItems();
    } catch (error) {
      console.error('Error saving roadmap item:', error);
      toast({
        title: "Error",
        description: "Failed to save roadmap item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: RoadmapItem) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description || "",
      status: item.status,
      priority: item.priority,
      target_date: item.target_date || "",
      is_published: item.is_published,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap item?')) return;

    try {
      const { error } = await supabase
        .from('platform_roadmap_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Roadmap item deleted successfully" });
      fetchItems();
    } catch (error) {
      console.error('Error deleting roadmap item:', error);
      toast({
        title: "Error",
        description: "Failed to delete roadmap item",
        variant: "destructive",
      });
    }
  };

  const handleNewItem = () => {
    setEditingItem(null);
    form.reset();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Roadmap Management" description="Manage roadmap items">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Roadmap Management" description="Manage roadmap items">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Roadmap Items</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Roadmap Item' : 'Create Roadmap Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the roadmap item details' : 'Add a new item to the roadmap'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Feature title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <InlineRTE
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Write a detailed description..."
                            variant="paragraph"
                            className="min-h-[120px] border border-input rounded-md p-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority (0-100)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="target_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Published</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Make this item visible to the public
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge className={statusColors[item.status]}>
                        {statusOptions.find(s => s.value === item.status)?.label}
                      </Badge>
                      {item.is_published ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Priority: {item.priority}</span>
                      {item.target_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(item.target_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {item.description && (
                <CardContent className="pt-0">
                  <div 
                    className="rich-text-content prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No roadmap items yet. Create your first one!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRoadmap;
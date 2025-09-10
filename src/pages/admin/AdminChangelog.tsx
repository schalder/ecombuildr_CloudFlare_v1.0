import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";

interface ChangelogEntry {
  id: string;
  title: string;
  content: string;
  version: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const changelogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  version: z.string().optional(),
  is_published: z.boolean(),
  published_at: z.string().optional(),
});

const AdminChangelog = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof changelogSchema>>({
    resolver: zodResolver(changelogSchema),
    defaultValues: {
      title: "",
      content: "",
      version: "",
      is_published: false,
      published_at: "",
    },
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_changelog_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching changelog entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch changelog entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof changelogSchema>) => {
    try {
      const data = {
        title: values.title,
        content: values.content,
        version: values.version || null,
        is_published: values.is_published,
        published_at: values.is_published 
          ? (values.published_at || new Date().toISOString())
          : null,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('platform_changelog_entries')
          .update(data)
          .eq('id', editingEntry.id);

        if (error) throw error;
        toast({ title: "Success", description: "Changelog entry updated successfully" });
      } else {
        const { error } = await supabase
          .from('platform_changelog_entries')
          .insert(data);

        if (error) throw error;
        toast({ title: "Success", description: "Changelog entry created successfully" });
      }

      setDialogOpen(false);
      setEditingEntry(null);
      form.reset();
      fetchEntries();
    } catch (error) {
      console.error('Error saving changelog entry:', error);
      toast({
        title: "Error",
        description: "Failed to save changelog entry",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setEditingEntry(entry);
    form.reset({
      title: entry.title,
      content: entry.content,
      version: entry.version || "",
      is_published: entry.is_published,
      published_at: entry.published_at 
        ? new Date(entry.published_at).toISOString().split('T')[0]
        : "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this changelog entry?')) return;

    try {
      const { error } = await supabase
        .from('platform_changelog_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Changelog entry deleted successfully" });
      fetchEntries();
    } catch (error) {
      console.error('Error deleting changelog entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete changelog entry",
        variant: "destructive",
      });
    }
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    form.reset({
      title: "",
      content: "",
      version: "",
      is_published: false,
      published_at: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Changelog Management" description="Manage changelog entries">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Changelog Management" description="Manage changelog entries">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Changelog Entries</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewEntry}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Changelog Entry' : 'Create Changelog Entry'}
                </DialogTitle>
                <DialogDescription>
                  {editingEntry ? 'Update the changelog entry details' : 'Add a new entry to the changelog'}
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
                          <Input placeholder="What's new in this update?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="v1.2.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Describe the changes, improvements, and new features..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="published_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publish Date</FormLabel>
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
                              Make this entry visible to the public
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
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingEntry ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      {entry.version && (
                        <Badge variant="outline">{entry.version}</Badge>
                      )}
                      {entry.is_published ? (
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
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {entry.published_at 
                          ? format(new Date(entry.published_at), 'MMM dd, yyyy')
                          : format(new Date(entry.created_at), 'MMM dd, yyyy')
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {entries.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No changelog entries yet. Create your first one!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChangelog;
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Save, ArrowLeft, GripVertical, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons_count?: number;
}

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = courseId === "new";

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    description: "",
    category: "",
    tags: [] as string[],
    estimated_duration_minutes: "",
    thumbnail_url: "",
    is_published: false,
    is_active: true,
    sort_order: 1,
  });

  const [tagInput, setTagInput] = useState("");

  const { data: course, isLoading } = useQuery({
    queryKey: ["training-course", courseId],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .eq("id", courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["training-modules", courseId],
    queryFn: async () => {
      if (isNew) return [];
      const { data, error } = await supabase
        .from("training_modules")
        .select(`
          *,
          lessons_count:training_lessons(count)
        `)
        .eq("course_id", courseId)
        .order("sort_order");
      
      if (error) throw error;
      return data.map(module => ({
        ...module,
        lessons_count: module.lessons_count?.[0]?.count || 0
      })) as Module[];
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        slug: course.slug,
        short_description: course.short_description || "",
        description: course.description || "",
        category: course.category || "",
        tags: course.tags || [],
        estimated_duration_minutes: course.estimated_duration_minutes?.toString() || "",
        thumbnail_url: course.thumbnail_url || "",
        is_published: course.is_published,
        is_active: course.is_active,
        sort_order: course.sort_order,
      });
    }
  }, [course]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const courseData = {
        ...data,
        estimated_duration_minutes: data.estimated_duration_minutes ? parseInt(data.estimated_duration_minutes) : null,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      };

      if (isNew) {
        const { data: newCourse, error } = await supabase
          .from("training_courses")
          .insert([courseData])
          .select()
          .single();
        
        if (error) throw error;
        return newCourse;
      } else {
        const { data: updatedCourse, error } = await supabase
          .from("training_courses")
          .update(courseData)
          .eq("id", courseId)
          .select()
          .single();
        
        if (error) throw error;
        return updatedCourse;
      }
    },
    onSuccess: (data) => {
      toast({ title: "Course saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["training-course"] });
      queryClient.invalidateQueries({ queryKey: ["admin-training-courses"] });
      
      if (isNew) {
        navigate(`/admin/training/${data.id}`);
      }
    },
    onError: () => {
      toast({ title: "Failed to save course", variant: "destructive" });
    },
  });

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/training")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "Create New Course" : "Edit Course"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Course title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="course-slug"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief description for course cards"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed course description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Marketing, Technical"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_minutes: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isNew && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Modules</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {modules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No modules yet. Add your first module to get started.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {modules.map((module) => (
                        <div key={module.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {module.lessons_count} lessons
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Published</Label>
                  <Switch
                    id="published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Course"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
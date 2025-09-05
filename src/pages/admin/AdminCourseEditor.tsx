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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Save, ArrowLeft, GripVertical, Edit, Trash2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
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

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'embed' | 'link';
  video_url?: string;
  embed_code?: string;
  text_content?: string;
  pdf_url?: string;
  link_url?: string;
  duration_minutes?: number;
  is_free_preview: boolean;
  sort_order: number;
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  
  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
  });

  const [lessonFormData, setLessonFormData] = useState<{
    title: string;
    content_type: 'video' | 'text' | 'pdf' | 'embed' | 'link';
    video_url: string;
    embed_code: string;
    text_content: string;
    pdf_url: string;
    link_url: string;
    duration_minutes: string;
    is_free_preview: boolean;
  }>({
    title: "",
    content_type: "video",
    video_url: "",
    embed_code: "",
    text_content: "",
    pdf_url: "",
    link_url: "",
    duration_minutes: "",
    is_free_preview: false,
  });

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

  const { data: lessons = [] } = useQuery({
    queryKey: ["training-lessons", courseId],
    queryFn: async () => {
      if (isNew) return [];
      const { data, error } = await supabase
        .from("training_lessons")
        .select("*")
        .in("module_id", modules.map(m => m.id))
        .order("sort_order");
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !isNew && modules.length > 0,
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
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        short_description: data.short_description || null,
        description: data.description || null,
        category: data.category || null,
        tags: data.tags,
        estimated_duration_minutes: data.estimated_duration_minutes ? parseInt(data.estimated_duration_minutes) : null,
        thumbnail_url: data.thumbnail_url || null,
        is_published: data.is_published,
        is_active: data.is_active,
        sort_order: data.sort_order,
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
    onError: (error) => {
      console.error('Save error:', error);
      toast({ 
        title: "Failed to save course", 
        description: error.message || "An error occurred while saving the course",
        variant: "destructive" 
      });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: typeof moduleFormData) => {
      const nextSortOrder = modules.length > 0 ? Math.max(...modules.map(m => m.sort_order)) + 1 : 1;
      
      const { data, error } = await supabase
        .from("training_modules")
        .insert([{
          course_id: courseId,
          title: moduleData.title,
          description: moduleData.description || null,
          sort_order: nextSortOrder,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Module created successfully" });
      queryClient.invalidateQueries({ queryKey: ["training-modules"] });
      setShowModuleDialog(false);
      setModuleFormData({ title: "", description: "" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create module", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: typeof lessonFormData) => {
      const moduleId = selectedModuleId;
      const moduleLessons = lessons.filter(l => l.module_id === moduleId);
      const nextSortOrder = moduleLessons.length > 0 ? Math.max(...moduleLessons.map(l => l.sort_order)) + 1 : 1;
      
      const { data, error } = await supabase
        .from("training_lessons")
        .insert([{
          module_id: moduleId,
          title: lessonData.title,
          content_type: lessonData.content_type,
          video_url: lessonData.video_url || null,
          embed_code: lessonData.embed_code || null,
          text_content: lessonData.text_content || null,
          pdf_url: lessonData.pdf_url || null,
          link_url: lessonData.link_url || null,
          duration_minutes: lessonData.duration_minutes ? parseInt(lessonData.duration_minutes) : null,
          is_free_preview: lessonData.is_free_preview,
          sort_order: nextSortOrder,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Lesson created successfully" });
      queryClient.invalidateQueries({ queryKey: ["training-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["training-modules"] });
      setShowLessonDialog(false);
      setLessonFormData({
        title: "",
        content_type: "video",
        video_url: "",
        embed_code: "",
        text_content: "",
        pdf_url: "",
        link_url: "",
        duration_minutes: "",
        is_free_preview: false,
      });
      setSelectedModuleId("");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create lesson", 
        description: error.message,
        variant: "destructive" 
      });
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

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter(lesson => lesson.module_id === moduleId);
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
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Course title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="course-slug (auto-generated if empty)"
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
                    <CardTitle>Modules & Lessons</CardTitle>
                    <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Module
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Module</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="module-title">Module Title *</Label>
                            <Input
                              id="module-title"
                              value={moduleFormData.title}
                              onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Module title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="module-description">Description</Label>
                            <Textarea
                              id="module-description"
                              value={moduleFormData.description}
                              onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Module description"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => createModuleMutation.mutate(moduleFormData)}
                              disabled={!moduleFormData.title.trim() || createModuleMutation.isPending}
                            >
                              {createModuleMutation.isPending ? "Creating..." : "Create Module"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                        <Collapsible key={module.id}>
                          <div className="border rounded-lg">
                            <div className="flex items-center gap-3 p-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <CollapsibleTrigger 
                                className="flex-1 flex items-center justify-between text-left"
                                onClick={() => toggleModuleExpanded(module.id)}
                              >
                                <div>
                                  <h4 className="font-medium">{module.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {module.lessons_count} lessons
                                  </p>
                                </div>
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </CollapsibleTrigger>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedModuleId(module.id);
                                    setShowLessonDialog(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CollapsibleContent>
                              <div className="px-3 pb-3 border-t">
                                {getModuleLessons(module.id).length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-4 text-center">
                                    No lessons in this module yet.
                                  </p>
                                ) : (
                                  <div className="space-y-2 mt-3">
                                    {getModuleLessons(module.id).map((lesson) => (
                                      <div key={lesson.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{lesson.title}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {lesson.content_type} • {lesson.duration_minutes ? `${lesson.duration_minutes}min` : 'No duration'}
                                            {lesson.is_free_preview && ' • Free Preview'}
                                          </p>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
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
              disabled={saveMutation.isPending || !formData.title.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Course"}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Lesson title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type *</Label>
              <Select
                value={lessonFormData.content_type}
                onValueChange={(value: any) => setLessonFormData(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="embed">Embed</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lessonFormData.content_type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                  id="video-url"
                  value={lessonFormData.video_url}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            )}

            {lessonFormData.content_type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea
                  id="text-content"
                  value={lessonFormData.text_content}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, text_content: e.target.value }))}
                  placeholder="Lesson content..."
                  rows={6}
                />
              </div>
            )}

            {lessonFormData.content_type === 'pdf' && (
              <div className="space-y-2">
                <Label htmlFor="pdf-url">PDF URL</Label>
                <Input
                  id="pdf-url"
                  value={lessonFormData.pdf_url}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
                  placeholder="https://example.com/file.pdf"
                />
              </div>
            )}

            {lessonFormData.content_type === 'embed' && (
              <div className="space-y-2">
                <Label htmlFor="embed-code">Embed Code</Label>
                <Textarea
                  id="embed-code"
                  value={lessonFormData.embed_code}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, embed_code: e.target.value }))}
                  placeholder="<iframe src=..."
                  rows={4}
                />
              </div>
            )}

            {lessonFormData.content_type === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="link-url">External Link URL</Label>
                <Input
                  id="link-url"
                  value={lessonFormData.link_url}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={lessonFormData.duration_minutes}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="15"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="free-preview"
                  checked={lessonFormData.is_free_preview}
                  onCheckedChange={(checked) => setLessonFormData(prev => ({ ...prev, is_free_preview: checked }))}
                />
                <Label htmlFor="free-preview">Free Preview</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createLessonMutation.mutate(lessonFormData)}
                disabled={!lessonFormData.title.trim() || createLessonMutation.isPending}
              >
                {createLessonMutation.isPending ? "Creating..." : "Create Lesson"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MediaSelector } from '@/components/page-builder/components/MediaSelector';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  PlayCircle,
  GripVertical,
  Eye,
  Upload
} from 'lucide-react';
import { useUserStore } from '@/hooks/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_price?: number;
  thumbnail_url?: string;
  is_published: boolean;
  is_active: boolean;
  includes_title?: string;
  includes_items?: string[];
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  is_published: boolean;
  course_lessons: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  video_url?: string;
  video_duration?: number;
  sort_order: number;
  is_published: boolean;
  is_preview: boolean;
}

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { store } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  
  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', is_published: false });
  const [lessonForm, setLessonForm] = useState({ 
    title: '', 
    content: '', 
    video_url: '', 
    video_duration: 0,
    is_published: false, 
    is_preview: false 
  });

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        throw new Error('Course not found');
      }
      setCourse(courseData);

      // Fetch modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          course_lessons (*)
        `)
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (modulesError) throw modulesError;
      
      // Sort lessons within each module
      const modulesWithSortedLessons = modulesData?.map(module => ({
        ...module,
        course_lessons: module.course_lessons.sort((a: Lesson, b: Lesson) => a.sort_order - b.sort_order)
      })) || [];

      setModules(modulesWithSortedLessons);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
      navigate('/dashboard/courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const saveCourse = async () => {
    if (!course) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: course.title,
          description: course.description,
          price: course.price,
          compare_price: course.compare_price,
          thumbnail_url: course.thumbnail_url,
          is_published: course.is_published,
          is_active: course.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', course.id);

      if (error) throw error;
      toast.success('Course updated successfully!');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateModule = async () => {
    if (!course || !moduleForm.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: course.id,
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || null,
          sort_order: modules.length,
          is_published: moduleForm.is_published
        })
        .select()
        .single();

      if (error) throw error;

      setModules(prev => [...prev, { ...data, course_lessons: [] }]);
      setModuleForm({ title: '', description: '', is_published: false });
      setShowModuleDialog(false);
      toast.success('Module created successfully!');
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !moduleForm.title.trim()) return;

    try {
      const { error } = await supabase
        .from('course_modules')
        .update({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || null,
          is_published: moduleForm.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingModule.id);

      if (error) throw error;

      setModules(prev => prev.map(module => 
        module.id === editingModule.id 
          ? { ...module, title: moduleForm.title, description: moduleForm.description, is_published: moduleForm.is_published }
          : module
      ));
      
      setEditingModule(null);
      setModuleForm({ title: '', description: '', is_published: false });
      setShowModuleDialog(false);
      toast.success('Module updated successfully!');
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedModuleId || !lessonForm.title.trim()) return;

    try {
      const module = modules.find(m => m.id === selectedModuleId);
      if (!module) return;

      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          module_id: selectedModuleId,
          title: lessonForm.title.trim(),
          content: lessonForm.content,
          video_url: lessonForm.video_url.trim() || null,
          video_duration: lessonForm.video_duration || null,
          sort_order: module.course_lessons.length,
          is_published: lessonForm.is_published,
          is_preview: lessonForm.is_preview
        })
        .select()
        .single();

      if (error) throw error;

      setModules(prev => prev.map(module => 
        module.id === selectedModuleId
          ? { ...module, course_lessons: [...module.course_lessons, data] }
          : module
      ));

      setLessonForm({ title: '', content: '', video_url: '', video_duration: 0, is_published: false, is_preview: false });
      setShowLessonDialog(false);
      setSelectedModuleId('');
      toast.success('Lesson created successfully!');
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !lessonForm.title.trim()) return;

    try {
      const { error } = await supabase
        .from('course_lessons')
        .update({
          title: lessonForm.title.trim(),
          content: lessonForm.content,
          video_url: lessonForm.video_url.trim() || null,
          video_duration: lessonForm.video_duration || null,
          is_published: lessonForm.is_published,
          is_preview: lessonForm.is_preview,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLesson.id);

      if (error) throw error;

      // Update the lesson in the local state
      setModules(prev => prev.map(module => ({
        ...module,
        course_lessons: module.course_lessons.map(lesson =>
          lesson.id === editingLesson.id
            ? {
                ...lesson,
                title: lessonForm.title,
                content: lessonForm.content,
                video_url: lessonForm.video_url || null,
                video_duration: lessonForm.video_duration || null,
                is_published: lessonForm.is_published,
                is_preview: lessonForm.is_preview
              }
            : lesson
        )
      })));

      setEditingLesson(null);
      setLessonForm({ title: '', content: '', video_url: '', video_duration: 0, is_published: false, is_preview: false });
      setShowLessonDialog(false);
      toast.success('Lesson updated successfully!');
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
    }
  };

  const openModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description || '',
        is_published: module.is_published
      });
    } else {
      setEditingModule(null);
      setModuleForm({ title: '', description: '', is_published: false });
    }
    setShowModuleDialog(true);
  };

  const openLessonDialog = (moduleId: string, lesson?: Lesson) => {
    setSelectedModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        content: lesson.content || '',
        video_url: lesson.video_url || '',
        video_duration: lesson.video_duration || 0,
        is_published: lesson.is_published,
        is_preview: lesson.is_preview
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', content: '', video_url: '', video_duration: 0, is_published: false, is_preview: false });
    }
    setShowLessonDialog(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Button onClick={() => navigate('/dashboard/courses')}>
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={course.title} description="Edit course content and structure">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold break-words">{course.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={course.is_published ? "default" : "secondary"}>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant={course.is_active ? "default" : "destructive"}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            
            <Button onClick={saveCourse} disabled={saving} className="shrink-0">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Course
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input
                    value={course.title}
                    onChange={(e) => setCourse(prev => prev ? {...prev, title: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Course Description</Label>
                  <RichTextEditor
                    content={course.description || ''}
                    onChange={(content) => setCourse(prev => prev ? {...prev, description: content} : null)}
                    placeholder="Write a detailed description of your course content, objectives, prerequisites, etc..."
                    className="min-h-[150px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* What it includes Section */}
            <Card>
              <CardHeader>
                <CardTitle>What This Course Includes</CardTitle>
                <CardDescription>
                  Optional section to highlight what students will get with this course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="includes-title">Section Title (Optional)</Label>
                  <Input
                    id="includes-title"
                    value={course.includes_title || ''}
                    onChange={(e) => setCourse(prev => prev ? {...prev, includes_title: e.target.value} : null)}
                    placeholder="e.g., This Course Includes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Course Features (Optional)</Label>
                  <div className="space-y-2">
                    {(course.includes_items || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(course.includes_items || [])];
                            newItems[index] = e.target.value;
                            setCourse(prev => prev ? {...prev, includes_items: newItems} : null);
                          }}
                          placeholder="e.g., 5.4 hours on-demand video"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newItems = (course.includes_items || []).filter((_, i) => i !== index);
                            setCourse(prev => prev ? {...prev, includes_items: newItems} : null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCourse(prev => prev ? {...prev, includes_items: [...(prev.includes_items || []), '']} : null);
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course Content</CardTitle>
                    <CardDescription>Organize your course into modules and lessons</CardDescription>
                  </div>
                  <Button onClick={() => openModuleDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No modules yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first module to start building course content
                    </p>
                    <Button onClick={() => openModuleDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Module
                    </Button>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {modules.map((module, moduleIndex) => (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3 w-full">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{module.title}</span>
                                <Badge variant={module.is_published ? "default" : "secondary"} className="text-xs">
                                  {module.is_published ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {module.course_lessons.length} lessons
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModuleDialog(module);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {module.description && (
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            )}
                            
                            <div className="space-y-2">
                              {module.course_lessons.map((lesson, lessonIndex) => (
                                <div key={lesson.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{lesson.title}</span>
                                      <Badge variant={lesson.is_published ? "default" : "secondary"} className="text-xs">
                                        {lesson.is_published ? 'Published' : 'Draft'}
                                      </Badge>
                                      {lesson.is_preview && (
                                        <Badge variant="outline" className="text-xs">
                                          Preview
                                        </Badge>
                                      )}
                                    </div>
                                    {lesson.video_url && (
                                      <p className="text-xs text-muted-foreground">
                                        Video • {lesson.video_duration ? `${Math.floor(lesson.video_duration / 60)}:${(lesson.video_duration % 60).toString().padStart(2, '0')}` : 'No duration'}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openLessonDialog(module.id, lesson)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openLessonDialog(module.id)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lesson
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Price (৳)</Label>
                  <Input
                    type="number"
                    value={course.price}
                    onChange={(e) => setCourse(prev => prev ? {...prev, price: parseFloat(e.target.value) || 0} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Compare Price (৳)</Label>
                  <Input
                    type="number"
                    value={course.compare_price || ''}
                    onChange={(e) => setCourse(prev => prev ? {...prev, compare_price: parseFloat(e.target.value) || null} : null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Published</Label>
                  <Switch
                    checked={course.is_published}
                    onCheckedChange={(checked) => setCourse(prev => prev ? {...prev, is_published: checked} : null)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={course.is_active}
                    onCheckedChange={(checked) => setCourse(prev => prev ? {...prev, is_active: checked} : null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle>Course Thumbnail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Course Thumbnail</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Open library */}}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Upload className="h-3 w-3" />
                      Library
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Upload */}}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Upload className="h-3 w-3" />
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* URL */}}
                      className="text-xs"
                    >
                      URL
                    </Button>
                  </div>
                  {course.thumbnail_url && (
                    <div className="mt-2">
                      <img 
                        src={course.thumbnail_url} 
                        alt="Course thumbnail"
                        className="w-full h-24 object-cover rounded-md border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Module Dialog */}
        <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Edit Module' : 'Create Module'}</DialogTitle>
              <DialogDescription>
                {editingModule ? 'Update module information' : 'Add a new module to organize your course content'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Module Title</Label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="e.g., Getting Started"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Brief description of this module..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch
                  checked={moduleForm.is_published}
                  onCheckedChange={(checked) => setModuleForm(prev => ({...prev, is_published: checked}))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={editingModule ? handleUpdateModule : handleCreateModule}>
                {editingModule ? 'Update Module' : 'Create Module'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create Lesson'}</DialogTitle>
              <DialogDescription>
                {editingLesson ? 'Update lesson content' : 'Add a new lesson with video and text content'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lesson Title</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="e.g., Introduction to Web Development"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm(prev => ({...prev, video_url: e.target.value}))}
                  placeholder="YouTube, Vimeo, or direct video URL"
                />
              </div>

              <div className="space-y-2">
                <Label>Video Duration (seconds)</Label>
                <Input
                  type="number"
                  value={lessonForm.video_duration}
                  onChange={(e) => setLessonForm(prev => ({...prev, video_duration: parseInt(e.target.value) || 0}))}
                  placeholder="e.g., 300 for 5 minutes"
                />
              </div>

              <div className="space-y-2">
                <Label>Lesson Content</Label>
                <RichTextEditor
                  content={lessonForm.content}
                  onChange={(content) => setLessonForm(prev => ({...prev, content}))}
                  placeholder="Write lesson content, notes, resources..."
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch
                  checked={lessonForm.is_published}
                  onCheckedChange={(checked) => setLessonForm(prev => ({...prev, is_published: checked}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Free Preview</Label>
                <Switch
                  checked={lessonForm.is_preview}
                  onCheckedChange={(checked) => setLessonForm(prev => ({...prev, is_preview: checked}))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
                Cancel
              </Button>
              <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}>
                {editingLesson ? 'Update Lesson' : 'Create Lesson'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CourseEditor;
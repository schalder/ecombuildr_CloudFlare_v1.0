import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseNavigationBuilder } from '@/components/course/CourseNavigationBuilder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CompactMediaSelector } from '@/components/page-builder/components/CompactMediaSelector';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { ColorPicker } from '@/components/ui/color-picker';
import { useUserStore } from '@/hooks/useUserStore';
import { useCategories } from '@/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDurationForInput, parseDurationInput } from '@/lib/utils';
import { CoursePaymentMethods } from '@/components/course/CoursePaymentMethods';
import { DripContentSettings, type DripContentData } from "@/components/drip-content/DripContentSettings";

interface Course {
  id: string;
  title: string;
  description: string;
  content?: string;
  show_content?: boolean;
  overview?: string;
  course_details?: string;
  author_name?: string;
  author_image_url?: string;
  author_details?: string;
  price: number;
  compare_price?: number;
  thumbnail_url?: string;
  category_id?: string;
  is_published: boolean;
  is_active: boolean;
  includes_title?: string;
  includes_items?: string[];
  payment_methods?: {
    bkash: boolean;
    nagad: boolean;
    eps: boolean;
    ebpay: boolean;
    stripe: boolean;
  };
  theme_settings?: {
    module_color?: string;
    module_text_color?: string;
    enroll_button_color?: string;
    enroll_button_text_color?: string;
  };
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
  drip_enabled?: boolean;
  drip_type?: 'days_after_purchase' | 'specific_date';
  drip_days?: number;
  drip_release_date?: string;
  drip_lock_message?: string;
}

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { store } = useUserStore();
  const { flatCategories } = useCategories();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [overviewType, setOverviewType] = useState<'text' | 'video'>('text');
  
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
    duration_hours: 0,
    duration_minutes: 0,
    duration_seconds: 0,
    is_published: false,
    is_preview: false,
    drip_enabled: false,
        drip_type: 'days_after_purchase' as 'days_after_purchase' | 'specific_date',
    drip_days: 0,
    drip_release_date: null as string | null,
    drip_lock_message: 'This lesson will be available after you complete the prerequisites.'
  });

  // Collapsible section states (default collapsed)
  const [collapsedSections, setCollapsedSections] = useState({
    pricing: true,
    settings: true,
    theme: true,
    navigation: true,
    payment: true,
    thumbnail: true,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Drag and drop reordering functions
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'MODULE') {
      // Reorder modules
      const newModules = Array.from(modules);
      const [reorderedModule] = newModules.splice(source.index, 1);
      newModules.splice(destination.index, 0, reorderedModule);

      // Update local state
      setModules(newModules);

      // Update sort_order in database
      try {
        const updates = newModules.map((module, index) => ({
          id: module.id,
          sort_order: index
        }));

        for (const update of updates) {
          await supabase
            .from('course_modules')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }

        toast('Modules reordered successfully');
      } catch (error) {
        console.error('Error reordering modules:', error);
        toast('Failed to reorder modules');
        // Revert local state
        fetchCourseData();
      }
    } else if (type === 'LESSON') {
      // Reorder lessons within a module
      const moduleId = result.destination.droppableId;
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      if (moduleIndex === -1) return;

      const newModules = [...modules];
      const module = newModules[moduleIndex];
      const newLessons = Array.from(module.course_lessons);
      const [reorderedLesson] = newLessons.splice(source.index, 1);
      newLessons.splice(destination.index, 0, reorderedLesson);

      newModules[moduleIndex] = {
        ...module,
        course_lessons: newLessons
      };

      // Update local state
      setModules(newModules);

      // Update sort_order in database
      try {
        const updates = newLessons.map((lesson, index) => ({
          id: lesson.id,
          sort_order: index
        }));

        for (const update of updates) {
          await supabase
            .from('course_lessons')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }

        toast('Lessons reordered successfully');
      } catch (error) {
        console.error('Error reordering lessons:', error);
        toast('Failed to reorder lessons');
        // Revert local state
        fetchCourseData();
      }
    }
  };

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules and lessons
      const { data: moduleData, error: moduleError } = await supabase
        .from('course_modules')
        .select(`
          *,
          course_lessons(
            id,
            title,
            content,
            video_url,
            video_duration,
            sort_order,
            is_published,
            is_preview,
            drip_enabled,
            drip_type,
            drip_days,
            drip_release_date,
            drip_lock_message
          )
        `)
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (moduleError) throw moduleError;

      setCourse({
        ...courseData,
        payment_methods: {
          bkash: false,
          nagad: false,
          eps: false,
          ebpay: false,
          stripe: false,
          ...(courseData.payment_methods as Course['payment_methods'] || {})
        } as Course['payment_methods'],
        theme_settings: courseData.theme_settings as Course['theme_settings'] || { 
          module_color: "#3b82f6", 
          module_text_color: "#ffffff",
          enroll_button_color: "#10b981",
          enroll_button_text_color: "#ffffff"
        }
      });
      
      // Sort lessons within each module
      const sortedModules = moduleData.map(module => ({
        ...module,
        course_lessons: (module.course_lessons || []).map(lesson => ({
          ...lesson,
          module_id: module.id,
          drip_type: (lesson.drip_type as 'days_after_purchase' | 'specific_date') || 'days_after_purchase'
        })).sort((a, b) => a.sort_order - b.sort_order)
      }));
      
      setModules(sortedModules);
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

  // Detect overview type when course loads
  useEffect(() => {
    if (course?.overview) {
      const isVideoUrl = /youtube\.com|youtu\.be|vimeo\.com|wistia\.com|\.mp4|\.webm|\.ogg/i.test(course.overview);
      setOverviewType(isVideoUrl ? 'video' : 'text');
    }
  }, [course?.overview]);

  const saveCourse = async () => {
    if (!course) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: course.title,
          description: course.description,
          content: course.show_content ? (course.content || null) : null,
          show_content: course.show_content ?? false,
          overview: course.overview,
          course_details: course.course_details,
          author_name: course.author_name,
          author_image_url: course.author_image_url,
          author_details: course.author_details,
          price: course.price,
          compare_price: course.compare_price,
          thumbnail_url: course.thumbnail_url,
          category_id: course.category_id,
          is_published: course.is_published,
          is_active: course.is_active,
          includes_title: course.includes_title,
          includes_items: course.includes_items,
          payment_methods: course.payment_methods,
          theme_settings: course.theme_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', course.id);

      if (error) throw error;

      toast.success('Course saved successfully!');
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
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
      const totalMinutes = lesson.video_duration || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.floor(totalMinutes % 60);
      const seconds = Math.round((totalMinutes % 1) * 60);
      
      setLessonForm({
        title: lesson.title,
        content: lesson.content,
        video_url: lesson.video_url || '',
        video_duration: totalMinutes,
        duration_hours: hours,
        duration_minutes: minutes,
        duration_seconds: seconds,
        is_published: lesson.is_published,
        is_preview: lesson.is_preview,
        drip_enabled: lesson.drip_enabled || false,
        drip_type: lesson.drip_type || 'days_after_purchase',
        drip_days: lesson.drip_days || 0,
        drip_release_date: lesson.drip_release_date || null,
        drip_lock_message: lesson.drip_lock_message || 'This lesson will be available after you complete the prerequisites.'
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        content: '',
        video_url: '',
        video_duration: 0,
        duration_hours: 0,
        duration_minutes: 0,
        duration_seconds: 0,
        is_published: false,
        is_preview: false,
        drip_enabled: false,
        drip_type: 'days_after_purchase' as 'days_after_purchase' | 'specific_date',
        drip_days: 0,
        drip_release_date: null as string | null,
        drip_lock_message: 'This lesson will be available after you complete the prerequisites.'
      });
    }
    setShowLessonDialog(true);
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
          content: lessonForm.content.trim(),
          video_url: lessonForm.video_url.trim() || null,
          video_duration: lessonForm.video_duration || null,
          sort_order: module.course_lessons.length,
          is_published: lessonForm.is_published,
          is_preview: lessonForm.is_preview,
          drip_enabled: lessonForm.drip_enabled,
          drip_type: lessonForm.drip_type,
          drip_days: lessonForm.drip_days,
          drip_release_date: lessonForm.drip_release_date,
          drip_lock_message: lessonForm.drip_lock_message
        })
        .select()
        .single();

      if (error) throw error;

      setModules(prev => prev.map(module => 
        module.id === selectedModuleId 
          ? { ...module, course_lessons: [...module.course_lessons, { 
              ...data, 
              drip_type: data.drip_type as 'days_after_purchase' | 'specific_date' 
            }] }
          : module
      ));
      
      setLessonForm({
        title: '',
        content: '',
        video_url: '',
        video_duration: 0,
        duration_hours: 0,
        duration_minutes: 0,
        duration_seconds: 0,
        is_published: false,
        is_preview: false,
        drip_enabled: false,
        drip_type: 'days_after_purchase' as 'days_after_purchase' | 'specific_date',
        drip_days: 0,
        drip_release_date: null as string | null,
        drip_lock_message: 'This lesson will be available after you complete the prerequisites.'
      });
      setShowLessonDialog(false);
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
          content: lessonForm.content.trim(),
          video_url: lessonForm.video_url.trim() || null,
          video_duration: lessonForm.video_duration || null,
          is_published: lessonForm.is_published,
          is_preview: lessonForm.is_preview,
          drip_enabled: lessonForm.drip_enabled,
          drip_type: lessonForm.drip_type,
          drip_days: lessonForm.drip_days,
          drip_release_date: lessonForm.drip_release_date,
          drip_lock_message: lessonForm.drip_lock_message,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLesson.id);

      if (error) throw error;

      setModules(prev => prev.map(module => ({
        ...module,
        course_lessons: module.course_lessons.map(lesson =>
          lesson.id === editingLesson.id 
            ? { ...lesson, ...lessonForm }
            : lesson
        )
      })));
      
      setEditingLesson(null);
      setLessonForm({
        title: '',
        content: '',
        video_url: '',
        video_duration: 0,
        duration_hours: 0,
        duration_minutes: 0,
        duration_seconds: 0,
        is_published: false,
        is_preview: false,
        drip_enabled: false,
        drip_type: 'days_after_purchase' as 'days_after_purchase' | 'specific_date',
        drip_days: 0,
        drip_release_date: null as string | null,
        drip_lock_message: 'This lesson will be available after you complete the prerequisites.'
      });
      setShowLessonDialog(false);
      toast.success('Lesson updated successfully!');
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading..." description="">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout title="Course Not Found" description="">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit ${course.title}`} description="Update course details and content">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/dashboard/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={`/courses/${course.id}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </a>
              </Button>
              <Button onClick={saveCourse} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Course
              </Button>
            </div>
          </div>

          {/* Course Editor Accordion */}
          <Accordion type="multiple" defaultValue={["course-info", "course-content"]} className="space-y-4">
            {/* Course Information */}
            <AccordionItem value="course-info" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-left text-base font-semibold">Course Information</CardTitle>
                    <CardDescription className="text-left">Basic course details and description</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label>Course Title</Label>
                      <Input
                        value={course.title}
                        onChange={(e) => setCourse(prev => prev ? {...prev, title: e.target.value} : null)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Course Category</Label>
                      <Select value={course.category_id || 'no-category'} onValueChange={(value) => setCourse(prev => prev ? {...prev, category_id: value === 'no-category' ? null : value} : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="no-category">No Category</SelectItem>
                          {flatCategories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Short Description</Label>
                      <RichTextEditor
                        content={course.description || ''}
                        onChange={(content) => setCourse(prev => prev ? {...prev, description: content} : null)}
                        placeholder="Write a brief description of your course..."
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Course Overview - Text or Video */}
            <AccordionItem value="course-overview" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-left text-base font-semibold">Course Overview</CardTitle>
                    <CardDescription className="text-left">Add a video or text overview of your course</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center gap-4">
                      <Label>Overview Type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={overviewType === 'text' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setOverviewType('text')}
                        >
                          Text
                        </Button>
                        <Button
                          type="button"
                          variant={overviewType === 'video' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setOverviewType('video')}
                        >
                          Video URL
                        </Button>
                      </div>
                    </div>
                    {overviewType === 'text' ? (
                      <div className="space-y-2">
                        <Label>Overview Text</Label>
                        <RichTextEditor
                          content={course.overview || ''}
                          onChange={(content) => setCourse(prev => prev ? {...prev, overview: content} : null)}
                          placeholder="Write an overview of your course..."
                          className="min-h-[150px]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input
                          value={course.overview || ''}
                          onChange={(e) => setCourse(prev => prev ? {...prev, overview: e.target.value} : null)}
                          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Supports YouTube, Vimeo, Wistia, or direct video URLs
                        </p>
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Course Content */}
            <AccordionItem value="course-content-text" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-left text-base font-semibold">Course Content</CardTitle>
                    <CardDescription className="text-left">Detailed course content and curriculum information</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Course Content Section</Label>
                        <p className="text-xs text-muted-foreground">
                          Display course content text on the course page
                        </p>
                      </div>
                      <Switch
                        checked={course.show_content ?? false}
                        onCheckedChange={(checked) => setCourse(prev => prev ? {...prev, show_content: checked} : null)}
                      />
                    </div>
                    {course.show_content && (
                      <div className="space-y-2">
                        <Label>Course Content</Label>
                        <RichTextEditor
                          content={course.content || ''}
                          onChange={(content) => setCourse(prev => prev ? {...prev, content: content} : null)}
                          placeholder="Write a detailed description of your course content, objectives, prerequisites, etc..."
                          className="min-h-[200px]"
                        />
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Course Details */}
            <AccordionItem value="course-details" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-left text-base font-semibold">Course Details</CardTitle>
                    <CardDescription className="text-left">Additional course information and specifications</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <RichTextEditor
                      content={course.course_details || ''}
                      onChange={(content) => setCourse(prev => prev ? {...prev, course_details: content} : null)}
                      placeholder="Add detailed course information, requirements, what students will get, etc..."
                      className="min-h-[200px]"
                    />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Author Information */}
            <AccordionItem value="author-information" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-left text-base font-semibold">Author Information</CardTitle>
                    <CardDescription className="text-left">Course instructor/author details</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label>Author Name</Label>
                      <Input
                        value={course.author_name || ''}
                        onChange={(e) => setCourse(prev => prev ? {...prev, author_name: e.target.value} : null)}
                        placeholder="e.g., John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Author Image</Label>
                      <CompactMediaSelector
                        value={course.author_image_url || ''}
                        onChange={(url) => setCourse(prev => prev ? {...prev, author_image_url: url} : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Author Details</Label>
                      <RichTextEditor
                        content={course.author_details || ''}
                        onChange={(content) => setCourse(prev => prev ? {...prev, author_details: content} : null)}
                        placeholder="Write about the course author, their experience, credentials, etc..."
                        className="min-h-[150px]"
                      />
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* What This Course Includes */}
            <AccordionItem value="course-includes" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline text-left">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-left text-base font-semibold">What This Course Includes</CardTitle>
                    <CardDescription className="text-left">
                      Optional section to highlight what students will get with this course
                    </CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-0">
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
                            const newItems = [...(course.includes_items || []), ''];
                            setCourse(prev => prev ? {...prev, includes_items: newItems} : null);
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Feature
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Course Content - Modules and Lessons */}
            <AccordionItem value="course-content" className="border rounded-lg">
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0 flex-1 text-left">
                    <CardTitle className="text-left text-base font-semibold">Course Content</CardTitle>
                    <CardDescription className="text-left">Organize your course into modules and lessons</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop to reorder modules and lessons
                        </p>
                      </div>
                      <Button 
                        onClick={() => openModuleDialog()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </Button>
                    </div>
                    
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
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="modules" type="MODULE">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-4"
                            >
                              {modules.map((module, moduleIndex) => (
                                <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`border rounded-lg ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                    >
                                      <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1">
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
                                            onClick={() => openModuleDialog(module)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        
                                        {module.description && (
                                          <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                                        )}
                                        
                                        <Droppable droppableId={module.id} type="LESSON">
                                          {(provided) => (
                                            <div
                                              {...provided.droppableProps}
                                              ref={provided.innerRef}
                                              className="space-y-2"
                                            >
                                              {module.course_lessons.map((lesson, lessonIndex) => (
                                                <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className={`flex items-center gap-3 p-3 border rounded-lg bg-background ${snapshot.isDragging ? 'shadow-md' : ''}`}
                                                    >
                                                      <div
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab active:cursor-grabbing"
                                                      >
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                      </div>
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
                                                            Video • {lesson.video_duration ? formatDurationForInput(lesson.video_duration) : 'No duration'}
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
                                                  )}
                                                </Draggable>
                                              ))}
                                              {provided.placeholder}
                                              
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openLessonDialog(module.id)}
                                                className="w-full mt-2"
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Lesson
                                              </Button>
                                            </div>
                                          )}
                                        </Droppable>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Collapsible open={!collapsedSections.pricing} onOpenChange={() => toggleSection('pricing')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-base font-semibold">
                    Pricing
                    <Plus className={`w-4 h-4 transition-transform ${!collapsedSections.pricing ? 'rotate-45' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      value={course.price}
                      onChange={(e) => setCourse(prev => prev ? {...prev, price: parseFloat(e.target.value) || 0} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Compare Price ($)</Label>
                    <Input
                      type="number"
                      value={course.compare_price || ''}
                      onChange={(e) => setCourse(prev => prev ? {...prev, compare_price: parseFloat(e.target.value) || undefined} : null)}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Settings */}
          <Collapsible open={!collapsedSections.settings} onOpenChange={() => toggleSection('settings')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-base font-semibold">
                    Settings
                    <Plus className={`w-4 h-4 transition-transform ${!collapsedSections.settings ? 'rotate-45' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Theme Settings */}
          <Collapsible open={!collapsedSections.theme} onOpenChange={() => toggleSection('theme')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-base font-semibold">
                    Theme Settings
                    <Plus className={`w-4 h-4 transition-transform ${!collapsedSections.theme ? 'rotate-45' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Module Background Color</Label>
                    <ColorPicker
                      color={course?.theme_settings?.module_color || "#3b82f6"}
                      onChange={(color) => setCourse(prev => prev ? {
                        ...prev, 
                        theme_settings: {
                          ...prev.theme_settings,
                          module_color: color
                        }
                      } : null)}
                      label="Choose module background color"
                    />
                    <p className="text-xs text-muted-foreground">
                      This color will be used as the background for module cards
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Module Text Color</Label>
                    <ColorPicker
                      color={course?.theme_settings?.module_text_color || "#ffffff"}
                      onChange={(color) => setCourse(prev => prev ? {
                        ...prev, 
                        theme_settings: {
                          ...prev.theme_settings,
                          module_text_color: color
                        }
                      } : null)}
                      label="Choose module text color"
                    />
                    <p className="text-xs text-muted-foreground">
                      This color will be used for text inside module cards
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Enroll Button Background Color</Label>
                    <ColorPicker
                      color={course?.theme_settings?.enroll_button_color || "#10b981"}
                      onChange={(color) => setCourse(prev => prev ? {
                        ...prev, 
                        theme_settings: {
                          ...prev.theme_settings,
                          enroll_button_color: color
                        }
                      } : null)}
                      label="Choose enroll button background color"
                    />
                    <p className="text-xs text-muted-foreground">
                      This color will be used as the background for the "Enroll Now" button
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Enroll Button Text Color</Label>
                    <ColorPicker
                      color={course?.theme_settings?.enroll_button_text_color || "#ffffff"}
                      onChange={(color) => setCourse(prev => prev ? {
                        ...prev, 
                        theme_settings: {
                          ...prev.theme_settings,
                          enroll_button_text_color: color
                        }
                      } : null)}
                      label="Choose enroll button text color"
                    />
                    <p className="text-xs text-muted-foreground">
                      This color will be used for text inside the "Enroll Now" button
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Navigation Menu */}
          <Collapsible open={!collapsedSections.navigation} onOpenChange={() => toggleSection('navigation')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-base font-semibold">
                    Navigation Menu
                    <Plus className={`w-4 h-4 transition-transform ${!collapsedSections.navigation ? 'rotate-45' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <CourseNavigationBuilder 
                    course={course} 
                    onSettingsUpdate={(settings) => setCourse(prev => prev ? {...prev, theme_settings: settings} : null)}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Payment Methods */}
          {store && (
            <Collapsible open={!collapsedSections.payment} onOpenChange={() => toggleSection('payment')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-base font-semibold">
                      Payment Methods
                      <Plus className={`w-4 h-4 transition-transform ${!collapsedSections.payment ? 'rotate-45' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    <CoursePaymentMethods
                      storeId={store.id}
                      value={course.payment_methods || { bkash: false, nagad: false, eps: false, ebpay: false, stripe: false }}
                      onChange={(methods) => setCourse(prev => prev ? {...prev, payment_methods: methods} : null)}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Course Thumbnail */}
          <Collapsible open={!collapsedSections.thumbnail} onOpenChange={() => toggleSection('thumbnail')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-base font-semibold">
                    Course Thumbnail
                    <Plus className={`w-4 h-4 transition-transform ${!collapsedSections.thumbnail ? 'rotate-45' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <CompactMediaSelector
                    value={course.thumbnail_url}
                    onChange={(url) => setCourse(prev => prev ? {...prev, thumbnail_url: url} : null)}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Module Dialog */}
        <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Edit Module' : 'Create New Module'}</DialogTitle>
              <DialogDescription>
                {editingModule ? 'Update module details' : 'Add a new module to your course'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Module Title</Label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter module title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Brief description of the module"
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
              <DialogDescription>
                {editingLesson ? 'Update lesson details' : 'Add a new lesson to the module'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lesson Title</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter lesson title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  content={lessonForm.content}
                  onChange={(content) => setLessonForm(prev => ({...prev, content}))}
                  placeholder="Write your lesson content..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Video URL (optional)</Label>
                <Input
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm(prev => ({...prev, video_url: e.target.value}))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Video Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={lessonForm.duration_hours}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        const totalMinutes = hours * 60 + lessonForm.duration_minutes + Math.floor(lessonForm.duration_seconds / 60);
                        setLessonForm(prev => ({
                          ...prev, 
                          duration_hours: hours,
                          video_duration: totalMinutes
                        }));
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Minutes</Label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={lessonForm.duration_minutes}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0;
                        const totalMinutes = lessonForm.duration_hours * 60 + minutes + Math.floor(lessonForm.duration_seconds / 60);
                        setLessonForm(prev => ({
                          ...prev, 
                          duration_minutes: minutes,
                          video_duration: totalMinutes
                        }));
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Seconds</Label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={lessonForm.duration_seconds}
                      onChange={(e) => {
                        const seconds = parseInt(e.target.value) || 0;
                        const totalMinutes = lessonForm.duration_hours * 60 + lessonForm.duration_minutes + Math.floor(seconds / 60);
                        setLessonForm(prev => ({
                          ...prev, 
                          duration_seconds: seconds,
                          video_duration: totalMinutes
                        }));
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
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

            <DripContentSettings
              value={{
                drip_enabled: lessonForm.drip_enabled,
                drip_type: lessonForm.drip_type,
                drip_days: lessonForm.drip_days,
                drip_release_date: lessonForm.drip_release_date,
                drip_lock_message: lessonForm.drip_lock_message
              }}
              onChange={(dripData: DripContentData) => {
                setLessonForm(prev => ({
                  ...prev,
                  drip_enabled: dripData.drip_enabled,
                  drip_type: dripData.drip_type,
                  drip_days: dripData.drip_days,
                  drip_release_date: dripData.drip_release_date,
                  drip_lock_message: dripData.drip_lock_message
                }));
              }}
            />

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
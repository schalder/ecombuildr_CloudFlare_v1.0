import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Circle
} from 'lucide-react';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CourseLesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  video_duration: number | null;
  sort_order: number;
  is_published: boolean;
  is_preview: boolean;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  lessons: CourseLesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content: string | null;
  modules: CourseModule[];
}

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { member, loading: authLoading } = useMemberAuth();
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !member) {
      navigate('/courses/members/login');
    }
  }, [member, authLoading, navigate]);

  // Verify access and fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!member || !courseId) return;

      try {
        setLoading(true);

        // Verify access first
        const { data: accessCheck } = await supabase.rpc('verify_member_course_access', {
          p_member_account_id: member.id,
          p_course_id: courseId
        });

        if (!accessCheck) {
          toast.error('You do not have access to this course');
          navigate('/courses/members');
          return;
        }

        setHasAccess(true);

        // Fetch course with modules and lessons
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            *,
            lessons:course_lessons(*)
          `)
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('sort_order');

        if (modulesError) throw modulesError;

        const modules = modulesData.map(module => ({
          ...module,
          lessons: (module.lessons as CourseLesson[])
            .filter(lesson => lesson.is_published)
            .sort((a, b) => a.sort_order - b.sort_order)
        }));

        setCourse({
          ...courseData,
          modules
        });

        // Auto-expand first module and select first lesson
        if (modules.length > 0) {
          setExpandedModules([modules[0].id]);
          if (modules[0].lessons.length > 0) {
            setSelectedLesson(modules[0].lessons[0]);
          }
        }

      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load course');
        navigate('/courses/members');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [member, courseId, navigate]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const markLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const renderVideoContent = (lesson: CourseLesson) => {
    if (!lesson.video_url) return null;

    const isYoutube = lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be');
    
    if (isYoutube) {
      let embedUrl = lesson.video_url;
      if (lesson.video_url.includes('youtube.com/watch?v=')) {
        embedUrl = lesson.video_url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
      } else if (lesson.video_url.includes('youtu.be/')) {
        embedUrl = lesson.video_url.replace('youtu.be/', 'youtube.com/embed/');
      }
      
      return (
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
            title={lesson.title}
          />
        </AspectRatio>
      );
    }
    
    return (
      <AspectRatio ratio={16 / 9}>
        <video
          src={lesson.video_url}
          controls
          className="w-full h-full rounded-lg"
          title={lesson.title}
          onEnded={() => markLessonComplete(lesson.id)}
        />
      </AspectRatio>
    );
  };

  const calculateProgress = () => {
    if (!course) return 0;
    
    const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
    if (totalLessons === 0) return 0;
    
    return Math.round((completedLessons.size / totalLessons) * 100);
  };

  const getTotalDuration = () => {
    if (!course) return 0;
    
    return course.modules.reduce((total, module) => {
      return total + module.lessons.reduce((moduleTotal, lesson) => {
        return moduleTotal + (lesson.video_duration || 0);
      }, 0);
    }, 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!member || !hasAccess || !course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/courses/members')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
              <div>
                <h1 className="text-xl font-bold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {course.modules.length} modules • {getTotalDuration()} min total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">Progress: {calculateProgress()}%</p>
                <Progress value={calculateProgress()} className="w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Navigation Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Content</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{course.modules.length} modules</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTotalDuration()} min</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.modules.map((module) => (
                  <Collapsible
                    key={module.id}
                    open={expandedModules.includes(module.id)}
                    onOpenChange={() => toggleModule(module.id)}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg text-left">
                      {expandedModules.includes(module.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{module.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {module.lessons.length} lessons
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-6 space-y-1">
                      {module.lessons.map((lesson, index) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={cn(
                            "flex items-center gap-2 w-full p-2 rounded text-left text-sm hover:bg-muted transition-colors",
                            selectedLesson?.id === lesson.id && "bg-primary/10 text-primary"
                          )}
                        >
                          {completedLessons.has(lesson.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Play className="h-3 w-3" />
                          <span className="flex-1 text-left">{lesson.title}</span>
                          {lesson.video_duration && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.video_duration}min
                            </span>
                          )}
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedLesson ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle>{selectedLesson.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Video Lesson
                        </Badge>
                        {selectedLesson.video_duration && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {selectedLesson.video_duration} min
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={completedLessons.has(selectedLesson.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => markLessonComplete(selectedLesson.id)}
                      disabled={completedLessons.has(selectedLesson.id)}
                    >
                      {completedLessons.has(selectedLesson.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Video Content */}
                  {selectedLesson.video_url && (
                    <div className="w-full">
                      {renderVideoContent(selectedLesson)}
                    </div>
                  )}

                  {/* Lesson Text Content */}
                  {selectedLesson.content && (
                    <>
                      <Separator />
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                      </div>
                    </>
                  )}

                  {/* Resources Section */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Resources
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button variant="outline" className="justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Lesson Notes
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Downloadable Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to {course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.thumbnail_url && (
                    <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  )}
                  
                  {course.description && (
                    <div className="prose prose-sm max-w-none">
                      <p>{course.description}</p>
                    </div>
                  )}

                  {course.content && (
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: course.content }} />
                    </div>
                  )}

                  <Separator />
                  
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a lesson from the sidebar to start learning
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
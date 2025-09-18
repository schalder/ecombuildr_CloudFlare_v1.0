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
import { supabase } from '@/integrations/supabase/client';
import { cn, formatDuration } from '@/lib/utils';
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

interface MemberAccount {
  id: string;
  store_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
}

interface CoursePlayerPageProps {
  courseId?: string;
}

const CoursePlayerPage = ({ courseId: propCourseId }: CoursePlayerPageProps = {}) => {
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const courseId = propCourseId || paramCourseId;
  const navigate = useNavigate();
  
  const [member, setMember] = useState<MemberAccount | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Check member authentication and access
  useEffect(() => {
    const checkMemberAccess = async () => {
      try {
        // Check for member session in localStorage
        const memberData = localStorage.getItem('member_session');
        if (!memberData) {
          navigate('/courses/members/login');
          return;
        }

        const memberAccount = JSON.parse(memberData);
        setMember(memberAccount);

        if (!courseId) {
          navigate('/courses/members');
          return;
        }

        // Verify access to the course
        const { data: accessCheck } = await supabase.rpc('verify_member_course_access', {
          p_member_account_id: memberAccount.id,
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
        console.error('Error checking member access:', error);
        navigate('/courses/members/login');
      } finally {
        setLoading(false);
      }
    };

    checkMemberAccess();
  }, [courseId, navigate]);

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

    const videoUrl = lesson.video_url.trim();
    
    // Check if it's an iframe/embed code
    if (videoUrl.includes('<iframe') || videoUrl.includes('<embed')) {
      return (
        <AspectRatio ratio={16 / 9}>
          <div 
            className="w-full h-full rounded-lg"
            dangerouslySetInnerHTML={{ __html: videoUrl }}
          />
        </AspectRatio>
      );
    }

    // YouTube URL handling
    const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    if (isYoutube) {
      let embedUrl = videoUrl;
      if (videoUrl.includes('youtube.com/watch?v=')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (videoUrl.includes('youtube.com/embed/')) {
        embedUrl = videoUrl;
      }
      
      return (
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </AspectRatio>
      );
    }

    // Vimeo URL handling
    const isVimeo = videoUrl.includes('vimeo.com');
    if (isVimeo) {
      let embedUrl = videoUrl;
      if (videoUrl.includes('vimeo.com/')) {
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
      
      return (
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
            title={lesson.title}
            allow="autoplay; fullscreen; picture-in-picture"
          />
        </AspectRatio>
      );
    }

    // Wistia URL handling
    const isWistia = videoUrl.includes('wistia.com') || videoUrl.includes('wi.st');
    if (isWistia) {
      let embedUrl = videoUrl;
      if (videoUrl.includes('wistia.com/medias/')) {
        const videoId = videoUrl.split('medias/')[1]?.split('?')[0];
        embedUrl = `https://fast.wistia.net/embed/iframe/${videoId}`;
      } else if (videoUrl.includes('wi.st/medias/')) {
        const videoId = videoUrl.split('medias/')[1]?.split('?')[0];
        embedUrl = `https://fast.wistia.net/embed/iframe/${videoId}`;
      }
      
      return (
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
            title={lesson.title}
            allow="autoplay; fullscreen"
          />
        </AspectRatio>
      );
    }
    
    // Default to regular video element for direct video URLs
    return (
      <AspectRatio ratio={16 / 9}>
        <video
          src={videoUrl}
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

  if (loading) {
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
                  {course.modules.length} modules • {formatDuration(getTotalDuration())}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
                <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{course.modules.length} modules</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(getTotalDuration())}</span>
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
                          <span className="flex-1 text-left text-xs leading-tight">{lesson.title}</span>
                          {lesson.video_duration && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(lesson.video_duration)}
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
          <div className="lg:col-span-2">
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
                            {formatDuration(selectedLesson.video_duration)}
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
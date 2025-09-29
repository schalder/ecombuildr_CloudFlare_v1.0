import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CourseNavigationMenu } from '@/components/course/CourseNavigationMenu';
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
  Circle,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LessonCountdown } from '@/components/drip-content/LessonCountdown';
import { isLessonAvailable } from '@/utils/dripContentUtils';

interface CourseLesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  video_duration: number | null;
  sort_order: number;
  is_published: boolean;
  is_preview: boolean;
  drip_enabled?: boolean;
  drip_type?: 'days_after_purchase' | 'specific_date';
  drip_days?: number;
  drip_release_date?: string;
  drip_lock_message?: string;
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
  theme_settings?: {
    module_color?: string;
    navigation_menu?: {
      enabled: boolean;
      items: Array<{
        id: string;
        label: string;
        url: string;
        new_tab: boolean;
      }>;
      fontSize?: string;
      fontWeight?: string;
    };
  };
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
  const [courseOrder, setCourseOrder] = useState<any>(null);

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

        // Fetch member's course order for drip content through course_member_access
        (async () => {
          try {
            const { data } = await (supabase as any)
              .from('course_member_access')
              .select(`
                course_order_id,
                course_orders!inner(
                  id,
                  created_at,
                  course_id
                )
              `)
              .eq('course_orders.course_id', courseId)
              .eq('member_account_id', memberAccount.id)
              .eq('is_active', true)
              .maybeSingle();

            if (data?.course_orders) {
              setCourseOrder({
                id: data.course_orders.id,
                created_at: data.course_orders.created_at,
                course_id: data.course_orders.course_id
              });
            }
          } catch (error) {
            console.error('Error fetching course order:', error);
          }
        })();

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

        const modules = modulesData?.map((module: any) => ({
          ...module,
          lessons: (module.lessons || [])
            .filter((lesson: any) => lesson.is_published)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
        })) || [];

        const themeSettings = courseData.theme_settings as any;
        setCourse({
          ...courseData,
          modules,
          theme_settings: {
            module_color: "#3b82f6",
            ...(themeSettings || {})
          }
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

  const renderLessonContent = (lesson: CourseLesson) => {
    if (!lesson.drip_enabled) {
      return (
        <>
          {/* Video Content */}
          {lesson.video_url && (
            <div className="w-full">
              {renderVideoContent(lesson)}
            </div>
          )}

          {/* Lesson Text Content */}
          {lesson.content && (
            <>
              <Separator />
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            </>
          )}
        </>
      );
    }

    const { available, releaseDate } = isLessonAvailable(lesson as any, courseOrder);

    if (!available && releaseDate) {
      return (
        <LessonCountdown
          releaseDate={releaseDate}
          lockMessage={lesson.drip_lock_message || 'This lesson will be available after you complete the prerequisites.'}
          lessonTitle={lesson.title}
        />
      );
    }

    if (!courseOrder) {
      return (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Locked</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground">
              {lesson.drip_lock_message || 'This lesson is locked until its scheduled release.'}
            </p>
            {lesson.drip_type === 'days_after_purchase' && typeof lesson.drip_days === 'number' && (
              <p className="text-sm text-muted-foreground">Available {lesson.drip_days} day{lesson.drip_days === 1 ? '' : 's'} after purchase.</p>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {/* Video Content */}
        {lesson.video_url && (
          <div className="w-full">
            {renderVideoContent(lesson)}
          </div>
        )}

        {/* Lesson Text Content */}
        {lesson.content && (
          <>
            <Separator />
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          </>
        )}
      </>
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
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/courses/members')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </div>
            {course?.theme_settings?.navigation_menu?.enabled && (
              <CourseNavigationMenu 
                items={course.theme_settings.navigation_menu.items || []}
                fontSize={course.theme_settings.navigation_menu.fontSize || 'text-sm'}
                fontWeight={course.theme_settings.navigation_menu.fontWeight || 'font-normal'}
              />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-background to-muted/50">
                <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.modules.length} modules
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{getTotalDuration()} min</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {course.modules.map((module, moduleIndex) => {
                  const moduleColor = course.theme_settings?.module_color || "#3b82f6";
                  const completedLessonsInModule = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
                  
                  return (
                    <div key={module.id} className="group">
                      <Collapsible
                        open={expandedModules.includes(module.id)}
                        onOpenChange={() => toggleModule(module.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Card 
                            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/20"
                            style={{ 
                              background: `linear-gradient(135deg, ${moduleColor}15 0%, ${moduleColor}08 100%)`,
                              borderColor: `${moduleColor}20`
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-sm"
                                  style={{ backgroundColor: moduleColor }}
                                >
                                  {moduleIndex + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base truncate">{module.title}</h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {module.lessons.length} lessons
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {completedLessonsInModule === module.lessons.length && module.lessons.length > 0 && (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  )}
                                  {expandedModules.includes(module.id) ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 ml-4 space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLesson(lesson)}
                              className={cn(
                                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md border",
                                selectedLesson?.id === lesson.id 
                                  ? "bg-primary/10 border-primary/30 shadow-sm" 
                                  : "hover:bg-muted/50 border-transparent hover:border-muted-foreground/20"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {completedLessons.has(lesson.id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div 
                                    className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                                    style={{ borderColor: selectedLesson?.id === lesson.id ? moduleColor : '#94a3b8' }}
                                  />
                                )}
                                <Play className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {lessonIndex + 1}.
                                  </span>
                                  <span className="font-medium text-sm truncate">{lesson.title}</span>
                                </div>
                              </div>
                              {lesson.video_duration && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex-shrink-0">
                                  {lesson.video_duration}min
                                </span>
                              )}
                            </button>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
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
                  {renderLessonContent(selectedLesson)}
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
                      <div dangerouslySetInnerHTML={{ __html: course.description }} />
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
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  BookOpen, 
  Play, 
  FileText, 
  Link as LinkIcon,
  Download,
  Video,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Users,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CourseLesson {
  id: string;
  title: string;
  content?: string;
  video_url?: string;
  sort_order: number;
  is_published: boolean;
  is_preview: boolean;
  video_duration?: number;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  is_published: boolean;
  course_lessons: CourseLesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  price: number;
  compare_price?: number;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  course_modules: CourseModule[];
}

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules!inner(
            id,
            title,
            description,
            sort_order,
            is_published,
            course_lessons!inner(
              id,
              title,
              content,
              video_url,
              sort_order,
              is_published,
              is_preview,
              video_duration
            )
          )
        `)
        .eq('id', courseId)
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('course_modules.is_published', true)
        .eq('course_modules.course_lessons.is_published', true)
        .order('sort_order', { referencedTable: 'course_modules' })
        .order('sort_order', { referencedTable: 'course_modules.course_lessons' })
        .single();

      if (error) throw error;
      return data as CourseDetail;
    },
    enabled: !!courseId
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLessonIcon = (lesson: CourseLesson) => {
    if (lesson.video_url) {
      return <Video className="h-4 w-4" />;
    } else if (lesson.content) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderLessonContent = (lesson: CourseLesson) => {
    if (!lesson.is_preview) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
            <p className="text-muted-foreground">
              This lesson is available after enrollment
            </p>
          </div>
        </div>
      );
    }

    if (lesson.video_url) {
      return (
        <div className="aspect-video">
          <video 
            controls 
            className="w-full h-full rounded-lg"
            poster={course?.thumbnail_url}
          >
            <source src={lesson.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    if (lesson.content) {
      return (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      );
    }

    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Content not available</p>
      </div>
    );
  };

  const totalLessons = course?.course_modules.reduce((total, module) => 
    total + module.course_lessons.length, 0) || 0;

  const totalDuration = course?.course_modules.reduce((total, module) => 
    total + module.course_lessons.reduce((moduleTotal, lesson) => 
      moduleTotal + (lesson.video_duration || 15), 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or is not available.
          </p>
          <Button asChild>
            <Link to="/courses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{course.title} | Course Library</title>
        <meta 
          name="description" 
          content={course.description || `Learn ${course.title} with our comprehensive course`} 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link to="/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                
                {course.description && (
                  <p className="text-lg text-muted-foreground mb-6">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.course_modules.length} modules</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span>{totalLessons} lessons</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      {course.price > 0 ? (
                        <div>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-3xl font-bold">৳{course.price}</span>
                            {course.compare_price && course.compare_price > course.price && (
                              <span className="text-lg text-muted-foreground line-through">
                                ৳{course.compare_price}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary">Premium Course</Badge>
                        </div>
                      ) : (
                        <div>
                          <span className="text-3xl font-bold text-green-600">Free</span>
                          <Badge variant="secondary" className="ml-2">Free Course</Badge>
                        </div>
                      )}
                    </div>
                    
                    <Button className="w-full mb-4" size="lg">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Enroll Now
                    </Button>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>30-day money-back guarantee</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Content */}
            <div className="lg:col-span-2">
              {selectedLesson ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getLessonIcon(selectedLesson)}
                        {selectedLesson.title}
                      </CardTitle>
                      {selectedLesson.is_preview && (
                        <Badge variant="secondary">Preview</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderLessonContent(selectedLesson)}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Welcome to the Course</h3>
                    <p className="text-muted-foreground">
                      Select a lesson from the curriculum to start learning
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Course Curriculum */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Course Curriculum</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {course.course_modules.map((module, moduleIndex) => (
                      <div key={module.id}>
                        <Collapsible
                          open={expandedModules.includes(module.id)}
                          onOpenChange={() => toggleModule(module.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                              <div className="text-left">
                                <h4 className="font-semibold text-sm">
                                  {moduleIndex + 1}. {module.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {module.course_lessons.length} lessons
                                </p>
                              </div>
                              {expandedModules.includes(module.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="border-t">
                              {module.course_lessons.map((lesson, lessonIndex) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => setSelectedLesson(lesson)}
                                  className={`w-full text-left p-3 pl-8 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 ${
                                    selectedLesson?.id === lesson.id ? 'bg-primary/10' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      {getLessonIcon(lesson)}
                                      <span className="text-sm">
                                        {lessonIndex + 1}. {lesson.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {lesson.is_preview && (
                                        <Badge variant="outline" className="text-xs">
                                          Preview
                                        </Badge>
                                      )}
                                      {lesson.video_duration && (
                                        <span className="text-xs text-muted-foreground">
                                          {lesson.video_duration}m
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CourseDetail;
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  BookOpen, 
  Play, 
  FileText, 
  Download,
  Video,
  ArrowLeft,
  CheckCircle,
  MonitorPlay,
  Smartphone,
  Award,
  Star,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { parseVideoUrl, buildEmbedUrl, sanitizeEmbedCode } from '@/components/page-builder/utils/videoUtils';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';
import { formatCoursePrice } from '@/utils/currency';
import { MetaTags } from '@/components/MetaTags';
import { useStore } from '@/contexts/StoreContext';
import { CourseEnrollmentCard } from '@/components/course/CourseEnrollmentCard';
import { setSEO } from '@/lib/seo';

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
  content?: string;
  thumbnail_url?: string;
  price: number;
  compare_price?: number;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  includes_title?: string;
  includes_items?: string[];
  course_modules: CourseModule[];
  payment_methods: {
    bkash: boolean;
    nagad: boolean;
    eps: boolean;
  };
}

interface StorefrontCourseDetailProps {
  courseSlug?: string;
  courseId?: string;
}

const StorefrontCourseDetail: React.FC<StorefrontCourseDetailProps> = ({ courseSlug, courseId }) => {
  const { courseSlug: paramSlug, courseId: paramId } = useParams<{ courseSlug?: string; courseId?: string }>();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState('');
  const [previewLesson, setPreviewLesson] = useState<CourseLesson | null>(null);
  const { currency } = useCourseCurrency();
  const { store } = useStore();

  const finalCourseSlug = courseSlug || paramSlug;
  const finalCourseId = courseId || paramId;

  // Fetch store settings for favicon
  const { data: storeSettings } = useQuery({
    queryKey: ['store-favicon', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('course_favicon_url')
        .eq('id', store.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Set favicon when store settings are loaded
  useEffect(() => {
    if (storeSettings?.course_favicon_url) {
      setSEO({
        favicon: storeSettings.course_favicon_url
      });
    }
  }, [storeSettings?.course_favicon_url]);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['storefront-course-detail', finalCourseSlug, finalCourseId],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          id, title, description, content, thumbnail_url, price, compare_price, is_published, is_active, created_at, includes_title, includes_items, payment_methods,
          course_modules(
            id, title, description, sort_order, is_published,
            course_lessons(
              id, title, content, video_url, sort_order, is_published, is_preview, video_duration
            )
          )
        `)
        .eq('is_published', true)
        .eq('is_active', true)
        .order('sort_order', { referencedTable: 'course_modules' })
        .order('sort_order', { referencedTable: 'course_modules.course_lessons' });

      if (finalCourseId) {
        query = query.eq('id', finalCourseId);
      } else if (finalCourseSlug) {
        // For now, we'll try to find by title matching the slug
        query = query.ilike('title', `%${finalCourseSlug.replace(/-/g, ' ')}%`);
      } else {
        throw new Error('Course slug or ID is required');
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Course not found');
      
      return {
        ...data,
        payment_methods: data.payment_methods as CourseDetail['payment_methods'] || { bkash: false, nagad: false, eps: false }
      } as CourseDetail;
    },
    enabled: !!(finalCourseSlug || finalCourseId)
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const totalLessons = course?.course_modules.reduce((total, module) => 
    total + module.course_lessons.length, 0) || 0;

  const totalDuration = course?.course_modules.reduce((total, module) => 
    total + module.course_lessons.reduce((moduleTotal, lesson) => 
      moduleTotal + (lesson.video_duration || 15), 0), 0) || 0;

  const publishedLessons = course?.course_modules.reduce((total, module) => 
    total + module.course_lessons.filter(lesson => lesson.is_published).length, 0) || 0;

  const totalResources = course?.course_modules.reduce((total, module) => 
    total + module.course_lessons.filter(lesson => lesson.content || lesson.video_url).length, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-32 w-full mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
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
      <MetaTags
        title={`${course.title} | Course Library`}
        description={course.description || `Learn ${course.title} with our comprehensive course`}
        image={course.thumbnail_url}
        keywords={[course.title, 'course', 'online learning', 'education']}
        canonical={`${window.location.origin}/courses/${course.id}`}
        favicon={storeSettings?.course_favicon_url}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Back Navigation */}
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/courses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <div className="space-y-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                  {course.title}
                </h1>

                {/* Course Overview (Description) */}
                {course.description && (
                  <div className="prose prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: course.description }} />
                  </div>
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
                    <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
                  </div>
                </div>
              </div>

              {/* Course Description (Content) */}
              {course.content && (
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: course.content }} />
                </div>
              )}

              {/* Course Modules */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-primary">Course module goes here</h2>
                
                <div className="border-2 border-dashed border-border rounded-lg p-6 space-y-4">
                  {course.course_modules.map((module, moduleIndex) => (
                    <div key={module.id} className="space-y-2">
                      <Collapsible
                        open={expandedModules.includes(module.id)}
                        onOpenChange={() => toggleModule(module.id)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-primary text-primary-foreground p-3 rounded-lg flex items-center justify-between hover:bg-primary/90 transition-colors">
                            <div className="text-left">
                              <h3 className="font-semibold">
                                {module.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">
                                {Math.floor(module.course_lessons.reduce((total, lesson) => total + (lesson.video_duration || 15), 0) / 60)}m
                              </Badge>
                              {expandedModules.includes(module.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="ml-4 mt-2 space-y-1">
                            {module.course_lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Play className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.is_preview && lesson.is_published && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-6 px-2">
                                          <Eye className="h-3 w-3 mr-1" />
                                          Preview
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                        <DialogHeader>
                                          <DialogTitle>{lesson.title}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          {lesson.video_url && (() => {
                                            const videoInfo = parseVideoUrl(lesson.video_url);
                                            
                                            if (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo' || videoInfo.type === 'wistia') {
                                              const embedUrl = buildEmbedUrl(videoInfo.embedUrl!, videoInfo.type, {
                                                controls: true,
                                                autoplay: false
                                              });
                                              
                                              return (
                                                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                                  <iframe
                                                    src={embedUrl}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                  />
                                                </div>
                                              );
                                            } else if (videoInfo.type === 'hosted') {
                                              return (
                                                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                                  <video
                                                    controls
                                                    className="w-full h-full"
                                                    poster="/placeholder.svg"
                                                  >
                                                    <source src={lesson.video_url} type="video/mp4" />
                                                    Your browser does not support the video tag.
                                                  </video>
                                                </div>
                                              );
                                            } else {
                                              // Handle custom embed codes (iframe)
                                              const sanitizedCode = sanitizeEmbedCode(lesson.video_url);
                                              return (
                                                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                                  <div 
                                                    className="w-full h-full"
                                                    dangerouslySetInnerHTML={{ __html: sanitizedCode }}
                                                  />
                                                </div>
                                              );
                                            }
                                          })()}
                                          {lesson.content && (
                                            <div className="prose prose-sm max-w-none">
                                              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                            </div>
                                          )}
                                          {!lesson.video_url && !lesson.content && (
                                            <div className="text-center py-8 text-muted-foreground">
                                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                              <p>No preview content available</p>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  {lesson.video_duration && (
                                    <span className="text-xs text-muted-foreground">
                                      {String(Math.floor(lesson.video_duration / 60)).padStart(2, '0')}:{String(lesson.video_duration % 60).padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Combined Course Card: Thumbnail + Pricing + Includes */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Course Thumbnail */}
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <MonitorPlay className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Course Preview</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Section */}
                  <div className="text-center">
                    {course.price > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-bold text-orange-600">
                            {formatCoursePrice(course.price, currency)}
                          </span>
                          {course.compare_price && course.compare_price > course.price && (
                            <span className="text-lg text-muted-foreground line-through">
                              {formatCoursePrice(course.compare_price, currency)}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline">Premium Course</Badge>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-green-600">Free</span>
                        <Badge variant="outline" className="ml-2">Free Course</Badge>
                      </div>
                    )}
                  </div>

                  {/* Payment Options */}
                  {course.price > 0 && (
                    <CourseEnrollmentCard 
                      course={course} 
                      storeId={store?.id || ''} 
                    />
                  )}



                  {/* Course Includes */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">
                      {course.includes_title || "This Course Includes"}
                    </h3>
                    <div className="space-y-3 text-sm">
                      {course.includes_items && course.includes_items.length > 0 ? (
                        course.includes_items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{Math.floor(totalDuration / 60)}.{Math.floor((totalDuration % 60) * 10 / 60)} hours on-demand video</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{publishedLessons} articles</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{totalResources} downloadable resources</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Full lifetime access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Access on mobile and TV</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Certificate of completion</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StorefrontCourseDetail;
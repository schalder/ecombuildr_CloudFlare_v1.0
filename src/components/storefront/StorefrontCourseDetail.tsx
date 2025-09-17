import React, { useState } from 'react';
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

  const finalCourseSlug = courseSlug || paramSlug;
  const finalCourseId = courseId || paramId;

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['storefront-course-detail', finalCourseSlug, finalCourseId],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          id, title, description, thumbnail_url, price, compare_price, is_published, is_active, created_at,
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
      return data as CourseDetail;
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
      <Helmet>
        <title>{course.title} | Course Library</title>
        <meta 
          name="description" 
          content={course.description || `Learn ${course.title} with our comprehensive course`} 
        />
        <link rel="canonical" href={`${window.location.origin}/courses/${course.id}`} />
        <meta property="og:title" content={`${course.title} | Course Library`} />
        <meta property="og:description" content={course.description || `Learn ${course.title} with our comprehensive course`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${window.location.origin}/courses/${course.id}`} />
        {course.thumbnail_url && <meta property="og:image" content={course.thumbnail_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${course.title} | Course Library`} />
        <meta name="twitter:description" content={course.description || `Learn ${course.title} with our comprehensive course`} />
        {course.thumbnail_url && <meta name="twitter:image" content={course.thumbnail_url} />}
      </Helmet>

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
                
                {course.description && (
                  <p className="text-lg text-muted-foreground">
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
                    <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
                  </div>
                </div>
              </div>

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
                                          {lesson.video_url && (
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
                                          )}
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
              {/* Course Thumbnail */}
              <Card>
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
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
                </CardContent>
              </Card>

              {/* Pricing & Enrollment */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    {course.price > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-bold text-orange-600">
                            ${course.price}
                          </span>
                          {course.compare_price && course.compare_price > course.price && (
                            <span className="text-lg text-muted-foreground line-through">
                              ${course.compare_price}
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

                  {course.price > 0 && (
                    <div className="space-y-3">
                      <Select value={selectedPaymentGateway} onValueChange={setSelectedPaymentGateway}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Payment Gateway" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Credit Card (Stripe)</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter Your Coupon"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="outline">
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button className="w-full" size="lg">
                    <Star className="h-5 w-5 mr-2" />
                    Enrol Now
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>30-day money-back guarantee</p>
                  </div>
                </CardContent>
              </Card>

              {/* Course Includes */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">This Course Includes</h3>
                  <div className="space-y-3 text-sm">
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
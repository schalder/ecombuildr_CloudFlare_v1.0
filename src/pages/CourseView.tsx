import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Edit, 
  Eye, 
  BookOpen, 
  PlayCircle,
  Clock,
  Users,
  DollarSign,
  Globe
} from 'lucide-react';
import { useUserStore } from '@/hooks/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';
import { formatCoursePrice } from '@/utils/currency';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_price?: number;
  thumbnail_url?: string;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  id: string;
  title: string;
  content?: string;
  video_url?: string;
  video_duration?: number;
  sort_order: number;
  is_published: boolean;
  is_preview: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  is_published: boolean;
  course_lessons: Lesson[];
}

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { store } = useUserStore();
  const { currency } = useCourseCurrency();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

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

  const totalLessons = modules.reduce((total, module) => total + module.course_lessons.length, 0);
  const publishedLessons = modules.reduce((total, module) => 
    total + module.course_lessons.filter(lesson => lesson.is_published).length, 0);
  const totalDuration = modules.reduce((total, module) => 
    total + module.course_lessons.reduce((moduleTotal, lesson) => 
      moduleTotal + (lesson.video_duration || 15), 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={course.title} description="View course details and statistics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to={`/courses/${course.id}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/dashboard/courses/${course.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Link>
            </Button>
          </div>
        </div>

        {/* Course Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{course.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant={course.is_active ? "default" : "destructive"}>
                      {course.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                {course.description && (
                  <CardDescription className="text-base">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              {course.thumbnail_url && (
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Course Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{modules.length}</div>
                  <div className="text-sm text-muted-foreground">Modules</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <PlayCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{publishedLessons}/{totalLessons}</div>
                  <div className="text-sm text-muted-foreground">Published Lessons</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{Math.round(totalDuration / 60)}h</div>
                  <div className="text-sm text-muted-foreground">Total Duration</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{formatCoursePrice(course.price, currency)}</div>
                  <div className="text-sm text-muted-foreground">Price</div>
                </CardContent>
              </Card>
            </div>

            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {modules.length} modules • {totalLessons} lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4" />
                    <p>No modules created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module, moduleIndex) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            {moduleIndex + 1}. {module.title}
                          </h4>
                          <Badge variant={module.is_published ? "default" : "secondary"}>
                            {module.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        
                        {module.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {module.description}
                          </p>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          {module.course_lessons.length} lessons • 
                          {module.course_lessons.filter(l => l.is_published).length} published
                        </div>
                        
                        {module.course_lessons.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {module.course_lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-center justify-between text-sm pl-4">
                                <div className="flex items-center gap-2">
                                  {lesson.video_url ? (
                                    <PlayCircle className="h-4 w-4" />
                                  ) : (
                                    <BookOpen className="h-4 w-4" />
                                  )}
                                  <span>{lessonIndex + 1}. {lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.is_preview && (
                                    <Badge variant="outline" className="text-xs">Preview</Badge>
                                  )}
                                  <Badge variant={lesson.is_published ? "default" : "secondary"} className="text-xs">
                                    {lesson.is_published ? "Published" : "Draft"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(course.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatCoursePrice(course.price, currency)}</span>
                    {course.compare_price && course.compare_price > course.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCoursePrice(course.compare_price, currency)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant={course.is_active ? "default" : "destructive"}>
                      {course.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link to={`/dashboard/courses/${course.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Course
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/courses/${course.id}`} target="_blank">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Course
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link to="/dashboard/courses/domains">
                    <Globe className="h-4 w-4 mr-2" />
                    Course Domains
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseView;
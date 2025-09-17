import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users, Star, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';
import { formatCoursePrice } from '@/utils/currency';
import { MetaTags } from '@/components/MetaTags';
import { useStore } from '@/contexts/StoreContext';
import { setSEO } from '@/lib/seo';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  compare_price: number | null;
  created_at: string;
  updated_at: string;
  modules_count?: number;
  lessons_count?: number;
  estimated_duration?: number;
}

const CourseLibrary = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const location = useLocation();
  const { currency } = useCourseCurrency();
  const { store } = useStore();

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

  const { data: courses, isLoading } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id, title, description, thumbnail_url, price, compare_price, created_at, updated_at,
          course_modules(
            id,
            course_lessons(id)
          )
        `) // left join style embed to avoid filtering out courses with no modules/lessons
        .eq('is_published', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate module and lesson counts
      return (data || []).map((course: any) => ({
        ...course,
        modules_count: course.course_modules?.length || 0,
        lessons_count: course.course_modules?.reduce((total: number, module: any) => 
          total + (module.course_lessons?.length || 0), 0) || 0,
        estimated_duration: (course.course_modules?.reduce((total: number, module: any) => 
          total + (module.course_lessons?.length || 0), 0) || 0) * 15 // 15 min per lesson estimate
      }));
    }
  });

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <MetaTags
        title="Course Library | Learn from Expert-Created Courses"
        description="Discover our extensive library of professional courses. Learn new skills with expert-created content and advance your career."
        image={filteredCourses && filteredCourses[0]?.thumbnail_url}
        keywords={['courses', 'online learning', 'education', 'training', 'skills']}
        canonical={`${window.location.origin}${location.pathname}`}
        favicon={storeSettings?.course_favicon_url}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Course Library</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover professional courses designed to help you master new skills and advance your career
              </p>
              
              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Course Grid */}
        <main className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Course Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-background/90 text-foreground">
                        {course.price > 0 ? formatCoursePrice(course.price, currency, true) : 'Free'}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {course.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Course Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.modules_count} modules</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.estimated_duration}m</span>
                      </div>
                    </div>

                    {/* Price Display */}
                    {course.price > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl font-bold">{formatCoursePrice(course.price, currency)}</span>
                        {course.compare_price && course.compare_price > course.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCoursePrice(course.compare_price, currency)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Button asChild className="w-full">
                      <Link to={`/courses/${course.id}`}>
                        View Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search terms.' : 'No courses are currently available.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default CourseLibrary;
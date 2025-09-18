import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  BookOpen, 
  Play, 
  Search,
  Star,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';
import { formatCoursePrice } from '@/utils/currency';
import { MetaTags } from '@/components/MetaTags';
import { setSEO } from '@/lib/seo';

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  price: number;
  compare_price?: number;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  course_modules: Array<{
    id: string;
    course_lessons: Array<{
      id: string;
      video_duration?: number;
    }>;
  }>;
}

const StorefrontCourseLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { store } = useStore();
  const { currency } = useCourseCurrency();

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

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['storefront-courses', store?.id, searchTerm, selectedCategory, priceFilter],
    queryFn: async () => {
      if (!store?.id) return [];

      let query = supabase
        .from('courses')
        .select(`
          id, title, description, thumbnail_url, price, compare_price, is_published, is_active, created_at,
          course_modules(
            id,
            course_lessons(
              id, video_duration
            )
          )
        `)
        .eq('store_id', store.id)
        .eq('is_published', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (priceFilter === 'free') {
        query = query.eq('price', 0);
      } else if (priceFilter === 'paid') {
        query = query.gt('price', 0);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Course[];
    },
    enabled: !!store?.id
  });

  const getTotalLessons = (course: Course) => {
    return course.course_modules.reduce((total, module) => 
      total + module.course_lessons.length, 0);
  };

  const getTotalDuration = (course: Course) => {
    return course.course_modules.reduce((total, module) => 
      total + module.course_lessons.reduce((moduleTotal, lesson) => 
        moduleTotal + (lesson.video_duration || 15), 0), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="aspect-video w-full mb-4" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Courses</h1>
          <p className="text-muted-foreground">
            There was an error loading the course library. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title="Course Library | Learn with Our Courses"
        description="Explore our comprehensive course library and start learning today."
        canonical={`${window.location.origin}/courses`}
        favicon={storeSettings?.course_favicon_url}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Course Library</h1>
            <p className="text-lg text-muted-foreground">
              Discover our comprehensive collection of courses and start your learning journey today.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Course Grid */}
          {courses && courses.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Course Preview</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        {course.description && (
                          <div 
                            className="text-muted-foreground text-sm line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: course.description }}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Play className="h-4 w-4" />
                          <span>{getTotalLessons(course)} lessons</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(getTotalDuration(course) / 60)}h {getTotalDuration(course) % 60}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {course.price > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-orange-600">
                                {formatCoursePrice(course.price, currency)}
                              </span>
                              {course.compare_price && course.compare_price > course.price && (
                                <span className="text-lg text-muted-foreground line-through">
                                  {formatCoursePrice(course.compare_price, currency)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-green-600">Free</span>
                          )}
                        </div>
                        <Badge variant={course.price > 0 ? 'default' : 'secondary'}>
                          {course.price > 0 ? 'Premium' : 'Free'}
                        </Badge>
                      </div>

                      <Button asChild className="w-full">
                        <Link to={`/courses/${course.id}`}>
                          <Star className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' || priceFilter !== 'all'
                  ? 'Try adjusting your filters to find more courses.'
                  : 'No courses are available at the moment. Check back later!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StorefrontCourseLibrary;
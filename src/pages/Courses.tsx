import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  GraduationCap,
  PlayCircle,
  BookOpen,
  Globe
} from 'lucide-react';
import { useUserStore } from '@/hooks/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_price?: number;
  is_published: boolean;
  is_active: boolean;
  thumbnail_url?: string;
  created_at: string;
  _count?: {
    modules: number;
    lessons: number;
    enrollments: number;
  };
}

const Courses = () => {
  const navigate = useNavigate();
  const { store } = useUserStore();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCourses = async () => {
    if (!store?.id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            id,
            course_lessons (id)
          ),
          course_member_access (
            id,
            member_account_id,
            is_active,
            access_status
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include counts
      const coursesWithCounts = data?.map(course => {
        // Count active students with access to the course
        const activeStudents = course.course_member_access?.filter((access: any) => 
          access.is_active && access.access_status !== 'revoked'
        ).length || 0;

        return {
          ...course,
          _count: {
            modules: course.course_modules?.length || 0,
            lessons: course.course_modules?.reduce((total: number, module: any) => 
              total + (module.course_lessons?.length || 0), 0) || 0,
            enrollments: activeStudents
          }
        };
      }) || [];

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [store?.id, searchTerm]);

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const toggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      toast.success(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course status:', error);
      toast.error('Failed to update course status');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Courses</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Create and manage your online courses and lessons
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => navigate('/dashboard/courses/domains')} variant="outline" className="w-full sm:w-auto">
              <Globe className="mr-2 h-4 w-4" />
              Course Domains
            </Button>
            <Button onClick={() => navigate('/dashboard/courses/create')} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Search Bar - Mobile Full Width */}
        <div className="md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-foreground w-full"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
              <GraduationCap className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-foreground">{courses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active courses</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Modules</CardTitle>
              <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-foreground">
                {courses.reduce((total, course) => total + (course._count?.modules || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Course modules</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Lessons</CardTitle>
              <PlayCircle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-foreground">
                {courses.reduce((total, course) => total + (course._count?.lessons || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Video lessons</p>
            </CardContent>
          </Card>

          {/* Search Card - Desktop Only */}
          <Card className="hidden md:block bg-gradient-card border-border shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Search</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-foreground"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">All Courses</CardTitle>
            <CardDescription className="text-sm">
              Manage your course content, pricing, and publication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No courses match your search.' : 'Create your first course to get started.'}
                </p>
                <Button onClick={() => navigate('/dashboard/courses/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {course.thumbnail_url ? (
                                <img 
                                  src={course.thumbnail_url} 
                                  alt={course.title}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                  <GraduationCap className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{course.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {course.description ? course.description.replace(/<[^>]*>/g, '') : 'No description'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              ৳{course.price.toLocaleString()}
                              {course.compare_price && (
                                <div className="text-sm text-muted-foreground line-through">
                                  ৳{course.compare_price.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{course._count?.modules || 0} modules</div>
                              <div className="text-muted-foreground">{course._count?.lessons || 0} lessons</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {course._count?.enrollments || 0} students
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={course.is_published ? "default" : "secondary"}>
                                {course.is_published ? 'Published' : 'Draft'}
                              </Badge>
                              <Badge variant={course.is_active ? "default" : "destructive"}>
                                {course.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(course.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/courses/${course.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleCourseStatus(course.id, course.is_active)}
                                >
                                  {course.is_active ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteCourse(course.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-4 md:hidden">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4 w-full overflow-hidden">
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-14 h-14 rounded object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">{course.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {course.description ? course.description.replace(/<[^>]*>/g, '') : 'No description'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">৳{course.price.toLocaleString()}</p>
                          {course.compare_price && (
                            <p className="text-xs text-muted-foreground line-through">
                              ৳{course.compare_price.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground">Content</p>
                          <p className="font-medium">{course._count?.modules || 0} modules</p>
                          <p className="text-xs text-muted-foreground">{course._count?.lessons || 0} lessons</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Students</p>
                          <p className="font-medium">{course._count?.enrollments || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">{new Date(course.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={course.is_published ? "default" : "secondary"}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Badge variant={course.is_active ? "default" : "destructive"}>
                          {course.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => toggleCourseStatus(course.id, course.is_active)}
                        >
                          {course.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Courses;
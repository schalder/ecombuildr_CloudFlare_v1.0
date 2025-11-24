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
    <DashboardLayout title="Courses" description="Create, edit and manage your online courses and lessons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Courses</h1>
            <p className="text-muted-foreground">
              Manage your course content, pricing, and publication status
            </p>
          </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/courses/domains')} variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            Course Domains
          </Button>
          <Button onClick={() => navigate('/dashboard/courses/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {courses.reduce((total, course) => total + (course._count?.modules || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {courses.reduce((total, course) => total + (course._count?.lessons || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-foreground"
            />
          </div>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
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
                    <div key={course.id} className="border rounded-lg p-4 space-y-4">
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

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[120px]"
                          onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[120px]"
                          onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[120px]"
                          onClick={() => toggleCourseStatus(course.id, course.is_active)}
                        >
                          {course.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 min-w-[120px]"
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
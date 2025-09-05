import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TrainingCourse {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  category: string | null;
  tags: string[];
  estimated_duration_minutes: number | null;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  thumbnail_url: string | null;
}

export default function AdminTraining() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-training-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as TrainingCourse[];
    },
  });

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
    await supabase
      .from("training_courses")
      .update({ is_published: !currentStatus })
      .eq("id", courseId);
    
    // Refresh data
    window.location.reload();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Training Management</h1>
            <p className="text-muted-foreground">Manage training courses, modules, and lessons</p>
          </div>
          <Button onClick={() => navigate("/admin/training/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePublishStatus(course.id, course.is_published)}
                      >
                        {course.is_published ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/training/${course.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.short_description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {course.category && (
                      <Badge variant="secondary">{course.category}</Badge>
                    )}
                    <Badge variant={course.is_published ? "default" : "outline"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Created {format(new Date(course.created_at), "MMM d, yyyy")}</span>
                    {course.estimated_duration_minutes && (
                      <span>{course.estimated_duration_minutes} min</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredCourses.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No courses found</h3>
            <p className="text-muted-foreground">Create your first training course to get started.</p>
            <Button className="mt-4" onClick={() => navigate("/admin/training/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
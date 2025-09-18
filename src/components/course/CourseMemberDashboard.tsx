import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, BookOpen, Play, Clock } from 'lucide-react';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { setSEO } from '@/lib/seo';
import { useQuery } from '@tanstack/react-query';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  is_membership: boolean;
}

const CourseMemberDashboard = () => {
  const navigate = useNavigate();
  const { member, signOut, loading: authLoading } = useMemberAuth();
  const { store } = useStore();
  
  // Fetch store settings for favicon and member area content
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('course_favicon_url, course_login_logo_url, member_area_welcome_headline, member_area_welcome_subheadline')
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
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !member) {
      navigate('/courses/members/login');
    }
  }, [member, authLoading, navigate]);

  // Fetch accessible content
  useEffect(() => {
    const fetchData = async () => {
      if (!member || !store) return;

      try {
        setLoading(true);

        // Fetch accessible products (membership products the user has purchased)
        const { data: accessData, error: accessError } = await supabase
          .from('member_content_access')
          .select('product_id')
          .eq('member_account_id', member.id)
          .eq('is_active', true);

        if (accessError) {
          console.error('Error fetching access data:', accessError);
        } else if (accessData && accessData.length > 0) {
          const productIds = accessData.map(item => item.product_id);
          
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name, description, images, price, is_membership')
            .in('id', productIds)
            .eq('is_active', true);

          if (productsError) {
            console.error('Error fetching products:', productsError);
          } else {
            const typedProducts = (productsData || []).map(product => ({
              ...product,
              images: Array.isArray(product.images) ? product.images as string[] : []
            }));
            setProducts(typedProducts);
          }
        }

        // Fetch accessible courses (only ones the member has access to)
        const { data: accessibleCoursesData, error: coursesError } = await supabase.rpc('get_member_accessible_courses', {
          p_member_account_id: member.id
        });

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
        } else {
          const coursesWithAccess = (accessibleCoursesData || []).map(courseAccess => ({
            id: courseAccess.course_id,
            title: courseAccess.course_title,
            description: courseAccess.course_description,
            thumbnail_url: courseAccess.course_thumbnail_url,
            price: courseAccess.course_price,
            is_published: true
          }));
          setCourses(coursesWithAccess);
        }

      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [member, store]);

  const handleSignOut = () => {
    signOut();
    navigate('/courses/members/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!member || !store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {storeSettings?.course_login_logo_url ? (
                <img 
                  src={storeSettings.course_login_logo_url} 
                  alt={store.name} 
                  className="h-10 w-auto"
                />
              ) : (
                <div>
                  <h1 className="text-2xl font-bold">{store.name}</h1>
                  <p className="text-muted-foreground">Course Members Area</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{member.full_name || member.email}</p>
                <p className="text-sm text-muted-foreground">Member</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">
              {storeSettings?.member_area_welcome_headline || 'Welcome to Your Learning Hub'}
            </h2>
            <p className="text-muted-foreground">
              {storeSettings?.member_area_welcome_subheadline || 'Access your purchased courses and membership content below'}
            </p>
          </div>

          {/* Available Courses */}
          {courses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Available Courses</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        <div dangerouslySetInnerHTML={{ __html: course.description || '' }} />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/courses/learn/${course.id}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Access Content
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Purchased Memberships */}
          {products.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-6">Your Memberships</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id}>
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {courses.length === 0 && products.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
              <p className="text-muted-foreground mb-4">
                You don't have access to any courses or memberships yet.
              </p>
              <Button onClick={() => navigate('/courses')}>
                Browse Available Courses
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseMemberDashboard;
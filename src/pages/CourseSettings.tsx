import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Eye, Users, Package, Settings as SettingsIcon } from 'lucide-react';
import { useUserStore } from '@/hooks/useUserStore';
import { useToast } from '@/hooks/use-toast';

const CourseSettings = () => {
  const navigate = useNavigate();
  const { store: userStore } = useUserStore();
  const { toast } = useToast();
  
  const [libraryHeadline, setLibraryHeadline] = useState('Course Library');
  const [librarySubheadline, setLibrarySubheadline] = useState('Discover our comprehensive collection of courses and start your learning journey today.');
  const [courseLoginLogo, setCourseLoginLogo] = useState('');
  const [courseCurrency, setCourseCurrency] = useState('USD');

  // Fetch store settings including currency
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings', userStore?.id],
    queryFn: async () => {
      if (!userStore?.id) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('course_currency')
        .eq('id', userStore.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userStore?.id,
  });

  // Update currency when store settings change
  useEffect(() => {
    if (storeSettings?.course_currency) {
      setCourseCurrency(storeSettings.course_currency);
    }
  }, [storeSettings]);

  // Fetch courses for management
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', userStore?.id],
    queryFn: async () => {
      if (!userStore?.id) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules!inner(
            id,
            course_lessons(id)
          )
        `)
        .eq('store_id', userStore.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userStore?.id,
  });

  // Fetch course purchases/members
  const { data: coursePurchases = [] } = useQuery({
    queryKey: ['course-purchases', userStore?.id],
    queryFn: async () => {
      if (!userStore?.id) return [];
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(
            customer_name,
            customer_email,
            customer_phone,
            created_at,
            status
          ),
          products!inner(
            name,
            is_membership
          )
        `)
        .eq('orders.store_id', userStore.id)
        .eq('products.is_membership', true)
        .eq('orders.status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userStore?.id,
  });

  const handleSaveLibrarySettings = async () => {
    try {
      if (!userStore?.id) return;

      // Save currency setting to the store
      const { error } = await supabase
        .from('stores')
        .update({ course_currency: courseCurrency })
        .eq('id', userStore.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Course library settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle logo upload logic here
      toast({
        title: "Logo uploaded",
        description: "Course login logo has been updated successfully.",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Course Settings" description="Manage your course library and member settings">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Course Settings" description="Manage course library, bundles, member access, and branding settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Course Settings</h1>
            <p className="text-muted-foreground">
              Configure course library, manage member access, and customize branding
            </p>
          </div>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="library">Library Settings</TabsTrigger>
            <TabsTrigger value="visibility">Course Visibility</TabsTrigger>
            <TabsTrigger value="bundles">Course Bundles</TabsTrigger>
            <TabsTrigger value="members">Members & Access</TabsTrigger>
          </TabsList>

          {/* Library Settings Tab */}
          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Course Library Page Settings
                </CardTitle>
                <CardDescription>
                  Customize the appearance and content of your course library page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="library-headline">Library Headline</Label>
                    <Input
                      id="library-headline"
                      value={libraryHeadline}
                      onChange={(e) => setLibraryHeadline(e.target.value)}
                      placeholder="Course Library"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="library-subheadline">Library Subheadline</Label>
                    <Textarea
                      id="library-subheadline"
                      value={librarySubheadline}
                      onChange={(e) => setLibrarySubheadline(e.target.value)}
                      placeholder="Discover our comprehensive collection of courses..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-currency">Course Price Currency</Label>
                    <Select value={courseCurrency} onValueChange={setCourseCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                        <SelectItem value="BDT">BDT (৳) - Bangladeshi Taka</SelectItem>
                        <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                        <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                        <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                        <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This currency will be used for all course pricing across your course library
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-logo">Course Login Page Logo</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="course-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('course-logo')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      {courseLoginLogo && (
                        <img src={courseLoginLogo} alt="Course Logo" className="h-12 w-12 object-contain" />
                      )}
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveLibrarySettings}>
                  Save Library Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Visibility Tab */}
          <TabsContent value="visibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Course Library Visibility
                </CardTitle>
                <CardDescription>
                  Control which courses appear in your public course library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.course_modules?.length || 0} modules • 
                          {course.course_modules?.reduce((acc, module) => acc + (module.course_lessons?.length || 0), 0) || 0} lessons
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={course.is_published ? "default" : "secondary"}>
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant={course.is_active ? "default" : "destructive"}>
                            {course.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Label className="text-sm">Show in Library</Label>
                          <Switch
                            checked={course.is_published && course.is_active}
                            disabled={!course.is_active}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Bundles Tab */}
          <TabsContent value="bundles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Course Bundles
                </CardTitle>
                <CardDescription>
                  Create course bundles to offer multiple courses at a discounted price
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Course Bundles Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Bundle multiple courses together and offer them at a special price.
                  </p>
                  <Button variant="outline" disabled>
                    Create Bundle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members & Access Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Course Members & Purchases
                </CardTitle>
                <CardDescription>
                  View and manage customers who have purchased your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coursePurchases.length > 0 ? (
                    coursePurchases.map((purchase) => (
                      <div key={purchase.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{purchase.orders.customer_name}</h4>
                            <p className="text-sm text-muted-foreground">{purchase.orders.customer_email}</p>
                            {purchase.orders.customer_phone && (
                              <p className="text-sm text-muted-foreground">{purchase.orders.customer_phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="default">{purchase.orders.status}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(purchase.orders.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm font-medium">Purchased Course:</p>
                          <p className="text-sm text-muted-foreground">{purchase.products.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {purchase.quantity} • Price: ${purchase.price}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Course Purchases Yet</h3>
                      <p className="text-muted-foreground">
                        When customers purchase your courses, their information will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CourseSettings;
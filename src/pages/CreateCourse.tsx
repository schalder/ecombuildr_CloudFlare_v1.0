import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2, Save, ArrowLeft, Upload, Image, DollarSign } from 'lucide-react';
import { MediaSelector } from '@/components/page-builder/components/MediaSelector';
import { useUserStore } from '@/hooks/useUserStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseFormData {
  title: string;
  description: string;
  content: string;
  price: number;
  compare_price: number | null;
  thumbnail_url: string;
  is_published: boolean;
  is_active: boolean;
}

const CreateCourse = () => {
  const navigate = useNavigate();
  const { store } = useUserStore();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    content: '',
    price: 0,
    compare_price: null,
    thumbnail_url: '',
    is_published: false,
    is_active: true
  });

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!store?.id) {
      toast.error('Store not found');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    setLoading(true);
    try {
      const courseData = {
        store_id: store.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: formData.price,
        compare_price: formData.compare_price,
        thumbnail_url: formData.thumbnail_url.trim() || null,
        is_published: formData.is_published,
        is_active: formData.is_active
      };

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Course created successfully!');
      navigate(`/dashboard/courses/${data.id}/edit`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Course" description="Create a new online course">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Course</h1>
            <p className="text-muted-foreground">
              Set up your course details and start building content
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Enter the basic details about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Complete Web Development Bootcamp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description</Label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(content) => handleInputChange('description', content)}
                    placeholder="Write a detailed description of your course, what students will learn, prerequisites, etc..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Course Thumbnail</Label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Open library */}}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Library
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Upload */}}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* URL */}}
                      className="flex items-center gap-2"
                    >
                      URL
                    </Button>
                  </div>
                  {formData.thumbnail_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.thumbnail_url} 
                        alt="Course thumbnail"
                        className="w-full h-32 object-cover rounded-md border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Description */}
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>
                  Write a detailed description of your course content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  placeholder="Describe what students will learn, course objectives, prerequisites, etc..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Course Price (৳) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compare-price">Compare Price (৳)</Label>
                  <Input
                    id="compare-price"
                    type="number"
                    value={formData.compare_price || ''}
                    onChange={(e) => handleInputChange('compare_price', parseFloat(e.target.value) || null)}
                    placeholder="Optional original price"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">
                    Show a strikethrough price for sales
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Publication Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publication Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Published</Label>
                    <p className="text-xs text-muted-foreground">
                      Make course visible to students
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable course for enrollment
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/dashboard/courses')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCourse;
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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Save, ArrowLeft, Upload, Image, DollarSign, Plus, Trash2 } from 'lucide-react';
import { CompactMediaSelector } from '@/components/page-builder/components/CompactMediaSelector';
import { CoursePaymentMethods } from '@/components/course/CoursePaymentMethods';
import { useUserStore } from '@/hooks/useUserStore';
import { useCategories } from '@/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseFormData {
  title: string;
  description: string;
  content: string;
  show_content: boolean;
  overview: string;
  course_details: string;
  author_name: string;
  author_image_url: string;
  author_details: string;
  price: number;
  compare_price: number | null;
  thumbnail_url: string;
  category_id: string | null;
  is_published: boolean;
  is_active: boolean;
  includes_title: string;
  includes_items: string[];
  payment_methods: {
    bkash: boolean;
    nagad: boolean;
    eps: boolean;
    ebpay: boolean;
    stripe: boolean;
  };
}

const CreateCourse = () => {
  const navigate = useNavigate();
  const { store } = useUserStore();
  const { flatCategories } = useCategories();
  
  const [loading, setLoading] = useState(false);
  const [overviewType, setOverviewType] = useState<'text' | 'video'>('text');
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    content: '',
    show_content: false,
    overview: '',
    course_details: '',
    author_name: '',
    author_image_url: '',
    author_details: '',
    price: 0,
    compare_price: null,
    thumbnail_url: '',
    category_id: null,
    is_published: false,
    is_active: true,
    includes_title: '',
    includes_items: [],
    payment_methods: {
      bkash: false,
      nagad: false,
      eps: false,
      ebpay: false,
      stripe: false
    }
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
        content: formData.show_content ? (formData.content.trim() || null) : null,
        show_content: formData.show_content,
        overview: formData.overview.trim() || null,
        course_details: formData.course_details.trim() || null,
        author_name: formData.author_name.trim() || null,
        author_image_url: formData.author_image_url.trim() || null,
        author_details: formData.author_details.trim() || null,
        price: formData.price,
        compare_price: formData.compare_price,
        thumbnail_url: formData.thumbnail_url.trim() || null,
        category_id: formData.category_id || null,
        is_published: formData.is_published,
        is_active: formData.is_active,
        includes_title: formData.includes_title.trim() || null,
        includes_items: formData.includes_items.filter(item => item.trim()).length > 0 ? formData.includes_items.filter(item => item.trim()) : null,
        payment_methods: formData.payment_methods
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard/courses')}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Course</h1>
            <p className="text-muted-foreground">
              Set up your course details and start building content
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Accordion type="multiple" className="space-y-4">
              {/* Course Information */}
              <AccordionItem value="course-information" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-left text-base font-semibold">Course Information</CardTitle>
                      <CardDescription className="text-left">
                        Enter the basic details about your course
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-0">
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
                        <Label htmlFor="category">Course Category</Label>
                        <Select value={formData.category_id || 'no-category'} onValueChange={(value) => handleInputChange('category_id', value === 'no-category' ? null : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="no-category">No Category</SelectItem>
                            {flatCategories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="thumbnail">Course Thumbnail</Label>
                        <CompactMediaSelector
                          value={formData.thumbnail_url}
                          onChange={(url) => handleInputChange('thumbnail_url', url)}
                          label="Select Course Thumbnail"
                        />
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Course Overview - Text or Video */}
              <AccordionItem value="course-overview" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-left text-base font-semibold">Course Overview</CardTitle>
                      <CardDescription className="text-left">
                        Add a video or text overview of your course
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-center gap-4">
                        <Label>Overview Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={overviewType === 'text' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setOverviewType('text')}
                          >
                            Text
                          </Button>
                          <Button
                            type="button"
                            variant={overviewType === 'video' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setOverviewType('video')}
                          >
                            Video URL
                          </Button>
                        </div>
                      </div>
                      {overviewType === 'text' ? (
                        <div className="space-y-2">
                          <Label>Overview Text</Label>
                          <RichTextEditor
                            content={formData.overview}
                            onChange={(content) => handleInputChange('overview', content)}
                            placeholder="Write an overview of your course..."
                            className="min-h-[150px]"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Video URL</Label>
                          <Input
                            value={formData.overview}
                            onChange={(e) => handleInputChange('overview', e.target.value)}
                            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                          />
                          <p className="text-xs text-muted-foreground">
                            Supports YouTube, Vimeo, Wistia, or direct video URLs
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Course Content */}
              <AccordionItem value="course-content" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-left text-base font-semibold">Course Content</CardTitle>
                      <CardDescription className="text-left">
                        Detailed course content and curriculum information
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Show Course Content Section</Label>
                          <p className="text-xs text-muted-foreground">
                            Display course content text on the course page
                          </p>
                        </div>
                        <Switch
                          checked={formData.show_content}
                          onCheckedChange={(checked) => handleInputChange('show_content', checked)}
                        />
                      </div>
                      {formData.show_content && (
                        <div className="space-y-2">
                          <Label>Course Content</Label>
                          <RichTextEditor
                            content={formData.content}
                            onChange={(content) => handleInputChange('content', content)}
                            placeholder="Describe what students will learn, course objectives, prerequisites, etc..."
                            className="min-h-[200px]"
                          />
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Course Details */}
              <AccordionItem value="course-details" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-left text-base font-semibold">Course Details</CardTitle>
                      <CardDescription className="text-left">
                        Additional course information and specifications
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      <RichTextEditor
                        content={formData.course_details}
                        onChange={(content) => handleInputChange('course_details', content)}
                        placeholder="Add detailed course information, requirements, what students will get, etc..."
                        className="min-h-[200px]"
                      />
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Author Information */}
              <AccordionItem value="author-information" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-left text-base font-semibold">Author Information</CardTitle>
                      <CardDescription className="text-left">
                        Course instructor/author details
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label htmlFor="author-name">Author Name</Label>
                        <Input
                          id="author-name"
                          value={formData.author_name}
                          onChange={(e) => handleInputChange('author_name', e.target.value)}
                          placeholder="e.g., John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author-image">Author Image</Label>
                        <CompactMediaSelector
                          value={formData.author_image_url}
                          onChange={(url) => handleInputChange('author_image_url', url)}
                          label="Select Author Image"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author-details">Author Details</Label>
                        <RichTextEditor
                          content={formData.author_details}
                          onChange={(content) => handleInputChange('author_details', content)}
                          placeholder="Write about the course author, their experience, credentials, etc..."
                          className="min-h-[150px]"
                        />
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* What This Course Includes */}
              <AccordionItem value="course-includes" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <CardHeader className="p-0 text-left">
                      <CardTitle className="text-left text-base font-semibold">What This Course Includes</CardTitle>
                      <CardDescription className="text-left">
                        Optional section to highlight what students will get with this course
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label htmlFor="includes-title">Section Title (Optional)</Label>
                        <Input
                          id="includes-title"
                          value={formData.includes_title}
                          onChange={(e) => handleInputChange('includes_title', e.target.value)}
                          placeholder="e.g., This Course Includes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Course Features (Optional)</Label>
                        <div className="space-y-2">
                          {formData.includes_items.map((item, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...formData.includes_items];
                                  newItems[index] = e.target.value;
                                  handleInputChange('includes_items', newItems);
                                }}
                                placeholder="e.g., 5.4 hours on-demand video"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const newItems = formData.includes_items.filter((_, i) => i !== index);
                                  handleInputChange('includes_items', newItems);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              handleInputChange('includes_items', [...formData.includes_items, '']);
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Feature
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
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
                <CardTitle className="text-base font-semibold">Publication Settings</CardTitle>
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

            {/* Payment Methods */}
            {store?.id && (
              <CoursePaymentMethods
                storeId={store.id}
                value={formData.payment_methods}
                onChange={(methods) => handleInputChange('payment_methods', methods)}
              />
            )}

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
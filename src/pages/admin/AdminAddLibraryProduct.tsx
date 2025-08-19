
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ImageUpload } from '@/components/ui/image-upload';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LibraryCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  suggested_price: number;
  base_cost: number;
  shipping_cost: number;
  category_id: string;
  images: string[];
  is_trending: boolean;
  supplier_link: string;
  ad_copy: string;
  video_url: string;
  tags: string[];
  status: 'draft' | 'published';
}

export default function AdminAddLibraryProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    short_description: '',
    suggested_price: 0,
    base_cost: 0,
    shipping_cost: 0,
    category_id: '',
    images: [],
    is_trending: false,
    supplier_link: '',
    ad_copy: '',
    video_url: '',
    tags: [],
    status: 'draft'
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_library_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_library')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        short_description: data.short_description || '',
        suggested_price: data.suggested_price || 0,
        base_cost: data.base_cost || 0,
        shipping_cost: data.shipping_cost || 0,
        category_id: data.category_id || '',
        images: Array.isArray(data.images) ? (data.images as string[]) : [],
        is_trending: data.is_trending || false,
        supplier_link: data.supplier_link || '',
        ad_copy: data.ad_copy || '',
        video_url: data.video_url || '',
        tags: data.tags || [],
        status: (data.status === 'published' ? 'published' : 'draft') as 'draft' | 'published'
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch product",
        variant: "destructive",
      });
      navigate('/admin/product-library');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      if (isEditing) {
        const { error } = await supabase
          .from('product_library')
          .update(submitData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Product ${status === 'published' ? 'published' : 'saved'} successfully`,
        });
      } else {
        const { error } = await supabase
          .from('product_library')
          .insert(submitData);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Product ${status === 'published' ? 'published' : 'created'} successfully`,
        });
      }

      navigate('/admin/product-library');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  if (loading && isEditing) {
    return (
      <DashboardLayout title="Loading..." description="Loading product data...">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-8 bg-muted rounded w-1/2" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={isEditing ? 'Edit Library Product' : 'Add Library Product'} 
      description={isEditing ? 'Update product in the library' : 'Add a new product to the library'}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/admin/product-library">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Short Description</label>
                  <Textarea
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief product description for listings"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Full Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed product description"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <Input
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ad Copy</label>
                  <Textarea
                    value={formData.ad_copy}
                    onChange={(e) => setFormData({ ...formData, ad_copy: e.target.value })}
                    placeholder="Marketing copy for advertisements"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Supplier Link</label>
                    <Input
                      value={formData.supplier_link}
                      onChange={(e) => setFormData({ ...formData, supplier_link: e.target.value })}
                      placeholder="https://supplier.com/product"
                      type="url"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Video URL</label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      type="url"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex items-center space-x-2">
                       <div className="flex-1">
                         <ImageUpload
                           value={image}
                           onChange={(url) => {
                             const newImages = [...formData.images];
                             newImages[index] = url;
                             setFormData({ ...formData, images: newImages });
                           }}
                         />
                       </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== index);
                          setFormData({ ...formData, images: newImages });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (formData.images.length < 5) {
                        setFormData({ ...formData, images: [...formData.images, ''] });
                      }
                    }}
                    disabled={formData.images.length >= 5}
                  >
                    Add Image ({formData.images.length}/5)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Base Cost *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.base_cost}
                    onChange={(e) => setFormData({ ...formData, base_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Shipping Cost</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Suggested Selling Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.suggested_price}
                    onChange={(e) => setFormData({ ...formData, suggested_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_trending"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is_trending" className="text-sm font-medium">
                    Mark as Trending
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleSubmit('draft')} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => handleSubmit('published')} 
                  className="w-full"
                  disabled={loading}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, ArrowLeft, BarChart3, Package, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { htmlToPlainText } from '@/lib/htmlToPlainText';

interface Product {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  inventory_quantity?: number;
  track_inventory: boolean;
  is_active: boolean;
  images: string[];
  seo_title?: string;
  seo_description?: string;
  slug: string;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
}

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchProduct();
    }
  }, [user, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            categories:category_id(name)
          `)
          .eq('id', id)
          .in('store_id', stores.map(store => store.id))
          .single();

        if (productError) throw productError;
        
        // Ensure images is properly typed as string array and handle all nullable fields
        const processedProduct: Product = {
          id: product.id,
          name: product.name,
          description: product.description || undefined,
          short_description: product.short_description || undefined,
          price: product.price,
          compare_price: product.compare_price || undefined,
          cost_price: product.cost_price || undefined,
          sku: product.sku || undefined,
          inventory_quantity: product.inventory_quantity || undefined,
          track_inventory: product.track_inventory,
          is_active: product.is_active,
          images: Array.isArray(product.images) ? product.images.filter((img): img is string => typeof img === 'string') : [],
          seo_title: product.seo_title || undefined,
          seo_description: product.seo_description || undefined,
          slug: product.slug,
          created_at: product.created_at || '',
          updated_at: product.updated_at || '',
          categories: product.categories
        };
        setProduct(processedProduct);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading..." description="Loading product details">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="h-64 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout title="Product Not Found" description="The requested product could not be found">
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Product not found</h3>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/dashboard/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={product.name} 
      description="Product details and management"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <Badge variant={product.is_active ? "default" : "secondary"}>
              {product.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Product Images */}
            {product.images && product.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Product Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Description */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.short_description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Short Description</h4>
                    <p className="text-sm">{htmlToPlainText(product.short_description)}</p>
                  </div>
                )}
                
                {product.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Full Description</h4>
                    <p className="text-sm whitespace-pre-wrap">{htmlToPlainText(product.description)}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">SKU:</span>
                    <p>{product.sku || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Category:</span>
                    <p>{product.categories?.name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Slug:</span>
                    <p className="font-mono">{product.slug}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <p>{product.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Information */}
            {(product.seo_title || product.seo_description) && (
              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.seo_title && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">SEO Title</h4>
                      <p className="text-sm">{product.seo_title}</p>
                    </div>
                  )}
                  {product.seo_description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">SEO Description</h4>
                      <p className="text-sm">{product.seo_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Price</span>
                  <p className="text-2xl font-bold">৳{product.price.toLocaleString()}</p>
                </div>
                
                {product.compare_price && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Compare at Price</span>
                    <p className="text-lg line-through text-muted-foreground">৳{product.compare_price.toLocaleString()}</p>
                  </div>
                )}
                
                {product.cost_price && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Cost Price</span>
                    <p className="text-lg">৳{product.cost_price.toLocaleString()}</p>
                  </div>
                )}

                {product.compare_price && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Margin</span>
                    <p className="text-lg font-medium text-green-600">
                      ৳{(product.price - (product.cost_price || 0)).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Inventory Tracking</span>
                  <p className="text-lg">{product.track_inventory ? 'Enabled' : 'Disabled'}</p>
                </div>
                
                {product.track_inventory && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Quantity in Stock</span>
                    <p className="text-2xl font-bold">{product.inventory_quantity || 0}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Created:</span>
                  <p>{new Date(product.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Last Updated:</span>
                  <p>{new Date(product.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
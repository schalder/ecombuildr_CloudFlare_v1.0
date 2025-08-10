
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReviewsSection from '@/components/storefront/ReviewsSection';
import RelatedProducts from '@/components/storefront/RelatedProducts';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  description?: string;
  short_description?: string;
  images: string[];
  slug: string;
  sku?: string;
  inventory_quantity?: number;
  track_inventory: boolean;
  variations: any[];
  is_active: boolean;
  category_id?: string | null;
  free_shipping_min_amount?: number | null;
  easy_returns_enabled?: boolean;
  easy_returns_days?: number | null;
}

export const ProductDetail: React.FC = () => {
  const { slug, websiteId, productSlug } = useParams<{ slug?: string; websiteId?: string; productSlug: string }>();
  const { store, loadStore, loadStoreById } = useStore();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Variations handling
  const options = React.useMemo<any[]>(() => {
    const v: any = product?.variations;
    if (Array.isArray(v)) return v as any[];
    return (v?.options || []) as any[];
  }, [product]);
  const variantList = React.useMemo<any[]>(() => {
    const v: any = product?.variations;
    return Array.isArray(v) ? [] : (v?.variants || []);
  }, [product]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  useEffect(() => {
    if (options && options.length) {
      const initial: Record<string, string> = {};
      options.forEach((opt: any) => {
        initial[opt.name] = opt.values?.[0] || '';
      });
      setSelectedOptions(initial);
    } else {
      setSelectedOptions({});
    }
  }, [options]);
  const selectedVariant = React.useMemo(() => {
    if (!variantList.length) return null;
    return (
      variantList.find((vv) => {
        const opts = vv.options || {};
        return Object.keys(opts).every((k) => opts[k] === selectedOptions[k]);
      }) || null
    );
  }, [variantList, selectedOptions]);

  useEffect(() => {
    const init = async () => {
      if (slug) {
        loadStore(slug);
      } else if (websiteId) {
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('id', websiteId)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      }
    };
    init();
  }, [slug, websiteId, loadStore, loadStoreById]);

  useEffect(() => {
    if (store && productSlug) {
      fetchProduct();
    }
  }, [store, productSlug]);

  const fetchProduct = async () => {
    if (!store || !productSlug) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('slug', productSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      const product = {
        ...data,
        images: Array.isArray(data.images) ? data.images.filter((img: any) => typeof img === 'string') as string[] : [],
        variations: Array.isArray(data.variations) ? data.variations : [],
      };
      setProduct(product as Product);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check inventory
    if (product.track_inventory && product.inventory_quantity !== undefined) {
      if (product.inventory_quantity < quantity) {
        toast.error('Insufficient inventory available');
        return;
      }
    }

    addItem({
      id: `${product.id}${Object.keys(selectedOptions).length ? `-${JSON.stringify(selectedOptions)}` : ''}`,
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      image: product.images[0],
      sku: product.sku,
      quantity,
      variation: Object.keys(selectedOptions).length ? selectedOptions : undefined,
    });

    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.short_description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard');
    }
  };

  if (!store) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Store not found</h1>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-muted animate-pulse rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              <div className="h-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <p className="text-muted-foreground mt-2">The requested product could not be found.</p>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  const isOutOfStock = product.track_inventory && product.inventory_quantity !== undefined && product.inventory_quantity <= 0;
  const effectivePrice = (selectedVariant?.price ?? product.price);
  const discountPercentage = product.compare_price && product.compare_price > effectivePrice 
    ? Math.round(((product.compare_price - effectivePrice) / product.compare_price) * 100)
    : 0;

  return (
    <StorefrontLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Thumbnail Images - Left side on desktop, top on mobile */}
            {product.images.length > 1 && (
              <div className="order-2 lg:order-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:w-20">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 aspect-square w-16 lg:w-full rounded border-2 overflow-hidden transition-all duration-200 ${
                      selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image */}
            <div className="order-1 lg:order-2 flex-1">
              <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
                <img
                  src={product.images[selectedImage] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="absolute top-4 left-4 text-xs">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-foreground">
                {formatCurrency(effectivePrice)}
              </span>
              {product.compare_price && product.compare_price > effectivePrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}

            <Separator />

            {/* Variations */}
            {options.length > 0 && (
              <div className="space-y-4">
                {options.map((opt: any) => (
                  <div key={opt.name}>
                    <h3 className="font-semibold mb-2">{opt.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      {(opt.values || []).map((val: string) => {
                        const selected = selectedOptions[opt.name] === val;
                        return (
                          <Button
                            key={val}
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                          >
                            {val}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-3 py-1 border rounded text-center min-w-[50px]">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock || (product.track_inventory && product.inventory_quantity !== undefined && quantity >= product.inventory_quantity)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {product.track_inventory && product.inventory_quantity !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {product.inventory_quantity} in stock
                </p>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {(product.free_shipping_min_amount || product.easy_returns_enabled) && (
                <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                  {product.free_shipping_min_amount && (
                    <div>
                      <span className="font-medium">Free Shipping</span>
                      <p className="text-muted-foreground">
                        On orders over {formatCurrency(Number(product.free_shipping_min_amount))}
                      </p>
                    </div>
                  )}
                  {product.easy_returns_enabled && (
                    <div>
                      <span className="font-medium">Easy Returns</span>
                      <p className="text-muted-foreground">
                        {product.easy_returns_days ? `${product.easy_returns_days}-day return policy` : "Easy return policy"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              {product.description ? (
                <article className="prose prose-sm max-w-none text-muted-foreground">
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                </article>
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </TabsContent>
            <TabsContent value="reviews">
              <ReviewsSection productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        <div className="mt-12">
          <RelatedProducts categoryId={product.category_id || null} currentProductId={product.id} />
        </div>
      </div>
    </StorefrontLayout>
  );
};

export default ProductDetail;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { useChannelContext } from '@/hooks/useChannelContext';
import { useWebsiteContext } from '@/contexts/WebsiteContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Share2, Phone, MessageCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReviewsSection from '@/components/storefront/ReviewsSection';
import RelatedProducts from '@/components/storefront/RelatedProducts';
import { useEcomPaths } from '@/lib/pathResolver';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { parseVideoUrl, buildEmbedUrl } from '@/components/page-builder/utils/videoUtils';
import { StorefrontImage } from '@/components/storefront/renderer/StorefrontImage';
import { UrgencyTimer } from '@/components/storefront/UrgencyTimer';

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
  variations: any;
  is_active: boolean;
  category_id?: string | null;
  free_shipping_min_amount?: number | null;
  easy_returns_enabled?: boolean;
  easy_returns_days?: number | null;
  action_buttons?: any;
  allowed_payment_methods?: string[] | null;
  description_mode?: 'rich_text' | 'builder';
  description_builder?: any;
  urgency_timer_enabled?: boolean;
  urgency_timer_duration?: number;
  urgency_timer_text?: string;
  urgency_timer_color?: string;
  urgency_timer_text_color?: string;
}


interface ActionButtons {
  order_now?: { enabled?: boolean; label?: string };
  phone?: { enabled?: boolean; label?: string; number?: string };
  whatsapp?: { enabled?: boolean; label?: string; url?: string };
}


export const ProductDetail: React.FC = () => {
  const { slug, websiteId, websiteSlug, productSlug } = useParams<{ slug?: string; websiteId?: string; websiteSlug?: string; productSlug: string }>();
  const { websiteId: contextWebsiteId } = useWebsiteContext();
  const { store, loadStore, loadStoreById } = useStore();
  const { addToCart } = useAddToCart();
  const navigate = useNavigate();
  const paths = useEcomPaths();
  const { pixels } = usePixelContext();
  const { websiteId: resolvedWebsiteId, funnelId: resolvedFunnelId } = useChannelContext();
  const { trackViewContent } = usePixelTracking(pixels, store?.id, resolvedWebsiteId, resolvedFunnelId);
  
  // Detect if we're in a website context (either system domain or custom domain)
  const isCustomDomain = () => {
    const currentHost = window.location.hostname;
    return !(currentHost === 'ecombuildr.com' || currentHost === 'localhost' || currentHost.includes('lovable.app'));
  };
  const isWebsiteContext = Boolean(websiteId || websiteSlug || isCustomDomain());
  
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
      } else if (websiteId || contextWebsiteId) {
        const targetWebsiteId = websiteId || contextWebsiteId;
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('id', targetWebsiteId)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      }
    };
    init();
  }, [slug, websiteId, contextWebsiteId, loadStore, loadStoreById]);

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
        .eq('is_active', true)
        .eq('slug', productSlug)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setProduct(null);
        return;
      }
      const product = {
        ...data,
        images: Array.isArray(data.images) ? data.images.filter((img: any) => typeof img === 'string') as string[] : [],
        variations: (data as any).variations ?? [],
        action_buttons: (data as any).action_buttons as ActionButtons | undefined,
      } as any;
      setProduct(product as Product);
      
      // Track view content event
      trackViewContent({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate effective price and compare price based on selected variant
  const effectivePrice = (selectedVariant?.price ?? product?.price) || 0;
  const effectiveComparePrice = selectedVariant?.compare_price ?? product?.compare_price;

  // Calculate all available images (product + variant images)
  const allAvailableImages = React.useMemo(() => {
    const defaultImages = product?.images || [];
    const variantImages = variantList
      .filter(variant => variant.image && !defaultImages.includes(variant.image))
      .map(variant => variant.image);
    
    // If a variant is selected and has an image, put it first
    if (selectedVariant && selectedVariant.image) {
      const otherImages = [...defaultImages, ...variantImages].filter(img => img !== selectedVariant.image);
      return [selectedVariant.image, ...otherImages];
    }
    
    return [...defaultImages, ...variantImages];
  }, [selectedVariant, product?.images, variantList]);

  // Create mapping between images and their corresponding variants
  const imageToVariantMap = React.useMemo(() => {
    const map = new Map<string, any>();
    variantList.forEach(variant => {
      if (variant.image) {
        map.set(variant.image, variant);
      }
    });
    return map;
  }, [variantList]);

  // Handle thumbnail click - auto-select variant if clicking variant image
  const handleThumbnailClick = (index: number, imageSrc: string) => {
    setSelectedImage(index);
    
    // Check if this image belongs to a specific variant
    const correspondingVariant = imageToVariantMap.get(imageSrc);
    if (correspondingVariant) {
      // Auto-select this variant's options
      setSelectedOptions(correspondingVariant.options || {});
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product as any, quantity, false, selectedOptions);
  };

  const handleOrderNow = () => {
    if (!product) return;
    addToCart(product as any, quantity, true, selectedOptions);
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

  const renderContent = () => {
    if (!store) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Store not found</h1>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
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
      );
    }

    if (!product) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <p className="text-muted-foreground mt-2">The requested product could not be found.</p>
          </div>
        </div>
      );
    }

    const isOutOfStock = product.track_inventory && product.inventory_quantity !== undefined && product.inventory_quantity <= 0;
    const discountPercentage = effectiveComparePrice && effectiveComparePrice > effectivePrice 
      ? Math.round(((effectiveComparePrice - effectivePrice) / effectiveComparePrice) * 100)
      : 0;

    // Build media list (video first if available)
    const videoInfo = parseVideoUrl(((product as any)?.video_url) || '');
    const mediaItems: Array<{ kind: 'video' | 'image'; src?: string; thumb?: string }> = (() => {
      const items: Array<{ kind: 'video' | 'image'; src?: string; thumb?: string }> = [];
      if (videoInfo && videoInfo.type !== 'unknown' && videoInfo.embedUrl) {
        items.push({ kind: 'video', src: videoInfo.embedUrl, thumb: videoInfo.thumbnailUrl });
      }
      allAvailableImages.forEach((img) => items.push({ kind: 'image', src: img }));
      return items;
    })();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Thumbnail Images - Left side on desktop, top on mobile */}
            {mediaItems.length > 1 && (
              <div className="order-2 lg:order-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:w-20">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index, item.src || '')}
                    className={`flex-shrink-0 aspect-square w-16 lg:w-full rounded border-2 overflow-hidden transition-all duration-200 ${
                      selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {item.kind === 'image' ? (
                      <img src={item.src!} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.thumb || '/placeholder.svg'} alt={`${product.name} video`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Media */}
            <div className="order-1 lg:order-2 flex-1">
              <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
                {mediaItems[selectedImage]?.kind === 'video' && videoInfo && videoInfo.embedUrl ? (
                  videoInfo.type === 'hosted' ? (
                    <video src={videoInfo.embedUrl} controls className="w-full h-full" />
                  ) : (
                    <iframe
                      src={buildEmbedUrl(videoInfo.embedUrl, videoInfo.type, { controls: true })}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${product.name} video`}
                    />
                  )
                ) : (
                  <StorefrontImage
                    src={mediaItems[selectedImage]?.src || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    enableMagnifier={true}
                    zoomLevel={8}
                    magnifierSize={350}
                    priority={selectedImage === 0}
                    enhancedMagnifier={true}
                    enableFullscreen={true}
                  />
                )}
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
              {effectiveComparePrice && effectiveComparePrice > effectivePrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(effectiveComparePrice)}
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
                            className={`variant-button ${selected ? 'variant-button-selected' : ''}`}
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

            {/* Urgency Timer */}
            {product.urgency_timer_enabled && (
              <UrgencyTimer
                productId={product.id}
                duration={product.urgency_timer_duration || 60}
                text={product.urgency_timer_text || 'Limited Time Offer!'}
                backgroundColor={product.urgency_timer_color || '#ef4444'}
                textColor={product.urgency_timer_text_color || '#ffffff'}
                className="mb-6"
              />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full product-cta"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                {/* Optional Action Buttons */}
                {((product as any).action_buttons?.order_now?.enabled) && (
                  <Button 
                    size="lg" 
                    className="w-full product-cta" 
                    onClick={handleOrderNow}
                  >
                    {(product as any).action_buttons?.order_now?.label || 'Order Now'}
                  </Button>
                )}
                {((product as any).action_buttons?.call?.enabled) && (
                  <Button size="lg" variant="outline" className="w-full" onClick={() => {
                    const num = (product as any).action_buttons?.call?.phone;
                    if (num) window.location.href = `tel:${num}`;
                  }}>
                    {(product as any).action_buttons?.call?.label || 'Call Now'}
                  </Button>
                )}
                {((product as any).action_buttons?.whatsapp?.enabled) && (
                  <Button size="lg" variant="outline" className="w-full" onClick={() => {
                    const url = (product as any).action_buttons?.whatsapp?.url;
                    if (url) window.open(url, '_blank');
                  }}>
                    {(product as any).action_buttons?.whatsapp?.label || 'WhatsApp'}
                  </Button>
                 )}
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
              {((product as any).description_mode === 'builder' && (product as any).description_builder?.sections?.length) ? (
                <section aria-label="Product description">
                  <PageBuilderRenderer data={(product as any).description_builder as any} />
                </section>
              ) : product.description ? (
                <article className="prose prose-sm max-w-none text-muted-foreground">
                  <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: product.description }} />
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
    );
  };

  const content = renderContent();

  if (isWebsiteContext) {
    return content;
  }

  return (
    <StorefrontLayout>
      {content}
    </StorefrontLayout>
  );
};

export default ProductDetail;


import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Heart, Star, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface VariationOption {
  name: string;
  values: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number | null;
  short_description?: string | null;
  description?: string | null;
  images: any; // Json type from Supabase
  slug: string;
  is_active: boolean;
  track_inventory?: boolean;
  inventory_quantity?: number | null;
  variations?: any; // Json type from Supabase (can be VariationOption[] or complex structure)
  store_id?: string;
  category_id?: string | null;
  sku?: string | null;
  cost_price?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  free_shipping_min_amount?: number | null;
  easy_returns_enabled?: boolean;
  easy_returns_days?: number | null;
  action_buttons?: any;
  allowed_payment_methods?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: any) => void;
  storeSlug: string;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  storeSlug
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Memoized options/variants to prevent effect loops
  const options = useMemo<VariationOption[]>(() => {
    const v: any = product?.variations;
    if (Array.isArray(v)) return v as any;
    return (v?.options || []) as VariationOption[];
  }, [product?.id]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Variants list (for price overrides)
  const variantList = useMemo<any[]>(() => {
    const v: any = product?.variations;
    return Array.isArray(v) ? [] : (v?.variants || []);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    setSelectedImage(0);
    setQuantity(1);
    if (options.length) {
      const initial: Record<string, string> = {};
      options.forEach((opt) => {
        initial[opt.name] = opt.values?.[0] || '';
      });
      setSelectedOptions(initial);
    } else {
      setSelectedOptions({});
    }
  }, [product?.id, isOpen]);

  const selectedVariant = (() => {
    if (!variantList.length) return null;
    return (
      variantList.find((vv) => {
        const opts = vv.options || {};
        return Object.keys(opts).every((k) => opts[k] === selectedOptions[k]);
      }) || null
    );
  })();

  if (!product) return null;

  // Calculate effective price and compare price based on selected variant
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveComparePrice = selectedVariant?.compare_price ?? product.compare_price;

  // Calculate effective images based on selected variant
  const effectiveImages = useMemo(() => {
    const defaultImages = Array.isArray(product.images) ? product.images : Object.values(product.images || {});
    if (selectedVariant && selectedVariant.image) {
      return [selectedVariant.image, ...defaultImages.filter(img => img !== selectedVariant.image)];
    }
    return defaultImages;
  }, [selectedVariant, product.images]);

  const discountPercentage = effectiveComparePrice && effectiveComparePrice > effectivePrice
    ? Math.round(((effectiveComparePrice - effectivePrice) / effectiveComparePrice) * 100)
    : 0;

  const inStock = !product.track_inventory || (product.inventory_quantity ?? 0) > 0;

  const strippedDescription = (() => {
    if (product?.short_description) return product.short_description;
    if (!product?.description) return "";
    return product.description.replace(/<[^>]+>/g, "").slice(0, 180) + (product.description.length > 180 ? "..." : "");
  })();

  const handleAddToCart = () => {
    const pWithPrice = { ...product, price: effectivePrice } as any;
    onAddToCart(pWithPrice, quantity, Object.keys(selectedOptions).length ? selectedOptions : undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-square bg-muted relative overflow-hidden">
              <img
                src={effectiveImages[selectedImage] || effectiveImages[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="text-xs font-bold">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                {/* Hide "New Arrival" mock */}
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Thumbnail Images */}
            {effectiveImages.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {effectiveImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                      selectedImage === index ? "border-primary" : "border-transparent"
                    )}
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
          </div>

          {/* Product Details */}
          <div className="p-6 space-y-6">
            <div>
              {/* Product Rating - placeholder stars until average rating integrated */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">(Reviews)</span>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>
              
              {/* Pricing */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {formatCurrency(effectivePrice)}
                </span>
                {effectiveComparePrice && effectiveComparePrice > effectivePrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(effectiveComparePrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                <div className={cn("w-2 h-2 rounded-full", inStock ? "bg-emerald-500" : "bg-destructive")} />
                <span className={cn("text-sm font-medium", inStock ? "text-emerald-600" : "text-destructive")}>
                  {inStock ? `In Stock${product.track_inventory ? ` (${product.inventory_quantity} items)` : ""}` : "Out of Stock"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Product Description */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {strippedDescription}
              </p>
            </div>

            <Separator />

            {/* Product Variations */}
            {options.length > 0 && (
              <div className="space-y-6">
                {options.map((opt) => (
                  <div key={opt.name} className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {opt.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {opt.values.map((val) => {
                        const selected = selectedOptions[opt.name] === val;
                        return (
                          <Button
                            key={val}
                            variant={selected ? "default" : "outline"}
                            size="default"
                            className={cn(
                              "h-12 px-4 min-w-[60px] font-medium transition-all duration-200",
                              selected 
                                ? "variant-button-selected" 
                                : "variant-button border-2 hover:border-primary/50 hover:bg-primary/5"
                            )}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                          >
                            {val}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Separator className="my-6" />
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Total: {formatCurrency(effectivePrice * quantity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 h-12 text-base font-semibold product-cta"
                  disabled={!inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="h-12 w-12 p-0"
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>

            {/* Product Features (real data) */}
            {(product.free_shipping_min_amount || product.easy_returns_enabled) && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

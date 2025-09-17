import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WishlistButton } from './WishlistButton';
import { useToast } from '@/hooks/use-toast';
import { useEcomPaths } from '@/lib/pathResolver';
import { formatCurrency } from '@/lib/currency';
import { useAddToCart } from '@/contexts/AddToCartProvider';

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
  variations?: any; // Json type from Supabase
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

interface ProductCardProps {
  product: Product;
  storeSlug?: string;
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
  ctaLabel?: string;
  ratingAverage?: number;
  ratingCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeSlug,
  onAddToCart,
  onQuickView,
  className,
  ctaLabel,
  ratingAverage = 0,
  ratingCount = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const paths = useEcomPaths();
  const { addToCart } = useAddToCart();

  // Calculate display price considering variations
  const getDisplayPrice = () => {
    const v: any = product.variations;
    
    // Handle new object-style variations with variants array
    if (v && !Array.isArray(v) && v.variants && Array.isArray(v.variants)) {
      const variantPrices = v.variants
        .filter((variant: any) => variant.price != null)
        .map((variant: any) => parseFloat(variant.price));
      return variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
    }
    
    // Handle legacy array-style variations
    if (Array.isArray(v) && v.length > 0) {
      const prices = v
        .filter((variation: any) => variation.price)
        .map((variation: any) => parseFloat(variation.price));
      return prices.length > 0 ? Math.min(...prices) : product.price;
    }
    
    return product.price;
  };

  const getDisplayComparePrice = () => {
    const v: any = product.variations;
    
    // Handle new object-style variations with variants array
    if (v && !Array.isArray(v) && v.variants && Array.isArray(v.variants)) {
      const variantComparePrices = v.variants
        .filter((variant: any) => variant.compare_price != null)
        .map((variant: any) => parseFloat(variant.compare_price));
      return variantComparePrices.length > 0 ? Math.min(...variantComparePrices) : product.compare_price;
    }
    
    // Handle legacy array-style variations
    if (Array.isArray(v) && v.length > 0) {
      const comparePrices = v
        .filter((variation: any) => variation.compare_price)
        .map((variation: any) => parseFloat(variation.compare_price));
      return comparePrices.length > 0 ? Math.min(...comparePrices) : product.compare_price;
    }
    
    return product.compare_price;
  };

  const displayPrice = getDisplayPrice();
  const displayComparePrice = getDisplayComparePrice();

  const discountPercentage = displayComparePrice && displayComparePrice > displayPrice
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0;


  return (
    <Card 
      className={cn(
        "group/card relative overflow-hidden bg-card border hover:shadow-2xl transition-all duration-300",
        "hover:-translate-y-1",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {discountPercentage > 0 && (
          <Badge variant="destructive" className="text-xs font-bold">
            -{discountPercentage}%
          </Badge>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className={cn(
        "absolute top-3 right-3 z-10 flex flex-col gap-2 transition-all duration-300 pointer-events-none",
        isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      )}>
        <WishlistButton
          product={product}
          storeSlug={storeSlug}
          className="bg-background/80 backdrop-blur-sm hover:bg-background pointer-events-auto"
        />
        
        
        {onQuickView && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background pointer-events-auto"
            onClick={() => onQuickView(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Product Image */}
      <Link to={paths.productDetail(product.slug)} className="block aspect-square relative overflow-hidden bg-muted">
        <img
          src={(Array.isArray(product.images) ? product.images[0] : product.images?.[0]) || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
        />
      </Link>

      {/* Product Info */}
      <CardContent className="p-4 space-y-3">
        {/* Product Rating */}
        {ratingCount > 0 && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.floor(ratingAverage) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({ratingAverage})</span>
          </div>
        )}

        {/* Product Name */}
        <Link to={paths.productDetail(product.slug)}>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Product Description */}
        {product.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:gap-2 sm:flex-wrap">
            <span className="font-bold text-base md:text-lg text-foreground flex-shrink-0">
              {formatCurrency(displayPrice)}
            </span>
            {displayComparePrice && displayComparePrice > displayPrice && (
              <span className="text-xs md:text-sm text-muted-foreground line-through flex-shrink-0">
                {formatCurrency(displayComparePrice)}
              </span>
            )}
          </div>

          {/* CTA Button */}
          <div className="mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addToCart(product)}
              className="h-9 px-3 text-xs w-full opacity-80 group-hover/card:opacity-100 transition-opacity product-card-button"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {ctaLabel || 'Add to Cart'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
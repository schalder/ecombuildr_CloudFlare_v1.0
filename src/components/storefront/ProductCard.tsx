import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, ShoppingCart, Star, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WishlistButton } from './WishlistButton';
import { useToast } from '@/hooks/use-toast';
import { useEcomPaths } from '@/lib/pathResolver';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  images: string[];
  slug: string;
  is_active: boolean;
}

interface ProductCardProps {
  product: Product;
  storeSlug?: string;
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
  ctaLabel?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeSlug,
  onAddToCart,
  onQuickView,
  className,
  ctaLabel,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const paths = useEcomPaths();

  const discountPercentage = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const isNew = true; // This would come from product creation date
  const isHot = discountPercentage > 20; // Hot if discount > 20%

  const handleAddToComparison = () => {
    if ((window as any).addToComparison) {
      const success = (window as any).addToComparison(product);
      if (success) {
        toast({
          title: "Added to comparison",
          description: `${product.name} has been added to comparison.`,
        });
      } else {
        toast({
          title: "Cannot add to comparison",
          description: "You can compare up to 3 products at once.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card 
      className={cn(
        "product-card-hover relative overflow-hidden bg-card border hover:shadow-2xl transition-all duration-300",
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
        {isNew && (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs font-bold">
            New
          </Badge>
        )}
        {isHot && (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-xs font-bold">
            Hot
          </Badge>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className={cn(
        "absolute top-3 right-3 z-10 flex flex-col gap-2 transition-all duration-300",
        isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      )}>
        <WishlistButton
          product={product}
          storeSlug={storeSlug}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        />
        
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleAddToComparison}
        >
          <GitCompare className="h-4 w-4" />
        </Button>
        
        {onQuickView && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={() => onQuickView(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={product.images[0] || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 product-card-hover:hover:scale-110"
        />
        
        {/* Overlay Add to Cart Button - appears on hover */}
        <div className={cn(
          "absolute inset-0 bg-black/20 flex items-end justify-center p-4 transition-all duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <Button
            onClick={() => onAddToCart(product)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {ctaLabel || 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-4 space-y-3">
        {/* Product Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
        </div>

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
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-foreground">
              {formatCurrency(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_price)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">In Stock</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddToCart(product)}
              className="h-8 px-3 text-xs opacity-70 hover:opacity-100 transition-opacity"
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
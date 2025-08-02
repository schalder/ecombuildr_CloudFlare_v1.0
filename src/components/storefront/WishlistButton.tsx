import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
}

interface WishlistButtonProps {
  product: Product;
  storeSlug: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'secondary' | 'ghost';
  className?: string;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  product,
  storeSlug,
  size = 'sm',
  variant = 'secondary',
  className
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if product is in wishlist
    const wishlist = localStorage.getItem(`wishlist-${storeSlug}`);
    if (wishlist) {
      try {
        const products = JSON.parse(wishlist);
        setIsWishlisted(products.some((p: Product) => p.id === product.id));
      } catch (error) {
        console.error('Error parsing wishlist:', error);
      }
    }
  }, [product.id, storeSlug]);

  const toggleWishlist = () => {
    const wishlist = localStorage.getItem(`wishlist-${storeSlug}`);
    let products: Product[] = [];
    
    if (wishlist) {
      try {
        products = JSON.parse(wishlist);
      } catch (error) {
        console.error('Error parsing wishlist:', error);
      }
    }

    if (isWishlisted) {
      // Remove from wishlist
      products = products.filter(p => p.id !== product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      // Add to wishlist
      products.push(product);
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }

    localStorage.setItem(`wishlist-${storeSlug}`, JSON.stringify(products));
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={toggleWishlist}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        size === 'sm' && "h-8 w-8 p-0 rounded-full",
        className
      )}
    >
      <Heart 
        className={cn(
          "transition-all duration-200",
          size === 'sm' ? "h-4 w-4" : "h-5 w-5",
          isWishlisted && "fill-red-500 text-red-500 scale-110"
        )} 
      />
    </Button>
  );
};
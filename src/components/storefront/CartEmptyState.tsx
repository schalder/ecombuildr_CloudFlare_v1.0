import React from 'react';
import { Button } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';

interface CartEmptyStateProps {
  onContinueShopping: string;
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({
  onContinueShopping
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {/* Animated Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center animate-pulse">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Sparkles className="w-6 h-6 text-primary/60 animate-bounce" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2 mb-6">
        <h3 className="text-xl font-semibold text-foreground">Your cart is empty</h3>
        <p className="text-muted-foreground max-w-sm">
          Looks like you haven't added anything to your cart yet. Start browsing our amazing products!
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 w-full max-w-xs">
        <SheetClose asChild>
          <Link to={onContinueShopping} className="block">
            <Button className="w-full product-cta" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Shopping
            </Button>
          </Link>
        </SheetClose>
        
        <Button variant="outline" className="w-full" size="lg">
          View Trending Products
        </Button>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-xs text-muted-foreground space-y-1">
        <p>✨ Free shipping on orders over $50</p>
        <p>🛡️ 30-day money-back guarantee</p>
        <p>⚡ Lightning-fast delivery</p>
      </div>
    </div>
  );
};
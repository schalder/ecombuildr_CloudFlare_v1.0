import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SheetClose } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Tag, Shield, Truck, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

interface CartOrderSummaryProps {
  subtotal: number;
  total: number;
  itemCount: number;
  checkoutPath: string;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  subtotal,
  total,
  itemCount,
  checkoutPath
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const { toast } = useToast();

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    
    // Simulate promo code validation
    setTimeout(() => {
      setIsApplyingPromo(false);
      if (promoCode.toLowerCase() === 'welcome10') {
        setPromoApplied(true);
        toast({
          title: "Promo code applied!",
          description: "You saved 10% on your order.",
        });
      } else {
        toast({
          title: "Invalid promo code",
          description: "Please check your code and try again.",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  const discount = promoApplied ? subtotal * 0.1 : 0;
  const finalTotal = total - discount;

  return (
    <div className="space-y-4">
      {/* Promo Code Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Promo Code</span>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1"
            disabled={promoApplied}
          />
          <Button
            variant="outline"
            onClick={handleApplyPromo}
            disabled={!promoCode.trim() || promoApplied || isApplyingPromo}
            className="px-4"
          >
            {isApplyingPromo ? 'Applying...' : 'Apply'}
          </Button>
        </div>
        
        {promoApplied && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              WELCOME10 Applied
            </Badge>
            <span className="text-xs text-success">10% off</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Order Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Order Summary</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount (WELCOME10)</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-success">Free</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">Calculated at checkout</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-success" />
          <span>Secure checkout with SSL encryption</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="h-3.5 w-3.5 text-primary" />
          <span>Free shipping on orders over $50</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-warning" />
          <span>Estimated delivery: 2-5 business days</span>
        </div>
      </div>

      {/* Checkout Button */}
      <SheetClose asChild>
        <Link to={checkoutPath} className="block">
          <Button className="w-full product-cta" size="lg">
            Proceed to Secure Checkout
          </Button>
        </Link>
      </SheetClose>
    </div>
  );
};
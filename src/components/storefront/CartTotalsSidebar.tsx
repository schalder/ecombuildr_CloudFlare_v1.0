import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { SheetClose } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

interface CartTotalsSidebarProps {
  subtotal: number;
  total: number;
  itemCount: number;
  checkoutPath: string;
}

export const CartTotalsSidebar: React.FC<CartTotalsSidebarProps> = ({
  subtotal,
  total,
  itemCount,
  checkoutPath,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    
    // Simulate API call
    setTimeout(() => {
      setAppliedPromo(promoCode);
      setPromoCode('');
      setIsApplyingPromo(false);
      toast({
        title: "Promo code applied!",
        description: `You saved 10% with code ${promoCode}`,
      });
    }, 1000);
  };

  const discount = appliedPromo ? subtotal * 0.1 : 0;
  const finalTotal = subtotal - discount;

  return (
    <div className="w-full lg:w-80 bg-muted/30 rounded-lg p-6 h-fit sticky top-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
          </p>
        </div>

        {/* Promo Code */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Promo Code</label>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1"
              disabled={isApplyingPromo || !!appliedPromo}
            />
            <Button 
              variant="outline" 
              onClick={handleApplyPromo}
              disabled={!promoCode.trim() || isApplyingPromo || !!appliedPromo}
              className="px-4"
            >
              {isApplyingPromo ? 'Applying...' : 'Apply'}
            </Button>
          </div>
          {appliedPromo && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded">
              ✓ Promo code "{appliedPromo}" applied
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 border-t border-border/40 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600">-{formatCurrency(discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-foreground">Free</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-foreground">Calculated at checkout</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-border/40 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total</span>
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <SheetClose asChild>
          <Link to={checkoutPath}>
            <Button className="w-full py-3 text-base font-medium">
              Proceed to Checkout
            </Button>
          </Link>
        </SheetClose>
      </div>
    </div>
  );
};
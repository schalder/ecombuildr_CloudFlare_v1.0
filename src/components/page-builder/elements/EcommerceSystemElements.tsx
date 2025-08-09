import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useEcomPaths } from '@/lib/pathResolver';

const CartSummaryElement: React.FC<{ element: PageBuilderElement }> = () => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const paths = useEcomPaths();

  if (items.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button onClick={() => (window.location.href = paths.products)}>Continue Shopping</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ShoppingCart className="h-5 w-5 mr-2"/>Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-sm text-muted-foreground">৳{item.price.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>-</Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>Remove</Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">৳{total.toFixed(2)}</span>
          </div>
          <Button className="w-full" onClick={() => (window.location.href = paths.checkout)}>Proceed to Checkout</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const CheckoutCtaElement: React.FC<{ element: PageBuilderElement }> = () => {
  const { total, items } = useCart();
  const paths = useEcomPaths();
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center"><CreditCard className="h-5 w-5 mr-2"/>Checkout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {items.length > 0 ? `You're almost there! Complete your purchase.` : `Your cart is empty.`}
        </p>
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">৳{total.toFixed(2)}</span>
        </div>
        <Button className="w-full" onClick={() => (window.location.href = paths.checkout)} disabled={items.length === 0}>
          Go to Checkout
        </Button>
      </CardContent>
    </Card>
  );
};

export const registerEcommerceSystemElements = () => {
  elementRegistry.register({
    id: 'cart-summary',
    name: 'Cart Summary',
    category: 'ecommerce',
    icon: ShoppingCart,
    component: CartSummaryElement,
    defaultContent: {},
    description: 'Display and edit the shopping cart with totals and a checkout button.'
  });

  elementRegistry.register({
    id: 'checkout-cta',
    name: 'Checkout CTA',
    category: 'ecommerce',
    icon: CreditCard,
    component: CheckoutCtaElement,
    defaultContent: {},
    description: 'Show a concise checkout call-to-action with subtotal.'
  });
};
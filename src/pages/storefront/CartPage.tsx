import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { useEcomPaths } from '@/lib/pathResolver';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { nameWithVariant } from '@/lib/utils';

export const CartPage: React.FC = () => {
  const { slug, websiteId, websiteSlug } = useParams<{ slug?: string; websiteId?: string; websiteSlug?: string }>();
  const { store, loadStore, loadStoreById } = useStore();
  const { items, total, updateQuantity, removeItem } = useCart();
  const paths = useEcomPaths();
  const navigate = useNavigate();
  const isWebsiteContext = Boolean(websiteId || websiteSlug);
  const { pixels } = usePixelContext();
  const { trackInitiateCheckout } = usePixelTracking(pixels, store?.id);

  // Basic SEO
  useEffect(() => {
    document.title = `${store?.name ? store.name + ' - ' : ''}Cart`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'View your shopping cart and proceed to checkout');
  }, [store]);

  useEffect(() => {
    if (!store && (slug || websiteId)) {
      if (slug) loadStore(slug);
      else if (websiteId) {
        // load by website id -> store id
        (async () => {
          const { data, error } = await (await import('@/integrations/supabase/client')).supabase
            .from('websites')
            .select('store_id')
            .eq('id', websiteId)
            .single();
          if (!error && data?.store_id) await loadStoreById(data.store_id);
        })();
      }
    }
  }, [store, slug, websiteId, loadStore, loadStoreById]);

  const cartContent = (
    <div className="container mx-auto px-4 py-8">
      {!store ? (
        <div className="text-center">Loading store...</div>
      ) : items.length === 0 ? (
        <div className="py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">Browse products and add items to your cart.</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate(paths.products)}>Continue Shopping</Button>
                <Button variant="outline" onClick={() => navigate(paths.home)}>Go to Home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.image && (
                        <img src={item.image} alt={`${item.name} image`} className="w-20 h-20 object-cover rounded" loading="lazy" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{nameWithVariant(item.name, item.variation)}</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(item.price)}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm">Qty:</span>
                          <Input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value || '1', 10))}
                            className="w-20"
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remove item">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <Button 
                    className="w-full product-cta"
                    onClick={() => {
                    // Track InitiateCheckout pixel event
                    const trackingItems = items.map(item => ({
                      item_id: item.id,
                      item_name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      item_category: undefined,
                      item_variant: item.variation ? JSON.stringify(item.variation) : undefined
                    }));
                    
                    trackInitiateCheckout({
                      value: total,
                      items: trackingItems
                    });
                    
                    navigate(paths.checkout);
                  }}>
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return cartContent;
};

export default CartPage;

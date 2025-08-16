import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Truck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useEcomPaths } from '@/lib/pathResolver';
import { computeShippingForAddress } from '@/lib/shipping';
import { formatCurrency } from '@/lib/currency';
import { nameWithVariant } from '@/lib/utils';
import { useWebsiteShipping } from '@/hooks/useWebsiteShipping';

interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_area: string;
  payment_method: 'cod' | 'bkash' | 'nagad' | 'sslcommerz';
  notes: string;
  discount_code: string;
}


export const CheckoutPage: React.FC = () => {
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const navigate = useNavigate();
  const { store } = useStore();
  const { items, total, clearCart } = useCart();
  const paths = useEcomPaths();
  const { pixels } = usePixelContext();
  const { trackInitiateCheckout, trackPurchase } = usePixelTracking(pixels);
  const isWebsiteContext = Boolean(websiteId || websiteSlug);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0); // Default shipping cost
  const { websiteShipping } = useWebsiteShipping();

  const [allowedMethods, setAllowedMethods] = useState<Array<'cod' | 'bkash' | 'nagad' | 'sslcommerz'>>(['cod','bkash','nagad','sslcommerz']);

  const [form, setForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_area: '',
    payment_method: 'cod',
    notes: '',
    discount_code: '',
  });

// Recompute shipping cost when address details or settings change
useEffect(() => {
  if (websiteShipping && websiteShipping.enabled) {
    const cost = computeShippingForAddress(websiteShipping, {
      city: form.shipping_city,
      area: form.shipping_area,
      address: form.shipping_address,
    });
    if (typeof cost === 'number') setShippingCost(cost);
    console.debug('[CheckoutPage] Recomputed shipping', {
      city: form.shipping_city,
      area: form.shipping_area,
      address: form.shipping_address,
      cost,
    });
  } else {
    setShippingCost(0);
  }
}, [websiteShipping, form.shipping_city, form.shipping_area, form.shipping_address]);

  // Derive allowed payment methods based on products in cart AND enabled gateways
  useEffect(() => {
    const loadAllowed = async () => {
      const storeAllowed: Record<string, boolean> = {
        cod: true,
        bkash: !!store?.settings?.bkash?.enabled,
        nagad: !!store?.settings?.nagad?.enabled,
        sslcommerz: !!store?.settings?.sslcommerz?.enabled,
      };

      // Empty cart: fall back to store-level enabled list
      if (!items.length) {
        let base = ['cod','bkash','nagad','sslcommerz'].filter((m) => (storeAllowed as any)[m]);
        if (base.length === 0) base = ['cod'];
        setAllowedMethods(base as any);
        if (!base.includes(form.payment_method)) {
          setForm(prev => ({ ...prev, payment_method: (base[0] as any) }));
        }
        return;
      }

      const ids = Array.from(new Set(items.map(i => i.productId)));
      const { data } = await supabase
        .from('products')
        .select('id, allowed_payment_methods')
        .in('id', ids);
      let acc: string[] = ['cod','bkash','nagad','sslcommerz'];
      (data || []).forEach((p: any) => {
        const arr: string[] | null = p.allowed_payment_methods;
        if (arr && arr.length > 0) {
          acc = acc.filter(m => arr.includes(m));
        }
      });
      // Intersect with store-level enabled methods
      acc = acc.filter((m) => (storeAllowed as any)[m]);
      if (acc.length === 0) acc = ['cod'];
      setAllowedMethods(acc as any);
      if (!acc.includes(form.payment_method)) {
        setForm(prev => ({ ...prev, payment_method: acc[0] as any }));
      }
    };
    loadAllowed();
  }, [items, store]);

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(form.customer_name && form.customer_email && form.customer_phone);
      case 2:
        return !!(form.shipping_address && form.shipping_city);
      case 3:
        return !!form.payment_method;
      default:
        return true;
    }
  };

  const applyDiscountCode = async () => {
    if (!form.discount_code.trim() || !store) return;

    setDiscountLoading(true);
    try {
      const { data: discountCode, error } = await supabase
        .from('discount_codes' as any)
        .select('*')
        .eq('store_id', store.id)
        .eq('code', form.discount_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !discountCode) {
        toast.error('Invalid discount code');
        setDiscountAmount(0);
        return;
      }

      // Type assertion for the discount code object
      const discount = discountCode as any;

      // Check if discount is expired
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        toast.error('Discount code has expired');
        setDiscountAmount(0);
        return;
      }

      // Check if discount hasn't started yet
      if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
        toast.error('Discount code is not active yet');
        setDiscountAmount(0);
        return;
      }

      // Check usage limit
      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        toast.error('Discount code usage limit reached');
        setDiscountAmount(0);
        return;
      }

      // Check minimum amount
      if (discount.minimum_amount && total < discount.minimum_amount) {
        toast.error(`Minimum order amount is ${formatCurrency(discount.minimum_amount)} for this discount`);
        setDiscountAmount(0);
        return;
      }

      // Calculate discount amount
      let discountValue = 0;
      if (discount.type === 'percentage') {
        discountValue = (total * discount.value) / 100;
      } else if (discount.type === 'fixed') {
        discountValue = discount.value;
      }

      // Ensure discount doesn't exceed total
      discountValue = Math.min(discountValue, total);
      setDiscountAmount(discountValue);
      toast.success(`Discount code applied! You saved ${formatCurrency(discountValue)}`);
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Error applying discount code');
      setDiscountAmount(0);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!store || items.length === 0) return;

    setLoading(true);
    try {
      // Determine manual number-only mode
      const hasBkashApi = !!(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
      const isBkashManual = !!(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
      const hasNagadApi = !!(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
      const isNagadManual = !!(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
      const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);

      // Create order via secure Edge Function to respect RLS
      const orderData = {
        store_id: store.id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        shipping_address: form.shipping_address,
        shipping_city: form.shipping_city,
        shipping_area: form.shipping_area,
        payment_method: form.payment_method,
        notes: form.notes,
        subtotal: total,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        discount_code: form.discount_code || null,
        total: total + shippingCost - discountAmount,
        status: form.payment_method === 'cod' ? 'pending' as const : (isManual ? 'pending' as const : 'processing' as const),
        order_number: `ORD-${Date.now()}`,
      };

      const itemsPayload = items.map(item => ({
        product_id: item.productId,
        product_name: item.name,
        product_sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        variation: item.variation || {},
        image: item.image || null,
      }));

      const { data, error: createErr } = await supabase.functions.invoke('create-order', {
        body: {
          order: orderData,
          items: itemsPayload,
          storeId: store.id,
        }
      });
      if (createErr) throw createErr;
      const createdOrderId: string | undefined = data?.order?.id;
      if (!createdOrderId) throw new Error('Order was not created');

      // Track purchase event
      if (form.payment_method === 'cod') {
        trackPurchase({
          transaction_id: createdOrderId,
          value: finalTotal,
          items: items.map(item => ({
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
            item_variant: item.variation ? JSON.stringify(item.variation) : undefined,
          })),
        });
      }

      // Update discount code usage if applied (best-effort; ignored if RLS blocks)
      if (discountAmount > 0 && form.discount_code) {
        const { data: currentDiscount } = await supabase
          .from('discount_codes' as any)
          .select('used_count')
          .eq('store_id', store.id)
          .eq('code', form.discount_code.toUpperCase())
          .maybeSingle();
        if (currentDiscount) {
          await supabase
            .from('discount_codes' as any)
            .update({ used_count: (currentDiscount as any).used_count + 1, updated_at: new Date().toISOString() })
            .eq('store_id', store.id)
            .eq('code', form.discount_code.toUpperCase());
        }
      }

      // Handle payment processing
      if (form.payment_method === 'cod' || isManual) {
        clearCart();
        toast.success(isManual ? 'Order placed! Please complete payment to the provided number.' : 'Order placed successfully!');
        navigate(paths.orderConfirmation(createdOrderId));
      } else {
        await initiatePayment(createdOrderId, finalTotal, form.payment_method);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (orderId: string, amount: number, method: string) => {
    try {
      let response;
      
      switch (method) {
        case 'bkash':
          response = await supabase.functions.invoke('bkash-payment', {
            body: { orderId, amount, storeId: store!.id }
          });
          break;
        case 'nagad':
          response = await supabase.functions.invoke('nagad-payment', {
            body: { orderId, amount, storeId: store!.id }
          });
          break;
        case 'sslcommerz':
          response = await supabase.functions.invoke('sslcommerz-payment', {
            body: { 
              orderId, 
              amount, 
              storeId: store!.id,
              customerData: {
                name: form.customer_name,
                email: form.customer_email,
                phone: form.customer_phone,
                address: form.shipping_address,
                city: form.shipping_city,
              }
            }
          });
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { paymentURL } = response.data;
      if (paymentURL) {
        // Redirect to payment gateway
        window.open(paymentURL, '_blank');
        toast.success('Redirecting to payment gateway...');
        
        // Clear cart after initiating payment
        clearCart();
        
        // Redirect to a payment processing page
        navigate(paths.paymentProcessing(orderId));
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    }
  };

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Store not found</div>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">Add products to your cart before checking out.</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(paths.products)}>Continue Shopping</Button>
              <Button variant="outline" onClick={() => navigate(paths.home)}>Go to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const finalTotal = total + shippingCost - discountAmount;

  // Track initial checkout when reaching step 2 or 3
  useEffect(() => {
    if (!hasTrackedCheckout && currentStep >= 2 && items.length > 0 && store) {
      trackInitiateCheckout({
        value: finalTotal,
        items: items.map(item => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_variant: item.variation ? JSON.stringify(item.variation) : undefined,
        })),
      });
      setHasTrackedCheckout(true);
    }
  }, [currentStep, hasTrackedCheckout, finalTotal, items, trackInitiateCheckout, store]);

  const checkoutContent = (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div className="flex justify-center mt-4 space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Full Name *</Label>
                    <Input
                      id="customer_name"
                      value={form.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone Number *</Label>
                    <Input
                      id="customer_phone"
                      value={form.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Shipping Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping_address">Address *</Label>
                  <Textarea
                    id="shipping_address"
                    value={form.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    placeholder="Enter your complete address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_city">City *</Label>
                    <Input
                      id="shipping_city"
                      value={form.shipping_city}
                      onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_area">Area</Label>
                    <Input
                      id="shipping_area"
                      value={form.shipping_area}
                      onChange={(e) => handleInputChange('shipping_area', e.target.value)}
                      placeholder="Enter your area"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment Method */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={form.payment_method}
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedMethods.includes('cod') && (
                      <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                    )}
                    {allowedMethods.includes('bkash') && (
                      <SelectItem value="bkash">bKash</SelectItem>
                    )}
                    {allowedMethods.includes('nagad') && (
                      <SelectItem value="nagad">Nagad</SelectItem>
                    )}
                    {allowedMethods.includes('sslcommerz') && (
                      <SelectItem value="sslcommerz">Credit/Debit Card (SSLCommerz)</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {form.payment_method === 'bkash' && store?.settings?.bkash?.mode === 'number' && store?.settings?.bkash?.number && (
                  <p className="text-sm text-muted-foreground">Pay to bKash number: {store.settings.bkash.number}</p>
                )}
                {form.payment_method === 'nagad' && store?.settings?.nagad?.mode === 'number' && store?.settings?.nagad?.number && (
                  <p className="text-sm text-muted-foreground">Pay to Nagad number: {store.settings.nagad.number}</p>
                )}
                
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for your order"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Order Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Customer Information:</h3>
                  <p>{form.customer_name}</p>
                  <p>{form.customer_email}</p>
                  <p>{form.customer_phone}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Shipping Address:</h3>
                  <p>{form.shipping_address}</p>
                  <p>{form.shipping_city}, {form.shipping_area}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Payment Method:</h3>
                  <p>
                    {form.payment_method === 'cod' && 'Cash on Delivery (COD)'}
                    {form.payment_method === 'bkash' && 'bKash'}
                    {form.payment_method === 'nagad' && 'Nagad'}
                    {form.payment_method === 'sslcommerz' && 'Credit/Debit Card (SSLCommerz)'}
                  </p>
                </div>
                {form.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Notes:</h3>
                      <p>{form.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmitOrder}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{nameWithVariant(item.name, item.variation)} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Discount Code */}
              <div className="space-y-2">
                <Label htmlFor="discount_code">Discount Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="discount_code"
                    value={form.discount_code}
                    onChange={(e) => handleInputChange('discount_code', e.target.value.toUpperCase())}
                    placeholder="Enter code"
                  />
                  <Button
                    variant="outline"
                    onClick={applyDiscountCode}
                    disabled={discountLoading}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const fullCheckoutContent = (
    <div className="container mx-auto px-4 py-8">
      {!store ? (
        <div className="text-center">Store not found</div>
      ) : items.length === 0 ? (
        <div className="py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">Add products to your cart before checking out.</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate(paths.products)}>Continue Shopping</Button>
                <Button variant="outline" onClick={() => navigate(paths.home)}>Go to Home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        checkoutContent
      )}
    </div>
  );

  return fullCheckoutContent;
};
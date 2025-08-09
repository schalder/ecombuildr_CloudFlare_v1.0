import React, { useEffect, useState } from 'react';
import { ShoppingCart, CreditCard, Package, MapPin, CheckCircle, RefreshCw, Heart, Share2, Star } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { useEcomPaths } from '@/lib/pathResolver';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStoreProducts } from '@/hooks/useStoreData';
import { generateResponsiveCSS } from '@/components/page-builder/utils/responsiveStyles';

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

// Product Detail Element (usable on any page, reads :productSlug if present)
const ProductDetailElement: React.FC<{ element: PageBuilderElement }> = ({ element }) => {
  const { productSlug, websiteId } = useParams<{ productSlug?: string; websiteId?: string }>();
  const { store, loadStoreById } = useStore();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    (async () => {
      if (!store && websiteId) {
        const { data: website } = await supabase.from('websites').select('store_id').eq('id', websiteId).single();
        if (website?.store_id) await loadStoreById(website.store_id);
      }
    })();
  }, [store, websiteId, loadStoreById]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!store) return;
      try {
        setLoading(true);
        let query = supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true);
        if (productSlug) {
          query = query.eq('slug', productSlug);
        } else if (element.content?.productId) {
          query = query.eq('id', element.content.productId);
        } else {
          setProduct(null);
          setLoading(false);
          return;
        }
        const { data } = await query.single();
        setProduct({
          ...data,
          images: Array.isArray(data?.images) ? data.images : [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [store, productSlug, element.content?.productId]);

  const handleAdd = () => {
    if (!product) return;
    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      sku: product.sku,
      quantity,
    });
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center text-muted-foreground">No product selected.</div>;
  }

  const isOut = product.track_inventory && typeof product.inventory_quantity === 'number' && product.inventory_quantity <= 0;
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {product.images?.length > 1 && (
            <div className="order-2 lg:order-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:w-20">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 aspect-square w-16 lg:w-full rounded border-2 overflow-hidden transition-all ${selectedImage===i?'border-primary ring-2 ring-primary/20':'border-border hover:border-primary/50'}`}>
                  <img src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="order-1 lg:order-2 flex-1">
            <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
              <img src={product.images?.[selectedImage] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
              {discount>0 && (<Badge variant="destructive" className="absolute top-4 left-4 text-xs">-{discount}%</Badge>)}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">৳{product.price?.toFixed(2)}</span>
            {product.compare_price && product.compare_price>product.price && (
              <span className="text-xl text-muted-foreground line-through">৳{product.compare_price.toFixed(2)}</span>
            )}
          </div>
          {product.short_description && (<p className="text-muted-foreground">{product.short_description}</p>)}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity-1))} disabled={quantity<=1}>-</Button>
                <span className="px-3 py-1 border rounded min-w-[50px] text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity+1)} disabled={isOut}>+</Button>
              </div>
            </div>
            <Button onClick={handleAdd} disabled={isOut} className="w-full md:w-auto">
              <ShoppingCart className="h-4 w-4 mr-2"/>
              {isOut ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
          <Separator />
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Related Products (simple grid)
const RelatedProductsElement: React.FC<{ element: PageBuilderElement }> = ({ element }) => {
  const { products } = useStoreProducts({ limit: element.content?.limit || 4 });
  const paths = useEcomPaths();
  return (
    <div className="max-w-6xl mx-auto">
      {element.content?.title && <h3 className="text-xl font-semibold mb-4">{element.content.title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <Card key={p.id} className="group">
            <CardContent className="p-3">
              <div className="aspect-square rounded-lg overflow-hidden mb-2">
                <img src={(Array.isArray(p.images)?p.images[0]:p.images) || '/placeholder.svg'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="text-sm font-medium line-clamp-1">{p.name}</div>
              <div className="text-sm">৳{Number(p.price).toFixed(2)}</div>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => (window.location.href = paths.productDetail(p.slug))}>View</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Full Cart Element
const CartFullElement: React.FC<{ element: PageBuilderElement }> = () => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const paths = useEcomPaths();
  if (items.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader><CardTitle>Cart</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button onClick={() => (window.location.href = paths.products)}>Continue Shopping</Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded border" />}
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-sm text-muted-foreground">৳{item.price.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity-1))}>-</Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity+1)}>+</Button>
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <Card>
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">৳{total.toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={() => (window.location.href = paths.checkout)}>Proceed to Checkout</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Full Checkout Element (wired to builder options and responsive styles)
const CheckoutFullElement: React.FC<{ element: PageBuilderElement }> = ({ element }) => {
  const { slug, websiteId } = useParams<{ slug?: string; websiteId?: string }>();
  const navigate = useNavigate();
  const { store, loadStore, loadStoreById } = useStore();
  const { items, total, clearCart } = useCart();
  const paths = useEcomPaths();

  const cfg: any = element.content || {};
  const fields = cfg.fields || {
    fullName: { enabled: true, placeholder: 'Full Name' },
    phone: { enabled: true, placeholder: 'Phone Number' },
    email: { enabled: true, placeholder: 'Email Address' },
    address: { enabled: true, placeholder: 'Street address' },
    city: { enabled: true, placeholder: 'City' },
    area: { enabled: true, placeholder: 'Area' },
    country: { enabled: true, placeholder: 'Country' },
    state: { enabled: true, placeholder: 'State/Province' },
    postalCode: { enabled: true, placeholder: 'ZIP / Postal code' },
  };
  const customFields: any[] = cfg.customFields || [];
  const terms = cfg.terms || { enabled: false, required: true, label: 'I agree to the Terms & Conditions', url: '/terms' };
  const trust = cfg.trustBadge || { enabled: false, imageUrl: '', alt: 'Secure checkout' };
  const buttonLabel: string = cfg.placeOrderLabel || 'Place Order';
  const showItemImages: boolean = cfg.showItemImages ?? true;
  const sections = cfg.sections || { info: true, shipping: true, payment: true, summary: true };

  // Dynamic grid helpers for responsive form layout
  const showFullName = !!fields.fullName?.enabled;
  const showPhone = !!fields.phone?.enabled;
  const infoCols = showFullName && showPhone ? 'md:grid-cols-2' : 'md:grid-cols-1';

  const showCity = !!fields.city?.enabled;
  const showArea = !!fields.area?.enabled;
  const ship2Cols = showCity && showArea ? 'md:grid-cols-2' : 'md:grid-cols-1';

  const showCountry = !!fields.country?.enabled;
  const showState = !!fields.state?.enabled;
  const showPostal = !!fields.postalCode?.enabled;
  const ship3Cols = showCountry && showState && showPostal
    ? 'md:grid-cols-3'
    : ((showCountry && showState) || (showCountry && showPostal) || (showState && showPostal)
      ? 'md:grid-cols-2'
      : 'md:grid-cols-1');

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    shipping_address: '', shipping_city: '', shipping_area: '',
    shipping_country: '', shipping_state: '', shipping_postal_code: '',
    payment_method: 'cod' as 'cod' | 'bkash' | 'nagad' | 'sslcommerz', notes: '',
    accept_terms: false,
    custom_fields: {} as Record<string, any>,
  });
  const [shippingCost] = useState(50);
  const [loading, setLoading] = useState(false);

  // Button responsive CSS
  const buttonStyles = (element.styles as any)?.checkoutButton || { responsive: { desktop: {}, mobile: {} } };
  const buttonCSS = generateResponsiveCSS(element.id, buttonStyles);

  useEffect(() => {
    if (slug) loadStore(slug);
    else if (websiteId) {
      (async () => {
        const { data: website } = await supabase.from('websites').select('store_id').eq('id', websiteId).single();
        if (website?.store_id) await loadStoreById(website.store_id);
      })();
    }
  }, [slug, websiteId, loadStore, loadStoreById]);

  const handleSubmit = async () => {
    if (!store || items.length === 0) return;
    if (terms.enabled && terms.required && !form.accept_terms) {
      toast.error('Please accept the terms to continue');
      return;
    }
    setLoading(true);
    try {
      const orderData: any = {
        store_id: store.id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        shipping_address: form.shipping_address,
        shipping_city: form.shipping_city,
        shipping_area: form.shipping_area,
        shipping_country: form.shipping_country,
        shipping_state: form.shipping_state,
        shipping_postal_code: form.shipping_postal_code,
        payment_method: form.payment_method,
        notes: form.notes,
        subtotal: total,
        shipping_cost: shippingCost,
        discount_amount: 0,
        total: total + shippingCost,
        status: form.payment_method === 'cod' ? 'pending' as const : 'processing' as const,
        order_number: `ORD-${Date.now()}`,
        custom_fields: form.custom_fields,
      };
      const { data: order } = await supabase.from('orders').insert(orderData).select().single();
      const orderItems = items.map(i => ({ order_id: order!.id, product_id: i.productId, product_name: i.name, product_sku: i.sku, price: i.price, quantity: i.quantity, total: i.price * i.quantity }));
      await supabase.from('order_items').insert(orderItems);
      if (form.payment_method === 'cod') {
        clearCart();
        toast.success('Order placed!');
        navigate(paths.orderConfirmation(order!.id));
      } else {
        await initiatePayment(order!.id, orderData.total, form.payment_method);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (orderId: string, amount: number, method: string) => {
    try {
      let response;
      switch (method) {
        case 'bkash':
          response = await supabase.functions.invoke('bkash-payment', { body: { orderId, amount, storeId: store!.id } });
          break;
        case 'nagad':
          response = await supabase.functions.invoke('nagad-payment', { body: { orderId, amount, storeId: store!.id } });
          break;
        case 'sslcommerz':
          response = await supabase.functions.invoke('sslcommerz-payment', { body: { orderId, amount, storeId: store!.id, customerData: { name: form.customer_name, email: form.customer_email, phone: form.customer_phone, address: form.shipping_address, city: form.shipping_city, country: form.shipping_country, state: form.shipping_state, postal_code: form.shipping_postal_code } } });
          break;
        default:
          throw new Error('Invalid payment method');
      }
      if (response.error) throw new Error(response.error.message);
      const { paymentURL } = response.data;
      if (paymentURL) {
        window.open(paymentURL, '_blank');
        clearCart();
        navigate(paths.paymentProcessing(orderId));
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment');
    }
  };

  if (!store) return <div className="text-center">Loading store...</div>;
  if (items.length === 0) return <div className="text-center text-muted-foreground">Your cart is empty.</div>;

  return (
    <>
      {/* Responsive styles for the primary button */}
      <style>{buttonCSS}</style>
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {sections.info && (
            <Card>
              <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className={`grid grid-cols-1 ${infoCols} gap-3`}>
                  {fields.fullName?.enabled && (
                    <Input placeholder={fields.fullName.placeholder} value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} />
                  )}
                  {fields.phone?.enabled && (
                    <Input placeholder={fields.phone.placeholder} value={form.customer_phone} onChange={e=>setForm(f=>({...f,customer_phone:e.target.value}))} />
                  )}
                </div>
                {fields.email?.enabled && (
                  <Input type="email" placeholder={fields.email.placeholder} value={form.customer_email} onChange={e=>setForm(f=>({...f,customer_email:e.target.value}))} />
                )}
              </CardContent>
            </Card>
          )}
          {sections.shipping && (
            <Card>
              <CardHeader><CardTitle>Shipping</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {fields.address?.enabled && (
                  <Textarea placeholder={fields.address.placeholder} value={form.shipping_address} onChange={e=>setForm(f=>({...f,shipping_address:e.target.value}))} rows={3} />
                )}
                <div className={`grid grid-cols-1 ${ship2Cols} gap-3`}>
                  {fields.city?.enabled && (
                    <Input placeholder={fields.city.placeholder} value={form.shipping_city} onChange={e=>setForm(f=>({...f,shipping_city:e.target.value}))} />
                  )}
                  {fields.area?.enabled && (
                    <Input placeholder={fields.area.placeholder} value={form.shipping_area} onChange={e=>setForm(f=>({...f,shipping_area:e.target.value}))} />
                  )}
                </div>
                <div className={`grid grid-cols-1 ${ship3Cols} gap-3`}>
                  {fields.country?.enabled && (
                    <Input placeholder={fields.country.placeholder} value={form.shipping_country} onChange={e=>setForm(f=>({...f,shipping_country:e.target.value}))} />
                  )}
                  {fields.state?.enabled && (
                    <Input placeholder={fields.state.placeholder} value={form.shipping_state} onChange={e=>setForm(f=>({...f,shipping_state:e.target.value}))} />
                  )}
                  {fields.postalCode?.enabled && (
                    <Input placeholder={fields.postalCode.placeholder} value={form.shipping_postal_code} onChange={e=>setForm(f=>({...f,shipping_postal_code:e.target.value}))} />
                  )}
                </div>

                {/* Custom fields */}
                {customFields?.length > 0 && (
                  <div className="space-y-2">
                    {customFields.filter((cf:any)=>cf.enabled).map((cf:any) => (
                      <div key={cf.id}>
                        {cf.type === 'textarea' ? (
                          <Textarea placeholder={cf.placeholder || cf.label} value={(form.custom_fields as any)[cf.id] || ''} onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} />
                        ) : (
                          <Input type={cf.type || 'text'} placeholder={cf.placeholder || cf.label} value={(form.custom_fields as any)[cf.id] || ''} onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {sections.payment && (
            <Card>
              <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={form.payment_method} onValueChange={(v:any)=>setForm(f=>({...f,payment_method:v}))}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="sslcommerz">Credit/Debit Card (SSLCommerz)</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Order notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />

                {terms.enabled && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.accept_terms} onChange={(e)=>setForm(f=>({...f, accept_terms: e.target.checked}))} />
                    <span>
                      {terms.label} {terms.url && (<a href={terms.url} target="_blank" rel="noreferrer" className="underline">Read</a>)}
                    </span>
                  </label>
                )}
              </CardContent>
            </Card>
          )
        </div>
        <div className="space-y-4">
          {sections.summary && (
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((it)=> (
                    <div key={it.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {showItemImages && it.image && (
                          <img src={it.image} alt={it.name} className="w-10 h-10 object-cover rounded border" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{it.name}</div>
                          <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">৳{(it.price * it.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">৳{total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="font-semibold">৳{shippingCost.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>৳{(total+shippingCost).toFixed(2)}</span></div>

                <Button className={`w-full mt-2 element-${element.id}`} onClick={handleSubmit} disabled={loading}>
                  {loading? 'Placing Order...' : buttonLabel}
                </Button>

                {trust.enabled && trust.imageUrl && (
                  <div className="pt-2">
                    <img src={trust.imageUrl} alt={trust.alt || 'Secure checkout'} className="w-full h-auto object-contain" loading="lazy" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        </div>
      </div>
    </>
  );
};

// Order Confirmation Element (reads orderId from path or ?orderId=)
const OrderConfirmationElement: React.FC<{ element: PageBuilderElement }> = () => {
  const { orderId, websiteId } = useParams<{ orderId?: string; websiteId?: string }>();
  const { store, loadStoreById } = useStore();
  const paths = useEcomPaths();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const id = orderId || query.get('orderId') || '';

  useEffect(() => {
    (async () => {
      if (!store && websiteId) {
        const { data: w } = await supabase.from('websites').select('store_id').eq('id', websiteId).single();
        if (w?.store_id) await loadStoreById(w.store_id);
      }
    })();
  }, [store, websiteId, loadStoreById]);

  useEffect(() => {
    (async () => {
      if (!store || !id) { setLoading(false); return; }
      try {
        const { data: o } = await supabase.from('orders').select('*').eq('id', id).eq('store_id', store.id).single();
        setOrder(o);
        const { data: it } = await supabase.from('order_items').select('*').eq('order_id', id);
        setItems(it || []);
      } finally { setLoading(false); }
    })();
  }, [store, id]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (!order) return <div className="text-center">Order not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">Thank you for your order.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Order #{order.order_number}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Customer</h3>
            <p className="text-sm">{order.customer_name} · {order.customer_phone}</p>
            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Shipping</h3>
            <p className="text-sm">{order.shipping_address}</p>
            <p className="text-sm">{order.shipping_city}{order.shipping_area && `, ${order.shipping_area}`}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{it.product_name} × {it.quantity}</span>
              <span>৳{Number(it.total).toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold"><span>Total</span><span>৳{Number(order.total).toFixed(2)}</span></div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = paths.home)} className="flex-1">Continue Shopping</Button>
        <Button variant="outline" onClick={() => window.print()} className="flex-1">Print</Button>
      </div>
    </div>
  );
};

// Payment Processing Element
const PaymentProcessingElement: React.FC<{ element: PageBuilderElement }> = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const paths = useEcomPaths();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const id = orderId || new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('orderId') || '';

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
      const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      setOrder(data || null);
      setLoading(false);
    })();
  }, [id]);

  const verifyPayment = async () => {
    if (!order) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { orderId: order.id, paymentId: order.id, method: order.payment_method }
      });
      if (error) throw error;
      if (data.paymentStatus === 'success') {
        toast.success('Payment verified');
        window.location.href = paths.orderConfirmation(order.id);
      } else {
        toast.error('Payment verification failed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to verify payment');
    } finally { setVerifying(false); }
  };

  const getStatusText = () => {
    if (!order) return 'Loading...';
    switch (order.status) {
      case 'paid': return 'Payment Successful';
      case 'payment_failed': return 'Payment Failed';
      default: return 'Payment Processing';
    }
  };

  if (loading) return <div className="text-center">Loading order...</div>;
  if (!order) return <div className="text-center">Order not found</div>;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{getStatusText()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded">
          <div className="flex justify-between text-sm">
            <span>Order No.</span><span className="font-medium">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total</span><span className="font-medium">৳{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
        {order.status === 'processing' && (
          <Button className="w-full" onClick={verifyPayment} disabled={verifying}>{verifying? 'Verifying...' : 'Verify Payment Status'}</Button>
        )}
        <Button variant="outline" className="w-full" onClick={() => (window.location.href = paths.home)}>Continue Shopping</Button>
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

  elementRegistry.register({
    id: 'product-detail',
    name: 'Product Detail',
    category: 'ecommerce',
    icon: Package,
    component: ProductDetailElement,
    defaultContent: {},
    description: 'Full product page block. Reads product from URL or configured ID.'
  });

  elementRegistry.register({
    id: 'related-products',
    name: 'Related Products',
    category: 'ecommerce',
    icon: Star,
    component: RelatedProductsElement,
    defaultContent: { limit: 4, title: 'Related Products' },
    description: 'Show a small grid of products.'
  });

  elementRegistry.register({
    id: 'cart-full',
    name: 'Cart (Full)',
    category: 'ecommerce',
    icon: ShoppingCart,
    component: CartFullElement,
    defaultContent: {},
    description: 'Full cart with line items and summary.'
  });

  elementRegistry.register({
    id: 'checkout-full',
    name: 'Checkout (Full)',
    category: 'ecommerce',
    icon: CreditCard,
    component: CheckoutFullElement,
    defaultContent: {},
    description: 'Full checkout form with summary.'
  });

  elementRegistry.register({
    id: 'order-confirmation',
    name: 'Order Confirmation',
    category: 'ecommerce',
    icon: CheckCircle,
    component: OrderConfirmationElement,
    defaultContent: {},
    description: 'Show order details. Reads orderId from URL or query.'
  });

  elementRegistry.register({
    id: 'payment-processing',
    name: 'Payment Processing',
    category: 'ecommerce',
    icon: RefreshCw,
    component: PaymentProcessingElement,
    defaultContent: {},
    description: 'Verify payment status for an order.'
  });
};
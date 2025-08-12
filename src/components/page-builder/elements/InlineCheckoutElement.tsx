import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/contexts/StoreContext';
import { useStoreProducts } from '@/hooks/useStoreData';
import { useWebsiteShipping } from '@/hooks/useWebsiteShipping';
import { useNavigate, useParams } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { generateResponsiveCSS, mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { computeShippingForAddress } from '@/lib/shipping';

const InlineCheckoutElement: React.FC<{ element: PageBuilderElement; deviceType?: 'desktop' | 'tablet' | 'mobile' }> = ({ element, deviceType = 'desktop' }) => {
  const navigate = useNavigate();
  const { websiteId } = useParams<{ websiteId?: string }>();
  const paths = useEcomPaths();
  const { store, loadStoreById } = useStore();

  const cfg: any = element.content || {};
  const productIds: string[] = Array.isArray(cfg.productIds) ? cfg.productIds : [];
  const allowSwitching: boolean = cfg.allowSwitching !== false; // default true
  const showQuantity: boolean = cfg.showQuantity !== false; // default true
  const headings = cfg.headings || { info: 'Customer Information', shipping: 'Shipping', payment: 'Payment', summary: 'Order Summary' };
  const sections = cfg.sections || { info: true, shipping: true, payment: true, summary: true };
  const fields = cfg.fields || {
    fullName: { enabled: true, required: true, placeholder: 'Full Name' },
    phone: { enabled: true, required: true, placeholder: 'Phone Number' },
    email: { enabled: true, required: false, placeholder: 'Email Address' },
    address: { enabled: true, required: true, placeholder: 'Street address' },
    city: { enabled: true, required: true, placeholder: 'City' },
    area: { enabled: true, required: false, placeholder: 'Area' },
    country: { enabled: true, required: false, placeholder: 'Country' },
    state: { enabled: true, required: false, placeholder: 'State/Province' },
    postalCode: { enabled: true, required: false, placeholder: 'ZIP / Postal code' },
  };
  const customFields: any[] = cfg.customFields || [];
  const terms = cfg.terms || { enabled: false, required: true, label: 'I agree to the Terms & Conditions', url: '/terms' };
  const trust = cfg.trustBadge || { enabled: false, imageUrl: '', alt: 'Secure checkout' };
  const buttonLabel: string = cfg.placeOrderLabel || 'Place Order';
  const showItemImages: boolean = cfg.showItemImages ?? true;
  const orderBump = cfg.orderBump || { enabled: false, productId: '', label: 'Add this to my order', description: '', prechecked: false };

  // Load store via websiteId if provided (for domain/website routes)
  useEffect(() => {
    (async () => {
      if (!store && websiteId) {
        const { data: website } = await supabase.from('websites').select('store_id').eq('id', websiteId).maybeSingle();
        if (website?.store_id) await loadStoreById(website.store_id);
      }
    })();
  }, [store, websiteId, loadStoreById]);

  // Load configured products (include bump product if set)
  const allProductIds = useMemo(() => Array.from(new Set([...(productIds || []), cfg?.orderBump?.productId].filter(Boolean))), [productIds, cfg?.orderBump?.productId]);
  const { products } = useStoreProducts({ specificProductIds: allProductIds });
  const defaultProductId: string = useMemo(() => {
    if (cfg.defaultProductId && productIds.includes(cfg.defaultProductId)) return cfg.defaultProductId;
    return productIds[0] || '';
  }, [cfg.defaultProductId, productIds]);

  const [selectedId, setSelectedId] = useState<string>(defaultProductId);
  useEffect(() => { setSelectedId((prev) => (productIds.includes(prev) ? prev : defaultProductId)); }, [defaultProductId, productIds]);
  const [quantity, setQuantity] = useState<number>(1);
  const [bumpChecked, setBumpChecked] = useState<boolean>(!!orderBump.prechecked);

  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedId), [products, selectedId]);
  const bumpProduct = useMemo(() => products.find((p) => p.id === orderBump.productId), [products, orderBump.productId]);

  const isSelectedOut = !!(selectedProduct?.track_inventory && typeof selectedProduct?.inventory_quantity === 'number' && selectedProduct?.inventory_quantity <= 0);

  // Form state
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    shipping_address: '', shipping_city: '', shipping_area: '',
    shipping_country: '', shipping_state: '', shipping_postal_code: '',
    payment_method: 'cod' as 'cod' | 'bkash' | 'nagad' | 'sslcommerz', notes: '',
    accept_terms: false,
    custom_fields: {} as Record<string, any>,
  });

  // Styles
  const buttonStyles = (element.styles as any)?.checkoutButton || { responsive: { desktop: {}, mobile: {} } };
  const buttonCSS = generateResponsiveCSS(element.id, buttonStyles);
  const headerStyles = (element.styles as any)?.checkoutSectionHeader || { responsive: { desktop: {}, mobile: {} } };
  const headerCSS = generateResponsiveCSS(`${element.id}-section-header`, headerStyles);
  const backgrounds = (element.styles as any)?.checkoutBackgrounds || {};
  const formBorderWidth = Number((backgrounds as any)?.formBorderWidth || 0);
  const summaryBorderWidth = Number((backgrounds as any)?.summaryBorderWidth || 0);
  const buttonSize = (((element.styles as any)?.checkoutButtonSize) || 'default') as 'sm' | 'default' | 'lg' | 'xl';
  const buttonInline = useMemo(() => mergeResponsiveStyles({}, buttonStyles, deviceType as any), [buttonStyles, deviceType]);
  const headerInline = useMemo(() => mergeResponsiveStyles({}, headerStyles, deviceType as any), [headerStyles, deviceType]);

  // Shipping
  const { websiteShipping } = useWebsiteShipping();
  const [shippingCost, setShippingCost] = useState(0);
  useEffect(() => {
    if (websiteShipping && websiteShipping.enabled) {
      const cost = computeShippingForAddress(websiteShipping, {
        city: form.shipping_city,
        area: form.shipping_area,
        address: form.shipping_address,
        postal: form.shipping_postal_code,
      });
      if (typeof cost === 'number') setShippingCost(cost);
    } else setShippingCost(0);
  }, [websiteShipping, form.shipping_city, form.shipping_area, form.shipping_postal_code, form.shipping_address]);

  const subtotal = useMemo(() => {
    const main = selectedProduct ? Number(selectedProduct.price) * Math.max(1, quantity || 1) : 0;
    const bump = (orderBump.enabled && bumpChecked && bumpProduct) ? Number(bumpProduct.price) : 0;
    return main + bump;
  }, [selectedProduct, quantity, orderBump.enabled, bumpChecked, bumpProduct]);

  const handleSubmit = async () => {
    if (!store || !selectedProduct) return;
    if (isSelectedOut) { toast.error('Selected product is out of stock'); return; }
    if (terms.enabled && terms.required && !form.accept_terms) {
      toast.error('Please accept the terms to continue');
      return;
    }

    // Validate required fields
    const missing: string[] = [];
    const isEmpty = (v?: string) => !v || v.trim() === '';
    if (fields.fullName?.enabled && (fields.fullName?.required ?? true) && isEmpty(form.customer_name)) missing.push('Full Name');
    if (fields.phone?.enabled && (fields.phone?.required ?? true) && isEmpty(form.customer_phone)) missing.push('Phone');
    if (fields.email?.enabled && (fields.email?.required ?? false)) {
      const email = form.customer_email || '';
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (isEmpty(email) || !emailOk) missing.push('Valid Email');
    }
    if (fields.address?.enabled && (fields.address?.required ?? true) && isEmpty(form.shipping_address)) missing.push('Address');
    if (fields.city?.enabled && (fields.city?.required ?? true) && isEmpty(form.shipping_city)) missing.push('City');
    if (fields.area?.enabled && (fields.area?.required ?? false) && isEmpty(form.shipping_area)) missing.push('Area');
    if (fields.country?.enabled && (fields.country?.required ?? false) && isEmpty(form.shipping_country)) missing.push('Country');
    if (fields.state?.enabled && (fields.state?.required ?? false) && isEmpty(form.shipping_state)) missing.push('State/Province');
    if (fields.postalCode?.enabled && (fields.postalCode?.required ?? false) && isEmpty(form.shipping_postal_code)) missing.push('ZIP / Postal code');
    (customFields || []).filter((cf:any)=>cf.enabled && cf.required).forEach((cf:any)=>{ const v=(form.custom_fields as any)[cf.id]; if (!String(v ?? '').trim()) missing.push(cf.label || 'Custom field'); });
    if (missing.length) { toast.error(`Please fill in: ${missing.join(', ')}`); return; }

    const total = subtotal + shippingCost;
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
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount_amount: 0,
        total: total,
        status: form.payment_method === 'cod' ? 'pending' : 'processing',
        custom_fields: (customFields || []).filter((cf:any)=>cf.enabled).map((cf:any)=>{ const value=(form.custom_fields as any)[cf.id]; if (value===undefined||value===null||value==='') return null; return { id: cf.id, label: cf.label || cf.id, value }; }).filter(Boolean),
      };

      const itemsPayload: any[] = [
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_sku: selectedProduct.sku,
          price: Number(selectedProduct.price),
          quantity: Math.max(1, quantity || 1),
          image: Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : (selectedProduct.images || null),
          variation: null,
        }
      ];
      if (orderBump.enabled && bumpChecked && bumpProduct) {
        itemsPayload.push({
          product_id: bumpProduct.id,
          product_name: bumpProduct.name,
          product_sku: bumpProduct.sku,
          price: Number(bumpProduct.price),
          quantity: 1,
          image: Array.isArray(bumpProduct.images) ? bumpProduct.images[0] : (bumpProduct.images || null),
          variation: null,
        });
      }

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: { order: orderData, items: itemsPayload, storeId: store.id }
      });
      if (error) throw error;
      const orderId: string | undefined = data?.order?.id;
      if (!orderId) throw new Error('Order was not created');

      if (form.payment_method === 'cod') {
        toast.success('Order placed!');
        navigate(paths.orderConfirmation(orderId));
      } else {
        await initiatePayment(orderId, orderData.total, form.payment_method);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to place order');
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
        navigate(paths.paymentProcessing(orderId));
      } else throw new Error('Payment URL not received');
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment');
    }
  };

  if (!store) return <div className="text-center">Loading store...</div>;
  if (productIds.length === 0) return <div className="text-center text-muted-foreground">Select products for this checkout in the Content panel.</div>;

  // Layout helpers for form
  const showFullName = !!fields.fullName?.enabled;
  const showPhone = !!fields.phone?.enabled;
  const infoGridCols = (showFullName && showPhone) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';
  const showCity = !!fields.city?.enabled;
  const showArea = !!fields.area?.enabled;
  const ship2GridCols = (showCity && showArea) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';
  const showCountry = !!fields.country?.enabled;
  const showState = !!fields.state?.enabled;
  const showPostal = !!fields.postalCode?.enabled;
  const ship3Count = [showCountry, showState, showPostal].filter(Boolean).length;
  let ship3GridCols = 'grid-cols-1';
  if (ship3Count >= 3) ship3GridCols = 'grid-cols-1 md:grid-cols-3';
  else if (ship3Count === 2) ship3GridCols = 'grid-cols-1 md:grid-cols-2';

  return (
    <>
      <style>{buttonCSS + headerCSS}</style>
      <div className="max-w-5xl mx-auto" style={{ backgroundColor: (backgrounds as any).containerBg || undefined }}>
        <Card className={formBorderWidth > 0 ? undefined : 'border-0'} style={{ backgroundColor: (backgrounds as any).formBg || undefined, borderColor: (backgrounds as any).formBorderColor || undefined, borderWidth: formBorderWidth || 0 }}>
          <CardContent className="p-4 md:p-6 space-y-6 w-full overflow-x-hidden" dir="auto">
            {/* Product chooser */}
            <section className="space-y-4">
              <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>Select Product</h3>
              {allowSwitching && products.length > 1 ? (
                <div className="space-y-2">
                  {products.filter((p)=>productIds.includes(p.id)).map((p) => {
                    const isOut = p.track_inventory && typeof p.inventory_quantity === 'number' && p.inventory_quantity <= 0;
                    return (
                      <label key={p.id} className="flex items-start gap-3 border rounded p-3 w-full">
                        {Array.isArray(p.images) && p.images[0] && (
                          <img src={p.images[0]} alt={`${p.name} product`} className="w-12 h-12 object-cover rounded border flex-shrink-0" />
                        )}
                        <input type="radio" name={`inline-product-${element.id}`} className="mt-1 flex-shrink-0" checked={selectedId === p.id} disabled={isOut} onChange={() => setSelectedId(p.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium break-words whitespace-normal leading-snug text-sm md:text-base">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{isOut ? 'Out of stock' : formatCurrency(Number(p.price))}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {selectedProduct && Array.isArray(selectedProduct.images) && selectedProduct.images[0] && (
                    <img src={selectedProduct.images[0]} alt={`${selectedProduct.name} product`} className="w-12 h-12 object-cover rounded border flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium break-words whitespace-normal leading-snug text-sm md:text-base">{selectedProduct?.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedProduct ? formatCurrency(Number(selectedProduct.price)) : ''}</div>
                  </div>
                </div>
              )}

              {showQuantity && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setQuantity((q)=>Math.max(1, (q||1)-1))} disabled={quantity<=1}>-</Button>
                    <span className="px-3 py-1 border rounded min-w-[50px] text-center">{quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => setQuantity((q)=>Math.max(1, (q||1)+1))} disabled={isSelectedOut}>+</Button>
                  </div>
                </div>
              )}

            </section>

            {(sections.info || sections.shipping || sections.payment || sections.summary) && <Separator />}

            {/* Info */}
            {sections.info && (
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.info}</h3>
                <div className={`grid ${infoGridCols} gap-4`}>
                  {fields.fullName?.enabled && (
                    <Input placeholder={fields.fullName.placeholder} value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} required={!!(fields.fullName?.enabled && (fields.fullName?.required ?? true))} aria-required={!!(fields.fullName?.enabled && (fields.fullName?.required ?? true))} />
                  )}
                  {fields.phone?.enabled && (
                    <Input placeholder={fields.phone.placeholder} value={form.customer_phone} onChange={e=>setForm(f=>({...f,customer_phone:e.target.value}))} required={!!(fields.phone?.enabled && (fields.phone?.required ?? true))} aria-required={!!(fields.phone?.enabled && (fields.phone?.required ?? true))} />
                  )}
                </div>
                {fields.email?.enabled && (
                  <Input type="email" placeholder={fields.email.placeholder} value={form.customer_email} onChange={e=>setForm(f=>({...f,customer_email:e.target.value}))} required={!!(fields.email?.enabled && (fields.email?.required ?? false))} aria-required={!!(fields.email?.enabled && (fields.email?.required ?? false))} />
                )}
              </section>
            )}

            {sections.info && (sections.shipping || sections.payment) && <Separator className="my-4" />}

            {/* Shipping */}
            {sections.shipping && (
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.shipping}</h3>
                {fields.address?.enabled && (
                  <Textarea placeholder={fields.address.placeholder} value={form.shipping_address} onChange={e=>setForm(f=>({...f,shipping_address:e.target.value}))} rows={3} required={!!(fields.address?.enabled && (fields.address?.required ?? true))} aria-required={!!(fields.address?.enabled && (fields.address?.required ?? true))} />
                )}
                <div className={`grid ${ship2GridCols} gap-4`}>
                  {fields.city?.enabled && (
                    <Input placeholder={fields.city.placeholder} value={form.shipping_city} onChange={e=>setForm(f=>({...f,shipping_city:e.target.value}))} required={!!(fields.city?.enabled && (fields.city?.required ?? true))} aria-required={!!(fields.city?.enabled && (fields.city?.required ?? true))} />
                  )}
                  {fields.area?.enabled && (
                    <Input placeholder={fields.area.placeholder} value={form.shipping_area} onChange={e=>setForm(f=>({...f,shipping_area:e.target.value}))} required={!!(fields.area?.enabled && (fields.area?.required ?? false))} aria-required={!!(fields.area?.enabled && (fields.area?.required ?? false))} />
                  )}
                </div>
                <div className={`grid ${ship3GridCols} gap-4`}>
                  {fields.country?.enabled && (
                    <Input placeholder={fields.country.placeholder} value={form.shipping_country} onChange={e=>setForm(f=>({...f,shipping_country:e.target.value}))} required={!!(fields.country?.enabled && (fields.country?.required ?? false))} aria-required={!!(fields.country?.enabled && (fields.country?.required ?? false))} />
                  )}
                  {fields.state?.enabled && (
                    <Input placeholder={fields.state.placeholder} value={form.shipping_state} onChange={e=>setForm(f=>({...f,shipping_state:e.target.value}))} required={!!(fields.state?.enabled && (fields.state?.required ?? false))} aria-required={!!(fields.state?.enabled && (fields.state?.required ?? false))} />
                  )}
                  {fields.postalCode?.enabled && (
                    <Input placeholder={fields.postalCode.placeholder} value={form.shipping_postal_code} onChange={e=>setForm(f=>({...f,shipping_postal_code:e.target.value}))} required={!!(fields.postalCode?.enabled && (fields.postalCode?.required ?? false))} aria-required={!!(fields.postalCode?.enabled && (fields.postalCode?.required ?? false))} />
                  )}
                </div>

                {customFields?.length > 0 && (
                  <div className="space-y-2">
                    {customFields.filter((cf:any)=>cf.enabled).map((cf:any) => (
                      <div key={cf.id}>
                        {cf.type === 'textarea' ? (
                          <Textarea placeholder={cf.placeholder || cf.label} value={(form.custom_fields as any)[cf.id] || ''} onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} required={!!cf.required} aria-required={!!cf.required} />
                        ) : (
                          <Input type={cf.type || 'text'} placeholder={cf.placeholder || cf.label} value={(form.custom_fields as any)[cf.id] || ''} onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} required={!!cf.required} aria-required={!!cf.required} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {sections.shipping && sections.payment && <Separator className="my-4" />}

            {/* Payment */}
            {sections.payment && (
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.payment}</h3>
                <Select value={form.payment_method} onValueChange={(v:any)=>setForm(f=>({...f,payment_method:v}))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="sslcommerz">Credit/Debit Card (SSLCommerz)</SelectItem>
                  </SelectContent>
                </Select>
                
              </section>
            )}

            {orderBump.enabled && bumpProduct && (
              <section className="space-y-3">
                <div className="border border-dashed rounded-md overflow-hidden" style={{ borderColor: 'hsl(var(--warning-border))' }}>
                  <div className="px-3 py-2" style={{ backgroundColor: 'hsl(var(--warning-light))' }}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={bumpChecked} onChange={(e)=>setBumpChecked(e.target.checked)} />
                      <span className="text-sm font-semibold" style={{ color: 'hsl(var(--success))' }}>{orderBump.label || 'Add this to my order'}</span>
                    </label>
                  </div>
                  <div className="p-3 flex items-start gap-3">
                    {Array.isArray(bumpProduct.images) && bumpProduct.images[0] && (
                      <img src={bumpProduct.images[0]} alt={`${bumpProduct.name} product`} className="w-12 h-12 object-cover rounded border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium break-words">{bumpProduct.name} · {formatCurrency(Number(bumpProduct.price))}</div>
                      {orderBump.description && (
                        <p className="text-xs text-muted-foreground mt-1 break-words">{orderBump.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {sections.summary && (
              <section className="space-y-3">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.summary}</h3>
                <div className="rounded-md p-4" style={{ backgroundColor: (backgrounds as any).summaryBg || undefined, borderColor: (backgrounds as any).summaryBorderColor || undefined, borderWidth: summaryBorderWidth || 0, borderStyle: summaryBorderWidth ? 'solid' as any : undefined }}>
                  <div className="space-y-2">
                    {selectedProduct && (
                      <div className={`grid items-center gap-3 ${showItemImages && (Array.isArray(selectedProduct.images) && selectedProduct.images[0]) ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                        {showItemImages && Array.isArray(selectedProduct.images) && selectedProduct.images[0] && (
                          <img src={selectedProduct.images[0]} alt={`${selectedProduct.name} product`} className="w-10 h-10 object-cover rounded border" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium break-words">{selectedProduct.name}</div>
                          <div className="text-xs text-muted-foreground">× {Math.max(1, quantity || 1)}</div>
                        </div>
                        <div className="text-sm font-medium shrink-0 whitespace-nowrap text-right">{formatCurrency(Number(selectedProduct.price) * Math.max(1, quantity || 1))}</div>
                      </div>
                    )}
                    {orderBump.enabled && bumpChecked && bumpProduct && (
                      <div className={`grid items-center gap-3 ${showItemImages && (Array.isArray(bumpProduct.images) && bumpProduct.images[0]) ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                        {showItemImages && Array.isArray(bumpProduct.images) && bumpProduct.images[0] && (
                          <img src={bumpProduct.images[0]} alt={`${bumpProduct.name} product`} className="w-10 h-10 object-cover rounded border" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium break-words">{bumpProduct.name}</div>
                          <div className="text-xs text-muted-foreground">× 1</div>
                        </div>
                        <div className="text-sm font-medium shrink-0 whitespace-nowrap text-right">{formatCurrency(Number(bumpProduct.price))}</div>
                      </div>
                    )}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0"><span className="truncate">Subtotal</span><span className="font-semibold shrink-0 whitespace-nowrap text-right">{formatCurrency(subtotal)}</span></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0"><span className="truncate">Shipping</span><span className="font-semibold shrink-0 whitespace-nowrap text-right">{formatCurrency(shippingCost)}</span></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 font-bold"><span className="truncate">Total</span><span className="shrink-0 whitespace-nowrap text-right">{formatCurrency(subtotal + shippingCost)}</span></div>

                  <Button size={buttonSize as any} className={`w-full mt-2 element-${element.id}`} style={buttonInline as React.CSSProperties} onClick={handleSubmit} disabled={!selectedProduct || isSelectedOut}>
                    {isSelectedOut ? 'Out of Stock' : buttonLabel}
                  </Button>

                  {terms.enabled && (
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" checked={form.accept_terms} onChange={(e)=>setForm(f=>({...f, accept_terms: e.target.checked}))} />
                      <span>
                        {terms.label} {terms.url && (<a href={terms.url} target="_blank" rel="noreferrer" className="underline">Read</a>)}
                      </span>
                    </label>
                  )}

                  {trust.enabled && trust.imageUrl && (
                    <div className="pt-2">
                      <img src={trust.imageUrl} alt={trust.alt || 'Secure checkout'} className="w-full h-auto object-contain" loading="lazy" />
                    </div>
                  )}
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export const registerInlineCheckoutElements = () => {
  elementRegistry.register({
    id: 'checkout-inline',
    name: 'Checkout (Inline)',
    category: 'ecommerce',
    icon: CreditCard,
    component: InlineCheckoutElement,
    defaultContent: {
      productIds: [],
      defaultProductId: '',
      allowSwitching: true,
      showQuantity: true,
      orderBump: { enabled: false, productId: '', label: 'Add this to my order', description: '', prechecked: false },
      sections: { info: true, shipping: true, payment: true, summary: true },
      headings: { info: 'Customer Information', shipping: 'Shipping', payment: 'Payment', summary: 'Order Summary' },
      placeOrderLabel: 'Place Order',
      showItemImages: true,
      fields: {
        fullName: { enabled: true, required: true, placeholder: 'Full Name' },
        phone: { enabled: true, required: true, placeholder: 'Phone Number' },
        email: { enabled: true, required: false, placeholder: 'Email Address' },
        address: { enabled: true, required: true, placeholder: 'Street address' },
        city: { enabled: true, required: true, placeholder: 'City' },
        area: { enabled: true, required: false, placeholder: 'Area' },
        country: { enabled: true, required: false, placeholder: 'Country' },
        state: { enabled: true, required: false, placeholder: 'State/Province' },
        postalCode: { enabled: true, required: false, placeholder: 'ZIP / Postal code' },
      },
      customFields: [],
      terms: { enabled: false, required: true, label: 'I agree to the Terms & Conditions', url: '/terms' },
      trustBadge: { enabled: false, imageUrl: '', alt: 'Secure checkout' },
    },
    description: 'Per-page inline checkout with product selection and optional order bump.'
  });
};

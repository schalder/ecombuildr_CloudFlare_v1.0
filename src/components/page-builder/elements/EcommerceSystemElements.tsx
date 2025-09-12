import React, { useEffect, useState, useRef } from 'react';
import { ShoppingCart, CreditCard, Package, MapPin, CheckCircle, RefreshCw, Heart, Share2, Star, Download, CheckCircle2 } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { useEcomPaths } from '@/lib/pathResolver';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStoreProducts } from '@/hooks/useStoreData';
import { formatVariant } from '@/lib/utils';
import { generateResponsiveCSS, mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { formatCurrency } from '@/lib/currency';
import { computeOrderShipping, type CartItem, type ShippingAddress, type ShippingSettings } from '@/lib/shipping-enhanced';
import { nameWithVariant } from '@/lib/utils';
import { useWebsiteShipping } from '@/hooks/useWebsiteShipping';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { useChannelContext } from '@/hooks/useChannelContext';
import { getAvailableShippingOptions, type ShippingOption } from '@/lib/shipping-enhanced';
import { ShippingOptionsPicker } from '@/components/storefront/ShippingOptionsPicker';
import { useHeadStyle } from '@/hooks/useHeadStyle';

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
                  <div className="font-medium truncate">{nameWithVariant(item.name, (item as any).variation)}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(item.price)}</div>
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
            <span className="font-semibold">{formatCurrency(total)}</span>
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
          <span className="font-semibold">{formatCurrency(total)}</span>
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
      if (!store) {
        if (websiteId) {
          const { data: website } = await supabase.from('websites').select('store_id').eq('id', websiteId).maybeSingle();
          if (website?.store_id) await loadStoreById(website.store_id);
        }
        // Note: For funnels, store should be preloaded in PageBuilder context
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
            <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
            {product.compare_price && product.compare_price>product.price && (
              <span className="text-xl text-muted-foreground line-through">{formatCurrency(product.compare_price)}</span>
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
const RelatedProductsElement: React.FC<{ element: PageBuilderElement; deviceType?: 'desktop' | 'tablet' | 'mobile'; }> = ({ element, deviceType = 'desktop' }) => {
  const { websiteId: urlWebsiteId } = useParams<{ websiteId?: string }>();
  
  // Resolve websiteId for filtering (inline logic to avoid import issues)
  const resolvedWebsiteId = React.useMemo(() => {
    const elementWebsiteId = element?.content?.websiteId;
    if (elementWebsiteId === '') return undefined;
    if (elementWebsiteId && elementWebsiteId !== 'auto') return elementWebsiteId;
    return urlWebsiteId || undefined;
  }, [element?.content?.websiteId, urlWebsiteId]);
  
  const { products } = useStoreProducts({ 
    limit: element.content?.limit || 8,
    categoryIds: element.content?.categoryIds || [],
    websiteId: resolvedWebsiteId
  });
  const paths = useEcomPaths();
  const desktopCols = element.content?.columns ?? 4;
  const tabletCols = element.content?.tabletColumns ?? 2;
  const mobileCols = element.content?.mobileColumns ?? 1;
  const gridClass = `grid grid-cols-${mobileCols} md:grid-cols-${tabletCols} lg:grid-cols-${desktopCols} gap-4`;
  const title = element.content?.title || 'Related Products';
  const showTitle = element.content?.showTitle !== false;

  const buttonStyles = React.useMemo(() => {
    const bs = (element as any).styles?.buttonStyles || {};
    if ((bs as any).responsive) {
      return mergeResponsiveStyles({}, bs, deviceType as any) as React.CSSProperties;
    }
    return bs as React.CSSProperties;
  }, [deviceType, (element as any).styles?.buttonStyles]);

  const elementStyles = renderElementStyles(element, deviceType);

  return (
    <div className="max-w-6xl mx-auto">
      {showTitle && title && (
        <h3
          className="font-semibold mb-4"
          style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }}
        >
          {title}
        </h3>
      )}
      <div className={gridClass}>
        {products.map((p) => (
          <Card key={p.id} className="group/card" style={{
            backgroundColor: elementStyles.backgroundColor,
            borderColor: elementStyles.borderColor,
            borderWidth: elementStyles.borderWidth as any,
            borderStyle: elementStyles.borderWidth ? 'solid' : undefined,
            borderRadius: elementStyles.borderRadius as any,
            margin: elementStyles.margin as any,
            marginTop: elementStyles.marginTop as any,
            marginRight: elementStyles.marginRight as any,
            marginBottom: elementStyles.marginBottom as any,
            marginLeft: elementStyles.marginLeft as any,
          }}>
            <CardContent className="p-3" style={{
              padding: elementStyles.padding as any,
              paddingTop: elementStyles.paddingTop as any,
              paddingRight: elementStyles.paddingRight as any,
              paddingBottom: elementStyles.paddingBottom as any,
              paddingLeft: elementStyles.paddingLeft as any,
            }}>
              <div className="aspect-square rounded-lg overflow-hidden mb-2">
                <img src={(Array.isArray(p.images)?p.images[0]:p.images) || '/placeholder.svg'} alt={p.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform" />
              </div>
              <div className="text-sm font-medium" style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }}>{p.name}</div>
              <div className="text-sm">{formatCurrency(Number(p.price))}</div>
              <Button variant="outline" size="sm" className="mt-2 w-full" style={buttonStyles as React.CSSProperties} onClick={() => (window.location.href = paths.productDetail(p.slug))}>{element.content?.ctaText || 'View'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Full Cart Element
const CartFullElement: React.FC<{ element: PageBuilderElement; deviceType?: 'desktop' | 'tablet' | 'mobile' }> = ({ element, deviceType = 'desktop' }) => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const paths = useEcomPaths();
  
  // Apply responsive element styles
  const elementStyles = renderElementStyles(element, deviceType);
  
  // Get button styles safely without deep nesting
  const buttonStyles = React.useMemo(() => {
    const bs = (element.styles as any)?.buttonStyles;
    if (!bs?.responsive) return {};
    
    // Use mergeResponsiveStyles to get the current device styles
    return mergeResponsiveStyles({}, bs, deviceType);
  }, [(element.styles as any)?.buttonStyles, deviceType]);
  
  // Generate CSS variables for cart buttons (works with product-cta class)
  const buttonStylesCSS = React.useMemo(() => {
    const bs = (element.styles as any)?.buttonStyles;
    if (!bs?.responsive) return '';
    
    const { desktop = {}, mobile = {} } = bs.responsive;
    let css = '';
    
    // Desktop CSS variables
    if (Object.keys(desktop).length > 0) {
      const variables: string[] = [];
      if (desktop.backgroundColor) variables.push(`--product-button-bg: ${desktop.backgroundColor}`);
      if (desktop.color) variables.push(`--product-button-text: ${desktop.color}`);
      if (desktop.hoverBackgroundColor) variables.push(`--product-button-hover-bg: ${desktop.hoverBackgroundColor}`);
      if (desktop.hoverColor) variables.push(`--product-button-hover-text: ${desktop.hoverColor}`);
      
      if (variables.length > 0) {
        css += `.cart-element-${element.id} { ${variables.join('; ')}; }`;
      }
    }
    
    // Mobile CSS variables
    if (Object.keys(mobile).length > 0) {
      const variables: string[] = [];
      if (mobile.backgroundColor) variables.push(`--product-button-bg: ${mobile.backgroundColor}`);
      if (mobile.color) variables.push(`--product-button-text: ${mobile.color}`);
      if (mobile.hoverBackgroundColor) variables.push(`--product-button-hover-bg: ${mobile.hoverBackgroundColor}`);
      if (mobile.hoverColor) variables.push(`--product-button-hover-text: ${mobile.hoverColor}`);
      
      if (variables.length > 0) {
        css += `@media (max-width: 767px) { .cart-element-${element.id} { ${variables.join('; ')}; } }`;
      }
    }
    
    return css;
  }, [(element.styles as any)?.buttonStyles, element.id]);

  // Get layout-only inline styles (non-color properties)
  const layoutStyles = React.useMemo(() => {
    const currentStyles = mergeResponsiveStyles({}, (element.styles as any)?.buttonStyles, deviceType);
    const layout: any = {};
    
    // Only include layout properties, exclude colors since they're handled by CSS variables
    if (currentStyles.fontSize) layout.fontSize = currentStyles.fontSize;
    if (currentStyles.padding) layout.padding = currentStyles.padding;
    if (currentStyles.borderRadius) layout.borderRadius = currentStyles.borderRadius;
    if (currentStyles.borderWidth) layout.borderWidth = currentStyles.borderWidth;
    if (currentStyles.borderColor) layout.borderColor = currentStyles.borderColor;
    if (currentStyles.letterSpacing) layout.letterSpacing = currentStyles.letterSpacing;
    if (currentStyles.fontWeight) layout.fontWeight = currentStyles.fontWeight;
    
    return layout;
  }, [(element.styles as any)?.buttonStyles, deviceType]);
  
  // Inject button styles into document head
  useHeadStyle(`cart-button-styles-${element.id}`, buttonStylesCSS || '');

  if (items.length === 0) {
    return (
      <div className={`cart-element-${element.id}`} style={elementStyles}>
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle 
              style={{
                color: elementStyles.color,
                fontSize: elementStyles.fontSize,
                fontFamily: elementStyles.fontFamily,
                lineHeight: elementStyles.lineHeight,
                textAlign: elementStyles.textAlign
              }}
            >
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" style={{
            padding: elementStyles.padding,
            paddingTop: elementStyles.paddingTop,
            paddingRight: elementStyles.paddingRight,
            paddingBottom: elementStyles.paddingBottom,
            paddingLeft: elementStyles.paddingLeft,
          }}>
            <p 
              className="text-muted-foreground"
              style={{
                color: elementStyles.color,
                fontSize: elementStyles.fontSize,
                fontFamily: elementStyles.fontFamily,
                lineHeight: elementStyles.lineHeight,
                textAlign: elementStyles.textAlign
              }}
            >
              Your cart is empty.
            </p>
            <Button 
              className="product-cta cart-action-button"
              style={layoutStyles}
              onClick={() => (window.location.href = paths.products)}
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`cart-element-${element.id}`} style={elementStyles}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_400px] gap-4 lg:gap-8">
          {/* Cart Table */}
          <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="hidden sm:table-header-group">
                  <tr className="border-b border-border">
                    <th 
                      className="text-left py-3 sm:py-4 font-medium text-xs sm:text-sm uppercase tracking-wider"
                      style={{
                        color: elementStyles.color,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      PRODUCT
                    </th>
                    <th 
                      className="text-center py-3 sm:py-4 font-medium text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell"
                      style={{
                        color: elementStyles.color,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      PRICE
                    </th>
                    <th 
                      className="text-center py-3 sm:py-4 font-medium text-xs sm:text-sm uppercase tracking-wider"
                      style={{
                        color: elementStyles.color,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      QUANTITY
                    </th>
                    <th 
                      className="text-right py-3 sm:py-4 font-medium text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell"
                      style={{
                        color: elementStyles.color,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      SUBTOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      {/* Mobile-first responsive layout */}
                      <td className="py-4 sm:py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-start gap-3">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border shrink-0" 
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div 
                                className="font-medium text-sm sm:text-base break-words"
                                style={{
                                  color: elementStyles.color,
                                  fontFamily: elementStyles.fontFamily,
                                  lineHeight: elementStyles.lineHeight
                                }}
                              >
                                {item.name}
                              </div>
                              {(item as any).variation && (
                                <div 
                                  className="text-xs sm:text-sm text-muted-foreground mt-1"
                                  style={{
                                    fontFamily: elementStyles.fontFamily
                                  }}
                                >
                                  {formatVariant((item as any).variation)}
                                </div>
                              )}
                              {/* Remove button below title on mobile */}
                              <div className="mt-2">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-7 px-3 text-xs font-medium"
                                  onClick={() => removeItem(item.id)}
                                >
                                  🗑️ Remove
                                </Button>
                              </div>
                              {/* Price on mobile */}
                              <div className="mt-2 sm:hidden">
                                <span 
                                  className="font-medium text-sm"
                                  style={{
                                    color: elementStyles.color,
                                    fontFamily: elementStyles.fontFamily
                                  }}
                                >
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Price column - hidden on mobile, shown on desktop */}
                      <td className="py-4 sm:py-6 text-center hidden md:table-cell">
                        <span 
                          className="font-medium"
                          style={{
                            color: elementStyles.color,
                            fontFamily: elementStyles.fontFamily
                          }}
                        >
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      {/* Quantity column */}
                      <td className="py-4 sm:py-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-8 h-8 p-0 text-xs"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity-1))}
                          >
                            -
                          </Button>
                          <span 
                            className="w-8 sm:w-12 text-center font-medium text-sm"
                            style={{
                              color: elementStyles.color,
                              fontFamily: elementStyles.fontFamily
                            }}
                          >
                            {item.quantity}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-8 h-8 p-0 text-xs"
                            onClick={() => updateQuantity(item.id, item.quantity+1)}
                          >
                            +
                          </Button>
                        </div>
                        {/* Subtotal on mobile */}
                        <div className="mt-2 text-center sm:hidden">
                          <span 
                            className="font-semibold text-sm"
                            style={{
                              color: elementStyles.color,
                              fontFamily: elementStyles.fontFamily
                            }}
                          >
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </td>
                      {/* Subtotal column - hidden on mobile */}
                      <td className="py-4 sm:py-6 text-right hidden sm:table-cell">
                        <span 
                          className="font-semibold"
                          style={{
                            color: elementStyles.color,
                            fontFamily: elementStyles.fontFamily
                          }}
                        >
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card>
              <CardHeader>
                <CardTitle 
                  className="text-lg"
                  style={{
                    color: elementStyles.color,
                    fontSize: elementStyles.fontSize,
                    fontFamily: elementStyles.fontFamily,
                    lineHeight: elementStyles.lineHeight,
                    textAlign: elementStyles.textAlign
                  }}
                >
                  Order Summary
                </CardTitle>
                <p 
                  className="text-sm text-muted-foreground"
                  style={{
                    fontFamily: elementStyles.fontFamily
                  }}
                >
                  {items.length} {items.length === 1 ? 'item' : 'items'} in cart
                </p>
              </CardHeader>
              <CardContent className="space-y-6" style={{
                padding: elementStyles.padding,
                paddingTop: elementStyles.paddingTop,
                paddingRight: elementStyles.paddingRight,
                paddingBottom: elementStyles.paddingBottom,
                paddingLeft: elementStyles.paddingLeft,
              }}>
                {/* Coupon Code Section */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
                      style={{
                        fontFamily: elementStyles.fontFamily
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-4"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Order Totals */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-base"
                      style={{
                        color: elementStyles.color,
                        fontSize: elementStyles.fontSize,
                        fontFamily: elementStyles.fontFamily,
                        lineHeight: elementStyles.lineHeight
                      }}
                    >
                      Subtotal
                    </span>
                    <span 
                      className="font-semibold text-base"
                      style={{
                        color: elementStyles.color,
                        fontSize: elementStyles.fontSize,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span 
                      className="text-lg font-semibold"
                      style={{
                        color: elementStyles.color,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      Total
                    </span>
                    <span 
                      className="text-lg font-bold"
                      style={{
                        color: elementStyles.color,
                        fontFamily: elementStyles.fontFamily
                      }}
                    >
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button 
                  className="w-full h-12 text-base font-semibold product-cta cart-action-button"
                  style={layoutStyles}
                  onClick={() => (window.location.href = paths.checkout)}
                >
                  PROCEED TO CHECKOUT →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Full Checkout Element (wired to builder options and responsive styles)
const CheckoutFullElement: React.FC<{ element: PageBuilderElement; deviceType?: 'desktop' | 'tablet' | 'mobile'; isEditing?: boolean }> = ({ element, deviceType = 'desktop', isEditing }) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { store, loadStore, loadStoreById } = useStore();
  const { items, total, clearCart } = useCart();
  const paths = useEcomPaths();
  const { pixels } = usePixelContext();
  const { trackPurchase } = usePixelTracking(pixels);
  const { websiteId, funnelId } = useChannelContext();

  const cfg: any = element.content || {};
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
  const sections = cfg.sections || { info: true, shipping: true, payment: true, summary: true };

  // Section headings with defaults
  const headings = cfg.headings || {
    info: 'Customer Information',
    shipping: 'Shipping',
    payment: 'Payment',
    summary: 'Order Summary',
    customFields: 'Additional Information',
  };

  // Dynamic grid helpers for responsive form layout
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

  // Single-column layout (no grid)

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    shipping_address: '', shipping_city: '', shipping_area: '',
    shipping_country: '', shipping_state: '', shipping_postal_code: '',
    payment_method: 'cod' as 'cod' | 'bkash' | 'nagad' | 'sslcommerz', payment_transaction_number: '', notes: '',
    accept_terms: false,
    custom_fields: {} as Record<string, any>,
    selectedShippingOption: '',
  });
  const [shippingCost, setShippingCost] = useState(0);
  const { websiteShipping } = useWebsiteShipping();
  const [loading, setLoading] = useState(false);
  const [allowedMethods, setAllowedMethods] = useState<Array<'cod' | 'bkash' | 'nagad' | 'sslcommerz'>>(['cod','bkash','nagad','sslcommerz']);
  const [productShippingData, setProductShippingData] = useState<Map<string, { weight_grams?: number; shipping_config?: any }>>(new Map());

  // Initialize default shipping option
  const availableShippingOptions = getAvailableShippingOptions(websiteShipping);
  useEffect(() => {
    if (websiteShipping?.enabled && (websiteShipping as any)?.showOptionsAtCheckout && 
        availableShippingOptions.length > 0 && !form.selectedShippingOption) {
      const defaultOption = availableShippingOptions.find(opt => opt.type === 'rest_of_country') || availableShippingOptions[0];
      setForm(prev => ({ ...prev, selectedShippingOption: defaultOption.id }));
    }
  }, [availableShippingOptions.length, form.selectedShippingOption, websiteShipping?.enabled, (websiteShipping as any)?.showOptionsAtCheckout]);

  useEffect(() => {
    if (!items.length) {
      const storeAllowed: Record<string, boolean> = {
        cod: true,
        bkash: !!store?.settings?.bkash?.enabled,
        nagad: !!store?.settings?.nagad?.enabled,
        sslcommerz: !!store?.settings?.sslcommerz?.enabled,
      };
      let base = ['cod','bkash','nagad','sslcommerz'].filter((m) => (storeAllowed as any)[m]);
      if (base.length === 0) base = ['cod'];
      setAllowedMethods(base as any);
      if (!base.includes(form.payment_method)) setForm(prev => ({ ...prev, payment_method: base[0] as any }));
      return;
    }
    const loadAllowed = async () => {
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
      const storeAllowed: Record<string, boolean> = {
        cod: true,
        bkash: !!store?.settings?.bkash?.enabled,
        nagad: !!store?.settings?.nagad?.enabled,
        sslcommerz: !!store?.settings?.sslcommerz?.enabled,
      };
      acc = acc.filter((m) => (storeAllowed as any)[m]);
      if (acc.length === 0) acc = ['cod'];
      setAllowedMethods(acc as any);
      if (!acc.includes(form.payment_method)) setForm(prev => ({ ...prev, payment_method: acc[0] as any }));
    };
    loadAllowed();
  }, [items, store]);

  // Button and header responsive CSS + background settings
  const buttonStyles = (element.styles as any)?.checkoutButton || { responsive: { desktop: {}, mobile: {} } };
  const buttonCSS = generateResponsiveCSS(element.id, buttonStyles);
  const headerStyles = (element.styles as any)?.checkoutSectionHeader || { responsive: { desktop: {}, mobile: {} } };
  const headerCSS = generateResponsiveCSS(`${element.id}-section-header`, headerStyles);
  const backgrounds = (element.styles as any)?.checkoutBackgrounds || {};
  const formBorderWidth = Number((backgrounds as any)?.formBorderWidth || 0);
  const summaryBorderWidth = Number((backgrounds as any)?.summaryBorderWidth || 0);
  const buttonSize = (((element.styles as any)?.checkoutButtonSize) || 'default') as 'sm' | 'default' | 'lg' | 'xl';
  // Inline resolved styles so Style tab 'Mobile' preview applies instantly
  const buttonInline = React.useMemo(() => mergeResponsiveStyles({}, buttonStyles, deviceType as any), [buttonStyles, deviceType]);
  const headerInline = React.useMemo(() => mergeResponsiveStyles({}, headerStyles, deviceType as any), [headerStyles, deviceType]);

  // Fetch product shipping data when items change
  useEffect(() => {
    const fetchProductShippingData = async () => {
      if (items.length === 0) {
        setProductShippingData(new Map());
        return;
      }
      
      const productIds = [...new Set(items.map(item => item.productId))];
      
      
      const { data, error } = await supabase
        .from('products')
        .select('id, weight_grams, shipping_config')
        .in('id', productIds);
        
      if (error) {
        return;
      }
      
      const dataMap = new Map();
      data?.forEach(product => {
        dataMap.set(product.id, {
          weight_grams: product.weight_grams,
          shipping_config: product.shipping_config
        });
      });
      setProductShippingData(dataMap);
    };
    
    fetchProductShippingData();
  }, [items]);

  // Compute enhanced shipping when form fields or product data changes
  useEffect(() => {
    const computeShipping = async () => {
      if (!websiteShipping || !websiteShipping.enabled) {
        setShippingCost(0);
        return;
      }
      
      const shippingAddress: ShippingAddress = { 
        city: form.shipping_city, 
        area: form.shipping_area, 
        address: form.shipping_address, 
        postal: form.shipping_postal_code 
      };
      
      const cartItemsWithShipping: CartItem[] = items.map(item => {
        const productData = productShippingData.get(item.productId);
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          weight_grams: productData?.weight_grams,
          shipping_config: productData?.shipping_config
        };
      });
      
      const shippingCalculation = computeOrderShipping(websiteShipping, cartItemsWithShipping, shippingAddress, total);
      const cost = shippingCalculation.shippingCost;
      
      setShippingCost(cost);
    };

    if (items.length > 0 || !isEditing) {
      computeShipping();
    }
  }, [websiteShipping, form.shipping_city, form.shipping_area, form.shipping_postal_code, form.shipping_address, items, total, productShippingData]);

  const handleSubmit = async () => {
    if (!store || items.length === 0) return;
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

    (customFields || [])
      .filter((cf:any) => cf.enabled && cf.required)
      .forEach((cf:any) => {
        const val = (form.custom_fields as any)[cf.id];
        if (isEmpty(String(val ?? ''))) missing.push(cf.label || 'Custom field');
      });

    // Require transaction number for manual number-only payments
    {
      const hasBkashApi = Boolean(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
      const isBkashManual = Boolean(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
      const hasNagadApi = Boolean(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
      const isNagadManual = Boolean(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
      const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);
      if (isManual && !form.payment_transaction_number?.trim()) missing.push('Transaction Number');
    }

    if (missing.length) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const hasBkashApi = Boolean(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
      const isBkashManual = Boolean(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
      const hasNagadApi = Boolean(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
      const isNagadManual = Boolean(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
      const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);

      
      
      const orderData: any = {
        store_id: store.id,
        website_id: websiteId || null,
        funnel_id: funnelId || null,
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
        payment_transaction_number: form.payment_transaction_number,
        notes: form.notes,
        subtotal: total,
        shipping_cost: shippingCost,
        discount_amount: 0,
        total: total + shippingCost,
        status: form.payment_method === 'cod' ? 'pending' as const : (isManual ? 'pending' as const : 'processing' as const),
        // Persist custom fields with labels for better display later
        custom_fields: (customFields || [])
          .filter((cf: any) => cf.enabled)
          .map((cf: any) => {
            const value = (form.custom_fields as any)[cf.id];
            if (value === undefined || value === null || value === '') return null;
            return { id: cf.id, label: cf.label || cf.id, value };
          })
          .filter(Boolean),
      };

      const itemsPayload = items.map(i => ({
        product_id: i.productId,
        product_name: i.name,
        product_sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        variation: (i as any).variation ?? null,
      }));


      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          order: orderData,
          items: itemsPayload,
          storeId: store.id,
        }
      });
      if (error) throw error;
      const orderId: string | undefined = data?.order?.id;
      if (!orderId) throw new Error('Order was not created');
      
      

      if (form.payment_method === 'cod' || isManual) {
        // Track Purchase event for COD orders
        const trackingItems = itemsPayload.map(item => ({
          item_id: item.product_id,
          item_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          item_category: undefined
        }));
        
        trackPurchase({
          transaction_id: orderId,
          value: orderData.total,
          items: trackingItems
        });
        
        clearCart();
        toast.success(isManual ? 'Order placed! Please complete payment to the provided number.' : 'Order placed!');
        // Get order access token from the response
        const orderToken = data?.order?.custom_fields?.order_access_token;
        navigate(paths.orderConfirmation(orderId, orderToken));
      } else {
        await initiatePayment(orderId, orderData.total, form.payment_method);
      }
    } catch (e) {
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
        // We need to get the order access token from somewhere - let's fetch it from the order
        const { data: orderData } = await supabase.functions.invoke('get-order-admin', { body: { orderId } });
        const orderToken = orderData?.order?.custom_fields?.order_access_token;
        const processingUrl = `${paths.paymentProcessing(orderId)}${orderToken ? `&ot=${orderToken}` : ''}`;
        navigate(processingUrl);
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  if (!store) return <div className="text-center">Loading store...</div>;
  
  // Show mock data only when cart is empty AND in editing mode
  const shouldShowMockData = items.length === 0 && isEditing;
  const displayItems = shouldShowMockData ? [
    { id: 'preview-1', productId: 'preview-1', name: 'Sample Product', price: 49.99, quantity: 2, image: '/placeholder.svg' },
    { id: 'preview-2', productId: 'preview-2', name: 'Another Product', price: 29.99, quantity: 1, image: '/placeholder.svg' }
  ] : items;
  
  const displayTotal = shouldShowMockData ? 129.97 : total;
  const displayShippingCost = shouldShowMockData ? 10 : shippingCost;
  
  if (!isEditing && items.length === 0) {
    return <div className="text-center text-muted-foreground">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto" style={{ backgroundColor: backgrounds.containerBg || undefined }}>
        {(sections.info || sections.shipping || sections.payment || sections.summary) && (
          <Card className={formBorderWidth > 0 ? undefined : 'border-0'} style={{ backgroundColor: backgrounds.formBg || undefined, borderColor: (backgrounds as any).formBorderColor || undefined, borderWidth: formBorderWidth || 0 }}>
            <CardContent className="p-4 md:p-6 space-y-6 w-full overflow-x-hidden">
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

              

              {/* Always show shipping section if any shipping-related fields are enabled */}
              {(fields.address?.enabled || fields.city?.enabled || fields.area?.enabled || fields.country?.enabled || fields.state?.enabled || fields.postalCode?.enabled || (websiteShipping?.enabled && (websiteShipping as any)?.showOptionsAtCheckout) || customFields?.length > 0) && (
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

                   {/* Custom fields */}
                  {customFields?.length > 0 && customFields.filter((cf:any)=>cf.enabled).length > 0 && (
                    <div className="space-y-4">
                      <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.customFields}</h3>
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
                    </div>
                  )}

                   {/* Shipping Options */}
                   {websiteShipping?.enabled && (websiteShipping as any)?.showOptionsAtCheckout && (
                     <ShippingOptionsPicker
                       settings={websiteShipping}
                       selectedOptionId={form.selectedShippingOption}
                       onOptionSelect={(option) => setForm(prev => ({ ...prev, selectedShippingOption: option.id }))}
                       setForm={setForm}
                     />
                   )}
                </section>
              )}

              {sections.shipping && sections.payment && <Separator className="my-4" />}

              {/* Always show payment section */}
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.payment}</h3>
                <Select value={form.payment_method} onValueChange={(v:any)=>setForm(f=>({...f,payment_method:v}))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {allowedMethods.includes('cod') && (<SelectItem value="cod">Cash on Delivery</SelectItem>)}
                    {allowedMethods.includes('bkash') && (<SelectItem value="bkash">bKash</SelectItem>)}
                    {allowedMethods.includes('nagad') && (<SelectItem value="nagad">Nagad</SelectItem>)}
                    {allowedMethods.includes('sslcommerz') && (<SelectItem value="sslcommerz">Credit/Debit Card (SSLCommerz)</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.payment_method === 'bkash' && store?.settings?.bkash?.mode === 'number' && store?.settings?.bkash?.number && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pay to bKash number: {store.settings.bkash.number}</p>
                    <Input
                      placeholder="Enter transaction ID (e.g., 8M5HA84D5K)"
                      value={form.payment_transaction_number}
                      onChange={(e) => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))}
                      className="w-full"
                      required
                    />
                  </div>
                )}
                {form.payment_method === 'nagad' && store?.settings?.nagad?.mode === 'number' && store?.settings?.nagad?.number && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pay to Nagad number: {store.settings.nagad.number}</p>
                    <Input
                      placeholder="Enter transaction ID (e.g., NG8M5HA84D5K)"
                      value={form.payment_transaction_number}
                      onChange={(e) => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))}
                      className="w-full"
                      required
                    />
                  </div>
                )}
                
              </section>

              {/* Always show order summary section */}
              <section className="space-y-3">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.summary}</h3>
                  <div className="rounded-md p-6" style={{ backgroundColor: backgrounds.summaryBg || undefined, borderColor: (backgrounds as any).summaryBorderColor || undefined, borderWidth: summaryBorderWidth || 0, borderStyle: summaryBorderWidth ? 'solid' as any : undefined }}>
                    {/* Items */}
                    <div className="space-y-2">
                      {displayItems.map((it)=> (
                        <div key={it.id} className={`grid items-center gap-3 ${showItemImages && it.image ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                          {showItemImages && it.image && (
                            <img src={it.image} alt={it.name} className="w-10 h-10 object-cover rounded border shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium break-words">{nameWithVariant(it.name, (it as any).variation)}</div>
                            <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                          </div>
                          <div className="text-sm font-medium shrink-0 whitespace-nowrap text-right">{formatCurrency(it.price * it.quantity)}</div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0"><span className="truncate">Subtotal</span><span className="font-semibold shrink-0 whitespace-nowrap text-right">{formatCurrency(displayTotal)}</span></div>
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0"><span className="truncate">Shipping</span><span className="font-semibold shrink-0 whitespace-nowrap text-right">{formatCurrency(displayShippingCost)}</span></div>
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 font-bold"><span className="truncate">Total</span><span className="shrink-0 whitespace-nowrap text-right">{formatCurrency(displayTotal+displayShippingCost)}</span></div>

                    <Button size={buttonSize as any} className={`w-full mt-4 element-${element.id}`} style={buttonInline as React.CSSProperties} onClick={handleSubmit} disabled={loading || (isEditing && items.length === 0)}>
                      {isEditing && items.length === 0 ? 'Preview Mode - Add items to cart' : (loading? 'Placing Order...' : buttonLabel)}
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
            </CardContent>
          </Card>
        )}
      </div>
  );
};

// Order Confirmation Element (reads orderId from path or ?orderId=)
const OrderConfirmationElement: React.FC<{ element: PageBuilderElement; isEditing?: boolean }> = ({ element, isEditing }) => {
  const { orderId, websiteId } = useParams<{ orderId?: string; websiteId?: string }>();
  const { store, loadStoreById } = useStore();
  const paths = useEcomPaths();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const orderContentRef = useRef<HTMLDivElement>(null);
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const id = orderId || query.get('orderId') || '';
  const orderToken = query.get('ot') || '';

  const cfg: any = element.content || {};
  const texts = cfg.texts || {
    title: 'Order Confirmed!',
    subtitle: 'Thank you for your order.',
    customerTitle: 'Customer',
    shippingTitle: 'Shipping',
    itemsTitle: 'Items',
  };
  const show = cfg.show || { email: true, phone: true, notes: true };

  const nameWithVariant = (name: string, variant: any) => {
    if (!variant) return name;
    const vars = Object.entries(variant).map(([k, v]) => `${k}: ${v}`);
    return `${name} (${vars.join(', ')})`;
  };

  const downloadPDF = async () => {
    if (!orderContentRef.current || !order) return;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(orderContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`order-confirmation-${order.order_number}.pdf`);
    } catch (error) {
      // PDF generation failed
    }
  };

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
      try {
        if (!id) {
          if (isEditing) {
            // Demo data in builder when no order id
            setOrder({
              order_number: '10001',
              customer_name: 'Jane Doe',
              customer_phone: '+1 555-1234',
              customer_email: 'jane@example.com',
              shipping_address: '123 Market St',
              shipping_city: 'San Francisco',
              shipping_area: 'CA',
              subtotal: 149.98,
              shipping_cost: 10,
              discount_amount: 0,
              total: 159.98,
              created_at: new Date().toISOString(),
              status: 'pending',
            });
            setItems([
              { id: '1', product_name: 'Sample Product A', quantity: 1, total: 99.99 },
              { id: '2', product_name: 'Sample Product B', quantity: 1, total: 49.99 },
            ]);
          }
          setLoading(false);
          return;
        }
        // Use secure public order access with token
        if (!store) {
          return;
        }
        const { data, error } = await supabase.functions.invoke('get-order-public', {
          body: { 
            orderId: id, 
            storeId: store.id,
            token: orderToken 
          }
        });
        if (error) throw error;
        setOrder(data?.order || null);
        setItems(data?.items || []);
      } catch (e) {
        // Error fetching order
      } finally {
        setLoading(false);
      }
    })();
  }, [id, store, orderToken]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (!order) return <div className="text-center">Order not found</div>;

  // Derived totals
    const subtotal = Number(order.subtotal ?? items.reduce((s, it) => s + Number(it.total || 0), 0));
    const shipping = Number(order.shipping_cost ?? 0);
    const discount = Number(order.discount_amount ?? 0);

    // Styles
    const oc = (element.styles as any)?.orderConfirmation || {};
    const css = [
      generateResponsiveCSS(`${element.id}-oc-title`, oc.title) || '',
      generateResponsiveCSS(`${element.id}-oc-subtitle`, oc.subtitle) || '',
      generateResponsiveCSS(`${element.id}-oc-section-title`, oc.sectionTitle) || '',
      generateResponsiveCSS(`${element.id}-oc-success`, oc.successIcon) || '',
      generateResponsiveCSS(`${element.id}-oc-card`, oc.card) || '',
    ].join(' ');

    return (
    <div className="max-w-2xl mx-auto space-y-6">
      <style>{css}</style>
      <div ref={orderContentRef}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 element-${element.id}-oc-success`}>
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 element-${element.id}-oc-title`}>{texts.title}</h1>
          <p className={`text-muted-foreground mb-8 element-${element.id}-oc-subtitle`}>{texts.subtitle}</p>
        </div>
        <Card className={`element-${element.id}-oc-card`}>
          <CardHeader><CardTitle>Order #{order.order_number}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className={`font-semibold mb-2 element-${element.id}-oc-section-title`}>{texts.customerTitle}</h3>
              <p className="text-sm">{order.customer_name}{show.phone && order.customer_phone ? ` · ${order.customer_phone}` : ''}</p>
              {show.email && (
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              )}
            </div>
          <Separator />
          <div>
            <h3 className={`font-semibold mb-2 element-${element.id}-oc-section-title`}>{texts.shippingTitle}</h3>
            <p className="text-sm">{order.shipping_address}</p>
            <p className="text-sm">{order.shipping_city}{order.shipping_area && `, ${order.shipping_area}`}</p>
          </div>
          {Array.isArray(order.custom_fields) && order.custom_fields.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className={`font-semibold mb-2 element-${element.id}-oc-section-title`}>Additional Information</h3>
                <div className="space-y-1">
                  {order.custom_fields.map((cf: any, idx: number) => (
                    <p key={idx} className="text-sm"><strong>{cf.label || cf.id}:</strong> {String(cf.value)}</p>
                  ))}
                </div>
              </div>
            </>
          )}
          {!Array.isArray(order.custom_fields) && order.custom_fields && (
            <>
              <Separator />
              <div>
                <h3 className={`font-semibold mb-2 element-${element.id}-oc-section-title`}>Additional Information</h3>
                <div className="space-y-1">
                  {Object.entries(order.custom_fields as any).map(([key, val]: any) => (
                    <p key={key} className="text-sm"><strong>{key}:</strong> {String(val)}</p>
                  ))}
                </div>
              </div>
            </>
          )}
          {show.notes && order.notes && (
            <>
              <Separator />
              <div>
                <h3 className={`font-semibold mb-2 element-${element.id}-oc-section-title`}>Order Notes</h3>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Card className={`element-${element.id}-oc-card`}>
        <CardHeader><CardTitle>{texts.itemsTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{nameWithVariant(it.product_name, (it as any).variation)} × {it.quantity}</span>
              <span>{formatCurrency(Number(it.total))}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatCurrency(shipping)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-sm"><span>Discount</span><span>- {formatCurrency(discount)}</span></div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = paths.home)} className="flex-1">Continue Shopping</Button>
        <Button variant="outline" onClick={downloadPDF} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
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
            <span>Total</span><span className="font-medium">{formatCurrency(Number(order.total))}</span>
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
    defaultContent: { limit: 8, title: 'Related Products', columns: 4, tabletColumns: 2, mobileColumns: 1, categoryIds: [], ctaText: 'View' },
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
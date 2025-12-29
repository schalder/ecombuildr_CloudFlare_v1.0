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
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { useStore } from '@/contexts/StoreContext';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { useEcomPaths } from '@/lib/pathResolver';
import { useParams, useNavigate } from 'react-router-dom';
import { StorefrontImage } from '@/components/storefront/renderer/StorefrontImage';
import { supabase } from '@/integrations/supabase/client';
import { useStoreProducts } from '@/hooks/useStoreData';
import { formatVariant } from '@/lib/utils';
import { generateResponsiveCSS, mergeResponsiveStyles, getEffectiveResponsiveValue } from '@/components/page-builder/utils/responsiveStyles';
import { computeOrderShipping, getAvailableShippingOptions, applyShippingOptionToForm, type CartItem, type ShippingAddress, type ShippingSettings, type ShippingOption } from '@/lib/shipping-enhanced';
import { nameWithVariant } from '@/lib/utils';
import { useWebsiteShipping } from '@/hooks/useWebsiteShipping';
import { ShippingOptionsPicker } from '@/components/storefront/ShippingOptionsPicker';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { useChannelContext } from '@/hooks/useChannelContext';
import { useHeadStyle } from '@/hooks/useHeadStyle';
import { DigitalDownloadSection } from '../components/DigitalDownloadSection';
import { getPhoneValidationError } from '@/utils/phoneValidation';
import { calculatePaymentBreakdown, getPaymentBreakdownMessage, getUpfrontPaymentMethod, ProductData } from '@/utils/checkoutCalculations';

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
        if (!productSlug && !element.content?.productId) {
          setProduct(null);
          setLoading(false);
          return;
        }
        
        // Build query with show_on_website filter
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Type instantiation is excessively deep (known Supabase type inference limitation)
        const queryBuilder = supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .eq('show_on_website', true);
        
        // Type assertion to avoid TypeScript deep instantiation error
        const finalQuery = productSlug
          ? (queryBuilder as any).eq('slug', productSlug)
          : (queryBuilder as any).eq('id', element.content?.productId);
        
        const { data } = await finalQuery.single();
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
                   <StorefrontImage src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-contain" aspectRatio="1" />
                 </button>
               ))}
            </div>
          )}
           <div className="order-1 lg:order-2 flex-1">
             <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
               <StorefrontImage src={product.images?.[selectedImage] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-contain" aspectRatio="1" priority={true} />
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
  const { addToCart } = useAddToCart();
  
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

  // Handle card click - always navigate to product detail
  const handleCardClick = (product: any) => {
    window.location.href = paths.productDetail(product.slug || product.id);
  };

  // Handle button click based on CTA behavior
  const handleButtonClick = (product: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click when button is clicked
    const ctaBehavior = element.content?.ctaBehavior || 'view';
    
    switch (ctaBehavior) {
      case 'add_to_cart':
        addToCart(product, 1, false);
        break;
      case 'buy_now':
        addToCart(product, 1, true);
        break;
      case 'view':
      default:
        window.location.href = paths.productDetail(product.slug || product.id);
        break;
    }
  };

  // Get button text based on CTA behavior
  const getButtonText = () => {
    const ctaBehavior = element.content?.ctaBehavior || 'view';
    const customText = element.content?.ctaText;
    
    if (customText) return customText;
    
    switch (ctaBehavior) {
      case 'add_to_cart':
        return 'Add to Cart';
      case 'buy_now':
        return 'Buy Now';
      case 'view':
      default:
        return 'View';
    }
  };

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
          <Card 
            key={p.id} 
            className="group/card cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => handleCardClick(p)}
            style={{
              backgroundColor: elementStyles.backgroundColor,
              borderColor: elementStyles.borderColor,
              borderWidth: elementStyles.borderWidth as any,
              borderStyle: elementStyles.borderWidth ? 'solid' : undefined,
              borderRadius: elementStyles.borderRadius as any,
              // NOTE: Margins removed - handled by ElementRenderer wrapper to prevent double application
            }}
          >
            <CardContent className="p-3" style={{
              padding: elementStyles.padding as any,
              paddingTop: elementStyles.paddingTop as any,
              paddingRight: elementStyles.paddingRight as any,
              paddingBottom: elementStyles.paddingBottom as any,
              paddingLeft: elementStyles.paddingLeft as any,
            }}>
               <div className="aspect-square rounded-lg overflow-hidden mb-2">
                 <StorefrontImage src={(Array.isArray(p.images)?p.images[0]:p.images) || '/placeholder.svg'} alt={p.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform" aspectRatio="1" />
               </div>
              <div className="text-sm font-medium" style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }}>{p.name}</div>
              <div className="text-sm">{formatCurrency(Number(p.price))}</div>
              <Button variant="outline" size="sm" className="mt-2 w-full" style={buttonStyles as React.CSSProperties} onClick={(e) => handleButtonClick(p, e)}>{getButtonText()}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Full Cart Element
const CartFullElement: React.FC<{ element: PageBuilderElement; deviceType?: 'desktop' | 'tablet' | 'mobile' }> = ({ element, deviceType = 'desktop' }) => {
  const { items, total, updateQuantity, removeItem, discountCode, discountAmount, applyDiscount, clearDiscount } = useCart();
  const { store } = useStore();
  const paths = useEcomPaths();
  
  // Local discount code input state
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  
  // Apply discount code
  const applyDiscountCode = async () => {
    if (!discountCodeInput.trim()) {
      toast.error('Please enter a discount code');
      return;
    }
    
    if (!store) {
      toast.error('Store not available. Please refresh the page.');
      return;
    }

    setDiscountLoading(true);
    try {
      const { data: discountCodeData, error } = await supabase
        .from('discount_codes' as any)
        .select('*')
        .eq('store_id', store.id)
        .eq('code', discountCodeInput.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        toast.error(`Database error: ${error.message}`);
        clearDiscount();
        return;
      }
      
      if (!discountCodeData) {
        toast.error('Invalid discount code');
        clearDiscount();
        return;
      }

      // Type assertion for the discount code object
      const discount = discountCodeData as any;

      // Check if discount is expired
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        toast.error('Discount code has expired');
        clearDiscount();
        return;
      }

      // Check if discount hasn't started yet
      if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
        toast.error('Discount code is not active yet');
        clearDiscount();
        return;
      }

      // Check usage limit
      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        toast.error('Discount code usage limit reached');
        clearDiscount();
        return;
      }

      // Check minimum amount
      if (discount.minimum_amount && total < discount.minimum_amount) {
        toast.error(`Minimum order amount is ${formatCurrency(discount.minimum_amount)} for this discount`);
        clearDiscount();
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
      
      // Apply discount to context
      applyDiscount(discountCodeInput.toUpperCase(), discountValue);
      toast.success(`Discount applied! You saved ${formatCurrency(discountValue)}`);
    } catch (error) {
      console.error('Error applying discount code:', error);
      toast.error(`Failed to apply discount code: ${error.message || 'Unknown error'}`);
      clearDiscount();
    } finally {
      setDiscountLoading(false);
    }
  };

  // Calculate final total with discount
  const finalTotal = total - discountAmount;
  
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
                                  Remove
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
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
                      style={{
                        fontFamily: elementStyles.fontFamily
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-4"
                      onClick={applyDiscountCode}
                      disabled={discountLoading || !discountCodeInput.trim()}
                    >
                      {discountLoading ? 'Applying...' : 'Apply'}
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
                  
                  {/* Discount Amount */}
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-base text-green-600"
                        style={{
                          fontSize: elementStyles.fontSize,
                          fontFamily: elementStyles.fontFamily,
                          lineHeight: elementStyles.lineHeight
                        }}
                      >
                        Discount ({discountCode})
                      </span>
                      <span 
                        className="font-semibold text-base text-green-600"
                        style={{
                          fontSize: elementStyles.fontSize,
                          fontFamily: elementStyles.fontFamily
                        }}
                      >
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}
                  
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
                      {formatCurrency(finalTotal)}
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
  const { items, total, clearCart, discountCode, discountAmount } = useCart();
  const paths = useEcomPaths();
  const { pixels } = usePixelContext();
  const { websiteId, funnelId } = useChannelContext();
  const { trackPurchase, trackInitiateCheckout } = usePixelTracking(pixels, store?.id, websiteId, funnelId);

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
  const buttonSubtext: string = cfg.placeOrderSubtext || '';
  const buttonSubtextPosition: string = cfg.placeOrderSubtextPosition || 'below';
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
    payment_method: 'cod' as 'cod' | 'bkash' | 'nagad' | 'eps' | 'ebpay' | 'stripe', payment_transaction_number: '', notes: '',
    accept_terms: false,
    custom_fields: {} as Record<string, any>,
    selectedShippingOption: '',
  });
  const [shippingCost, setShippingCost] = useState(0);
  
  // Track selected shipping option for website shipping
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const { websiteShipping } = useWebsiteShipping();

  // Set default shipping option when website shipping is available
  useEffect(() => {
    if (websiteShipping?.enabled && !selectedShippingOption) {
      const options = getAvailableShippingOptions(websiteShipping);
      if (options.length > 0) {
        const defaultOption = options.find(opt => opt.type === 'rest_of_country') || options[0];
        setSelectedShippingOption(defaultOption);
        // Apply the default option to form fields
        applyShippingOptionToForm(defaultOption, websiteShipping, setForm);
      }
    }
  }, [websiteShipping, selectedShippingOption]);
  const [loading, setLoading] = useState(false);
  const [allowedMethods, setAllowedMethods] = useState<Array<'cod' | 'bkash' | 'nagad' | 'eps' | 'ebpay' | 'stripe'>>(['cod','bkash','nagad','eps','ebpay','stripe']);
  const [productShippingData, setProductShippingData] = useState<Map<string, { weight_grams?: number; shipping_config?: any; product_type?: string }>>(new Map());
  const [productDataMap, setProductDataMap] = useState<Map<string, ProductData>>(new Map());
  const [paymentBreakdown, setPaymentBreakdown] = useState<ReturnType<typeof calculatePaymentBreakdown> | null>(null);
  
  // Validation error states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Helper function to clear validation error for a specific field
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
  const [productTypes, setProductTypes] = useState<{ hasPhysical: boolean; hasDigital: boolean }>({ hasPhysical: false, hasDigital: false });
  
  // Tracking state
  const [hasTrackedInitiateCheckout, setHasTrackedInitiateCheckout] = useState<boolean>(false);

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
        eps: !!store?.settings?.eps?.enabled,
        ebpay: !!store?.settings?.ebpay?.enabled,
        stripe: !!store?.settings?.payment?.stripe?.enabled && !!store?.settings?.payment?.stripe?.stripe_account_id,
      };
      let base = ['cod','bkash','nagad','eps','ebpay','stripe'].filter((m) => (storeAllowed as any)[m]);
      if (base.length === 0) base = ['cod'];
      setAllowedMethods(base as any);
      if (!base.includes(form.payment_method)) setForm(prev => ({ ...prev, payment_method: base[0] as any }));
      return;
    }
    const loadAllowed = async () => {
      const ids = Array.from(new Set(items.map(i => i.productId)));
      const { data } = await supabase
        .from('products')
        .select('id, allowed_payment_methods, collect_shipping_upfront, upfront_shipping_payment_method')
        .in('id', ids);
      let acc: string[] = ['cod','bkash','nagad','eps','ebpay','stripe'];
      
      // Collect upfront payment methods that need to be included
      const upfrontMethodsToInclude: string[] = [];
      
      // Build product data map for upfront payment method selection
      const productMapForPayment = new Map<string, ProductData>();
      (data || []).forEach((p: any) => {
        productMapForPayment.set(p.id, {
          id: p.id,
          product_type: 'physical', // Will be updated from productShippingData
          collect_shipping_upfront: p.collect_shipping_upfront || false,
          upfront_shipping_payment_method: p.upfront_shipping_payment_method || null,
        });
        
        // If product has upfront shipping enabled, ensure its payment method is included
        if (p.collect_shipping_upfront && p.upfront_shipping_payment_method) {
          upfrontMethodsToInclude.push(p.upfront_shipping_payment_method);
        }
        
        const arr: string[] | null = p.allowed_payment_methods;
        if (arr && arr.length > 0) {
          acc = acc.filter(m => arr.includes(m));
        }
      });
      const storeAllowed: Record<string, boolean> = {
        cod: true,
        bkash: !!store?.settings?.bkash?.enabled,
        nagad: !!store?.settings?.nagad?.enabled,
        eps: !!store?.settings?.eps?.enabled,
        ebpay: !!store?.settings?.ebpay?.enabled,
        stripe: !!store?.settings?.payment?.stripe?.enabled && !!store?.settings?.payment?.stripe?.stripe_account_id,
      };
      
      // Add upfront payment methods if they're store-enabled
      upfrontMethodsToInclude.forEach(method => {
        if ((storeAllowed as any)[method] && !acc.includes(method)) {
          acc.push(method);
        }
      });
      
      acc = acc.filter((m) => (storeAllowed as any)[m]);
      if (acc.length === 0) acc = ['cod'];
      
      // If there's upfront payment required, use the upfront payment method
      const upfrontMethod = paymentBreakdown?.hasUpfrontPayment
        ? getUpfrontPaymentMethod(
            items.map(i => ({ id: i.id, productId: i.productId, quantity: i.quantity, price: i.price })),
            productDataMap,
            form.payment_method,
            acc
          )
        : null;
      
      setAllowedMethods(acc as any);
      if (upfrontMethod && acc.includes(upfrontMethod)) {
        // Use upfront payment method if available
        setForm(prev => ({ ...prev, payment_method: upfrontMethod as any }));
      } else if (!acc.includes(form.payment_method)) {
        setForm(prev => ({ ...prev, payment_method: acc[0] as any }));
      }
    };
    loadAllowed();
  }, [items, store]);

  // Track InitiateCheckout event when component mounts and has items in cart
  useEffect(() => {
    const sessionKey = `initiate_checkout_tracked_${element.id}`;
    const alreadyTracked = sessionStorage.getItem(sessionKey);
    
    if (!hasTrackedInitiateCheckout && !alreadyTracked && items.length > 0 && store && pixels && total > 0) {

      trackInitiateCheckout({
        value: total + shippingCost,
        items: items.map(item => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: 'General'
        }))
      });
      
      setHasTrackedInitiateCheckout(true);
      sessionStorage.setItem(sessionKey, 'true');
    } else if (items.length === 0) {
      console.log('🛒 No items in cart for full checkout, skipping InitiateCheckout tracking');
    } else if (!store) {
      console.log('🛒 Store not loaded yet for full checkout, skipping InitiateCheckout tracking');
    } else if (!pixels) {
      console.log('🛒 Pixels not configured for full checkout, skipping InitiateCheckout tracking');
    } else if (alreadyTracked || hasTrackedInitiateCheckout) {
      console.log('🛒 InitiateCheckout already tracked for full checkout this session');
    }
  }, [items, store, pixels, total, shippingCost, element.id, hasTrackedInitiateCheckout, trackInitiateCheckout, websiteId, funnelId]);

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
        .select('id, weight_grams, shipping_config, product_type, collect_shipping_upfront, upfront_shipping_payment_method')
        .in('id', productIds);
        
      if (error) {
        return;
      }
      
      const dataMap = new Map();
      const productDataMapForCalc = new Map<string, ProductData>();
      let hasPhysical = false;
      let hasDigital = false;
      
      data?.forEach(product => {
        const isDigital = product.product_type === 'digital';
        if (isDigital) {
          hasDigital = true;
        } else {
          hasPhysical = true;
        }
        
        dataMap.set(product.id, {
          weight_grams: product.weight_grams,
          shipping_config: product.shipping_config,
          product_type: product.product_type
        });
        
        // Populate productDataMap for upfront payment calculations
        productDataMapForCalc.set(product.id, {
          id: product.id,
          product_type: product.product_type || 'physical',
          collect_shipping_upfront: product.collect_shipping_upfront || false,
          upfront_shipping_payment_method: product.upfront_shipping_payment_method || null,
        });
      });
      
      setProductShippingData(dataMap);
      setProductDataMap(productDataMapForCalc);
      setProductTypes({ hasPhysical, hasDigital });
    };
    
    fetchProductShippingData();
  }, [items]);

  // Compute enhanced shipping when form fields or product data changes
  useEffect(() => {
    const computeShipping = async () => {
      // Skip shipping calculation for digital-only orders
      if (!productTypes.hasPhysical || !websiteShipping || !websiteShipping.enabled) {
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
      
      // Calculate payment breakdown
      if (items.length > 0 && productDataMap.size > 0) {
        const cartItems = items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product_type: productDataMap.get(item.productId)?.product_type,
          collect_shipping_upfront: productDataMap.get(item.productId)?.collect_shipping_upfront,
          upfront_shipping_payment_method: productDataMap.get(item.productId)?.upfront_shipping_payment_method,
        }));
        
        const breakdown = calculatePaymentBreakdown(cartItems, cost, productDataMap);
        setPaymentBreakdown(breakdown);
      } else {
        setPaymentBreakdown(null);
      }
    };

    if (items.length > 0 || !isEditing) {
      computeShipping();
    }
  }, [websiteShipping, form.shipping_city, form.shipping_area, form.shipping_postal_code, form.shipping_address, items, total, productShippingData, productTypes.hasPhysical, productDataMap]);

  const handleSubmit = async () => {
    console.log('🚀 CheckoutFullElement handleSubmit called', { store: !!store, itemsCount: items.length });
    
    if (!store || items.length === 0) {
      console.log('❌ Early return: no store or items', { store: !!store, itemsCount: items.length });
      return;
    }
    if (terms.enabled && terms.required && !form.accept_terms) {
      console.log('❌ Early return: terms not accepted');
      toast.error('Please accept the terms to continue');
      return;
    }

    // Validate required fields with inline error messages
    const errors: Record<string, string> = {};
    const isEmpty = (v?: string) => !v || v.trim() === '';

    if (fields.fullName?.enabled && (fields.fullName?.required ?? true) && isEmpty(form.customer_name)) {
      errors.customer_name = 'Full name is required';
    }
    if (fields.phone?.enabled && (fields.phone?.required ?? true)) {
      if (isEmpty(form.customer_phone)) {
      errors.customer_phone = 'Phone number is required';
      } else {
        // Validate phone format for all payment methods (must be 11 digits starting with 01)
        const phoneError = getPhoneValidationError(form.customer_phone);
        if (phoneError) {
          errors.customer_phone = phoneError;
        }
      }
    }
    if (fields.email?.enabled && (fields.email?.required ?? false)) {
      const email = form.customer_email || '';
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (isEmpty(email)) {
        errors.customer_email = 'Email address is required';
      } else if (!emailOk) {
        errors.customer_email = 'Please enter a valid email address';
      }
    }
    // Skip shipping field validation for digital-only orders
    if (productTypes.hasPhysical) {
      if (fields.address?.enabled && (fields.address?.required ?? true) && isEmpty(form.shipping_address)) {
        errors.shipping_address = 'Address is required';
      }
      if (fields.city?.enabled && (fields.city?.required ?? true) && isEmpty(form.shipping_city)) {
        errors.shipping_city = 'City is required';
      }
      if (fields.area?.enabled && (fields.area?.required ?? false) && isEmpty(form.shipping_area)) {
        errors.shipping_area = 'Area is required';
      }
      if (fields.country?.enabled && (fields.country?.required ?? false) && isEmpty(form.shipping_country)) {
        errors.shipping_country = 'Country is required';
      }
      if (fields.state?.enabled && (fields.state?.required ?? false) && isEmpty(form.shipping_state)) {
        errors.shipping_state = 'State/Province is required';
      }
      if (fields.postalCode?.enabled && (fields.postalCode?.required ?? false) && isEmpty(form.shipping_postal_code)) {
        errors.shipping_postal_code = 'ZIP / Postal code is required';
      }
    }

    (customFields || [])
      .filter((cf:any) => cf.enabled && cf.required)
      .forEach((cf:any) => {
        const val = (form.custom_fields as any)[cf.id];
        if (isEmpty(String(val ?? ''))) {
          errors[`custom_${cf.id}`] = `${cf.label || 'Custom field'} is required`;
        }
      });

    // Require transaction number for manual number-only payments
    {
      const hasBkashApi = Boolean(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
      const isBkashManual = Boolean(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
      const hasNagadApi = Boolean(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
      const isNagadManual = Boolean(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
      const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);
      if (isManual && !form.payment_transaction_number?.trim()) {
        errors.payment_transaction_number = 'Transaction number is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false); // Reset loading state on validation error
      return;
    }
    
    // Clear validation errors if validation passes
    setValidationErrors({});

    setLoading(true);
    try {
      console.log('✅ Validation passed, starting order submission...');
      
      // Recalculate payment breakdown to ensure we have latest data
      const cartItems = items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product_type: productDataMap.get(item.productId)?.product_type,
        collect_shipping_upfront: productDataMap.get(item.productId)?.collect_shipping_upfront,
        upfront_shipping_payment_method: productDataMap.get(item.productId)?.upfront_shipping_payment_method,
      }));

      const currentPaymentBreakdown = calculatePaymentBreakdown(
        cartItems,
        productTypes.hasPhysical ? shippingCost : 0,
        productDataMap
      );

      // Use recalculated breakdown instead of state
      const upfrontAmount = currentPaymentBreakdown.upfrontAmount || 0;
      const upfrontPaymentMethod = upfrontAmount > 0 
        ? getUpfrontPaymentMethod(
            cartItems,
            productDataMap,
            form.payment_method,
            allowedMethods
          )
        : null;

      // Debug: Log why upfrontPaymentMethod might be wrong
      console.log('🔍 Upfront Payment Method Debug (CheckoutFullElement):', {
        upfrontAmount,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          collect_shipping_upfront: productDataMap.get(item.productId)?.collect_shipping_upfront,
          upfront_shipping_payment_method: productDataMap.get(item.productId)?.upfront_shipping_payment_method,
          product_type: productDataMap.get(item.productId)?.product_type
        })),
        customerSelectedMethod: form.payment_method,
        allowedMethods,
        upfrontPaymentMethod,
        productDataMapEntries: Array.from(productDataMap.entries()).map(([id, data]) => ({
          id,
          product_type: data.product_type,
          collect_shipping_upfront: data.collect_shipping_upfront,
          upfront_shipping_payment_method: data.upfront_shipping_payment_method
        }))
      });

      // Helper function to check if a payment method requires gateway processing (live payment)
      const isLivePaymentMethod = (method: string | null | undefined): boolean => {
        if (!method) return false;
        return method === 'eps' || method === 'ebpay' || method === 'stripe';
      };

      // Determine if we need to process upfront payment
      const hasUpfrontPayment = upfrontAmount > 0 && !!upfrontPaymentMethod; // Add !! to ensure boolean
      const upfrontPaymentIsLive = hasUpfrontPayment && isLivePaymentMethod(upfrontPaymentMethod);
      const isLivePayment = isLivePaymentMethod(form.payment_method);

      console.log('🔍 Payment Processing Debug (CheckoutFullElement):', {
        paymentBreakdown: currentPaymentBreakdown,
        upfrontAmount,
        upfrontPaymentMethod,
        selectedPaymentMethod: form.payment_method,
        hasUpfrontPayment,
        upfrontPaymentIsLive,
        isLivePayment,
        allowedMethods,
        productDataMapSize: productDataMap.size,
        itemsCount: items.length
      });

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
        shipping_cost: productTypes.hasPhysical ? shippingCost : 0,
        discount_amount: 0,
        total: total + (productTypes.hasPhysical ? shippingCost : 0),
        // Status will be set by create-order or create-order-on-payment-success based on payment method and product types
        // Upfront payment info (if applicable)
        upfront_payment_amount: upfrontAmount > 0 ? upfrontAmount : null,
        upfront_payment_method: upfrontPaymentMethod || null,
        delivery_payment_amount: currentPaymentBreakdown.deliveryAmount || null,
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

      // ✅ Create order immediately for ALL payment methods (like funnel checkout)
      // This ensures we have a real order ID to update if payment fails
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          order: orderData,
          items: itemsPayload,
          storeId: store.id,
        }
      });
      if (error) throw error;
      const orderId: string | undefined = data?.order?.id;
      const accessToken = data?.order?.access_token;
      if (!orderId) throw new Error('Order was not created');
      const orderResponse = data;
      
      // For EPS/EB Pay/Stripe, store checkout data for potential deferred order creation
      // (though order is already created, this is kept for backward compatibility)
      // Note: isLivePayment is already defined above in the upfront payment calculation
      if (isLivePayment) {
        sessionStorage.setItem('pending_checkout', JSON.stringify({
          orderData,
          itemsPayload,
          storeId: store.id,
          timestamp: Date.now()
        }));
      }
      
      // Handle payment processing
      // PRIORITY: Check for upfront payment FIRST, regardless of selected payment method
      console.log('🔍 Before upfront payment check (CheckoutFullElement):', {
        hasUpfrontPayment,
        upfrontAmount,
        upfrontPaymentMethod,
        upfrontPaymentIsLive,
        orderId
      });

      if (hasUpfrontPayment) {
        console.log('✅ Upfront payment detected, processing...');
        
        // Validate that we have a valid payment method
        if (!upfrontPaymentMethod) {
          console.error('❌ Upfront payment method is null!');
          toast.error('Payment method not available. Please select a different payment method.');
          setLoading(false);
          return;
        }

        // Validate that the payment method is in allowed methods
        if (!allowedMethods.includes(upfrontPaymentMethod)) {
          console.error('❌ Upfront payment method not in allowed methods:', {
            upfrontPaymentMethod,
            allowedMethods
          });
          toast.error(`Payment method ${upfrontPaymentMethod} is not available for this order.`);
          setLoading(false);
          return;
        }

        // Check if the upfront payment method requires gateway processing
        if (upfrontPaymentIsLive) {
          console.log('✅ Upfront payment is live, initiating payment gateway...', {
            orderId,
            amount: upfrontAmount,
            method: upfrontPaymentMethod
          });
          try {
            // Process upfront payment for live payment methods (EPS, EB Pay, Stripe, etc.)
            await initiatePayment(orderId, upfrontAmount, upfrontPaymentMethod);
            console.log('✅ Payment initiation completed, redirecting to gateway...');
            return; // Exit early - payment gateway will handle order creation
          } catch (error) {
            console.error('❌ Failed to initiate upfront payment:', error);
            toast.error('Failed to initiate payment. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          console.log('ℹ️ Upfront payment is manual, showing confirmation...');
          // Manual payment method for upfront (bkash, nagad) - order already created
          clearCart();
          toast.success('Order placed! Please complete the upfront payment.');
          const orderToken = orderResponse?.order?.custom_fields?.order_access_token || accessToken;
          navigate(paths.orderConfirmation(orderId, orderToken));
          return; // Exit early after showing confirmation
        }
      } else {
        console.log('ℹ️ No upfront payment required, processing regular flow...');
      }

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
        
        // Clear InitiateCheckout tracking on successful order
        const sessionKey = `initiate_checkout_tracked_${element.id}`;
        sessionStorage.removeItem(sessionKey);
        setHasTrackedInitiateCheckout(false);
        
        clearCart();
        toast.success(isManual ? 'Order placed! Please complete payment to the provided number.' : 'Order placed!');
        // Get order access token from the response
        const orderToken = orderResponse?.order?.custom_fields?.order_access_token || accessToken;
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
      // Get stored checkout data for live payments
      const pendingCheckout = sessionStorage.getItem('pending_checkout');
      const checkoutData = pendingCheckout ? JSON.parse(pendingCheckout) : null;
      
      let response;
      switch (method) {
        case 'bkash':
          response = await supabase.functions.invoke('bkash-payment', { body: { orderId, amount, storeId: store!.id } });
          break;
        case 'nagad':
          response = await supabase.functions.invoke('nagad-payment', { body: { orderId, amount, storeId: store!.id } });
          break;
        case 'eps':
          response = await supabase.functions.invoke('eps-payment', { 
            body: { 
              orderId: orderId, // ✅ Use real orderId (order already created)
              amount, 
              storeId: store!.id, 
              customerData: { 
                name: form.customer_name, 
                email: form.customer_email, 
                phone: form.customer_phone, 
                address: form.shipping_address, 
                city: form.shipping_city, 
                country: form.shipping_country, 
                state: form.shipping_state, 
                postal_code: form.shipping_postal_code 
              } 
            } 
          });
          break;
        case 'ebpay':
          response = await supabase.functions.invoke('ebpay-payment', { 
            body: { 
              orderId: orderId, // ✅ Use real orderId (order already created)
              amount, 
              storeId: store!.id, 
              redirectOrigin: window.location.origin,
              customerData: { 
                name: form.customer_name, 
                email: form.customer_email, 
                phone: form.customer_phone, 
                address: form.shipping_address, 
                city: form.shipping_city, 
                country: form.shipping_country, 
                state: form.shipping_state, 
                postal_code: form.shipping_postal_code 
              } 
            } 
          });
          break;
        case 'stripe': {
          // Get currency from website/funnel settings
          let currency = 'USD'; // Default to USD for Stripe
          try {
            if (funnelId) {
              const { data: funnel } = await supabase
                .from('funnels')
                .select('settings, website_id')
                .eq('id', funnelId)
                .single();
              if (funnel?.settings?.currency_code) {
                currency = funnel.settings.currency_code;
              } else if (funnel?.website_id) {
                const { data: website } = await supabase
                  .from('websites')
                  .select('settings')
                  .eq('id', funnel.website_id)
                  .maybeSingle();
                currency = (website?.settings as any)?.currency?.code || (website?.settings as any)?.currency_code || 'USD';
              }
            } else if (websiteId) {
              const { data: website } = await supabase
                .from('websites')
                .select('settings')
                .eq('id', websiteId)
                .single();
              currency = (website?.settings as any)?.currency?.code || (website?.settings as any)?.currency_code || 'USD';
            }
          } catch (err) {
            console.error('Error fetching currency:', err);
            // Use default USD
          }
          
          // Store original origin for redirects (preserves custom domain)
          sessionStorage.setItem('payment_origin', window.location.origin);
          
          response = await supabase.functions.invoke('stripe-payment', { 
            body: { 
              orderId: orderId, // ✅ Use real orderId (order already created)
              amount, 
              storeId: store!.id, 
              redirectOrigin: window.location.origin,
              currency,
              customerData: { 
                name: form.customer_name, 
                email: form.customer_email, 
                phone: form.customer_phone, 
                address: form.shipping_address, 
                city: form.shipping_city, 
                country: form.shipping_country || 'US', 
                state: form.shipping_state, 
                postal_code: form.shipping_postal_code 
              } 
            } 
          });
          break;
        }
        default:
          throw new Error('Invalid payment method');
      }
      if (response.error) throw new Error(response.error.message);
      const { paymentURL } = response.data;
      if (paymentURL) {
        // Cart will be cleared after successful payment verification
        window.location.href = paymentURL;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast.error(errorMessage);
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

  // Calculate responsive padding for the checkout element using mergeResponsiveStyles
  const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);
  
  const checkoutPadding = {
    paddingTop: mergedStyles.paddingTop || '0',
    paddingRight: mergedStyles.paddingRight || '0', 
    paddingBottom: mergedStyles.paddingBottom || '0',
    paddingLeft: mergedStyles.paddingLeft || '0'
  };

  return (
    <div className="max-w-5xl mx-auto" style={{ backgroundColor: backgrounds.containerBg || undefined, ...checkoutPadding }}>
        {(sections.info || sections.shipping || sections.payment || sections.summary) && (
          <Card className={formBorderWidth > 0 ? undefined : 'border-0'} style={{ backgroundColor: backgrounds.formBg || undefined, borderColor: (backgrounds as any).formBorderColor || undefined, borderWidth: formBorderWidth || 0 }}>
            <CardContent className="p-4 md:p-6 space-y-5 w-full overflow-x-hidden">
              {sections.info && (
                <section className="space-y-4">
                  <h3 className={`text-base font-semibold text-gray-900 element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.info}</h3>
                  <div className={`grid ${infoGridCols} gap-3`}>
                    {fields.fullName?.enabled && (
                      <div>
                        <Input 
                          placeholder={fields.fullName.placeholder} 
                          value={form.customer_name} 
                          onChange={e => {
                            setForm(f => ({ ...f, customer_name: e.target.value }));
                            clearFieldError('customer_name');
                          }} 
                          required={!!(fields.fullName?.enabled && (fields.fullName?.required ?? true))} 
                          aria-required={!!(fields.fullName?.enabled && (fields.fullName?.required ?? true))}
                          aria-invalid={!!validationErrors.customer_name}
                          aria-describedby={validationErrors.customer_name ? `customer_name-error-${element.id}` : undefined}
                          className={`h-[3.75rem] px-3 border-2 rounded-md focus:ring-1 transition-colors text-base ${
                            validationErrors.customer_name 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        />
                        {validationErrors.customer_name && (
                          <p id={`customer_name-error-${element.id}`} className="text-sm text-red-600 mt-1" role="alert">
                            {validationErrors.customer_name}
                          </p>
                        )}
                      </div>
                    )}
                    {fields.phone?.enabled && (
                      <div>
                        <Input 
                          placeholder={fields.phone.placeholder} 
                          value={form.customer_phone} 
                          onChange={e => {
                            setForm(f => ({ ...f, customer_phone: e.target.value }));
                            clearFieldError('customer_phone');
                          }} 
                          onBlur={(e) => {
                            // Validate phone format for all payment methods
                            if (e.target.value.trim()) {
                              const error = getPhoneValidationError(e.target.value);
                              if (error) {
                                setValidationErrors(prev => ({ ...prev, customer_phone: error }));
                              } else {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.customer_phone;
                                  return newErrors;
                                });
                              }
                            }
                          }} 
                          required={!!(fields.phone?.enabled && (fields.phone?.required ?? true))} 
                          aria-required={!!(fields.phone?.enabled && (fields.phone?.required ?? true))}
                          aria-invalid={!!validationErrors.customer_phone}
                          aria-describedby={validationErrors.customer_phone ? `customer_phone-error-${element.id}` : undefined}
                          className={`h-[3.75rem] px-3 border-2 rounded-md focus:ring-1 transition-colors text-base ${
                            validationErrors.customer_phone 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        />
                        {validationErrors.customer_phone && (
                          <p id={`customer_phone-error-${element.id}`} className="text-sm text-red-600 mt-1 font-medium" role="alert">
                            {validationErrors.customer_phone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {fields.email?.enabled && (
                    <div>
                      <Input 
                        type="email" 
                        placeholder={fields.email.placeholder} 
                        value={form.customer_email} 
                        onChange={e => {
                          setForm(f => ({ ...f, customer_email: e.target.value }));
                          clearFieldError('customer_email');
                        }} 
                        required={!!(fields.email?.enabled && (fields.email?.required ?? false))} 
                        aria-required={!!(fields.email?.enabled && (fields.email?.required ?? false))}
                        aria-invalid={!!validationErrors.customer_email}
                        aria-describedby={validationErrors.customer_email ? `customer_email-error-${element.id}` : undefined}
                        className={`h-[3.75rem] px-3 border-2 rounded-md focus:ring-1 transition-colors text-sm ${
                          validationErrors.customer_email 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                      />
                      {validationErrors.customer_email && (
                        <p id={`customer_email-error-${element.id}`} className="text-sm text-red-600 mt-1" role="alert">
                          {validationErrors.customer_email}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )}

              

              {/* Show shipping section only if there are physical products and shipping fields are enabled */}
              {(isEditing || productTypes.hasPhysical) && (fields.address?.enabled || fields.city?.enabled || fields.area?.enabled || fields.country?.enabled || fields.state?.enabled || fields.postalCode?.enabled || (websiteShipping?.enabled && (websiteShipping as any)?.showOptionsAtCheckout)) && (
                <section className="space-y-4">
                  <h3 className={`text-base font-semibold text-gray-900 element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.shipping}</h3>
                  {fields.address?.enabled && (
                    <div>
                      <Input 
                        placeholder={fields.address.placeholder} 
                        value={form.shipping_address} 
                        onChange={e => {
                          setForm(f => ({ ...f, shipping_address: e.target.value }));
                          clearFieldError('shipping_address');
                        }} 
                        required={!!(fields.address?.enabled && (fields.address?.required ?? true))} 
                        aria-required={!!(fields.address?.enabled && (fields.address?.required ?? true))}
                        aria-invalid={!!validationErrors.shipping_address}
                        aria-describedby={validationErrors.shipping_address ? `shipping_address-error-${element.id}` : undefined}
                        className={`h-[3.75rem] px-3 border-2 rounded-md focus:ring-1 transition-colors text-sm ${
                          validationErrors.shipping_address 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                      />
                      {validationErrors.shipping_address && (
                        <p id={`shipping_address-error-${element.id}`} className="text-sm text-red-600 mt-1" role="alert">
                          {validationErrors.shipping_address}
                        </p>
                      )}
                    </div>
                  )}
                  <div className={`grid ${ship2GridCols} gap-3`}>
                    {fields.city?.enabled && (
                      <div>
                        <Input 
                          placeholder={fields.city.placeholder} 
                          value={form.shipping_city} 
                          onChange={e => {
                            setForm(f => ({ ...f, shipping_city: e.target.value }));
                            clearFieldError('shipping_city');
                          }} 
                          required={!!(fields.city?.enabled && (fields.city?.required ?? true))} 
                          aria-required={!!(fields.city?.enabled && (fields.city?.required ?? true))}
                          aria-invalid={!!validationErrors.shipping_city}
                          aria-describedby={validationErrors.shipping_city ? `shipping_city-error-${element.id}` : undefined}
                          className={`h-[3.75rem] px-3 border-2 rounded-md focus:ring-1 transition-colors text-base ${
                            validationErrors.shipping_city 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        />
                        {validationErrors.shipping_city && (
                          <p id={`shipping_city-error-${element.id}`} className="text-sm text-red-600 mt-1" role="alert">
                            {validationErrors.shipping_city}
                          </p>
                        )}
                      </div>
                    )}
                    {fields.area?.enabled && (
                      <Input 
                        placeholder={fields.area.placeholder} 
                        value={form.shipping_area} 
                        onChange={e=>setForm(f=>({...f,shipping_area:e.target.value}))} 
                        required={!!(fields.area?.enabled && (fields.area?.required ?? false))} 
                        aria-required={!!(fields.area?.enabled && (fields.area?.required ?? false))}
                        className="h-[3.75rem] px-3 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-base"
                      />
                    )}
                  </div>
                  <div className={`grid ${ship3GridCols} gap-3`}>
                    {fields.country?.enabled && (
                      <Input 
                        placeholder={fields.country.placeholder} 
                        value={form.shipping_country} 
                        onChange={e=>setForm(f=>({...f,shipping_country:e.target.value}))} 
                        required={!!(fields.country?.enabled && (fields.country?.required ?? false))} 
                        aria-required={!!(fields.country?.enabled && (fields.country?.required ?? false))}
                        className="h-[3.75rem] px-3 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-base"
                      />
                    )}
                    {fields.state?.enabled && (
                      <Input 
                        placeholder={fields.state.placeholder} 
                        value={form.shipping_state} 
                        onChange={e=>setForm(f=>({...f,shipping_state:e.target.value}))} 
                        required={!!(fields.state?.enabled && (fields.state?.required ?? false))} 
                        aria-required={!!(fields.state?.enabled && (fields.state?.required ?? false))}
                        className="h-[3.75rem] px-3 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-base"
                      />
                    )}
                     {fields.postalCode?.enabled && (
                       <Input 
                        placeholder={fields.postalCode.placeholder} 
                        value={form.shipping_postal_code} 
                        onChange={e=>setForm(f=>({...f,shipping_postal_code:e.target.value}))} 
                        required={!!(fields.postalCode?.enabled && (fields.postalCode?.required ?? false))} 
                        aria-required={!!(fields.postalCode?.enabled && (fields.postalCode?.required ?? false))}
                        className="h-[3.75rem] px-3 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-base"
                       />
                     )}
                    </div>

                   {/* Show website shipping options if enabled and not all physical products have free shipping */}
                   {(() => {
                     // Filter to only physical products (exclude digital products)
                     const physicalItems = items.filter((item) => {
                       const productData = productShippingData.get(item.productId);
                       return productData?.product_type !== 'digital';
                     });
                     
                     // If no physical products, don't show shipping options
                     if (physicalItems.length === 0) {
                       return null;
                     }
                     
                     // Check if ALL physical products have free shipping
                     const allPhysicalProductsHaveFreeShipping = physicalItems.every((item) => {
                       const productData = productShippingData.get(item.productId);
                       const shippingConfig = productData?.shipping_config;
                       return shippingConfig?.type === 'free';
                     });
                     
                     // If ALL physical products have free shipping, don't show shipping options
                     if (allPhysicalProductsHaveFreeShipping) {
                       return null;
                     }
                     
                     // Show shipping options if enabled
                     if (websiteShipping?.enabled && (websiteShipping as any)?.showOptionsAtCheckout) {
                       return (
                         <ShippingOptionsPicker
                           settings={websiteShipping}
                           selectedOptionId={selectedShippingOption?.id}
                           onOptionSelect={(option) => setSelectedShippingOption(option)}
                           setForm={setForm}
                           className="mt-4"
                         />
                       );
                     }
                     
                     return null;
                   })()}

                </section>
              )}

              {/* Custom fields section - show independently of shipping */}
              {customFields?.length > 0 && customFields.filter((cf:any)=>cf.enabled).length > 0 && (
                <section className="space-y-6">
                  <h3 className={`text-lg font-semibold text-gray-900 element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.customFields}</h3>
                  <div className="space-y-4">
                    {customFields.filter((cf:any)=>cf.enabled).map((cf:any) => (
                      <div key={cf.id}>
                        {cf.type === 'textarea' ? (
                          <Textarea 
                            placeholder={cf.placeholder || cf.label} 
                            value={(form.custom_fields as any)[cf.id] || ''} 
                            onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} 
                            required={!!cf.required} 
                            aria-required={!!cf.required}
                            className="px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                          />
                        ) : (
                          <Input 
                            type={cf.type || 'text'} 
                            placeholder={cf.placeholder || cf.label} 
                            value={(form.custom_fields as any)[cf.id] || ''} 
                            onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} 
                            required={!!cf.required} 
                            aria-required={!!cf.required}
                            className="h-[3.75rem] px-3 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-base"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {productTypes.hasPhysical && sections.shipping && sections.payment && <Separator className="my-4" />}

              {/* Always show payment section */}
              <section className="space-y-6">
                <h3 className={`text-lg font-semibold text-gray-900 element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.payment}</h3>
                <Select value={form.payment_method} onValueChange={(v:any)=>setForm(f=>({...f,payment_method:v}))}>
                  <SelectTrigger className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedMethods.includes('cod') && (<SelectItem value="cod">Cash on Delivery</SelectItem>)}
                    {allowedMethods.includes('bkash') && (<SelectItem value="bkash">bKash</SelectItem>)}
                    {allowedMethods.includes('nagad') && (<SelectItem value="nagad">Nagad</SelectItem>)}
                    {allowedMethods.includes('eps') && (<SelectItem value="eps">Bank/Card/MFS (EPS)</SelectItem>)}
                    {allowedMethods.includes('ebpay') && (<SelectItem value="ebpay">EB Pay</SelectItem>)}
                    {allowedMethods.includes('stripe') && (<SelectItem value="stripe">Credit/Debit Card (Stripe)</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.payment_method === 'bkash' && store?.settings?.bkash?.mode === 'number' && store?.settings?.bkash?.number && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Pay to bKash number: <span className="font-medium">{store.settings.bkash.number}</span></p>
                    <Input
                      placeholder="Enter transaction ID (e.g., 8M5HA84D5K)"
                      value={form.payment_transaction_number}
                      onChange={(e) => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))}
                      className="h-12 px-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>
                )}
                {form.payment_method === 'nagad' && store?.settings?.nagad?.mode === 'number' && store?.settings?.nagad?.number && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Pay to Nagad number: <span className="font-medium">{store.settings.nagad.number}</span></p>
                    <Input
                      placeholder="Enter transaction ID (e.g., NG8M5HA84D5K)"
                      value={form.payment_transaction_number}
                      onChange={(e) => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))}
                      className="h-12 px-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>
                )}
                
              </section>

              {/* Always show order summary section */}
              <section className="space-y-6">
                <h3 className={`text-lg font-semibold text-gray-900 element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.summary}</h3>
                  <div className="rounded-lg p-6 bg-gray-50 border border-gray-100" style={{ backgroundColor: backgrounds.summaryBg || undefined, borderColor: (backgrounds as any).summaryBorderColor || undefined, borderWidth: summaryBorderWidth || 0, borderStyle: summaryBorderWidth ? 'solid' as any : undefined }}>
                    {/* Items */}
                    <div className="space-y-4">
                      {displayItems.map((it)=> (
                        <div key={it.id} className={`grid items-center gap-4 ${showItemImages && it.image ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                          {showItemImages && it.image && (
                            <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 break-words">{nameWithVariant(it.name, (it as any).variation)}</div>
                            <div className="text-xs text-gray-500">Qty: {it.quantity}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 shrink-0 whitespace-nowrap text-right">{formatCurrency(it.price * it.quantity)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 my-4 pt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">{formatCurrency(displayTotal)}</span>
                      </div>
                      
                      {/* Discount Amount */}
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Discount ({discountCode})</span>
                          <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      
                      {(productTypes.hasPhysical || shouldShowMockData) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium text-gray-900">{formatCurrency(displayShippingCost)}</span>
                        </div>
                      )}
                      {!productTypes.hasPhysical && !shouldShowMockData && productTypes.hasDigital && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Digital Delivery</span>
                          <span className="font-medium text-green-600">Free</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>{formatCurrency(displayTotal - discountAmount + (productTypes.hasPhysical || shouldShowMockData ? displayShippingCost : 0))}</span>
                      </div>
                    </div>

                    {/* Payment Breakdown Message */}
                    {(() => {
                      const message = paymentBreakdown && paymentBreakdown.hasUpfrontPayment 
                        ? getPaymentBreakdownMessage(paymentBreakdown, '৳') 
                        : null;
                      return message && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                            {message}
                          </p>
                        </div>
                      );
                    })()}

                    <Button 
                      size={buttonSize as any} 
                      className={`w-full h-auto min-h-12 text-base font-semibold element-${element.id} bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-lg transition-colors ${buttonSubtextPosition === 'above' ? 'flex-col-reverse' : 'flex-col'} items-center justify-center gap-1 whitespace-normal`} 
                      style={buttonInline as React.CSSProperties} 
                      onClick={handleSubmit} 
                      disabled={loading || (isEditing && items.length === 0)}
                    >
                      {/* Main button text */}
                      <span className="whitespace-nowrap">
                        {isEditing && items.length === 0 ? 'Preview Mode - Add items to cart' : (loading? 'Placing Order...' : buttonLabel)}
                      </span>
                      
                      {/* Subtext - only shown if exists */}
                      {buttonSubtext && (
                        <span 
                          className="whitespace-normal text-center"
                          style={{
                            fontSize: getEffectiveResponsiveValue(element, 'subtextFontSize', deviceType, '12px', 'checkoutButton'),
                            color: getEffectiveResponsiveValue(element, 'subtextColor', deviceType, '#ffffff', 'checkoutButton'),
                            fontWeight: getEffectiveResponsiveValue(element, 'subtextFontWeight', deviceType, '400', 'checkoutButton'),
                            opacity: 0.9
                          }}
                        >
                          {buttonSubtext}
                        </span>
                      )}
                    </Button>

                    {terms.enabled && (
                      <label className="flex items-start gap-3 text-sm mt-4 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={form.accept_terms} 
                          onChange={(e)=>setForm(f=>({...f, accept_terms: e.target.checked}))}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-gray-600 leading-relaxed">
                          {terms.label} {terms.url && (<a href={terms.url} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">Read</a>)}
                        </span>
                      </label>
                    )}

                    {trust.enabled && trust.imageUrl && (
                      <div className="pt-4 border-t border-gray-200 mt-4">
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
  const { orderId, websiteId, funnelId } = useParams<{ orderId?: string; websiteId?: string; funnelId?: string }>();
  const { store, loadStoreById } = useStore();
  const paths = useEcomPaths();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [downloadLinks, setDownloadLinks] = useState<any[]>([]);
  const [urlFiles, setUrlFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const orderContentRef = useRef<HTMLDivElement>(null);
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const id = orderId || query.get('orderId') || '';
  const orderToken = query.get('ot') || '';
  
  // Get pixel context for tracking
  const { pixels } = usePixelContext();
  const { trackPurchase } = usePixelTracking(pixels, store?.id, websiteId, funnelId);

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
            setDownloadLinks([
              { 
                id: '1', 
                digital_file_path: 'sample-ebook.pdf', 
                download_count: 0, 
                max_downloads: 5, 
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
              }
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
        setDownloadLinks(data?.downloadLinks || []);
        setUrlFiles(data?.urlFiles || []);

        // Fallback: if no download links yet, try to generate them (service-side)
        if ((!data?.downloadLinks || data.downloadLinks.length === 0) && id) {
          try {
            const { data: ensureData } = await supabase.functions.invoke('ensure-download-links', {
              body: { orderId: id }
            });
            if (ensureData?.downloadLinks?.length) {
              setDownloadLinks(ensureData.downloadLinks);
            }
          } catch (genErr) {
            // ignore and keep empty
          }
        }
        
        // Track Purchase event when order confirmation element loads (for funnel context)
        // Check if purchase was already tracked (e.g., from PaymentProcessing for deferred payments)
        const alreadyTracked = sessionStorage.getItem('purchase_tracked_' + id) === 'true';
        
        if (!alreadyTracked && data?.order && data?.items && data.items.length > 0) {
          const trackingItems = data.items.map((item: any) => ({
            item_id: item.product_id || item.id,
            item_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            item_category: undefined
          }));
          
          // If in funnel context, fetch funnel pixel config and track directly
          if (funnelId) {
            try {
              const { data: funnelData } = await supabase
                .from('funnels')
                .select('settings')
                .eq('id', funnelId)
                .single();
              
              if (funnelData?.settings) {
                const settings = funnelData.settings as any;
                const funnelPixels = {
                  facebook_pixel_id: settings?.facebook_pixel_id || pixels?.facebook_pixel_id,
                  google_analytics_id: settings?.google_analytics_id || pixels?.google_analytics_id,
                  google_ads_id: settings?.google_ads_id || pixels?.google_ads_id,
                };
                
                // Track directly with funnel pixel config
                const eventData = {
                  content_ids: trackingItems.map(item => item.item_id),
                  content_type: 'product',
                  value: data.order.total,
                  currency: 'BDT',
                  contents: trackingItems.map(item => ({
                    id: item.item_id,
                    quantity: item.quantity,
                  })),
                  // Include customer data for better Facebook matching
                  customer_email: data.order.customer_email || null,
                  customer_phone: data.order.customer_phone || null,
                  customer_name: data.order.customer_name || null,
                  shipping_city: data.order.shipping_city || null,
                  shipping_state: data.order.shipping_state || null,
                  shipping_postal_code: data.order.shipping_postal_code || null,
                  shipping_country: data.order.shipping_country || null,
                };
                
                // Facebook Pixel
                if (funnelPixels.facebook_pixel_id && window.fbq) {
                  try {
                    window.fbq('track', 'Purchase', eventData);
                  } catch (error) {
                    console.error('OrderConfirmationElement: Error tracking Facebook Purchase:', error);
                  }
                }
                
                // Google Analytics
                if ((funnelPixels.google_analytics_id || funnelPixels.google_ads_id) && window.gtag) {
                  try {
                    window.gtag('event', 'purchase', {
                      transaction_id: data.order.id,
                      currency: 'BDT',
                      value: data.order.total,
                      items: trackingItems,
                    });
                  } catch (error) {
                    console.error('OrderConfirmationElement: Error tracking Google Purchase:', error);
                  }
                }
                
                // Store purchase event directly in database with funnel_id
                try {
                  let sessionId = sessionStorage.getItem('session_id');
                  if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    sessionStorage.setItem('session_id', sessionId);
                  }
                  
                  const dbEventData = {
                    ...eventData,
                    _providers: {
                      facebook: {
                        configured: !!funnelPixels.facebook_pixel_id,
                        attempted: !!window.fbq && !!funnelPixels.facebook_pixel_id,
                        success: !!window.fbq && !!funnelPixels.facebook_pixel_id
                      },
                      google: {
                        configured: !!(funnelPixels.google_analytics_id || funnelPixels.google_ads_id),
                        attempted: !!(window.gtag && (funnelPixels.google_analytics_id || funnelPixels.google_ads_id)),
                        success: !!(window.gtag && (funnelPixels.google_analytics_id || funnelPixels.google_ads_id))
                      }
                    },
                    funnel_id: funnelId // ✅ Explicitly include funnel_id in event_data
                  };
                  
                  await supabase.from('pixel_events').insert({
                    store_id: store?.id || '',
                    website_id: websiteId || null,
                    funnel_id: funnelId || null, // ✅ Add funnel_id column for server-side tracking
                    event_type: 'Purchase',
                    event_data: dbEventData,
                    session_id: sessionId,
                    page_url: window.location.href,
                    referrer: document.referrer || null,
                    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
                    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
                    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
                    utm_term: new URLSearchParams(window.location.search).get('utm_term'),
                    utm_content: new URLSearchParams(window.location.search).get('utm_content'),
                    user_agent: navigator.userAgent,
                  });
                  
                  console.log('OrderConfirmationElement: Purchase event stored in database with funnel_id:', funnelId);
                } catch (dbError) {
                  console.error('OrderConfirmationElement: Error storing purchase event in database:', dbError);
                  // Fallback: use hook-based tracking if direct insert fails
                  trackPurchase({
                    transaction_id: data.order.id,
                    value: data.order.total,
                    items: trackingItems
                  });
                }
              }
            } catch (error) {
              console.error('OrderConfirmationElement: Error fetching funnel pixel config:', error);
              // Fallback: use hook-based tracking if funnel config fetch fails
              trackPurchase({
                transaction_id: data.order.id,
                value: data.order.total,
                items: trackingItems
              });
            }
          } else {
            // No funnelId, use hook-based tracking (for website checkouts)
            trackPurchase({
              transaction_id: data.order.id,
              value: data.order.total,
              items: trackingItems
            });
          }
          
          // Store tracking flag to prevent future duplicates
          sessionStorage.setItem('purchase_tracked_' + id, 'true');
        }
        
        // Clear tracking flag after processing if it was already tracked
        if (alreadyTracked) {
          sessionStorage.removeItem('purchase_tracked_' + id);
        }
      } catch (e) {
        // Error fetching order
      } finally {
        setLoading(false);
      }
    })();
  }, [id, store, orderToken]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (!order) return <div className="text-center">Order Processing...</div>;

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
          
          {/* Upfront Payment Breakdown */}
          {order.custom_fields && typeof order.custom_fields === 'object' && (order.custom_fields as any).upfront_payment_amount && (order.custom_fields as any).upfront_payment_amount > 0 && (
            <>
              <Separator className="my-2" />
              <div className="space-y-2 pt-2">
                <div className="text-sm font-medium text-blue-600">Payment Breakdown:</div>
                <div className="flex justify-between text-sm">
                  <span>Paid Upfront:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((order.custom_fields as any).upfront_payment_amount || 0)}
                    {((order.custom_fields as any).upfront_payment_method && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (via {((order.custom_fields as any).upfront_payment_method === 'eps' ? 'EPS' : 
                               (order.custom_fields as any).upfront_payment_method === 'ebpay' ? 'EB Pay' : 
                               (order.custom_fields as any).upfront_payment_method === 'stripe' ? 'Stripe' : 
                               (order.custom_fields as any).upfront_payment_method === 'bkash' ? 'bKash' : 
                               (order.custom_fields as any).upfront_payment_method === 'nagad' ? 'Nagad' : 
                               (order.custom_fields as any).upfront_payment_method)})
                      </span>
                    ))}
                  </span>
                </div>
                {((order.custom_fields as any).delivery_payment_amount && (order.custom_fields as any).delivery_payment_amount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span>To Pay on Delivery (COD):</span>
                    <span className="font-medium">
                      {formatCurrency((order.custom_fields as any).delivery_payment_amount || 0)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
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
      
      
      {/* Digital Downloads Section */}
      <DigitalDownloadSection
        downloadLinks={downloadLinks}
        urlFiles={urlFiles}
        orderId={order.id}
        orderToken={orderToken}
      />
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
    defaultContent: { limit: 8, title: 'Related Products', columns: 4, tabletColumns: 2, mobileColumns: 1, categoryIds: [], ctaBehavior: 'view', ctaText: 'View' },
    description: 'Show a small grid of products with customizable CTA behavior (View, Add to Cart, Buy Now).'
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
    name: 'Site Checkout',
    category: 'ecommerce',
    icon: CreditCard,
    component: CheckoutFullElement,
    defaultContent: {
      placeOrderLabel: 'Place Order',
      placeOrderSubtext: '',
      placeOrderSubtextPosition: 'below',
    },
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
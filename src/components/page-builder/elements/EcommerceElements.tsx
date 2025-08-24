import React from 'react';
import { ShoppingCart, Grid, Star, Tag, Package, DollarSign, Eye } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStoreProducts, useStoreCategories, useProductById } from '@/hooks/useStoreData';
import { useStore } from '@/contexts/StoreContext';
import { useUserStore } from '@/hooks/useUserStore';
import { useEcomPaths } from '@/lib/pathResolver';
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { ProductsPageElement } from './ProductsPageElement';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedWebsiteId } from '@/hooks/useResolvedWebsiteId';
import { useProductReviewStats } from '@/hooks/useProductReviewStats';
// Product Grid Element
const ProductGridElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing = false, deviceType = 'desktop', columnCount = 1 }) => {
  const { addToCart: addToCartProvider } = useAddToCart();
  const { store } = useStore();
  const paths = useEcomPaths();
  const { openQuickView } = useAddToCart();
  const ctaBehavior: 'add_to_cart' | 'buy_now' = element.content.ctaBehavior || 'add_to_cart';
  
  // Resolve websiteId for filtering
  const resolvedWebsiteId = useResolvedWebsiteId(element);
  
  // Quick View support
  const showQuickView = element.content.showQuickView !== false;
  
  // Extract configuration from element content
  const columns = element.content.columns || 2;
  const showRating = element.content.showRating !== false;
  const showPrice = element.content.showPrice !== false;
  const showQuickAdd = element.content.showQuickAdd !== false;
  const categoryIds = element.content.categoryIds || [];
  const specificProductIds = element.content.specificProductIds || [];
  const limit = element.content.limit || 4;
  const selectionMode = element.content.selectionMode || 'all'; // 'all', 'category', 'specific'

  // Get device-responsive grid classes
  const getGridClasses = () => {
    if (deviceType === 'mobile') {
      const mCols = (element.content as any).mobileColumns as number | undefined;
      const m = typeof mCols === 'number' ? Math.max(1, Math.min(3, mCols)) : 1;
      const map: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };
      return map[m] || 'grid-cols-1';
    }
    if (deviceType === 'tablet') {
      // Respect single column layout
      if (columnCount === 1) return 'grid-cols-1';
      // Use explicit tablet columns when provided, fallback to heuristic
      const tCols = element.content.tabletColumns as number | undefined;
      if (typeof tCols === 'number') {
        const t = Math.max(1, Math.min(4, tCols));
        const map: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
        return map[t];
      }
      return (element.content.columns || 2) >= 4 ? 'grid-cols-3' : 'grid-cols-2';
    }
    const col = Math.min(columns, 4);
    const map: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
    return map[col] || 'grid-cols-2';
  };
  const { products, loading } = useStoreProducts({
    categoryIds: selectionMode === 'category' ? categoryIds : undefined,
    specificProductIds: selectionMode === 'specific' ? specificProductIds : undefined,
    limit: limit,
    websiteId: resolvedWebsiteId
  });

  // Fetch review stats for all products
  const productIds = products.map(p => p.id);
  const { reviewStats } = useProductReviewStats(productIds);

  const handleAddToCart = (product: any) => {
    const isBuyNow = ctaBehavior === 'buy_now';
    addToCartProvider(product, 1, isBuyNow);
  };


  const buttonStyles = React.useMemo(() => {
    const bs = (element as any).styles?.buttonStyles || {};
    if ((bs as any).responsive) {
      return mergeResponsiveStyles({}, bs, deviceType as any) as React.CSSProperties;
    }
    return bs as React.CSSProperties;
  }, [deviceType, (element as any).styles?.buttonStyles]);

  const elementStyles = renderElementStyles(element, deviceType);

  if (loading) {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`} style={elementStyles}>
        <div className={`grid gap-4 ${getGridClasses()}`}>
          {[...Array(limit)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`} style={elementStyles}>
      {element.content.title && (
        <h3 style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }} className="font-semibold mb-4">{element.content.title}</h3>
      )}
      <div className={`grid gap-4 ${getGridClasses()}`}>
        {products.map((product) => (
          <Card key={product.id} className="group/card hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="aspect-square overflow-hidden rounded-lg mb-3 relative">
                <a href={paths.productDetail(product.slug)} aria-label={product.name}>
                  <img
                    src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
                  />
                </a>
                {showQuickView && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    onClick={() => openQuickView({
                      ...product,
                      images: Array.isArray(product.images) ? product.images : [product.images]
                    })}
                    aria-label={`Quick view ${product.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <h4 style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }} className="font-medium mb-2 line-clamp-2">
                <a href={paths.productDetail(product.slug)} className="hover:underline">{product.name}</a>
              </h4>
              
              {showRating && reviewStats[product.id] && reviewStats[product.id].rating_count > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(reviewStats[product.id].rating_average) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span style={{ color: elementStyles.color, fontSize: elementStyles.fontSize }} className="text-xs text-muted-foreground">
                    ({reviewStats[product.id].rating_average.toFixed(1)})
                  </span>
                </div>
              )}
              
              {showPrice && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, fontWeight: elementStyles.fontWeight }} className="font-bold text-base md:text-lg">{formatCurrency(product.price)}</span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-xs md:text-sm text-muted-foreground line-through">
                        {formatCurrency(product.compare_price)}
                      </span>
                    )}
                  </div>
                  {showQuickAdd && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAddToCart(product)}
                      style={buttonStyles as React.CSSProperties}
                      className="w-full sm:w-auto"
                    >
                      {ctaBehavior === 'buy_now' ? 'Buy Now' : 'Add to Cart'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found. Add some products to your store to display them here.
        </div>
      )}

    </div>
  );
};

// Featured Products Element
const FeaturedProductsElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing = false, deviceType = 'desktop', columnCount = 1 }) => {
  const { addToCart: addToCartProvider } = useAddToCart();
  const { store } = useStore();
  const paths = useEcomPaths();
  
  const ctaBehavior: 'add_to_cart' | 'buy_now' = element.content.ctaBehavior || 'add_to_cart';
  
  // Resolve websiteId for filtering
  const resolvedWebsiteId = useResolvedWebsiteId(element);
  
  const productId = element.content.productId;
  const selectedProductIds: string[] = element.content.selectedProductIds || [];
  const layout = element.content.layout || 'horizontal';
  const badgeText = element.content.badgeText || 'Featured Product';
  const ctaText = element.content.ctaText || 'Add to Cart';
  
  // Multi-featured support - only show products visible on this website
  const { products: featuredProducts, loading: loadingFeatured } = useStoreProducts(
    selectedProductIds.length > 0 ? { specificProductIds: selectedProductIds, websiteId: resolvedWebsiteId } : undefined as any
  );
  
  const { product, loading } = useProductById(productId);

  const handleAddToCartGeneric = (p: any) => {
    const isBuyNow = ctaBehavior === 'buy_now';
    addToCartProvider(p, 1, isBuyNow);
  };

  const buttonStyles = React.useMemo(() => {
    const bs = (element as any).styles?.buttonStyles || {};
    if ((bs as any).responsive) {
      return mergeResponsiveStyles({}, bs, deviceType as any) as React.CSSProperties;
    }
    return bs as React.CSSProperties;
  }, [deviceType, (element as any).styles?.buttonStyles]);

  // Responsive grid classes for multi-featured layout
  const getGridClasses = () => {
    const cols = element.content.columns || 2;
    if (deviceType === 'mobile') {
      const mCols = (element.content as any).mobileColumns as number | undefined;
      const m = typeof mCols === 'number' ? Math.max(1, Math.min(3, mCols)) : 1;
      const map: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };
      return map[m] || 'grid-cols-1';
    }
    if (deviceType === 'tablet') {
      if (columnCount === 1) return 'grid-cols-1';
      const tCols = element.content.tabletColumns as number | undefined;
      if (typeof tCols === 'number') {
        const t = Math.max(1, Math.min(4, tCols));
        const map: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
        return map[t];
      }
      // auto heuristic
      return cols >= 4 ? 'grid-cols-3' : 'grid-cols-2';
    }
    const d = Math.min(cols, 4);
    const map: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
    return map[d] || 'grid-cols-2';
  };

  if (selectedProductIds.length > 0) {
    if (loadingFeatured) {
      return (
        <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`}>
          <div className={`grid gap-4 ${getGridClasses()}`}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    const elementStyles = renderElementStyles(element, deviceType);
    
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`} style={elementStyles}>
        {element.content.title && (
          <h3 style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }} className="text-xl font-semibold mb-4">{element.content.title}</h3>
        )}
        <div className={`grid gap-4 ${getGridClasses()}`}>
          {featuredProducts.map((p) => (
            <Card key={p.id} className="group/card hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="aspect-square overflow-hidden rounded-lg mb-3">
                  <a href={paths.productDetail(p.slug)} aria-label={p.name}>
                    <img
                      src={(Array.isArray(p.images) ? p.images[0] : p.images) || '/placeholder.svg'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
                    />
                  </a>
                </div>
                 <div className="flex items-start justify-between gap-2">
                   <h4 style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }} className="font-medium line-clamp-2">
                     <a href={paths.productDetail(p.slug)} className="hover:underline">{p.name}</a>
                   </h4>
                  <Star className="h-4 w-4 text-primary shrink-0" aria-label="Featured" />
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                   <div className="flex flex-col">
                     <span style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, fontWeight: elementStyles.fontWeight }} className="font-bold text-base md:text-lg">{formatCurrency(p.price)}</span>
                    {p.compare_price && p.compare_price > p.price && (
                      <span className="text-xs md:text-sm text-muted-foreground line-through">
                        {formatCurrency(p.compare_price)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleAddToCartGeneric(p)} style={buttonStyles as React.CSSProperties} className="w-full sm:w-auto">
                    {ctaBehavior === 'buy_now' ? 'Buy Now' : 'Add to Cart'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {featuredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Select products to feature.</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-4xl mx-auto'}`}>
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 animate-pulse">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="h-6 w-24 bg-muted rounded mb-3"></div>
              <div className="h-8 w-3/4 bg-muted rounded mb-2"></div>
              <div className="h-4 w-full bg-muted rounded mb-4"></div>
              <div className="h-10 w-32 bg-muted rounded"></div>
            </div>
            <div className="h-64 md:h-80 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-4xl mx-auto'}`}>
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <div className="text-center py-8 text-muted-foreground">
            Please select a product to feature from the properties panel.
          </div>
        </div>
      </div>
    );
  }

  // Mobile/tablet responsive layout logic
  const isMobileOrTablet = deviceType === 'mobile' || deviceType === 'tablet';
  const isVerticalLayout = layout === 'vertical' || isMobileOrTablet;
  
  const containerClass = deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-4xl mx-auto';
  const layoutClass = layout === 'hero'
    ? 'grid lg:grid-cols-2 gap-8 items-center min-h-[400px]'
    : isVerticalLayout
    ? 'flex flex-col gap-6'
    : 'grid md:grid-cols-2 gap-6 items-center';

  // Responsive image sizing
  const imageClass = isMobileOrTablet 
    ? 'w-full h-48 sm:h-56 object-cover rounded-lg'
    : 'w-full h-64 md:h-80 object-cover rounded-lg';

  return (
    <div className={containerClass} style={renderElementStyles(element, deviceType)}>
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <div className={layoutClass}>
          {/* Header section - Badge and Title */}
          <div className={`${isVerticalLayout ? '' : 'order-1'}`}>
            <Star className="h-5 w-5 text-primary mb-3" aria-label="Featured" />
            <h2 className="font-bold mb-4">{product.name}</h2>
            
            {/* Image section - appears right after title on mobile/tablet */}
            {isMobileOrTablet && (
              <div className="relative mb-4">
                <img
                  src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
                  alt={product.name}
                  className={imageClass}
                />
                <Badge className="absolute top-4 right-4" variant="secondary">
                  ⭐ 4.8
                </Badge>
              </div>
            )}
            
            {/* Content section - Description, Price, Button */}
            <p className="text-muted-foreground mb-4">
              {product.short_description || product.description}
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.compare_price)}
                  </span>
                  <Badge variant="destructive">
                    Save {formatCurrency(product.compare_price - product.price)}
                  </Badge>
                </>
              )}
            </div>

            <Button size="lg" className="w-full md:w-auto" onClick={() => handleAddToCartGeneric(product)} style={buttonStyles as React.CSSProperties}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {ctaText}
            </Button>
          </div>
          
          {/* Image section - for desktop only */}
          {!isMobileOrTablet && (
            <div className={`relative ${layout === 'vertical' ? 'order-1' : 'order-2'}`}>
              <img
                src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
                alt={product.name}
                className={imageClass}
              />
              <Badge className="absolute top-4 right-4" variant="secondary">
                ⭐ 4.8
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Category Navigation Element
const CategoryNavigationElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop', columnCount = 1 }) => {
  // Resolve websiteId for filtering
  const resolvedWebsiteId = useResolvedWebsiteId(element);
  const { categories, loading } = useStoreCategories(resolvedWebsiteId);
  const paths = useEcomPaths();
  const layout = element.content.layout || 'grid';
  const selectedCategoryIds = element.content.selectedCategoryIds || [];
  const showProductCount = element.content.showProductCount !== false;
  const enableLinks = element.content.enableLinks !== false;
  
  // Filter categories based on selection
  const displayCategories = selectedCategoryIds.length > 0 
    ? categories.filter(cat => selectedCategoryIds.includes(cat.id))
    : categories;
  
  // Product counts per category (for display)
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  React.useEffect(() => {
    if (!showProductCount || displayCategories.length === 0) return;
    let cancelled = false;
    const fetchCounts = async () => {
      const results: Record<string, number> = {};
      // Lazy import supabase to avoid touching imports at file top
      const { supabase } = await import('@/integrations/supabase/client');
      await Promise.all(
        displayCategories.map(async (cat) => {
          try {
            // If websiteId is provided, filter by website visibility
            if (resolvedWebsiteId) {
              const { data: visibleProductIds } = await supabase
                .from('product_website_visibility')
                .select('product_id')
                .eq('website_id', resolvedWebsiteId);

              const productIds = visibleProductIds?.map(v => v.product_id) || [];
              
              if (productIds.length === 0) {
                results[cat.id] = 0;
                return;
              }

              const { count } = await supabase
                .from('products')
                .select('id', { head: true, count: 'exact' })
                .eq('category_id', cat.id)
                .eq('is_active', true)
                .in('id', productIds);
              results[cat.id] = count ?? 0;
            } else {
              // Original logic for store-wide counting
              const { count } = await supabase
                .from('products')
                .select('id', { head: true, count: 'exact' })
                .eq('category_id', cat.id)
                .eq('is_active', true);
              results[cat.id] = count ?? 0;
            }
          } catch (e) {
            results[cat.id] = 0;
          }
        })
      );
      if (!cancelled) setCounts(results);
    };
    fetchCounts();
    return () => { cancelled = true; };
  // Key off IDs string and resolvedWebsiteId to avoid deep deps
  }, [showProductCount, displayCategories.map(c => c.id).join(','), resolvedWebsiteId]);
  
  // Get device-responsive grid classes
  const getCircleGridClasses = () => {
    if (deviceType === 'mobile') return 'grid-cols-2';
    if (deviceType === 'tablet') {
      // Respect single column layout
      if (columnCount === 1) return 'grid-cols-3';
      // Smart tablet logic: use fewer columns if few categories
      return displayCategories.length <= 2 ? 'grid-cols-2' : 'grid-cols-4';
    }
    return 'grid-cols-6';
  };
  
  const getCardGridClasses = () => {
    if (deviceType === 'mobile') return 'grid-cols-1';
    if (deviceType === 'tablet') {
      // Respect single column layout
      if (columnCount === 1) return 'grid-cols-1';
      // Smart tablet logic: single column if few categories for better readability
      return displayCategories.length <= 2 ? 'grid-cols-1' : 'grid-cols-2';
    }
    return 'grid-cols-3';
  };

  const handleCategoryClick = (category: any) => {
    if (enableLinks) {
      window.location.href = `${paths.products}?category=${category.slug}`;
    }
  };

  if (loading) {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`}>
        <div className={`grid gap-4 ${getCircleGridClasses()}`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full mb-2"></div>
              <div className="h-4 bg-muted rounded mx-auto w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'circles') {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`}>
        {element.content.title && (
          <h3 className="text-xl font-semibold mb-6 text-center">{element.content.title}</h3>
        )}
        <div className={`grid gap-4 ${getCircleGridClasses()}`}>
          {displayCategories.map((category) => (
            <div 
              key={category.id} 
              className="text-center group cursor-pointer"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors overflow-hidden">
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tag className="h-6 w-6" />
                )}
              </div>
              <h4 className="font-medium mt-2 text-sm">{category.name}</h4>
              {showProductCount && (
                <p className="text-xs text-muted-foreground">{(counts[category.id] ?? 0)} {(counts[category.id] ?? 0) === 1 ? 'product' : 'products'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-6xl mx-auto'}`}>
      {element.content.title && (
        <h3 className="text-xl font-semibold mb-4">{element.content.title}</h3>
      )}
      <div className={`grid gap-4 ${getCardGridClasses()}`}>
        {displayCategories.map((category) => (
          <Card 
            key={category.id} 
            className="group hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCategoryClick(category)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tag className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  {showProductCount && (
                    <p className="text-sm text-muted-foreground">{(counts[category.id] ?? 0)} {(counts[category.id] ?? 0) === 1 ? 'product' : 'products'}</p>
                  )}
                  {category.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {displayCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No categories found. Add some categories to your store to display them here.
        </div>
      )}
    </div>
  );
};

  // Weekly Featured Element
  const WeeklyFeaturedElement: React.FC<{
    element: PageBuilderElement;
    isEditing?: boolean;
    deviceType?: 'desktop' | 'tablet' | 'mobile';
    columnCount?: number;
    onUpdate?: (updates: Partial<PageBuilderElement>) => void;
  }> = ({ element, deviceType = 'desktop', columnCount = 1 }) => {
    const { store } = useStore();
    const resolvedWebsiteId = useResolvedWebsiteId(element);
    
    const [topProducts, setTopProducts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const sourceType = element.content.sourceType || 'auto';
    const selectedProductIds = element.content.selectedProductIds || [];
    
    const { products: allProducts } = useStoreProducts({ websiteId: resolvedWebsiteId });
    
    // Fetch review stats for all products
    const productIds = topProducts.map(p => p.id);
    const { reviewStats } = useProductReviewStats(productIds);
    
    // Fetch top selling products for auto mode or selected products for manual mode
    React.useEffect(() => {
      const fetchProducts = async () => {
        if (!store?.id) {
          setTopProducts([]);
          setLoading(false);
          return;
        }
        
        if (sourceType === 'manual') {
          // For manual mode, get selected products
          const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id));
          setTopProducts(selectedProducts);
          setLoading(false);
          return;
        }
        
        // For auto mode, fetch from top-sellers function
        setLoading(true);
        try {
          const { data } = await supabase.functions.invoke('top-sellers', {
            body: { storeId: store.id, limit: element.content.limit || 6, websiteId: resolvedWebsiteId }
          });
          
          setTopProducts(data || []);
        } catch (error) {
          console.error('Error fetching top products:', error);
          setTopProducts([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProducts();
    }, [store?.id, element.content.limit, resolvedWebsiteId, sourceType, selectedProductIds, allProducts]);
    
    const { addToCart } = useAddToCart();
    
    const getResponsiveColumns = () => {
      const columns = element.content.columns || 3;
      const tabletColumns = element.content.tabletColumns || Math.max(2, Math.min(columns, 3));
      const mobileColumns = element.content.mobileColumns || 1;
      
      if (deviceType === 'mobile') return mobileColumns;
      if (deviceType === 'tablet') return tabletColumns;
      return columns;
    };
    
    const handleAddToCart = async (product: any) => {
      await addToCart(product, 1);
    };
    
    const applyStyles = (baseClasses: string, styleType?: string) => {
      const styles = element.styles || {};
      let classes = baseClasses;
      let inlineStyles: React.CSSProperties = {};
      
      // Get responsive styles based on device type - fix the structure mismatch
      const deviceKey = deviceType === 'mobile' ? 'mobile' : 'desktop';
      
      // Check multiple possible structure locations for styles
      const responsiveStyles = (styles as any).responsiveStyles?.[deviceKey] || {};
      const headlineStyles = responsiveStyles.headline || 
                            (styles as any).headlineStyles?.responsive?.[deviceKey] || {};
      const subheadlineStyles = responsiveStyles.subheadline || 
                               (styles as any).subheadlineStyles?.responsive?.[deviceKey] || {};
      const productTitleStyles = responsiveStyles.productTitle || 
                                (styles as any).productTitleStyles?.responsive?.[deviceKey] || {};
      const priceStyles = responsiveStyles.price || 
                         (styles as any).priceStyles?.responsive?.[deviceKey] || {};
      
      // Apply styles based on the element being styled
      if (baseClasses.includes('headline') || styleType === 'headline') {
        if (headlineStyles.fontSize) inlineStyles.fontSize = headlineStyles.fontSize;
        if (headlineStyles.color) inlineStyles.color = headlineStyles.color;
        if (headlineStyles.textAlign) inlineStyles.textAlign = headlineStyles.textAlign;
        if (headlineStyles.lineHeight) inlineStyles.lineHeight = headlineStyles.lineHeight;
      }
      
      if (baseClasses.includes('subheadline') || styleType === 'subheadline') {
        if (subheadlineStyles.fontSize) inlineStyles.fontSize = subheadlineStyles.fontSize;
        if (subheadlineStyles.color) inlineStyles.color = subheadlineStyles.color;
        if (subheadlineStyles.textAlign) inlineStyles.textAlign = subheadlineStyles.textAlign;
        if (subheadlineStyles.lineHeight) inlineStyles.lineHeight = subheadlineStyles.lineHeight;
      }
      
      if (baseClasses.includes('product-title') || styleType === 'product-title') {
        if (productTitleStyles.fontSize) inlineStyles.fontSize = productTitleStyles.fontSize;
        if (productTitleStyles.color) inlineStyles.color = productTitleStyles.color;
        if (productTitleStyles.lineHeight) inlineStyles.lineHeight = productTitleStyles.lineHeight;
      }
      
      if (baseClasses.includes('price') || styleType === 'price') {
        if (priceStyles.fontSize) inlineStyles.fontSize = priceStyles.fontSize;
        if (priceStyles.color) inlineStyles.color = priceStyles.color;
        if (priceStyles.lineHeight) inlineStyles.lineHeight = priceStyles.lineHeight;
      }
      
      return { className: classes, style: inlineStyles };
    };
    
    const getCardStyles = () => {
      const styles = element.styles || {};
      let cardClasses = "border rounded-lg p-4 hover:shadow-md transition-shadow bg-card";
      let inlineStyles: React.CSSProperties = {};
      
      // Apply card styles using inline styles for reliability
      if ((styles as any).cardBackground) {
        inlineStyles.backgroundColor = (styles as any).cardBackground;
      }
      if (styles.borderRadius) {
        inlineStyles.borderRadius = styles.borderRadius;
      }
      if ((styles as any).borderWidth) {
        inlineStyles.borderWidth = (styles as any).borderWidth;
        if ((styles as any).borderColor) {
          inlineStyles.borderColor = (styles as any).borderColor;
        }
      }
      if ((styles as any).cardPadding) {
        inlineStyles.padding = (styles as any).cardPadding;
      }
      
      return { className: cardClasses, style: inlineStyles };
    };
    
    const getButtonStyles = () => {
      const styles = element.styles || {};
      const variant = (styles as any).buttonVariant || 'default';
      const size = (styles as any).buttonSize || 'sm';
      const width = (styles as any).buttonWidth === 'full' ? 'w-full' : '';
      
      let customStyle: React.CSSProperties = {};
      let className = width;
      
      // Handle custom button colors
      if (variant === 'custom') {
        const buttonBg = (styles as any).buttonBackground || '#000000';
        const buttonText = (styles as any).buttonTextColor || '#ffffff';
        const buttonHover = (styles as any).buttonHoverBackground || '#333333';
        
        customStyle = {
          backgroundColor: buttonBg,
          color: buttonText,
          border: 'none'
        };
        
        // Add hover effect via CSS custom properties
        className += ' custom-button-hover';
        
        return { 
          variant: 'default' as const,
          size, 
          className,
          style: customStyle,
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = buttonHover;
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = buttonBg;
          }
        };
      }
      
      return { variant, size, className };
    };
    
    if (loading) {
      return (
        <div className="w-full py-8">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${getResponsiveColumns()}, 1fr)` }}>
            {Array.from({ length: element.content.limit || 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (topProducts.length === 0) {
      const emptyMessage = sourceType === 'manual' 
        ? "No products selected. Please select products in the element settings."
        : "No top products found for this week. Products need delivered orders to appear here.";
      
      return (
        <div className="w-full py-12 text-center text-muted-foreground">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }
    
    const containerGap = (element.styles as any)?.gap ? parseInt((element.styles as any).gap) : 16;
    
    return (
      <div className="w-full">
        {element.content.showTitle !== false && element.content.title && (
          <h2 
            className={applyStyles("text-2xl font-bold mb-2", 'headline').className}
            style={applyStyles("text-2xl font-bold mb-2", 'headline').style}
          >
            {element.content.title}
          </h2>
        )}
        
        {element.content.showSubtitle !== false && element.content.subtitle && (
          <p 
            className={applyStyles("text-muted-foreground mb-6", 'subheadline').className}
            style={applyStyles("text-muted-foreground mb-6", 'subheadline').style}
          >
            {element.content.subtitle}
          </p>
        )}
        
        <div 
          className="grid" 
          style={{ 
            gridTemplateColumns: `repeat(${getResponsiveColumns()}, 1fr)`,
            gap: `${containerGap}px`
          }}
        >
          {topProducts.slice(0, element.content.limit || 6).map((product) => {
            const buttonProps = getButtonStyles();
            const cardProps = getCardStyles();
            const titleProps = applyStyles("font-medium text-sm mb-1", 'product-title');
            const priceProps = applyStyles("font-bold text-lg mb-3", 'price');
            
            return (
              <div key={product.id} className={cardProps.className} style={cardProps.style}>
                <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                
                <h3 className={titleProps.className} style={titleProps.style}>
                  {product.name}
                </h3>
                
                {reviewStats[product.id] && reviewStats[product.id].rating_count > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < Math.floor(reviewStats[product.id].rating_average) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({reviewStats[product.id].rating_average.toFixed(1)})
                    </span>
                  </div>
                )}
                
                <p className={priceProps.className} style={priceProps.style}>
                  ${product.price}
                </p>
                
                <Button
                  onClick={() => handleAddToCart(product)}
                  variant={buttonProps.variant}
                  size={buttonProps.size}
                  className={buttonProps.className}
                  style={buttonProps.style}
                  onMouseEnter={buttonProps.onMouseEnter}
                  onMouseLeave={buttonProps.onMouseLeave}
                >
                  {element.content.ctaText || 'Add to Cart'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

// Price Element
const PriceElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop', columnCount = 1 }) => {
  const { addToCart } = useAddToCart();
  
  const productId = element.content.productId;
  const showComparePrice = element.content.showComparePrice !== false;
  const showDiscount = element.content.showDiscount !== false;
  const ctaBehavior = element.content.ctaBehavior || 'add_to_cart';
  const ctaText = element.content.ctaText || (ctaBehavior === 'buy_now' ? 'Buy Now' : 'Add to Cart');
  const elementLayout = (element.styles as any)?.layout || element.content.layout || 'horizontal';
  
  const { product, loading } = useProductById(productId);
  
  const applyStyles = (styleType: 'price' | 'comparePrice' | 'discount') => {
    const styles = element.styles || {};
    const deviceKey = deviceType === 'mobile' ? 'mobile' : 'desktop';
    
    let targetStyles = {};
    
    if (styleType === 'price') {
      targetStyles = (styles as any).priceStyles?.responsive?.[deviceKey] || {};
    } else if (styleType === 'comparePrice') {
      targetStyles = (styles as any).comparePriceStyles?.responsive?.[deviceKey] || {};
    } else if (styleType === 'discount') {
      targetStyles = (styles as any).discountStyles?.responsive?.[deviceKey] || {};
    }
    
    const inlineStyles: React.CSSProperties = {};
    
    if ((targetStyles as any).fontSize) inlineStyles.fontSize = (targetStyles as any).fontSize;
    if ((targetStyles as any).color) inlineStyles.color = (targetStyles as any).color;
    if ((targetStyles as any).lineHeight) inlineStyles.lineHeight = (targetStyles as any).lineHeight;
    if ((targetStyles as any).textAlign) inlineStyles.textAlign = (targetStyles as any).textAlign;
    
    return { style: inlineStyles };
  };
  
  const getContainerStyles = () => {
    const styles = element.styles || {};
    const containerAlignment = (styles as any).containerAlignment || 'left';
    const priceAlignment = (styles as any).priceAlignment || 'left';
    const spacing = parseInt((styles as any).spacing) || 8;
    
    let outerContainerClass = '';
    let containerClass = 'flex';
    let priceContainerClass = 'flex items-center';
    
    // Outer container alignment (positions entire element within column)
    if (containerAlignment === 'center') outerContainerClass = 'mx-auto';
    if (containerAlignment === 'right') outerContainerClass = 'ml-auto';
    if (containerAlignment === 'left') outerContainerClass = 'mr-auto';
    
    // Price elements alignment (within the price container)
    if (priceAlignment === 'center') priceContainerClass += ' justify-center';
    if (priceAlignment === 'right') priceContainerClass += ' justify-end';
    
    return { 
      outerContainerClass,
      containerClass,
      priceContainerClass,
      spacing: `${spacing}px`
    };
  };
  
  const getButtonStyles = () => {
    const styles = element.styles || {};
    const variant = (styles as any).buttonVariant || 'default';
    const size = (styles as any).buttonSize || 'default';
    const width = (styles as any).buttonWidth === 'full' ? 'w-full' : '';
    
    let customStyle: React.CSSProperties = {};
    let className = width;
    
    // Handle custom button colors
    if (variant === 'custom') {
      const buttonBg = (styles as any).buttonBackground || '#000000';
      const buttonText = (styles as any).buttonTextColor || '#ffffff';
      const buttonHover = (styles as any).buttonHoverBackground || '#333333';
      
      customStyle = {
        backgroundColor: buttonBg,
        color: buttonText,
        border: 'none'
      };
      
      return { 
        variant: 'default' as const,
        size, 
        className,
        style: customStyle,
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = buttonHover;
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = buttonBg;
        }
      };
    }
    
    return { variant, size, className };
  };

  const handleButtonClick = () => {
    if (!product) return;
    
    const isBuyNow = ctaBehavior === 'buy_now';
    addToCart(product, 1, isBuyNow);
  };

  if (loading) {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md'}`}>
        <div className="animate-pulse">
          <div className="h-8 w-24 bg-muted rounded mb-2"></div>
          <div className="h-10 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md'}`}>
        <div className="text-center py-4 text-muted-foreground">
          Please select a product from the properties panel.
        </div>
      </div>
    );
  }

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const containerStyles = getContainerStyles();
  const buttonProps = getButtonStyles();
  const priceStyleProps = applyStyles('price');
  const comparePriceStyleProps = applyStyles('comparePrice');
  const discountStyleProps = applyStyles('discount');

  // Layout classes
  const isVertical = elementLayout === 'vertical';
  const mainLayoutClass = isVertical 
    ? `${containerStyles.containerClass} flex-col`
    : `${containerStyles.containerClass} items-center`;

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md'} ${containerStyles.outerContainerClass}`}>
      <div className={mainLayoutClass} style={{ gap: containerStyles.spacing }}>
        {/* Price Section */}
        <div className={`${containerStyles.priceContainerClass} flex-wrap`} style={{ gap: containerStyles.spacing }}>
          <span className="text-2xl font-bold text-primary" style={priceStyleProps.style}>
            {formatCurrency(product.price)}
          </span>
          {showComparePrice && product.compare_price && product.compare_price > product.price && (
            <span className="text-lg text-muted-foreground line-through" style={comparePriceStyleProps.style}>
              {formatCurrency(product.compare_price)}
            </span>
          )}
          {showDiscount && discount > 0 && (
            <Badge variant="destructive" style={discountStyleProps.style}>
              -{discount}%
            </Badge>
          )}
        </div>
        
        {/* Button Section */}
        <Button 
          onClick={handleButtonClick}
          variant={buttonProps.variant}
          size={buttonProps.size}
          className={buttonProps.className}
          style={buttonProps.style}
          onMouseEnter={buttonProps.onMouseEnter}
          onMouseLeave={buttonProps.onMouseLeave}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          {ctaText}
        </Button>
      </div>
    </div>
  );
};

// Register all ecommerce elements
export const registerEcommerceElements = () => {
  elementRegistry.register({
    id: 'products-page',
    name: 'Products Page',
    category: 'ecommerce',
    icon: Grid,
    component: ProductsPageElement,
    defaultContent: {
      title: 'Products',
      subtitle: 'Discover our amazing collection of products',
      showSearch: true,
      showFilters: true,
      showSort: true,
      showViewToggle: true,
      columns: 4,
      tabletColumns: 3,
      mobileColumns: 2,
      defaultSortBy: 'name',
      defaultViewMode: 'grid',
      priceRange: [0, 10000],
      showRecentlyViewed: true
    },
    description: 'Full products listing page'
  });

  elementRegistry.register({
    id: 'product-grid',
    name: 'Product Grid',
    category: 'ecommerce',
    icon: Grid,
    component: ProductGridElement,
    defaultContent: { 
      title: 'Our Products',
      columns: 2,
      tabletColumns: 3,
      mobileColumns: 1,
      limit: 4,
      showRating: true,
      showPrice: true,
      showQuickAdd: true,
      showQuickView: true,
      selectionMode: 'all',
      categoryIds: [],
      specificProductIds: []
    },
    description: 'Display products in a grid layout'
  });

  elementRegistry.register({
    id: 'featured-products',
    name: 'Featured Products',
    category: 'ecommerce',
    icon: Star,
    component: FeaturedProductsElement,
    defaultContent: {
      productId: '',
      layout: 'horizontal',
      badgeText: 'Featured Product',
      ctaText: 'Add to Cart',
      columns: 2,
      tabletColumns: 2,
      mobileColumns: 1
    },
    description: 'Highlight a specific product'
  });

  elementRegistry.register({
    id: 'product-categories',
    name: 'Product Categories',
    category: 'ecommerce',
    icon: Tag,
    component: CategoryNavigationElement,
    defaultContent: { 
      title: 'Shop by Category',
      layout: 'grid',
      selectedCategoryIds: [],
      showProductCount: true,
      enableLinks: true
    },
    description: 'Browse product categories'
  });

  elementRegistry.register({
    id: 'weekly-featured',
    name: 'Weekly Featured',
    category: 'ecommerce',
    icon: Star,
    component: WeeklyFeaturedElement,
    defaultContent: {
      sourceType: 'auto',
      selectedProductIds: [],
      title: 'Weekly Featured Products',
      subtitle: 'Top selling products this week',
      ctaText: 'Add to Cart',
      limit: 6,
      columns: 3,
      tabletColumns: 2,
      mobileColumns: 1,
      showTitle: true,
      showSubtitle: true
    },
    description: 'Display bestsellers from last 7 days or manually selected products'
  });

  elementRegistry.register({
    id: 'price',
    name: 'Price',
    category: 'ecommerce',
    icon: DollarSign,
    component: PriceElement,
    defaultContent: {
      productId: '',
      showComparePrice: true,
      showDiscount: true,
      ctaText: 'Add to Cart',
      ctaBehavior: 'add_to_cart',
      layout: 'horizontal'
    },
    description: 'Display product price with buy button'
  });
};
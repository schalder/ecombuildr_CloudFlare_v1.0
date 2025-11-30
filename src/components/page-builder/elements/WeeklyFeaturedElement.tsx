import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, ShoppingCart } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { useStoreProducts } from '@/hooks/useStoreData';
import { useResolvedWebsiteId } from '@/hooks/useResolvedWebsiteId';
import { useStore } from '@/contexts/StoreContext';
import { useEcomPaths } from '@/lib/pathResolver';
import { useProductReviewStats } from '@/hooks/useProductReviewStats';

// Product interface is now imported from useStoreData hook

const WeeklyFeaturedElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing = false, deviceType = 'desktop', onUpdate }) => {
  const { store } = useStore();
  const { addToCart } = useAddToCart();
  const paths = useEcomPaths();
  const websiteId = useResolvedWebsiteId(element);
  
  // Get content from element
  const content = element.content || {};
  const {
    title = 'Weekly Featured Products',
    subtitle = 'Top selling products this week',
    showTitle = true,
    showSubtitle = true,
    sourceType = 'auto',
    selectedProductIds = [],
    ctaText = 'Add to Cart',
    ctaBehavior = 'add_to_cart',
    limit = 6,
    columns = 3,
    tabletColumns = 2,
    mobileColumns = 1
  } = content;
  
  // Get responsive styles for this element
  const appliedStyles = renderElementStyles(element, deviceType);

  // Only fetch products if we have a resolved websiteId (prevents store-wide fallback)
  const shouldFetchProducts = websiteId !== undefined;
  
  // Use the proper store products hook for data fetching only if websiteId is resolved
  const { 
    products, 
    loading, 
    error 
  } = useStoreProducts({
    websiteId: shouldFetchProducts ? websiteId : undefined,
    specificProductIds: sourceType === 'manual' ? selectedProductIds : undefined,
    limit: limit || 6
  });

  // Fetch review stats for all products
  const productIds = products.map(p => p.id);
  const { reviewStats } = useProductReviewStats(productIds);

  const handleAddToCart = (product: any) => {
    if (!isEditing) {
      if (ctaBehavior === 'buy_now') {
        addToCart(product, 1, true); // Third parameter triggers checkout redirect
      } else {
        addToCart(product);
      }
    }
  };

  // Get responsive grid classes based on device type and content settings
  const getGridClasses = () => {
    if (deviceType === 'mobile') {
      const cols = Math.max(1, Math.min(2, mobileColumns));
      return cols === 1 ? 'grid-cols-1' : 'grid-cols-2';
    }
    if (deviceType === 'tablet') {
      const cols = Math.max(1, Math.min(4, tabletColumns));
      const map: Record<number, string> = { 
        1: 'grid-cols-1', 
        2: 'grid-cols-2', 
        3: 'grid-cols-3', 
        4: 'grid-cols-4' 
      };
      return map[cols] || 'grid-cols-2';
    }
    // Desktop
    const cols = Math.max(1, Math.min(6, columns));
    const map: Record<number, string> = { 
      1: 'grid-cols-1', 
      2: 'grid-cols-2', 
      3: 'grid-cols-3', 
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    };
    return map[cols] || 'grid-cols-3';
  };

  // Get responsive typography styles
  const getTypographyStyles = (styleKey: 'headlineStyles' | 'subheadlineStyles' | 'productTitleStyles' | 'priceStyles') => {
    const styles = (element as any).styles?.[styleKey];
    if (!styles?.responsive) return {};
    
    const deviceStyles = deviceType === 'mobile' ? styles.responsive.mobile : styles.responsive.desktop;
    return deviceStyles || {};
  };

  // Get button styles
  const getButtonStyles = () => {
    const styles = (element as any).styles || {};
    const buttonStyles: React.CSSProperties = {};
    
    // Custom button styles (hover, border radius, etc.)
    if (styles.buttonVariant === 'custom') {
      if (styles.borderRadius) buttonStyles.borderRadius = styles.borderRadius;
    }
    
    return buttonStyles;
  };

  // Generate CSS for button with !important to override variant classes
  const getButtonCSS = () => {
    const styles = (element as any).styles || {};
    if (!styles.buttonBackground && !styles.buttonTextColor) return null;
    
    const buttonId = `weekly-featured-btn-${element.id}`;
    let css = `.${buttonId} {`;
    if (styles.buttonBackground) {
      css += `background-color: ${styles.buttonBackground} !important;`;
    }
    if (styles.buttonTextColor) {
      css += `color: ${styles.buttonTextColor} !important;`;
    }
    css += '}';
    return { css, className: buttonId };
  };

  // Get card styles
  const getCardStyles = () => {
    const styles = (element as any).styles || {};
    const cardStyles: React.CSSProperties = {};
    
    if (styles.cardBackground) cardStyles.backgroundColor = styles.cardBackground;
    if (styles.borderRadius) cardStyles.borderRadius = styles.borderRadius;
    if (styles.borderWidth) {
      cardStyles.borderWidth = styles.borderWidth;
      cardStyles.borderStyle = 'solid';
      if (styles.borderColor) cardStyles.borderColor = styles.borderColor;
    }
    if (styles.cardPadding) cardStyles.padding = styles.cardPadding;
    
    return cardStyles;
  };

  // Get grid gap
  const getGridGap = () => {
    const styles = (element as any).styles || {};
    return styles.gap ? `${parseInt(styles.gap)}px` : '24px';
  };

  // Get button variant
  const getButtonVariant = () => {
    const styles = (element as any).styles || {};
    if (styles.buttonVariant === 'custom') return 'default'; // Will be styled with inline styles
    return styles.buttonVariant || 'default';
  };

  // Get button size
  const getButtonSize = () => {
    const styles = (element as any).styles || {};
    return styles.buttonSize || 'sm';
  };

  // Get button width class
  const getButtonWidthClass = () => {
    const styles = (element as any).styles || {};
    return styles.buttonWidth === 'full' ? 'w-full' : '';
  };

  const renderProductGrid = () => {
    const buttonCSS = getButtonCSS();
    return (
      <>
        {buttonCSS && <style>{buttonCSS.css}</style>}
        <div className={`grid ${getGridClasses()} gap-3 sm:gap-4 md:gap-6`}>
          {products.map((product, index) => (
        <Card key={product.id} className="group/card hover:shadow-lg transition-all duration-300 overflow-hidden" style={getCardStyles()}>
          <div className="relative aspect-square overflow-hidden">
            {product.images && Array.isArray(product.images) && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
            
            {index === 0 && (
              <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-primary text-primary-foreground text-xs">
                <Trophy className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">#1 Bestseller</span>
                <span className="sm:hidden">#1</span>
              </Badge>
            )}
          </div>

          <CardContent className="p-2 sm:p-3 md:p-4" style={getCardStyles()}>
            <Link to={paths.productDetail(product.slug || product.id)}>
              <h3 className="font-medium text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer leading-tight" style={getTypographyStyles('productTitleStyles')}>{product.name}</h3>
            </Link>
            
            {reviewStats[product.id] && reviewStats[product.id].rating_count > 0 && (
              <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                        i < Math.floor(reviewStats[product.id].rating_average) ? 'fill-current' : ''
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-0.5 sm:ml-1">
                  ({reviewStats[product.id].rating_average.toFixed(1)})
                </span>
              </div>
            )}

            <div className="flex flex-col items-start gap-0.5 sm:gap-1 mb-2 sm:mb-3">
              <span className="font-bold text-primary text-sm sm:text-base md:text-lg" style={getTypographyStyles('priceStyles')}>
                {formatCurrency(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs sm:text-sm text-muted-foreground line-through" style={getTypographyStyles('priceStyles')}>
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            <Button 
              size="sm"
              variant={getButtonVariant() as any}
              className={`w-full text-sm font-medium px-4 py-2.5 h-auto transition-colors duration-200 ${buttonCSS?.className || ''}`}
              style={getButtonStyles()}
              onMouseEnter={(e) => {
                const styles = (element as any).styles || {};
                if (styles.buttonVariant === 'custom' && styles.buttonHoverBackground) {
                  e.currentTarget.style.backgroundColor = styles.buttonHoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                const styles = (element as any).styles || {};
                if (styles.buttonBackground) {
                  e.currentTarget.style.backgroundColor = styles.buttonBackground;
                }
              }}
              onClick={() => handleAddToCart(product)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="truncate">
                {ctaBehavior === 'buy_now' ? (ctaText || 'Buy Now') : (ctaText || 'Add to Cart')}
              </span>
            </Button>
          </CardContent>
        </Card>
      ))}
        </div>
      </>
    );
  };

  if (loading || !shouldFetchProducts) {
    return (
      <section style={appliedStyles}>
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
          <div className="h-80 bg-muted rounded-lg"></div>
        </div>
      </section>
    );
  }

  return (
    <section style={appliedStyles}>
      <div className="container mx-auto px-4">
        {(showTitle && title) || (showSubtitle && subtitle) ? (
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            {showTitle && title && (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={getTypographyStyles('headlineStyles')}>{title}</h2>
            )}
            {showSubtitle && subtitle && (
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg" style={getTypographyStyles('subheadlineStyles')}>{subtitle}</p>
            )}
          </div>
        ) : null}

        {renderProductGrid()}

        {products.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">
              {sourceType === 'manual' && selectedProductIds.length === 0 
                ? 'Please select products in the content settings'
                : error 
                  ? 'Error loading products'
                  : 'No featured products found'
              }
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

// Weekly Featured Element Type Definition
const weeklyFeaturedElementType: ElementType = {
  id: 'weekly-featured',
  name: 'Weekly Featured',
  component: WeeklyFeaturedElement,
  icon: Trophy,
  category: 'ecommerce',
  defaultContent: {
    title: 'Weekly Featured Products',
    subtitle: 'Top selling products this week',
    showTitle: true,
    showSubtitle: true,
    sourceType: 'auto',
    selectedProductIds: [],
    ctaText: 'Add to Cart',
    ctaBehavior: 'add_to_cart',
    limit: 6,
    columns: 3,
    tabletColumns: 2,
    mobileColumns: 1
  },
  description: 'Showcase your weekly featured products'
};

// Register element
export const registerWeeklyFeaturedElement = () => {
  elementRegistry.register(weeklyFeaturedElementType);
};
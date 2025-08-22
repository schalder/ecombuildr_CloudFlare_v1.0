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
    
    // Custom button styles
    if (styles.buttonVariant === 'custom') {
      if (styles.buttonBackground) buttonStyles.backgroundColor = styles.buttonBackground;
      if (styles.buttonTextColor) buttonStyles.color = styles.buttonTextColor;
      if (styles.borderRadius) buttonStyles.borderRadius = styles.borderRadius;
    }
    
    return buttonStyles;
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

  const renderProductGrid = () => (
    <div className={`grid ${getGridClasses()}`} style={{ gap: getGridGap() }}>
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
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                <Trophy className="w-3 h-3 mr-1" />
                #1 Bestseller
              </Badge>
            )}
          </div>

          <CardContent style={getCardStyles()}>
            <Link to={paths.productDetail(product.slug)}>
              <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer" style={getTypographyStyles('productTitleStyles')}>{product.name}</h3>
            </Link>
            
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-primary text-primary" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
            </div>

            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2 mb-3">
              <span className="font-bold text-primary text-base md:text-lg" style={getTypographyStyles('priceStyles')}>
                {formatCurrency(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs md:text-sm text-muted-foreground line-through" style={getTypographyStyles('priceStyles')}>
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            <Button 
              size={getButtonSize() as any} 
              variant={getButtonVariant() as any}
              className={getButtonWidthClass()}
              style={getButtonStyles()}
              onClick={() => handleAddToCart(product)}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {ctaBehavior === 'buy_now' ? (ctaText || 'Buy Now') : (ctaText || 'Add to Cart')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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

  console.log('WeeklyFeaturedElement rendering:', {
    loading,
    products: products.length,
    showTitle,
    showSubtitle,
    title,
    subtitle,
    websiteId,
    shouldFetchProducts
  });
  return (
    <section style={appliedStyles}>
      <div className="container mx-auto">
        {(showTitle && title) || (showSubtitle && subtitle) ? (
          <div className="text-center mb-12">
            {showTitle && title && (
              <h2 className="text-3xl font-bold mb-2" style={getTypographyStyles('headlineStyles')}>{title}</h2>
            )}
            {showSubtitle && subtitle && (
              <p className="text-muted-foreground text-lg" style={getTypographyStyles('subheadlineStyles')}>{subtitle}</p>
            )}
          </div>
        ) : null}

        {renderProductGrid()}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
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
  console.log('Registering Weekly Featured Element...');
  elementRegistry.register(weeklyFeaturedElementType);
  console.log('Weekly Featured Element registered successfully with ID:', weeklyFeaturedElementType.id);
  console.log('Total elements in registry:', elementRegistry.getAll().length);
};
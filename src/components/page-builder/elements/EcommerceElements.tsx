import React from 'react';
import { ShoppingCart, Grid, Star, Tag, Package, DollarSign } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStoreProducts, useStoreCategories, useProductById } from '@/hooks/useStoreData';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

// Product Grid Element
const ProductGridElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop' }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  
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
    if (deviceType === 'mobile') return 'grid-cols-1';
    if (deviceType === 'tablet') return 'grid-cols-2';
    return `grid-cols-${Math.min(columns, 4)}`;
  };

  // Fetch products based on configuration
  const { products, loading } = useStoreProducts({
    categoryIds: selectionMode === 'category' ? categoryIds : undefined,
    specificProductIds: selectionMode === 'specific' ? specificProductIds : undefined,
    limit: limit
  });

  const handleAddToCart = (product: any) => {
    addItem({
      id: `cart-${product.id}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: Array.isArray(product.images) ? product.images[0] : product.images,
      sku: product.sku
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <div>
      {element.content.title && (
        <h3 className="text-xl font-semibold mb-4">{element.content.title}</h3>
      )}
      <div className={`grid gap-4 ${getGridClasses()}`}>
        {products.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="aspect-square overflow-hidden rounded-lg mb-3">
                <img
                  src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h4 className="font-medium mb-2 line-clamp-2">{product.name}</h4>
              
              {showRating && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < 4 ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">(4.0)</span>
                </div>
              )}
              
              {showPrice && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">${product.price}</span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.compare_price}
                      </span>
                    )}
                  </div>
                  {showQuickAdd && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
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
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop' }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const productId = element.content.productId;
  const layout = element.content.layout || 'horizontal';
  const badgeText = element.content.badgeText || 'Featured Product';
  const ctaText = element.content.ctaText || 'Add to Cart';
  
  const { product, loading } = useProductById(productId);

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: `cart-${product.id}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: Array.isArray(product.images) ? product.images[0] : product.images,
      sku: product.sku
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
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
    );
  }

  if (!product) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <div className="text-center py-8 text-muted-foreground">
          Please select a product to feature from the properties panel.
        </div>
      </div>
    );
  }

  const layoutClass = layout === 'vertical' 
    ? 'flex flex-col gap-6' 
    : layout === 'hero'
    ? 'grid lg:grid-cols-2 gap-8 items-center min-h-[400px]'
    : 'grid md:grid-cols-2 gap-6 items-center';

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
      <div className={layoutClass}>
        <div className={layout === 'vertical' ? 'order-2' : ''}>
          <Badge className="mb-3">{badgeText}</Badge>
          <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
          <p className="text-muted-foreground mb-4">
            {product.short_description || product.description}
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-primary">${product.price}</span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ${product.compare_price}
                </span>
                <Badge variant="destructive">
                  Save ${(product.compare_price - product.price).toFixed(2)}
                </Badge>
              </>
            )}
          </div>

          <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            {ctaText}
          </Button>
        </div>
        
        <div className={`relative ${layout === 'vertical' ? 'order-1' : ''}`}>
          <img
            src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-64 md:h-80 object-cover rounded-lg"
          />
          <Badge className="absolute top-4 right-4" variant="secondary">
            ⭐ 4.8
          </Badge>
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
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop' }) => {
  const { categories, loading } = useStoreCategories();
  
  const layout = element.content.layout || 'grid';
  const selectedCategoryIds = element.content.selectedCategoryIds || [];
  const showProductCount = element.content.showProductCount !== false;
  const enableLinks = element.content.enableLinks !== false;
  
  // Get device-responsive grid classes
  const getCircleGridClasses = () => {
    if (deviceType === 'mobile') return 'grid-cols-2';
    if (deviceType === 'tablet') return 'grid-cols-4';
    return 'grid-cols-6';
  };
  
  const getCardGridClasses = () => {
    if (deviceType === 'mobile') return 'grid-cols-1';
    if (deviceType === 'tablet') return 'grid-cols-2';
    return 'grid-cols-3';
  };
  
  // Filter categories based on selection
  const displayCategories = selectedCategoryIds.length > 0 
    ? categories.filter(cat => selectedCategoryIds.includes(cat.id))
    : categories;

  const handleCategoryClick = (category: any) => {
    if (enableLinks) {
      // In a real implementation, this would navigate to the category page
      window.location.href = `/products?category=${category.slug}`;
    }
  };

  if (loading) {
    return (
      <div className={`grid gap-4 ${getCircleGridClasses()}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full mb-2"></div>
            <div className="h-4 bg-muted rounded mx-auto w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'circles') {
    return (
      <div>
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
                <p className="text-xs text-muted-foreground">0 items</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
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
                    <p className="text-sm text-muted-foreground">0 products</p>
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
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, deviceType = 'desktop' }) => {
  const mockWeeklyProducts = [
    {
      id: '1',
      name: 'Gaming Keyboard',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=200&fit=crop',
      discount: 20
    },
    {
      id: '2',
      name: 'Wireless Mouse',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=200&fit=crop',
      discount: 15
    },
    {
      id: '3',
      name: 'Monitor Stand',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=200&fit=crop',
      discount: 25
    }
  ];

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Weekly Featured Products</h2>
        <p className="text-muted-foreground">Special deals this week only!</p>
      </div>
      
      <div className={`grid gap-4 ${deviceType === 'mobile' ? 'grid-cols-1' : deviceType === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {mockWeeklyProducts.map((product) => (
          <div key={product.id} className="text-center group">
            <div className="relative overflow-hidden rounded-lg mb-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
              />
              <Badge className="absolute top-2 right-2" variant="destructive">
                -{product.discount}%
              </Badge>
            </div>
            <h4 className="font-medium mb-2">{product.name}</h4>
            <div className="mb-3">
              <span className="text-lg font-bold text-primary">${product.price}</span>
              <span className="text-sm text-muted-foreground line-through ml-2">
                ${(product.price / (1 - product.discount / 100)).toFixed(2)}
              </span>
            </div>
            <Button size="sm" className="w-full">Quick Add</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Price Element
const PriceElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const productId = element.content.productId;
  const showComparePrice = element.content.showComparePrice !== false;
  const showDiscount = element.content.showDiscount !== false;
  const ctaText = element.content.ctaText || 'Buy Now';
  const layout = element.content.layout || 'horizontal';
  
  const { product, loading } = useProductById(productId);

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: `cart-${product.id}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: Array.isArray(product.images) ? product.images[0] : product.images,
      sku: product.sku
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-24 bg-muted rounded mb-2"></div>
        <div className="h-10 w-32 bg-muted rounded"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Please select a product from the properties panel.
      </div>
    );
  }

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const layoutClass = layout === 'vertical' 
    ? 'flex flex-col gap-2' 
    : 'flex items-center gap-4';

  return (
    <div className={layoutClass}>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-primary">${product.price}</span>
        {showComparePrice && product.compare_price && product.compare_price > product.price && (
          <span className="text-lg text-muted-foreground line-through">
            ${product.compare_price}
          </span>
        )}
        {showDiscount && discount > 0 && (
          <Badge variant="destructive">
            -{discount}%
          </Badge>
        )}
      </div>
      <Button onClick={handleAddToCart}>
        <DollarSign className="h-4 w-4 mr-2" />
        {ctaText}
      </Button>
    </div>
  );
};

// Register all ecommerce elements
export const registerEcommerceElements = () => {
  elementRegistry.register({
    id: 'product-grid',
    name: 'Product Grid',
    category: 'ecommerce',
    icon: Grid,
    component: ProductGridElement,
    defaultContent: { 
      title: 'Our Products',
      columns: 2,
      limit: 4,
      showRating: true,
      showPrice: true,
      showQuickAdd: true,
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
      ctaText: 'Add to Cart'
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
    icon: Package,
    component: WeeklyFeaturedElement,
    defaultContent: {},
    description: 'Weekly featured products section'
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
      ctaText: 'Buy Now',
      layout: 'horizontal'
    },
    description: 'Display product price with buy button'
  });
};
import React from 'react';
import { ShoppingCart, Grid, Star, Tag, Package } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Product Grid Element
const ProductGridElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element }) => {
  // Mock products for now - in real implementation this would fetch from store
  const mockProducts = [
    {
      id: '1',
      name: 'Premium Headphones',
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      rating: 4.5
    },
    {
      id: '2', 
      name: 'Wireless Speaker',
      price: 199.99,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop',
      rating: 4.8
    },
    {
      id: '3',
      name: 'Smart Watch',
      price: 399.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
      rating: 4.3
    },
    {
      id: '4',
      name: 'Laptop Stand',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop',
      rating: 4.6
    }
  ];

  const columns = element.content.columns || 2;
  const showRating = element.content.showRating !== false;
  const showPrice = element.content.showPrice !== false;

  return (
    <div>
      {element.content.title && (
        <h3 className="text-xl font-semibold mb-4">{element.content.title}</h3>
      )}
      <div className={`grid gap-4 grid-cols-${Math.min(columns, 4)}`}>
        {mockProducts.slice(0, element.content.limit || 4).map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="aspect-square overflow-hidden rounded-lg mb-3">
                <img
                  src={product.image}
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
                        className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({product.rating})</span>
                </div>
              )}
              
              {showPrice && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">${product.price}</span>
                  <Button size="sm">Add to Cart</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Featured Products Element
const FeaturedProductsElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element }) => {
  const mockFeaturedProduct = {
    id: 'featured-1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
    rating: 4.8,
    features: ['Noise Cancellation', '30hr Battery', 'Wireless Charging', 'Premium Sound'],
    description: 'Experience premium audio quality with these professional-grade wireless headphones.'
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <Badge className="mb-3">Featured Product</Badge>
          <h2 className="text-2xl font-bold mb-2">{mockFeaturedProduct.name}</h2>
          <p className="text-muted-foreground mb-4">{mockFeaturedProduct.description}</p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-primary">${mockFeaturedProduct.price}</span>
            <span className="text-lg text-muted-foreground line-through">${mockFeaturedProduct.originalPrice}</span>
            <Badge variant="destructive">Save ${mockFeaturedProduct.originalPrice - mockFeaturedProduct.price}</Badge>
          </div>

          <ul className="mb-4 space-y-1">
            {mockFeaturedProduct.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>

          <Button size="lg" className="w-full md:w-auto">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
        
        <div className="relative">
          <img
            src={mockFeaturedProduct.image}
            alt={mockFeaturedProduct.name}
            className="w-full h-64 md:h-80 object-cover rounded-lg"
          />
          <Badge className="absolute top-4 right-4" variant="secondary">
            ⭐ {mockFeaturedProduct.rating}
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
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element }) => {
  const mockCategories = [
    { id: '1', name: 'Electronics', icon: '📱', count: 24 },
    { id: '2', name: 'Fashion', icon: '👕', count: 18 },
    { id: '3', name: 'Home & Garden', icon: '🏠', count: 32 },
    { id: '4', name: 'Sports', icon: '⚽', count: 15 },
    { id: '5', name: 'Books', icon: '📚', count: 42 },
    { id: '6', name: 'Beauty', icon: '💄', count: 28 }
  ];

  const layout = element.content.layout || 'grid';

  if (layout === 'circles') {
    return (
      <div>
        {element.content.title && (
          <h3 className="text-xl font-semibold mb-6 text-center">{element.content.title}</h3>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockCategories.map((category) => (
            <div key={category.id} className="text-center group cursor-pointer">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors">
                {category.icon}
              </div>
              <h4 className="font-medium mt-2 text-sm">{category.name}</h4>
              <p className="text-xs text-muted-foreground">{category.count} items</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCategories.map((category) => (
          <Card key={category.id} className="group hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{category.icon}</div>
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.count} products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Weekly Featured Element
const WeeklyFeaturedElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element }) => {
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
      
      <div className="grid md:grid-cols-3 gap-4">
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
      showPrice: true
    },
    description: 'Display products in a grid layout'
  });

  elementRegistry.register({
    id: 'featured-products',
    name: 'Featured Products',
    category: 'ecommerce',
    icon: Star,
    component: FeaturedProductsElement,
    defaultContent: {},
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
      layout: 'grid'
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
};
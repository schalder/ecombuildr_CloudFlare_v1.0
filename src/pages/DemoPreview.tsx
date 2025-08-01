import React, { useEffect, useState } from 'react';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { StoreProvider } from '@/contexts/StoreContext';
import { CartProvider } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Heart, Eye } from 'lucide-react';

// Demo store data
const demoStore = {
  id: 'demo-store-id',
  name: 'Demo Fashion Store',
  slug: 'demo',
  description: 'Discover the latest fashion trends',
  logo_url: '',
  favicon_url: '',
  primary_color: '#10B981',
  secondary_color: '#059669',
  domain: '',
  settings: {},
  is_active: true
};

const demoProducts = [
  {
    id: '1',
    name: 'Premium Cotton T-Shirt',
    price: 1200,
    compare_price: 1500,
    short_description: 'Comfortable and stylish cotton t-shirt',
    images: ['/placeholder.svg'],
    slug: 'premium-cotton-tshirt',
    is_active: true,
    inventory_quantity: 50,
    track_inventory: true
  },
  {
    id: '2',
    name: 'Denim Jacket',
    price: 3500,
    compare_price: 4000,
    short_description: 'Classic denim jacket for all seasons',
    images: ['/placeholder.svg'],
    slug: 'denim-jacket',
    is_active: true,
    inventory_quantity: 25,
    track_inventory: true
  },
  {
    id: '3',
    name: 'Casual Sneakers',
    price: 2800,
    compare_price: 3200,
    short_description: 'Comfortable sneakers for everyday wear',
    images: ['/placeholder.svg'],
    slug: 'casual-sneakers',
    is_active: true,
    inventory_quantity: 30,
    track_inventory: true
  },
  {
    id: '4',
    name: 'Leather Wallet',
    price: 1800,
    compare_price: 2200,
    short_description: 'Premium leather wallet with multiple compartments',
    images: ['/placeholder.svg'],
    slug: 'leather-wallet',
    is_active: true,
    inventory_quantity: 15,
    track_inventory: true
  }
];

// Mock StoreProvider for demo
const MockStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setStore(demoStore);
      setLoading(false);
    }, 1000);
  }, []);

  const contextValue = {
    store,
    loading,
    error: null,
    loadStore: async () => {}
  };

  return React.createElement(StoreContext.Provider, { value: contextValue }, children);
};

const StoreContext = React.createContext<any>(undefined);

const DemoStorefront = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-primary text-primary-foreground text-center py-3 px-4">
        <p className="text-sm font-medium">
          🎉 This is a demo store - Experience the power of our e-commerce platform!
        </p>
      </div>

      {/* Custom styles for demo store */}
      <style>{`
        :root {
          --store-primary: ${demoStore.primary_color};
          --store-secondary: ${demoStore.secondary_color};
        }
      `}</style>

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">{demoStore.name}</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Products</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">About</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Contact</a>
          </nav>
          <Button variant="outline" size="sm">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart (0)
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to {demoStore.name}
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {demoStore.description}
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Shop Now
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Featured Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoProducts.map((product) => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    {product.compare_price > product.price && (
                      <Badge className="absolute top-2 left-2">
                        Save ৳{product.compare_price - product.price}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.short_description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-primary">৳{product.price}</span>
                        {product.compare_price > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ৳{product.compare_price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.5</span>
                      </div>
                    </div>
                    <Button className="w-full mt-3" size="sm">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Fast Delivery</h4>
              <p className="text-muted-foreground">Get your orders delivered quickly and safely to your doorstep.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Quality Products</h4>
              <p className="text-muted-foreground">We offer only the highest quality products from trusted brands.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Customer Support</h4>
              <p className="text-muted-foreground">Our friendly team is here to help you with any questions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-lg font-semibold mb-4">{demoStore.name}</h5>
              <p className="text-muted-foreground mb-4">{demoStore.description}</p>
            </div>
            <div>
              <h6 className="font-semibold mb-4">Quick Links</h6>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">Categories</h6>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Clothing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Accessories</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Footwear</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">Contact Info</h6>
              <ul className="space-y-2 text-muted-foreground">
                <li>Email: info@demostore.com</li>
                <li>Phone: +880 123 456 789</li>
                <li>Address: Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 {demoStore.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const DemoPreview = () => {
  return (
    <MockStoreProvider>
      <CartProvider>
        <DemoStorefront />
      </CartProvider>
    </MockStoreProvider>
  );
};

export default DemoPreview;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { CartDrawer } from './CartDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, Menu, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEcomPaths } from '@/lib/pathResolver';

export const StorefrontHeader: React.FC = () => {
  const { store } = useStore();
  const { itemCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const paths = useEcomPaths();

  if (!store) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${paths.products}?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Store Name */}
          <Link to={paths.home} className="flex items-center space-x-3">
            {store.logo_url && (
              <img 
                src={store.logo_url} 
                alt={store.name}
                className="h-8 w-8 object-contain"
              />
            )}
            <span className="text-xl font-bold text-foreground">{store.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to={paths.home}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              to={paths.products}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Products
            </Link>
            <Link 
              to={`${paths.base}/about`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              to={`${paths.base}/contact`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Search and Cart */}
          <div className="flex items-center space-x-2">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hidden md:flex"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Cart */}
            <CartDrawer>
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </CartDrawer>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col space-y-4 mt-6">
                  <Link 
                    to={paths.home}
                    className="text-lg font-medium text-foreground"
                  >
                    Home
                  </Link>
                  <Link 
                    to={paths.products}
                    className="text-lg font-medium text-foreground"
                  >
                    Products
                  </Link>
                  <Link 
                    to={`${paths.base}/about`}
                    className="text-lg font-medium text-foreground"
                  >
                    About
                  </Link>
                  <Link 
                    to={`${paths.base}/contact`}
                    className="text-lg font-medium text-foreground"
                  >
                    Contact
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t">
            <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductQuickView } from '@/components/storefront/ProductQuickView';
import { ProductFilters } from '@/components/storefront/ProductFilters';
import { ProductGridSkeleton } from '@/components/storefront/ProductGridSkeleton';
import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { ProductComparison } from '@/components/storefront/ProductComparison';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  ArrowUpDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  description?: string;
  images: string[];
  slug: string;
  is_active: boolean;
  variations?: any;
  track_inventory?: boolean;
  inventory_quantity?: number | null;
  free_shipping_min_amount?: number | null;
  easy_returns_enabled?: boolean;
  easy_returns_days?: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  onSale: boolean;
  freeShipping: boolean;
}

export const StorefrontProducts: React.FC = () => {
  const { slug, websiteId } = useParams<{ slug?: string; websiteId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store, loading: storeLoading, loadStore, loadStoreById } = useStore();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 10000],
    rating: 0,
    inStock: false,
    onSale: false,
    freeShipping: false
  });

  // Initialize category filter from URL param (e.g., ?category=slug)
  useEffect(() => {
    const paramCategory = searchParams.get('category');
    if (paramCategory) {
      setFilters((prev) => {
        if (
          (prev.categories.length === 1 && prev.categories[0] === paramCategory) ||
          prev.categories.includes(paramCategory)
        ) {
          return prev;
        }
        return { ...prev, categories: [paramCategory] };
      });
    }
  }, [searchParams]);

  // Keep URL in sync with selected category (first selected)
  useEffect(() => {
    const current = searchParams.get('category');
    const selected = filters.categories[0] || null;
    if (selected !== current) {
      const newParams = new URLSearchParams(searchParams);
      if (selected) newParams.set('category', selected);
      else newParams.delete('category');
      setSearchParams(newParams);
    }
  }, [filters.categories, setSearchParams, searchParams]);

  // Fetch categories
  const fetchCategories = async () => {
    if (!store?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('store_id', store.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products with filters
  const fetchProducts = async () => {
    if (!store?.id) {
      console.log('No store ID available for product fetch');
      return;
    }
    
    console.log('Fetching products for store:', store.id);
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        const categoryIds = categories
          .filter(cat => filters.categories.includes(cat.slug))
          .map(cat => cat.id);
        
        if (categoryIds.length > 0) {
          query = query.in('category_id', categoryIds);
        }
      }

      // Apply price range filter
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }

      // Apply on sale filter
      if (filters.onSale) {
        query = query.not('compare_price', 'is', null);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name':
        default:
          query = query.order('name', { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) {
        console.error('Products query error:', error);
        throw error;
      }
      
      console.log('Raw products data:', data);
      
      // Transform data to match Product interface
      const transformedProducts: Product[] = (data || []).map(product => ({
        id: product.id,
        name: product.name || '',
        price: product.price || 0,
        compare_price: product.compare_price || undefined,
        short_description: product.short_description || undefined,
        description: product.description || undefined,
        images: Array.isArray(product.images) ? product.images.filter((img): img is string => typeof img === 'string') : [],
        slug: product.slug || '',
        is_active: product.is_active || false,
        variations: (product as any).variations ?? undefined,
        track_inventory: product.track_inventory ?? undefined,
        inventory_quantity: product.inventory_quantity ?? undefined,
        free_shipping_min_amount: product.free_shipping_min_amount ?? undefined,
        easy_returns_enabled: product.easy_returns_enabled ?? undefined,
        easy_returns_days: product.easy_returns_days ?? undefined,
      }));
      
      console.log('Transformed products:', transformedProducts);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (searchQuery) {
        newParams.set('q', searchQuery);
      } else {
        newParams.delete('q');
      }
      return newParams;
    });
  };

  // Load store and fetch data
  useEffect(() => {
    const init = async () => {
      if (slug) {
        console.log('Loading store for products page:', slug);
        loadStore(slug);
      } else if (websiteId) {
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('id', websiteId)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      }
    };
    init();
  }, [slug, websiteId, loadStore, loadStoreById]);

  useEffect(() => {
    if (store?.id) {
      console.log('Store loaded, fetching data for store:', store.id);
      fetchCategories();
      fetchProducts();
    }
  }, [store?.id, searchQuery, sortBy, filters]);

  // Refetch products once categories load to apply slug->id mapping
  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [categories]);

  const handleAddToCart = (product: Product, quantity?: number, variation?: any) => {
    addItem({
      id: `${product.id}${variation ? `-${JSON.stringify(variation)}` : ''}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity || 1,
      image: product.images[0],
      variation
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 10000],
      rating: 0,
      inStock: false,
      onSale: false,
      freeShipping: false
    });
    setSearchQuery('');
    setSearchParams({});
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">The requested store could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <StorefrontLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">
            Discover our amazing collection of products
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between animate-slide-up">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Mobile Filter Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {(filters.categories.length > 0 || filters.onSale || filters.inStock) && (
                    <Badge variant="secondary" className="ml-2">
                      {[
                        filters.categories.length > 0,
                        filters.onSale,
                        filters.inStock,
                        filters.rating > 0
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ProductFilters
                    categories={categories}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Results Info */}
                <div className="flex items-center justify-between pb-4 border-b animate-fade-in">
                  <p className="text-sm text-muted-foreground">
                    Showing {products.length} products
                  </p>
                </div>

                {/* Products Grid/List */}
                <div className={cn(
                  "transition-all duration-300",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                )}>
                  {products.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="animate-fade-in" 
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ProductCard
                        product={product}
                        storeSlug={store.slug}
                        onAddToCart={handleAddToCart}
                        onQuickView={handleQuickView}
                        className={viewMode === 'list' ? "flex flex-row" : ""}
                      />
                    </div>
                  ))}
                </div>

                {/* Recently Viewed Products */}
                <RecentlyViewed
                  storeSlug={store.slug}
                  onAddToCart={handleAddToCart}
                  onQuickView={handleQuickView}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          storeSlug={store.slug}
        />
      )}

      {/* Product Comparison */}
      <ProductComparison
        storeSlug={store.slug}
        onAddToCart={handleAddToCart}
      />
    </StorefrontLayout>
  );
};
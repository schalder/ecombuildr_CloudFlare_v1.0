import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/storefront/ProductCard';

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
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { useToast } from '@/hooks/use-toast';
import { useProductReviewStats } from '@/hooks/useProductReviewStats';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';

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
  collections: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  onSale: boolean;
  freeShipping: boolean;
}

export const StorefrontProducts: React.FC = () => {
  const { slug, websiteId, websiteSlug } = useParams<{ slug?: string; websiteId?: string; websiteSlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store, loading: storeLoading, loadStore, loadStoreById } = useStore();
  
  // Website context for custom domains
  const [detectedWebsiteId, setDetectedWebsiteId] = useState<string | null>(null);
  const { addToCart, openQuickView } = useAddToCart();
  const { toast } = useToast();


  const { pixels } = usePixelContext();
  const { trackSearch } = usePixelTracking(pixels, store?.id, websiteId || detectedWebsiteId);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get review stats for all products
  const productIds = products.map(p => p.id);
  const { reviewStats } = useProductReviewStats(productIds);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isWebsiteContext = Boolean(websiteId || websiteSlug || detectedWebsiteId);
  
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    collections: [],
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

  // Detect website context on custom domains
  useEffect(() => {
    const detectWebsiteContext = async () => {
      const currentHost = window.location.hostname;
      
      // Skip detection for staging domains
      if (currentHost === 'ecombuildr.com' || 
          currentHost === 'localhost' || 
          
          currentHost === 'ecombuildr.com') {
        return;
      }
      
      try {
        // Check if this is a custom domain
        const { data: domain } = await supabase
          .from('custom_domains')
          .select(`
            id,
            store_id,
            domain_connections!inner (
              content_type,
              content_id
            )
          `)
          .eq('domain', currentHost)
          .eq('is_verified', true)
          .eq('dns_configured', true)
          .eq('domain_connections.content_type', 'website')
          .maybeSingle();
          
        if (domain && domain.domain_connections && domain.domain_connections.length > 0) {
          const websiteId = domain.domain_connections[0].content_id;
          setDetectedWebsiteId(websiteId);
          
          // Load the store for this website
          const { data: website } = await supabase
            .from('websites')
            .select('store_id')
            .eq('id', websiteId)
            .single();
            
          if (website?.store_id) {
            await loadStoreById(website.store_id);
          }
        }
      } catch (error) {
        console.error('Error detecting website context:', error);
      }
    };
    
    detectWebsiteContext();
  }, []);

  // Fetch categories with website filtering
  const fetchCategories = async () => {
    if (!store?.id) return;
    
    try {
      // Get the effective website ID (from params, slug, or custom domain detection)
      const effectiveWebsiteId = websiteId || detectedWebsiteId;
      let resolvedWebsiteId = effectiveWebsiteId;
      
      // If we have a websiteSlug, resolve it to ID
      if (websiteSlug && !resolvedWebsiteId) {
        const { data: websiteData } = await supabase
          .from('websites')
          .select('id')
          .eq('slug', websiteSlug)
          .single();
        resolvedWebsiteId = websiteData?.id;
      }
      
      // If website context is present, filter categories by website visibility
      if (resolvedWebsiteId) {
        // Get visible category IDs for this website
        const { data: visibilityData } = await supabase
          .from('category_website_visibility')
          .select('category_id')
          .eq('website_id', resolvedWebsiteId);

        const visibleCategoryIds = visibilityData?.map(v => v.category_id) || [];
        
        if (visibleCategoryIds.length === 0) {
          setCategories([]);
          return;
        }

        // Fetch categories that are visible on this website
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('store_id', store.id)
          .in('id', visibleCategoryIds)
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } else {
        // No website filtering - show all store categories
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('store_id', store.id)
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch collections for filtering
  const fetchCollections = async () => {
    if (!store?.id) return;
    
    try {
      // Get the effective website ID (from params, slug, or custom domain detection)
      const effectiveWebsiteId = websiteId || detectedWebsiteId;
      let resolvedWebsiteId = effectiveWebsiteId;
      
      // If we have a websiteSlug, resolve it to ID
      if (websiteSlug && !resolvedWebsiteId) {
        const { data: websiteData } = await supabase
          .from('websites')
          .select('id')
          .eq('slug', websiteSlug)
          .single();
        resolvedWebsiteId = websiteData?.id;
      }
      
      // Get collections that are active, published, and set to show on products page
      let query = supabase
        .from('collections')
        .select('id, name, slug, website_id')
        .eq('is_active', true)
        .eq('is_published', true)
        .eq('show_on_products_page', true);
      
      // Filter by website if we have a specific website context
      if (resolvedWebsiteId) {
        query = query.eq('website_id', resolvedWebsiteId);
      } else {
        // If no website context, don't show any collections (safer)
        setCollections([]);
        return;
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  // Fetch products with filters and website visibility
  const fetchProducts = async () => {
    if (!store?.id) {
      console.log('No store ID available for product fetch');
      return;
    }
    
    // Get the effective website ID (from params, slug, or custom domain detection)
    const effectiveWebsiteId = websiteId || detectedWebsiteId;
    let resolvedWebsiteId = effectiveWebsiteId;
    
    // If we have a websiteSlug, resolve it to ID
    if (websiteSlug && !resolvedWebsiteId) {
      const { data: websiteData } = await supabase
        .from('websites')
        .select('id')
        .eq('slug', websiteSlug)
        .single();
      resolvedWebsiteId = websiteData?.id;
    }
    
    console.log('Fetching products for store:', store.id, 'resolvedWebsiteId:', resolvedWebsiteId);
    setLoading(true);
    try {
      let productIds: string[] | undefined = undefined;

      // If website context is present, get visible product IDs for this website
      if (resolvedWebsiteId) {
        const { data: visibilityData } = await supabase
          .from('product_website_visibility')
          .select('product_id')
          .eq('website_id', resolvedWebsiteId);

        productIds = visibilityData?.map(v => v.product_id) || [];
        
        if (productIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .eq('show_on_website', true);

      // Apply website visibility filter if we have specific product IDs
      if (productIds) {
        query = query.in('id', productIds);
      }

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

      // Apply collection filter
      if (filters.collections.length > 0) {
        const collectionIds = collections
          .filter(col => filters.collections.includes(col.slug))
          .map(col => col.id);
        
        if (collectionIds.length > 0) {
          // Get product IDs from selected collections
          const { data: collectionProducts } = await supabase
            .from('product_collection_items')
            .select('product_id')
            .in('collection_id', collectionIds);
          
          const productIdsInCollections = [...new Set(collectionProducts?.map(cp => cp.product_id) || [])];
          
          if (productIdsInCollections.length > 0) {
            query = query.in('id', productIdsInCollections);
          } else {
            // No products in selected collections
            setProducts([]);
            setLoading(false);
            return;
          }
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

      // Apply in stock filter
      if (filters.inStock) {
        query = query.or('track_inventory.is.null,track_inventory.eq.false,and(track_inventory.eq.true,inventory_quantity.gt.0)');
      }

      // Apply free shipping filter
      if (filters.freeShipping) {
        query = query.eq('free_shipping_min_amount', 0);
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
        // Track search event
        trackSearch({
          search_string: searchQuery,
          content_category: 'product',
        });
      } else {
        newParams.delete('q');
      }
      return newParams;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      collections: [],
      priceRange: [0, 10000],
      rating: 0,
      inStock: false,
      onSale: false,
      freeShipping: false
    });
    setSearchQuery('');
    setSearchParams({});
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
      } else if (websiteSlug) {
        // Load store via website slug
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('slug', websiteSlug)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      }
      // Note: Custom domain detection is handled in the separate useEffect above
    };
    init();
  }, [slug, websiteId, websiteSlug, loadStore, loadStoreById]);

  // ✅ PERFORMANCE: Parallelize category and collection fetching
  useEffect(() => {
    if (!store?.id) return;
    
    // Fetch categories and collections in parallel
    Promise.allSettled([
      Promise.resolve(fetchCategories()),
      Promise.resolve(fetchCollections())
    ]).catch(err => {
      console.error('Error fetching categories/collections:', err);
    });
  }, [store?.id, websiteId, websiteSlug, detectedWebsiteId]);

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [store?.id, searchQuery, filters, sortBy, categories, collections, websiteId, websiteSlug, detectedWebsiteId]);

  if (storeLoading || !store) {
    const loadingContent = (
      <div className="container mx-auto px-4 py-8">
        {storeLoading ? (
          <div className="space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Store not found</h1>
          </div>
        )}
      </div>
    );

    if (isWebsiteContext) {
      return loadingContent;
    }

    return loadingContent;
  }

  const content = (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
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
                  <ProductFilters
                    categories={categories}
                    collections={collections}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                    className="mt-6"
                  />
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
                collections={collections}
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
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                      : "space-y-4"
                  )}>
                    {products.map((product, index) => {
                      const stats = reviewStats[product.id];
                      return (
                        <div 
                          key={product.id} 
                          className="animate-fade-in" 
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <ProductCard
                            product={product}
                            storeSlug={store.slug}
                            onAddToCart={addToCart}
                            onQuickView={openQuickView}
                            className={viewMode === 'list' ? "flex flex-row" : ""}
                            ratingAverage={stats?.rating_average || 0}
                            ratingCount={stats?.rating_count || 0}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Recently Viewed Products */}
                  <RecentlyViewed
                    storeSlug={store.slug}
                    onAddToCart={addToCart}
                    onQuickView={openQuickView}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Comparison */}
        <ProductComparison
          storeSlug={store.slug}
          onAddToCart={addToCart}
        />
      </div>
    </div>
  );

  if (isWebsiteContext) {
    return content;
  }

  return content;
};

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageBuilderElement } from '../types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductFilters } from '@/components/storefront/ProductFilters';
import { ProductGridSkeleton } from '@/components/storefront/ProductGridSkeleton';
import { ProductCard } from '@/components/storefront/ProductCard';

import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { WishlistButton } from '@/components/storefront/WishlistButton';
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { ArrowUpDown, Grid3X3, List, Search, SlidersHorizontal, Eye, GitCompare, Star } from 'lucide-react';
import { useEcomPaths } from '@/lib/pathResolver';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  description?: string;
  images: any;
  slug: string;
  is_active: boolean;
  variations?: any;
  track_inventory?: boolean;
  inventory_quantity?: number;
  created_at?: string;
  updated_at?: string;
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

export const ProductsPageElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing = false, deviceType = 'desktop', columnCount = 1 }) => {
  const { store } = useStore();
  const { addToCart, openQuickView } = useAddToCart();
  const { websiteId: builderWebsiteId } = useParams<{ websiteId?: string }>();

  const paths = useEcomPaths();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(element.content.defaultSortBy || 'name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(element.content.defaultViewMode || 'grid');
  
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: element.content.priceRange || [0, 10000],
    rating: 0,
    inStock: false,
    onSale: false,
    freeShipping: false,
  });

  const showSearch = element.content.showSearch !== false;
  const showFilters = element.content.showFilters !== false;
  const showSort = element.content.showSort !== false;
  const showViewToggle = element.content.showViewToggle !== false;
  const showRecentlyViewed = element.content.showRecentlyViewed !== false;

  const elementStyles = renderElementStyles(element, deviceType);
  const buttonStyles = useMemo(() => {
    const bs = (element as any).styles?.buttonStyles || {};
    if ((bs as any).responsive) return mergeResponsiveStyles({}, bs, deviceType as any) as React.CSSProperties;
    return bs as React.CSSProperties;
  }, [deviceType, (element as any).styles?.buttonStyles]);

  const elementId = element.id || 'products-page-element';
  const dynamicCSS = useMemo(() => {
    if (!buttonStyles || Object.keys(buttonStyles).length === 0) return '';
    
    const buttonStylesWithHover = buttonStyles as any; // Type assertion for custom hover properties
    const { hoverColor, hoverBackgroundColor, ...regularStyles } = buttonStylesWithHover;
    
    let css = '';
    if (Object.keys(regularStyles).length > 0) {
      const styleProps = Object.entries(regularStyles)
        .filter(([key, value]) => value !== undefined && key !== 'hoverColor' && key !== 'hoverBackgroundColor')
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');
      if (styleProps) {
        css += `.products-element-${elementId} .product-card-button { ${styleProps} !important; }`;
      }
    }
    
    if (hoverColor || hoverBackgroundColor) {
      const hoverProps = [];
      if (hoverColor) hoverProps.push(`color: ${hoverColor}`);
      if (hoverBackgroundColor) hoverProps.push(`background-color: ${hoverBackgroundColor}`);
      if (hoverProps.length > 0) {
        css += `.products-element-${elementId} .product-card-button:hover { ${hoverProps.join('; ')} !important; }`;
      }
    }
    
    return css;
  }, [buttonStyles, elementId]);

  const getGridClasses = () => {
    // Always emit responsive classes so CSS handles breakpoints on live pages
    const desktopColsRaw = Number(element.content.columns ?? 4);
    const desktop = Math.max(1, Math.min(4, isNaN(desktopColsRaw) ? 4 : desktopColsRaw));

    const tabletConfigured = (element.content as any).tabletColumns as number | undefined;
    let tablet = typeof tabletConfigured === 'number'
      ? Math.max(1, Math.min(4, tabletConfigured))
      : (desktop >= 4 ? 3 : 2);
    // Preserve builder behavior: when a single column is forced in tablet layout
    if (columnCount === 1) tablet = 1;

    const mobileConfigured = (element.content as any).mobileColumns as number | undefined;
    const mobile = typeof mobileConfigured === 'number' ? Math.max(1, Math.min(3, mobileConfigured)) : 2;

    // Use explicit mappings so Tailwind includes these classes in production
    const map = (n: number) => {
      switch (n) {
        case 1: return 'grid-cols-1';
        case 2: return 'grid-cols-2';
        case 3: return 'grid-cols-3';
        case 4: return 'grid-cols-4';
        default: return 'grid-cols-2';
      }
    };

    return `${map(mobile)} md:${map(tablet)} lg:${map(desktop)}`;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      if (!store?.id) return;
      
      // Check for website selection from element content or URL
      let websiteId = element.content.websiteId;
      
      // If auto-detect is enabled or no website selected, try to get from URL
      if (!websiteId || websiteId === 'auto') {
        // First priority: builder websiteId from URL params
        if (builderWebsiteId) {
          websiteId = builderWebsiteId;
        } else
        if (window.location.pathname.includes('/website/')) {
          websiteId = window.location.pathname.split('/website/')[1]?.split('/')[0];
        } else if (window.location.pathname.includes('/site/')) {
          // For site URLs like /site/natural-energy, we need to find the website ID
          const siteSlug = window.location.pathname.split('/site/')[1]?.split('/')[0];
          if (siteSlug) {
            const { data: websiteData } = await supabase
              .from('websites')
              .select('id')
              .eq('slug', siteSlug)
              .single();
            websiteId = websiteData?.id;
          }
        } else {
          // Check for custom domain context
          const currentHost = window.location.hostname;
          
          // Skip staging domains
          if (!(currentHost === 'ecombuildr.com' || 
                currentHost === 'localhost' || 
                currentHost.includes('lovable.app') ||
                currentHost.includes('lovableproject.com'))) {
            
            try {
              // Check if this is a custom domain
              const { data: domain } = await supabase
                .from('custom_domains')
                .select(`
                  id,
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
                websiteId = domain.domain_connections[0].content_id;
              }
            } catch (error) {
              console.error('Error detecting custom domain context:', error);
            }
          }
        }
      }

      let query = supabase
        .from('categories')
        .select('id, name, slug')
        .eq('store_id', store.id)
        .order('name');

      if (websiteId) {
        const { data: visibleCategoryIds } = await supabase
          .from('category_website_visibility')
          .select('category_id')
          .eq('website_id', websiteId);

        const categoryIds = visibleCategoryIds?.map(v => v.category_id) || [];
        if (categoryIds.length > 0) {
          query = query.in('id', categoryIds);
        } else {
          setCategories([]);
          return;
        }
      }

      const { data, error } = await query;
      if (!error) setCategories(data || []);
    };
    fetchCategories();
  }, [store?.id, element.content.websiteId, builderWebsiteId]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!store?.id) return;
      setLoading(true);
      try {
        // Check for website selection from element content or URL
        let websiteId = element.content.websiteId;
        
        // If auto-detect is enabled or no website selected, try to get from URL
        if (!websiteId || websiteId === 'auto') {
          // First priority: builder websiteId from URL params
          if (builderWebsiteId) {
            websiteId = builderWebsiteId;
          } else if (window.location.pathname.includes('/website/')) {
            websiteId = window.location.pathname.split('/website/')[1]?.split('/')[0];
          } else if (window.location.pathname.includes('/site/')) {
            // For site URLs like /site/natural-energy, we need to find the website ID
            const siteSlug = window.location.pathname.split('/site/')[1]?.split('/')[0];
            if (siteSlug) {
              const { data: websiteData } = await supabase
                .from('websites')
                .select('id')
                .eq('slug', siteSlug)
                .single();
              websiteId = websiteData?.id;
            }
          } else {
            // Check for custom domain context
            const currentHost = window.location.hostname;
            
            // Skip staging domains
            if (!(currentHost === 'ecombuildr.com' || 
                  currentHost === 'localhost' || 
                  currentHost.includes('lovable.app') ||
                  currentHost.includes('lovableproject.com'))) {
              
              try {
                // Check if this is a custom domain
                const { data: domain } = await supabase
                  .from('custom_domains')
                  .select(`
                    id,
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
                  websiteId = domain.domain_connections[0].content_id;
                }
              } catch (error) {
                console.error('Error detecting custom domain context:', error);
              }
            }
          }
        }

        let productIds: string[] | undefined = undefined;

        // If websiteId is present, get visible product IDs for this website
        if (websiteId) {
          const { data: visibilityData } = await supabase
            .from('product_website_visibility')
            .select('product_id')
            .eq('website_id', websiteId);

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
          .eq('is_active', true);

        // Apply website visibility filter if we have specific product IDs
        if (productIds) {
          query = query.in('id', productIds);
        }

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        if (filters.categories.length > 0) {
          const categoryIds = categories
            .filter((c) => filters.categories.includes(c.slug))
            .map((c) => c.id);
          if (categoryIds.length) query = query.in('category_id', categoryIds);
        }

        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        }

        if (filters.onSale) {
          query = query.not('compare_price', 'is', null);
        }

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
        if (error) throw error;
        const transformed: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name || '',
          price: p.price || 0,
          compare_price: p.compare_price || undefined,
          short_description: p.short_description || undefined,
          description: p.description || undefined,
          images: p.images || [],
          slug: p.slug || '',
          is_active: p.is_active || false,
          variations: p.variations || null,
          track_inventory: p.track_inventory || false,
          inventory_quantity: p.inventory_quantity || 0,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        setProducts(transformed);
      } catch (e) {
        console.error('ProductsPageElement fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [store?.id, searchQuery, sortBy, JSON.stringify(filters), categories.length, element.content.websiteId, builderWebsiteId]);

  const handleAddToCart = (product: Product, quantity?: number) => {
    addToCart(product, quantity || 1);
  };

  const handleClearFilters = () => {
    setFilters({ categories: [], priceRange: [0, 10000], rating: 0, inStock: false, onSale: false, freeShipping: false });
    setSearchQuery('');
  };

  return (
    <div className={`products-element-${elementId} ${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-7xl mx-auto'}`} style={elementStyles}>
      {dynamicCSS && <style dangerouslySetInnerHTML={{ __html: dynamicCSS }} />}
      {/* Header */}
      <div className="mb-6">
        {element.content.title && (
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: elementStyles.color, fontSize: elementStyles.fontSize, textAlign: elementStyles.textAlign, lineHeight: elementStyles.lineHeight, fontWeight: elementStyles.fontWeight }}
          >
            {element.content.title}
          </h2>
        )}
        {element.content.subtitle && (
          <p className="text-muted-foreground" style={{ color: elementStyles.color }}>{element.content.subtitle}</p>
        )}
      </div>

      {/* Search + Controls */}
      {(showSearch || showSort || showViewToggle) && (
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {showSearch && (
            <form onSubmit={(e) => e.preventDefault()} className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </form>
          )}

          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Mobile Filters */}
            {showFilters && (
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
                          filters.rating > 0,
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
                    <ProductFilters categories={categories} filters={filters} onFiltersChange={setFilters} onClearFilters={handleClearFilters} />
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {showSort && (
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
            )}

            {showViewToggle && (
              <div className="flex items-center border rounded-lg p-1">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 px-3">
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 px-3">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Separator className="my-6" />

      <div className="flex gap-8">
        {/* Desktop Filters */}
        {showFilters && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <ProductFilters categories={categories} filters={filters} onFiltersChange={setFilters} onClearFilters={handleClearFilters} />
          </div>
        )}

        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters to find what you're looking for.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-4 border-b">
                <p className="text-sm text-muted-foreground">Showing {products.length} products</p>
              </div>

              <div
                className={cn(
                  'transition-all duration-300',
                  viewMode === 'grid' ? `grid ${getGridClasses()} gap-6` : 'space-y-4'
                )}
              >
                {products.map((product) => (
                  viewMode === 'grid' ? (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeSlug={store?.slug || ''}
                      onAddToCart={handleAddToCart}
                       onQuickView={openQuickView}
                    />
                  ) : (
                    <Card key={product.id} className="p-4">
                      <div className="flex gap-4 items-start">
                        <a href={paths.productDetail(product.slug)} className="w-28 sm:w-40 h-28 sm:h-40 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img src={product.images[0] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
                        </a>
                        <div className="flex-1 min-w-0 space-y-2">
                          <a href={paths.productDetail(product.slug)} className="hover:text-primary transition-colors">
                            <h3 className="font-semibold text-base sm:text-lg leading-snug truncate">{product.name}</h3>
                          </a>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
                          </div>
                          {product.short_description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">{product.short_description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2 min-w-[120px] sm:min-w-[140px]">
                          <div className="text-right w-full">
                            <div className="font-bold text-base sm:text-lg flex flex-wrap items-center justify-end gap-1">
                              <span>{formatCurrency(product.price)}</span>
                              {product.compare_price && product.compare_price > product.price && (
                                <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.compare_price)}</span>
                              )}
                            </div>
                          </div>
                          <Button onClick={() => handleAddToCart(product)} className="w-full product-card-button">
                            Add to Cart
                          </Button>
                          <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <Eye className="h-4 w-4" />
                             </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { if ((window as any).addToComparison) { (window as any).addToComparison(product); } }}
                            >
                              <GitCompare className="h-4 w-4" />
                            </Button>
                            <WishlistButton product={product as any} storeSlug={store?.slug || ''} size="sm" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                ))}
              </div>

              {showRecentlyViewed && (
                <RecentlyViewed
                  storeSlug={store?.slug || ''}
                  onAddToCart={handleAddToCart}
                  onQuickView={openQuickView}
                />
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Grid, List, Filter, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/storefront/ProductGridSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { setSEO, buildCanonical } from '@/lib/seo';
import { useToast } from '@/hooks/use-toast';
import { useAddToCart } from '@/contexts/AddToCartProvider';
import { useWebsiteContext } from '@/contexts/WebsiteContext';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_id: string;
  is_published: boolean;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  images: string[];
  slug: string;
  short_description: string | null;
  inventory_quantity: number | null;
  track_inventory: boolean;
  is_active: boolean;
}

function CollectionPage() {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const { toast } = useToast();
  const { addToCart } = useAddToCart();
  const { websiteId, websiteSlug } = useWebsiteContext();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (collectionSlug) {
      fetchCollectionAndProducts();
    }
  }, [collectionSlug]);

  // Set SEO based on collection state
  useEffect(() => {
    if (loading) {
      setSEO({
        title: 'Loading Collection...',
        description: 'Loading collection page',
        robots: 'noindex, nofollow'
      });
    } else if (!collection) {
      setSEO({
        title: 'Collection Not Found',
        description: 'The requested collection could not be found',
        robots: 'noindex, nofollow'
      });
    } else {
      setSEO({
        title: collection.name,
        description: collection.description || `Browse products in the ${collection.name} collection`,
        canonical: buildCanonical(),
        robots: 'index, follow'
      });
    }
  }, [loading, collection]);

  const fetchCollectionAndProducts = async () => {
    try {
      setLoading(true);

      // First fetch the collection
      const { data: collectionData, error: collectionError } = await (supabase as any)
        .from('collections')
        .select('*')
        .eq('slug', collectionSlug)
        .eq('is_published', true)
        .eq('is_active', true)
        .single();

      if (collectionError || !collectionData) {
        throw new Error('Collection not found');
      }

      setCollection(collectionData);

      // Then fetch the products in this collection
      const { data: productsData, error: productsError } = await (supabase as any)
        .from('product_collection_items')
        .select(`
          position,
          product:products (
            id,
            name,
            price,
            compare_price,
            images,
            slug,
            short_description,
            inventory_quantity,
            track_inventory,
            is_active
          )
        `)
        .eq('collection_id', collectionData.id)
        .order('position');

      if (productsError) throw productsError;

      // Filter and transform the data
      const activeProducts = (productsData || [])
        .filter(item => item.product?.is_active)
        .map(item => item.product)
        .filter(Boolean) as Product[];

      setProducts(activeProducts);
    } catch (error: any) {
      console.error('Error fetching collection:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      slug: product.slug,
      is_active: product.is_active,
    }, quantity);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if we're in a website context (custom domain or site slug)
  const isWebsiteContext = !!(websiteId || websiteSlug);

  const renderContent = (content: React.ReactNode) => {
    return content;
  };

  if (loading) {
    return renderContent(
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    );
  }

  if (!collection) {
    return renderContent(
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The collection you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse All Products
          </Link>
        </Button>
      </div>
    );
  }

  return renderContent(
    <div className="container mx-auto px-4 py-8">
        {/* Collection Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <Link 
              to="/products" 
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              All Products
            </Link>
          </nav>
          
          <h1 className="text-3xl font-bold mb-4">{collection.name}</h1>
          {collection.description && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {collection.description}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search in this collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'No products in this collection match your search criteria.'
                  : 'This collection is currently empty.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  {viewMode === 'grid' ? (
                    <ProductCard
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  ) : (
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <Link 
                              to={`/products/${product.slug}`}
                              className="hover:text-primary"
                            >
                              <h3 className="font-semibold mb-2">{product.name}</h3>
                            </Link>
                            {product.short_description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {product.short_description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {product.compare_price && product.compare_price > product.price ? (
                                  <>
                                    <span className="font-bold text-lg">
                                      ${product.price}
                                    </span>
                                    <span className="text-sm text-muted-foreground line-through">
                                      ${product.compare_price}
                                    </span>
                                    <Badge variant="destructive" className="text-xs">
                                      Sale
                                    </Badge>
                                  </>
                                ) : (
                                  <span className="font-bold text-lg">
                                    ${product.price}
                                  </span>
                                )}
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => handleAddToCart(product)}
                                disabled={product.track_inventory && product.inventory_quantity === 0}
                              >
                                {product.track_inventory && product.inventory_quantity === 0 
                                  ? 'Out of Stock' 
                                  : 'Add to Cart'
                                }
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
    </div>
  );
}

export { CollectionPage };
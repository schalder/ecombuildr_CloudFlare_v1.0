import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { ProductQuickView } from '@/components/ProductQuickView';
import { Search, Plus, TrendingUp, Check, Eye, Filter } from 'lucide-react';

interface ProductLibraryItem {
  id: string;
  name: string;
  description: string;
  short_description: string;
  suggested_price: number;
  base_cost: number;
  shipping_cost: number;
  category: string;
  tags: string[];
  images: any;
  is_trending: boolean;
  supplier_link: string;
  ad_copy: string;
  video_url: string;
  variations: any;
  created_at: string;
}

export default function ProductLibrary() {
  const { toast } = useToast();
  const { store, ensureStore } = useUserStore();
  const [products, setProducts] = useState<ProductLibraryItem[]>([]);
  const [importedProducts, setImportedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [importedFilter, setImportedFilter] = useState<string>('all');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductLibraryItem | null>(null);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
    fetchImportedProducts();
  }, [store?.id]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_library')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch product library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchImportedProducts = async () => {
    if (!store?.id) return;
    
    try {
      const { data: importedIds } = await supabase
        .rpc('get_imported_products', { store_id_param: store.id });
      
      setImportedProducts(importedIds || []);
    } catch (error: any) {
      console.error('Failed to fetch imported products:', error);
      setImportedProducts([]);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchesImported = importedFilter === 'all' || 
      (importedFilter === 'imported' && importedProducts.includes(product.id)) ||
      (importedFilter === 'not-imported' && !importedProducts.includes(product.id));

    return matchesSearch && matchesCategory && matchesImported;
  });

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const addToStore = async (product: ProductLibraryItem) => {
    if (!store) {
      try {
        await ensureStore();
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to create store. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setImportingIds(prev => new Set(prev.add(product.id)));

    try {
      const currentStore = store || await ensureStore();
      
      // Generate a unique slug for the product
      const slug = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // First, add the product to the products table
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: currentStore.id,
          name: product.name,
          slug: `${slug}-${Date.now()}`, // Make it unique
          description: product.description || product.short_description,
          price: product.suggested_price || 0,
          images: product.images || [],
          variations: product.variations || [],
          is_active: true,
          track_inventory: false,
          category_id: null,
          sku: null
        })
        .select()
        .single();

      if (productError) throw productError;

      // Record import using RPC
      await supabase.rpc('record_product_import', {
        library_item_id_param: product.id,
        store_id_param: currentStore.id,
        product_id_param: newProduct.id
      });

      // Update local state
      setImportedProducts(prev => [...prev, product.id]);
      
      toast({
        title: "Success",
        description: `${product.name} has been added to your store!`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to store",
        variant: "destructive",
      });
    } finally {
      setImportingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  return (
    <DashboardLayout title="Product Library" description="Browse and add products from our curated library">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={importedFilter} onValueChange={setImportedFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="imported">Imported</SelectItem>
              <SelectItem value="not-imported">Not Imported</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary">{filteredProducts.length} products</Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-48 bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No products found in the library.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-all duration-200 relative">
                {/* Import Status Badge */}
                {importedProducts.includes(product.id) && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-white">
                      ✓ Imported
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-3">
                  {product.images && product.images.length > 0 && (
                    <div className="aspect-[4/3] bg-muted rounded-md mb-3 overflow-hidden relative">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {product.is_trending && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="w-2 h-2 mr-1" />
                            Trending
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight">{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          ৳{product.suggested_price}
                        </Badge>
                        {product.base_cost > 0 && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            Cost: ৳{product.base_cost}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1 pt-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setQuickViewProduct(product)}
                        className="h-7 text-xs px-2"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Quick View
                      </Button>
                    
                      {importedProducts.includes(product.id) ? (
                        <Button 
                          disabled
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs px-2 flex-1"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Added
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => addToStore(product)}
                          disabled={importingIds.has(product.id)}
                          size="sm"
                          className="h-7 text-xs px-2 flex-1"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {importingIds.has(product.id) ? 'Adding...' : 'Add to Store'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          isImported={quickViewProduct ? importedProducts.includes(quickViewProduct.id) : false}
          showProfitCalculation={true}
        />
      </div>
    </DashboardLayout>
  );
}
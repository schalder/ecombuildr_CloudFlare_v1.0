import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { Search, Plus, TrendingUp, Check } from 'lucide-react';

interface ProductLibraryItem {
  id: string;
  name: string;
  description: string;
  short_description: string;
  suggested_price: number;
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
      // Simplified approach: track imports in localStorage for now
      const stored = localStorage.getItem(`imports_${store.id}`);
      if (stored) {
        setImportedProducts(JSON.parse(stored));
      }
    } catch (error: any) {
      console.error('Failed to fetch imported products:', error);
      setImportedProducts([]);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      // Store the import in localStorage for now
      const currentImports = [...importedProducts, product.id];
      setImportedProducts(currentImports);
      localStorage.setItem(`imports_${currentStore.id}`, JSON.stringify(currentImports));
      
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
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {product.images && product.images.length > 0 && (
                    <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                      {product.is_trending && (
                        <Badge variant="secondary" className="ml-2">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.short_description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {product.suggested_price && (
                        <Badge variant="outline">
                          ${product.suggested_price}
                        </Badge>
                      )}
                      {product.category && (
                        <Badge variant="secondary">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {product.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {importedProducts.includes(product.id) ? (
                      <Button 
                        disabled
                        className="w-full mt-4"
                        size="sm"
                        variant="secondary"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Added to Store
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => addToStore(product)}
                        disabled={importingIds.has(product.id)}
                        className="w-full mt-4"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {importingIds.has(product.id) ? 'Adding...' : 'Add to Store'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
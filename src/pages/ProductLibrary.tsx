
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, TrendingUp, Eye, DollarSign } from 'lucide-react';
import { ProductImportDialog } from '@/components/ProductImportDialog';

interface ProductLibraryItem {
  id: string;
  name: string;
  description: string;
  short_description: string;
  suggested_price: number;
  base_cost: number;
  shipping_cost: number;
  category_id: string | null;
  images: any;
  is_trending: boolean;
  supplier_link: string;
  ad_copy: string;
  video_url: string;
  variations: any;
  created_at: string;
  product_library_categories?: {
    name: string;
    slug: string;
  };
}

export default function ProductLibrary() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductLibraryItem | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_library')
        .select(`
          *,
          product_library_categories (
            name,
            slug
          )
        `)
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

  const handleImportClick = (product: ProductLibraryItem) => {
    setSelectedProduct(product);
    setShowImportDialog(true);
  };

  const handleImportSuccess = () => {
    toast({
      title: "Success",
      description: "Product imported successfully!",
    });
    // Could refresh or update UI here if needed
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_library_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateProfit = (suggestedPrice: number, baseCost: number, shippingCost: number) => {
    return suggestedPrice - baseCost - shippingCost;
  };

  const calculateProfitMargin = (suggestedPrice: number, profit: number) => {
    return suggestedPrice > 0 ? ((profit / suggestedPrice) * 100).toFixed(1) : '0';
  };

  return (
    <DashboardLayout title="Product Library" description="Browse and import products from our curated library">
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

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Import winning products to your store, set your own prices, and we'll handle fulfillment when you make sales.
              </p>
            </div>
          </CardContent>
        </Card>

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
            {filteredProducts.map((product) => {
              const profit = calculateProfit(product.suggested_price, product.base_cost, product.shipping_cost);
              const profitMargin = calculateProfitMargin(product.suggested_price, profit);
              
              return (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden relative">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {product.is_trending && (
                          <Badge className="absolute top-2 left-2">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                        
                        {product.short_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.short_description}
                          </p>
                        )}
                      </div>
                      
                      {/* Pricing Info */}
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Your Cost:</span>
                          <span className="font-medium">${(product.base_cost + product.shipping_cost).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Suggested Price:</span>
                          <span className="font-medium">${product.suggested_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="text-green-700 font-medium">Your Profit:</span>
                          <span className="font-bold text-green-800">
                            ${profit.toFixed(2)} ({profitMargin}%)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {product.product_library_categories && (
                          <Badge variant="outline">
                            {product.product_library_categories.name}
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => handleImportClick(product)}
                        className="w-full"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Import to Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Import Dialog */}
        <ProductImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          product={selectedProduct}
          onSuccess={handleImportSuccess}
        />
      </div>
    </DashboardLayout>
  );
}

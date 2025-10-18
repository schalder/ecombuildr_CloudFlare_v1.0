import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  CheckSquare,
  Square,
  Download,
  Upload,
  Copy
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  sku?: string;
  inventory_quantity?: number;
  is_active: boolean;
  images: any;
  created_at: string;
  categories?: {
    name: string;
  };
  product_website_visibility?: {
    websites: {
      name: string;
    };
  }[];
}

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingProduct, setDuplicatingProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'single' | 'bulk'; productId?: string; productName?: string }>({ 
    open: false, 
    type: 'single' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const productsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, currentPage, searchTerm]);

  // Realtime subscription to product inventory updates for the owner's stores
  useEffect(() => {
    if (!user || storeIds.length === 0) return;

    const filter = storeIds.length === 1
      ? `store_id=eq.${storeIds[0]}`
      : `store_id=in.(${storeIds.join(",")})`;

    const channel = supabase
      .channel('products-inventory-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter }, (payload) => {
        const updated: any = payload.new;
        setProducts(prev =>
          prev.map(p => p.id === updated.id ? { ...p, inventory_quantity: updated.inventory_quantity } : p)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, storeIds]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const ids = stores.map((store: any) => store.id as string);
        setStoreIds(ids);

        // Build search query
        let productsQuery = supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            compare_price,
            sku,
            inventory_quantity,
            is_active,
            images,
            created_at,
            categories:category_id(name)
          `)
          .in('store_id', stores.map(store => store.id));

        // Apply search filter if searchTerm exists
        if (searchTerm.trim()) {
          productsQuery = productsQuery.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
        }

        // Get total count for pagination with same filters
        let countQuery = supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .in('store_id', stores.map(store => store.id));

        if (searchTerm.trim()) {
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        setTotalCount(count || 0);

        // Calculate offset for pagination
        const offset = (currentPage - 1) * productsPerPage;

        const { data: products, error: productsError } = await productsQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + productsPerPage - 1);

        if (productsError) throw productsError;

        // Fetch product visibility data separately
        const { data: visibilityData } = await supabase
          .from('product_website_visibility')
          .select('product_id, website_id');

        // Fetch websites data
        const { data: websitesData } = await supabase
          .from('websites')
          .select('id, name')
          .in('store_id', stores.map(store => store.id));

        // Merge the visibility data with products
        const productsWithVisibility = (products || []).map(product => {
          const productVisibility = (visibilityData || [])
            .filter(v => v.product_id === product.id)
            .map(v => {
              const website = websitesData?.find(w => w.id === v.website_id);
              return {
                websites: {
                  name: website?.name || 'Unknown Website'
                }
              };
            });
          
          return {
            ...product,
            product_website_visibility: productVisibility
          };
        });

        setProducts(productsWithVisibility);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_active: !isActive }
          : product
      ));

      toast({
        title: "Success",
        description: `Product ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const duplicateProduct = async (productId: string) => {
    setDuplicatingProduct(productId);
    try {
      // First, fetch the original product with all its data
      const { data: originalProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalProduct) {
        throw new Error('Product not found');
      }

      // Generate new slug to avoid conflicts
      const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
        let newSlug = `${baseSlug}-copy`;
        let counter = 1;
        
        while (true) {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('slug', newSlug)
            .eq('store_id', originalProduct.store_id)
            .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors
          
          if (!existing) break;
          
          newSlug = `${baseSlug}-copy-${counter}`;
          counter++;
        }
        
        return newSlug;
      };

      const newSlug = await generateUniqueSlug(originalProduct.slug);

      // Prepare the duplicated product data - exclude problematic fields
      const duplicatedProduct = {
        store_id: originalProduct.store_id,
        category_id: originalProduct.category_id,
        name: `${originalProduct.name} (Copy)`,
        slug: newSlug,
        description: originalProduct.description,
        short_description: originalProduct.short_description,
        price: originalProduct.price,
        compare_price: originalProduct.compare_price,
        cost_price: originalProduct.cost_price,
        sku: originalProduct.sku ? `${originalProduct.sku}-COPY` : null,
        track_inventory: originalProduct.track_inventory,
        inventory_quantity: 0, // Reset inventory
        images: originalProduct.images,
        variations: originalProduct.variations,
        is_active: false, // Start as inactive
        seo_title: originalProduct.seo_title,
        seo_description: originalProduct.seo_description,
        free_shipping_min_amount: originalProduct.free_shipping_min_amount,
        easy_returns_enabled: originalProduct.easy_returns_enabled,
        easy_returns_days: originalProduct.easy_returns_days,
        action_buttons: originalProduct.action_buttons,
        allowed_payment_methods: originalProduct.allowed_payment_methods,
        description_mode: originalProduct.description_mode,
        description_builder: originalProduct.description_builder,
        video_url: originalProduct.video_url,
        weight_grams: originalProduct.weight_grams,
        shipping_config: originalProduct.shipping_config,
        library_item_id: originalProduct.library_item_id,
        fulfillment_type: originalProduct.fulfillment_type,
        supplier_link: originalProduct.supplier_link,
        urgency_timer_enabled: originalProduct.urgency_timer_enabled,
        urgency_timer_duration: originalProduct.urgency_timer_duration,
        urgency_timer_text: originalProduct.urgency_timer_text,
        urgency_timer_color: originalProduct.urgency_timer_color,
        urgency_timer_text_color: originalProduct.urgency_timer_text_color,
        is_membership: originalProduct.is_membership,
        membership_content: originalProduct.membership_content,
        product_type: originalProduct.product_type,
        digital_files: originalProduct.digital_files,
        download_limit: originalProduct.download_limit,
        download_expiry_hours: originalProduct.download_expiry_hours,
        // Explicitly exclude: id, created_at, updated_at, product_website_visibility
      };

      // Insert the duplicated product without select()
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(duplicatedProduct)
        .select('*')
        .single();

      if (insertError) throw insertError;

      // Add the new product to the current list
      setProducts(prev => [newProduct, ...prev]);

      toast({
        title: "Success",
        description: `Product "${originalProduct.name}" duplicated as "${newProduct.name}"`,
      });

      // Optionally navigate to edit the new product
      navigate(`/dashboard/products/${newProduct.id}/edit`);

    } catch (error) {
      console.error('Error duplicating product:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate product",
        variant: "destructive",
      });
    } finally {
      setDuplicatingProduct(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const bulkToggleStatus = async (isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .in('id', selectedProducts);

      if (error) throw error;

      setProducts(products.map(product => 
        selectedProducts.includes(product.id) 
          ? { ...product, is_active: isActive }
          : product
      ));

      setSelectedProducts([]);
      toast({
        title: "Success",
        description: `${selectedProducts.length} products ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: "Error",
        description: "Failed to update products",
        variant: "destructive",
      });
    }
  };

  const bulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;

      setProducts(products.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);

      toast({
        title: "Success",
        description: `${selectedProducts.length} products deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteConfirm({ open: true, type: 'single', productId, productName });
  };

  const handleBulkDelete = () => {
    setDeleteConfirm({ open: true, type: 'bulk' });
  };

  const confirmDelete = () => {
    if (deleteConfirm.type === 'single' && deleteConfirm.productId) {
      deleteProduct(deleteConfirm.productId);
    } else if (deleteConfirm.type === 'bulk') {
      bulkDelete();
    }
    setDeleteConfirm({ open: false, type: 'single' });
  };

  // Products are already filtered by the database query, no need for client-side filtering
  const filteredProducts = products;

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedProducts([]); // Clear selections when changing pages
  };

  return (
    <DashboardLayout 
      title="Products" 
      description="Manage your product catalog"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row justify-between items-center'} gap-4`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className={`pl-10 text-foreground ${isMobile ? 'w-full' : 'w-80'}`}
              />
            </div>
            <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-2'}`}>
              <Button variant="outline" size={isMobile ? "sm" : "default"}>
                <Download className="h-4 w-4 mr-2" />
                {isMobile ? "" : "Export"}
              </Button>
              <Button onClick={() => navigate('/dashboard/products/add')} size={isMobile ? "sm" : "default"}>
                <Plus className="h-4 w-4 mr-2" />
                {isMobile ? "Add" : "Add Product"}
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions - Mobile optimized */}
          {selectedProducts.length > 0 && (
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 p-3 bg-muted rounded-lg`}>
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} selected
              </span>
              <div className={`flex ${isMobile ? 'w-full' : 'items-center'} gap-2`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkToggleStatus(true)}
                  className={isMobile ? "flex-1" : ""}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkToggleStatus(false)}
                  className={isMobile ? "flex-1" : ""}
                >
                  Deactivate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className={isMobile ? "flex-1" : ""}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Products List/Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({totalCount})
              </div>
              {!isMobile && selectedProducts.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectAll(selectedProducts.length !== filteredProducts.length)}
                  className="text-muted-foreground"
                >
                  {selectedProducts.length === filteredProducts.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span className="ml-2">Select All</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`${isMobile ? 'h-32' : 'h-16'} bg-muted animate-pulse rounded`} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'Start by adding your first product'}
                </p>
              </div>
            ) : isMobile ? (
              // Mobile Card View  
              <div className="space-y-3">
                {/* Select All for Mobile */}
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectAll(selectedProducts.length !== filteredProducts.length)}
                    className="text-muted-foreground h-8"
                  >
                    {selectedProducts.length === filteredProducts.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <span className="ml-2 text-sm">Select All</span>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {selectedProducts.length} of {filteredProducts.length}
                  </span>
                </div>
                
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="border-l-2 border-l-primary/30 overflow-hidden">
                    <CardContent className="p-3">
                      {/* Header Row - Checkbox, Image, Title, Actions */}
                      <div className="flex items-start gap-2 mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectProduct(product.id, !selectedProducts.includes(product.id))}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          {selectedProducts.includes(product.id) ? (
                            <CheckSquare className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <div className="flex-shrink-0">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm leading-tight mb-1">{product.name}</h3>
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {product.sku && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-16">
                                {product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/products/${product.id}`)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}>
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => duplicateProduct(product.id)}
                              disabled={duplicatingProduct === product.id}
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              {duplicatingProduct === product.id ? 'Duplicating...' : 'Duplicate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleProductStatus(product.id, product.is_active)}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Price and Stock Info - Single column layout for small screens */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Price</p>
                            <div className="flex flex-col">
                              <span className="font-semibold text-base">৳{product.price.toLocaleString()}</span>
                              {product.compare_price && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ৳{product.compare_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Stock</p>
                            <p className="font-medium text-sm">
                              {product.inventory_quantity ?? 'Not tracked'}
                            </p>
                          </div>
                        </div>

                        {/* Category and Channel - Stacked on very small screens */}
                        <div className="pt-2 border-t border-muted/50 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium truncate ml-2">
                              {product.categories?.name || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Channel:</span>
                            <span className="font-medium truncate ml-2">
                              {product.product_website_visibility && product.product_website_visibility.length > 0 
                                ? product.product_website_visibility[0].websites.name 
                                : '-'
                              }
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground pt-1">
                            Added {new Date(product.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll(selectedProducts.length !== filteredProducts.length)}
                      >
                        {selectedProducts.length === filteredProducts.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Channel</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectProduct(product.id, !selectedProducts.includes(product.id))}
                        >
                          {selectedProducts.includes(product.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Added {new Date(product.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                       <TableCell className="hidden md:table-cell">{product.sku || '-'}</TableCell>
                       <TableCell>
                         <div>
                           ৳{product.price.toLocaleString()}
                           {product.compare_price && (
                             <div className="text-sm text-muted-foreground line-through">
                               ৳{product.compare_price.toLocaleString()}
                             </div>
                           )}
                         </div>
                       </TableCell>
                       <TableCell className="hidden lg:table-cell">
                         {product.inventory_quantity ?? 'Not tracked'}
                       </TableCell>
                       <TableCell>
                         <Badge variant={product.is_active ? "default" : "secondary"}>
                           {product.is_active ? 'Active' : 'Inactive'}
                         </Badge>
                       </TableCell>
                       <TableCell className="hidden md:table-cell">
                         {product.categories?.name || '-'}
                       </TableCell>
                       <TableCell className="hidden lg:table-cell">
                         {product.product_website_visibility && product.product_website_visibility.length > 0 
                           ? product.product_website_visibility[0].websites.name 
                           : '-'
                         }
                       </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/products/${product.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => duplicateProduct(product.id)}
                              disabled={duplicatingProduct === product.id}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {duplicatingProduct === product.id ? 'Duplicating...' : 'Duplicate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleProductStatus(product.id, product.is_active)}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, totalCount)} of {totalCount} products
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === currentPage;
                  
                  // Show first page, last page, current page, and pages around current
                  const showPage = page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                  
                  if (!showPage) {
                    // Show ellipsis for gaps
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <span className="px-3 py-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={isCurrentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <ConfirmationDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => !open && setDeleteConfirm({ open: false, type: 'single' })}
          title={deleteConfirm.type === 'bulk' ? 'Delete Products' : 'Delete Product'}
          description={
            deleteConfirm.type === 'bulk' 
              ? `Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`
              : `Are you sure you want to delete "${deleteConfirm.productName}"? This action cannot be undone.`
          }
          confirmText={deleteConfirm.type === 'bulk' ? 'Delete Products' : 'Delete Product'}
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
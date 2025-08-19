
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';

interface ProductImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProductImportDialog({ isOpen, onClose, product, onSuccess }: ProductImportDialogProps) {
  const { toast } = useToast();
  const { store } = useUserStore();
  const { websites } = useStoreWebsites(store?.id);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    compare_price: 0,
    category_id: '',
    website_ids: [] as string[],
    short_description: '',
    description: ''
  });

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        price: product.suggested_price || 0,
        compare_price: Math.round((product.suggested_price || 0) * 1.2), // 20% markup
        category_id: '',
        website_ids: [],
        short_description: product.short_description || '',
        description: product.description || ''
      });
      fetchCategories();
    }
  }, [product, isOpen]);

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
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImport = async () => {
    if (!store?.id || !product?.id) return;

    try {
      setImporting(true);

      // Generate a unique slug
      const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let slug = baseSlug;
      let counter = 1;

      // Check if slug exists and make it unique
      while (true) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('slug', slug)
          .single();

        if (!existingProduct) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create the product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name: formData.name,
          slug: slug,
          price: formData.price,
          compare_price: formData.compare_price > formData.price ? formData.compare_price : null,
          short_description: formData.short_description,
          description: formData.description,
          category_id: formData.category_id || null,
          images: product.images || [],
          is_active: true,
          track_inventory: false,
          library_item_id: product.id,
          fulfillment_type: 'admin',
          cost_price: product.base_cost,
          supplier_link: product.supplier_link,
          variations: product.variations || null
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create import record
      const { error: importError } = await supabase
        .from('product_library_imports')
        .insert({
          library_item_id: product.id,
          store_id: store.id,
          product_id: newProduct.id,
          status: 'imported'
        });

      if (importError) throw importError;

      // Set website visibility if websites are selected
      if (formData.website_ids.length > 0) {
        const visibilityRecords = formData.website_ids.map(websiteId => ({
          product_id: newProduct.id,
          website_id: websiteId
        }));

        const { error: visibilityError } = await supabase
          .from('product_website_visibility')
          .insert(visibilityRecords);

        if (visibilityError) throw visibilityError;
      }

      toast({
        title: "Success",
        description: `${formData.name} has been imported to your store!`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import product",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const profit = formData.price - (product?.base_cost || 0) - (product?.shipping_cost || 0);
  const profitMargin = formData.price > 0 ? ((profit / formData.price) * 100).toFixed(1) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Product to Your Store</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Preview */}
          <div className="flex gap-4 p-4 bg-muted rounded-lg">
            {product?.images?.[0] && (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-semibold">{product?.name}</h3>
              <p className="text-sm text-muted-foreground">{product?.short_description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>Cost: ${product?.base_cost || 0}</span>
                <span>Shipping: ${product?.shipping_cost || 0}</span>
                <span>Suggested: ${product?.suggested_price || 0}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Selling Price *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Compare Price</label>
              <Input
                type="number"
                step="0.01"
                value={formData.compare_price}
                onChange={(e) => setFormData({ ...formData, compare_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Profit Calculation */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Profit Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Your Profit: </span>
                <span className="font-semibold text-green-800">${profit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-green-700">Profit Margin: </span>
                <span className="font-semibold text-green-800">{profitMargin}%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Websites (Optional)</label>
            <Select
              value={formData.website_ids.join(',')}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                website_ids: value ? value.split(',') : [] 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select websites to show this product" />
              </SelectTrigger>
              <SelectContent>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Short Description</label>
              <Input
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Full description"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || !formData.name || !formData.price}>
              {importing ? 'Importing...' : 'Import Product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

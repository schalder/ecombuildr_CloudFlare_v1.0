
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ProductDescriptionBuilderDialog from '@/components/products/ProductDescriptionBuilderDialog';
import type { PageBuilderData } from '@/components/page-builder/types';
import VariationsBuilder, { VariationOption } from '@/components/products/VariationsBuilder';
import VariantMatrix, { VariantEntry } from '@/components/products/VariantMatrix';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { parseVideoUrl, buildEmbedUrl } from '@/components/page-builder/utils/videoUtils';
import { MultiSelect } from '@/components/ui/multi-select';
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);

  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    cost_price: '',
    sku: '',
    track_inventory: false,
    inventory_quantity: '0',
    is_active: true,
    category_id: '',
    seo_title: '',
    seo_description: '',
    images: [] as string[],
    video_url: '',
  });

  // New local states
  const [hasVariants, setHasVariants] = useState(false);
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>([]);
  const [enableFreeShipping, setEnableFreeShipping] = useState(false);
  const [freeShippingMin, setFreeShippingMin] = useState<string>('');
  const [easyReturnsEnabled, setEasyReturnsEnabled] = useState(false);
  const [easyReturnsDays, setEasyReturnsDays] = useState<string>('30');

  // Action buttons & payment methods
  const [actionButtons, setActionButtons] = useState({
    order_now: { enabled: false, label: 'Order Now' },
    call: { enabled: false, label: 'Call Now', phone: '' },
    whatsapp: { enabled: false, label: 'WhatsApp', url: '' },
  });
const [allowedPayments, setAllowedPayments] = useState<string[]>([]);

  // Description mode (Rich Text or Page Builder)
  const [descriptionMode, setDescriptionMode] = useState<'rich_text' | 'builder'>('rich_text');
  const [descriptionBuilder, setDescriptionBuilder] = useState<PageBuilderData>({ sections: [] });
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Get websites for store
  const { websites: storeWebsites } = useStoreWebsitesForSelection(storeId);


  // Fetch categories for the dropdown
  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  // Preselect first website if available
  useEffect(() => {
    if (storeWebsites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(storeWebsites[0].id);
    }
  }, [storeWebsites, selectedWebsiteId]);

  // Filter categories based on selected website (strict filtering)
  useEffect(() => {
    const filterCategories = async () => {
      if (!selectedWebsiteId) {
        setFilteredCategories([]);
        return;
      }

      try {
        const { data: visibilityData } = await supabase
          .from('category_website_visibility')
          .select('category_id')
          .eq('website_id', selectedWebsiteId);

        const visibleCategoryIds = visibilityData?.map(v => v.category_id) || [];
        
        // Only show categories assigned to this specific website
        const filtered = categories.filter(cat => visibleCategoryIds.includes(cat.id));
        
        setFilteredCategories(filtered);
      } catch (error) {
        console.error('Error filtering categories:', error);
        setFilteredCategories([]);
      }
    };

    filterCategories();
  }, [selectedWebsiteId, categories]);

  const fetchCategories = async () => {
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (stores && stores.length > 0) {
        setStoreId(stores[0].id); // Set the first store as default

        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .in('store_id', stores.map(store => store.id))
          .order('name');

        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get user's store
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!stores || stores.length === 0) {
        toast({
          title: "Error",
          description: "No store found. Please create a store first.",
          variant: "destructive",
        });
        return;
      }

      // Generate a unique, URL-safe slug per store
      const baseSlug = formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let slug = baseSlug;
      const { data: existingSlugs } = await supabase
        .from('products')
        .select('slug')
        .eq('store_id', stores[0].id)
        .ilike('slug', `${baseSlug}%`);
      if (existingSlugs && existingSlugs.length) {
        const set = new Set((existingSlugs as any[]).map((r) => r.slug as string));
        if (set.has(baseSlug)) {
          let n = 2;
          while (set.has(`${baseSlug}-${n}`)) n++;
          slug = `${baseSlug}-${n}`;
        }
      }

const { data: newProduct, error: insertError } = await supabase.from('products').insert({
        ...formData,
        store_id: stores[0].id,
        slug,
        price: parseFloat(formData.price) || 0,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        inventory_quantity: parseInt(formData.inventory_quantity) || 0,
        category_id: formData.category_id || null,
        images: formData.images,
        video_url: formData.video_url || null,
        // New fields
        variations: hasVariants ? { options: variations, variants: variantEntries } : [],
        free_shipping_min_amount: enableFreeShipping && freeShippingMin ? parseFloat(freeShippingMin) : null,
        easy_returns_enabled: easyReturnsEnabled,
        easy_returns_days: easyReturnsEnabled && easyReturnsDays ? parseInt(easyReturnsDays) : null,
        action_buttons: actionButtons as any,
        allowed_payment_methods: allowedPayments.length ? allowedPayments : null,
        description_mode: descriptionMode,
        description_builder: descriptionBuilder as any,
      } as any).select('id').single();

      if (insertError) throw insertError;

      // Add website visibility records
      if (selectedWebsiteId && newProduct?.id) {
        const { error: visibilityError } = await supabase
          .from('product_website_visibility')
          .insert({
            product_id: newProduct.id,
            website_id: selectedWebsiteId
          });

        if (visibilityError) throw visibilityError;
      }

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      navigate('/dashboard/products');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Add Product" description="Create a new product for your store">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selling Website & Category - Moved to Top */}
        <Card>
          <CardHeader>
            <CardTitle>Selling Channel & Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website_id">Selling Website *</Label>
                <Select value={selectedWebsiteId} onValueChange={(value) => setSelectedWebsiteId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a website" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeWebsites.map((website) => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose which website this product will be sold on.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  disabled={!selectedWebsiteId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedWebsiteId ? "Select a category" : "Select a website first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {selectedWebsiteId 
                    ? `${filteredCategories.length} categories available for this website` 
                    : 'Select a website first to see available categories'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="use_builder"
                  checked={descriptionMode === 'builder'}
                  onCheckedChange={(v) => setDescriptionMode(v ? 'builder' : 'rich_text')}
                />
                <Label htmlFor="use_builder">Use Page Builder for Description</Label>
              </div>

              {descriptionMode === 'rich_text' ? (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                    placeholder="Write a detailed description..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Button type="button" onClick={() => setIsBuilderOpen(true)}>
                    Edit Description with Page Builder
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {descriptionBuilder.sections && descriptionBuilder.sections.length
                      ? 'Builder content saved. Click Edit to update.'
                      : 'No builder content yet. Click Edit to start.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare_price">Compare at Price</Label>
                <Input
                  id="compare_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, compare_price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="track_inventory"
                checked={formData.track_inventory}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, track_inventory: checked }))}
              />
              <Label htmlFor="track_inventory">Track inventory</Label>
            </div>
            
            {formData.track_inventory && (
              <div className="space-y-2">
                <Label htmlFor="inventory_quantity">Quantity</Label>
                <Input
                  id="inventory_quantity"
                  type="number"
                  value={formData.inventory_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory_quantity: e.target.value }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch id="has_variants" checked={hasVariants} onCheckedChange={setHasVariants} />
              <Label htmlFor="has_variants">This product has variants (e.g., Size, Color)</Label>
            </div>
            {hasVariants && (
              <>
                <VariationsBuilder options={variations} onChange={setVariations} />
                <VariantMatrix options={variations} variants={variantEntries} onChange={setVariantEntries} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Actions & Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="order_now_enabled"
                    checked={actionButtons.order_now.enabled}
                    onCheckedChange={(v) => setActionButtons(prev => ({ ...prev, order_now: { ...prev.order_now, enabled: v } }))}
                  />
                  <Label htmlFor="order_now_enabled">Enable "Order Now" button</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_now_label">Order Now Button Text</Label>
                  <Input id="order_now_label" value={actionButtons.order_now.label}
                    onChange={(e) => setActionButtons(prev => ({ ...prev, order_now: { ...prev.order_now, label: e.target.value } }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <Switch
                    id="call_enabled"
                    checked={actionButtons.call.enabled}
                    onCheckedChange={(v) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, enabled: v } }))}
                  />
                  <Label htmlFor="call_enabled">Enable Call button</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="call_label">Call Button Text</Label>
                  <Input id="call_label" value={actionButtons.call.label}
                    onChange={(e) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, label: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="call_phone">Phone Number</Label>
                  <Input id="call_phone" placeholder="e.g. +8801XXXXXXXXX" value={actionButtons.call.phone || ''}
                    onChange={(e) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, phone: e.target.value } }))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="whatsapp_enabled"
                    checked={actionButtons.whatsapp.enabled}
                    onCheckedChange={(v) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, enabled: v } }))}
                  />
                  <Label htmlFor="whatsapp_enabled">Enable WhatsApp button</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_label">WhatsApp Button Text</Label>
                  <Input id="whatsapp_label" value={actionButtons.whatsapp.label}
                    onChange={(e) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, label: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_url">WhatsApp URL</Label>
                  <Input id="whatsapp_url" placeholder="e.g. https://wa.me/8801XXXXXXXXX?text=Hello" value={actionButtons.whatsapp.url || ''}
                    onChange={(e) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, url: e.target.value } }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed Payment Methods</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['cod','bkash','nagad','sslcommerz'].map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <Checkbox
                      checked={allowedPayments.includes(m)}
                      onCheckedChange={(v) => setAllowedPayments(prev => v ? [...prev, m] : prev.filter(x => x !== m))}
                    />
                    <span className="capitalize">{m === 'sslcommerz' ? 'SSLCommerz' : m}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Leave all unchecked to allow all methods.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping & Returns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="free_shipping"
                  checked={enableFreeShipping}
                  onCheckedChange={setEnableFreeShipping}
                />
                <Label htmlFor="free_shipping">Offer free shipping over a minimum amount</Label>
              </div>
              {enableFreeShipping && (
                <div className="grid grid-cols-1 md:grid-cols-[200px] gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Minimum amount (e.g., 1000)"
                    value={freeShippingMin}
                    onChange={(e) => setFreeShippingMin(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="easy_returns"
                  checked={easyReturnsEnabled}
                  onCheckedChange={setEasyReturnsEnabled}
                />
                <Label htmlFor="easy_returns">Enable Easy Returns</Label>
              </div>
              {easyReturnsEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-[200px] gap-2">
                  <Input
                    type="number"
                    placeholder="Days (e.g., 30)"
                    value={easyReturnsDays}
                    onChange={(e) => setEasyReturnsDays(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Product is active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Product Images</Label>
              <div className="space-y-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={image}
                      onChange={(e) => {
                        const newImages = [...formData.images];
                        newImages[index] = e.target.value;
                        setFormData(prev => ({ ...prev, images: newImages }));
                      }}
                      placeholder="Image URL"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, images: newImages }));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
                  }}
                >
                  Add Image URL
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">Product Video (optional)</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="YouTube/Vimeo/Wistia link or direct MP4/WebM URL"
              />
              {formData.video_url && (() => {
                const info = parseVideoUrl(formData.video_url);
                if (info.type === 'unknown') return null;
                return (
                  <AspectRatio ratio={16/9}>
                    {info.type === 'hosted' ? (
                      <video src={info.embedUrl} controls className="w-full h-full rounded border" />
                    ) : (
                      <iframe
                        src={buildEmbedUrl(info.embedUrl!, info.type, { controls: true })}
                        className="w-full h-full rounded border"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Product Video Preview"
                      />
                    )}
                  </AspectRatio>
                );
              })()}
              <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, Wistia, or direct .mp4/.webm links.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">            
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                placeholder="SEO optimized title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                placeholder="SEO meta description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/dashboard/products')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>

        <ProductDescriptionBuilderDialog
          open={isBuilderOpen}
          onOpenChange={setIsBuilderOpen}
          initialData={descriptionBuilder}
          onSave={(data) => setDescriptionBuilder(data)}
        />
      </form>
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/ui/RichTextEditor";
import ProductDescriptionBuilderDialog from "@/components/products/ProductDescriptionBuilderDialog";
import type { PageBuilderData } from "@/components/page-builder/types";
import VariationsBuilder, { VariationOption } from "@/components/products/VariationsBuilder";
import VariantMatrix, { VariantEntry } from "@/components/products/VariantMatrix";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  sku?: string;
  inventory_quantity?: number;
  is_active: boolean;
  images: any;
  description?: string;
  short_description?: string;
  category_id?: string;
  store_id: string;
}

interface Category {
  id: string;
  name: string;
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
    price: '',
    compare_price: '',
    cost_price: '',
    sku: '',
    track_inventory: false,
    inventory_quantity: '',
    category_id: '',
    is_active: true,
    images: [] as string[],
    video_url: '',
    seo_title: '',
    seo_description: '',
  });

  const [hasVariants, setHasVariants] = useState(false);
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>([]);

  // Shipping & returns toggles
  const [enableFreeShipping, setEnableFreeShipping] = useState(false);
  const [freeShippingMin, setFreeShippingMin] = useState<string>('');
  const [easyReturnsEnabled, setEasyReturnsEnabled] = useState(false);
  const [easyReturnsDays, setEasyReturnsDays] = useState<string>('30');

  // Action buttons & payments
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


  useEffect(() => {
    if (user && id) {
      fetchProduct();
      fetchCategories();
    }
  }, [user, id]);

  const fetchProduct = async () => {
    try {
      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .in('store_id', stores.map(store => store.id))
          .single();

        if (productError) throw productError;
        
        setFormData({
          name: product.name || '',
          short_description: product.short_description || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          compare_price: product.compare_price?.toString() || '',
          cost_price: product.cost_price?.toString() || '',
          sku: product.sku || '',
          track_inventory: !!product.track_inventory,
          inventory_quantity: product.inventory_quantity?.toString() || '',
          category_id: product.category_id || '',
          is_active: product.is_active,
          images: Array.isArray(product.images) ? product.images.filter((i: any) => typeof i === 'string') : [],
          video_url: (product as any).video_url || '',
          seo_title: (product as any).seo_title || '',
          seo_description: (product as any).seo_description || '',
          
          // Action buttons & payments
          
        });

        // Shipping & returns
        setEnableFreeShipping(!!(product as any).free_shipping_min_amount);
        setFreeShippingMin((product as any).free_shipping_min_amount?.toString() || '');
        setEasyReturnsEnabled(!!(product as any).easy_returns_enabled);
        setEasyReturnsDays((product as any).easy_returns_days?.toString() || '30');

        const v = (product as any).variations;
        if (Array.isArray(v)) {
          setHasVariants(v.length > 0);
          setVariations(v);
          setVariantEntries([]);
        } else if (v && typeof v === 'object') {
          setHasVariants((v.options || []).length > 0);
          setVariations(v.options || []);
          setVariantEntries(v.variants || []);
        } else {
          setHasVariants(false);
          setVariations([]);
          setVariantEntries([]);
        }

        // Action buttons & payments
        const ab = (product as any).action_buttons || {};
        setActionButtons({
          order_now: { enabled: !!ab.order_now?.enabled, label: ab.order_now?.label || 'Order Now' },
          call: { enabled: !!ab.call?.enabled, label: ab.call?.label || 'Call Now', phone: ab.call?.phone || '' },
          whatsapp: { enabled: !!ab.whatsapp?.enabled, label: ab.whatsapp?.label || 'WhatsApp', url: ab.whatsapp?.url || '' },
        });
        setAllowedPayments(((product as any).allowed_payment_methods || []) as string[]);
        
        // Description builder
        setDescriptionMode(((product as any).description_mode as any) === 'builder' ? 'builder' : 'rich_text');
        setDescriptionBuilder(((product as any).description_builder as any) || { sections: [] });

      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .in('store_id', stores.map(store => store.id))
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        short_description: formData.short_description || null,
        description: formData.description || null,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        sku: formData.sku || null,
        track_inventory: !!formData.track_inventory,
        inventory_quantity: formData.inventory_quantity ? parseInt(formData.inventory_quantity) : null,
        category_id: formData.category_id === 'none' ? null : formData.category_id || null,
        images: formData.images,
        video_url: formData.video_url || null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        free_shipping_min_amount: enableFreeShipping && freeShippingMin ? parseFloat(freeShippingMin) : null,
        easy_returns_enabled: easyReturnsEnabled,
        easy_returns_days: easyReturnsEnabled && easyReturnsDays ? parseInt(easyReturnsDays) : null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
        variations: hasVariants ? { options: variations, variants: variantEntries } : [],
        action_buttons: actionButtons as any,
        allowed_payment_methods: allowedPayments.length ? allowedPayments : null,
        description_mode: descriptionMode,
        description_builder: descriptionBuilder as any,
      } as any;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      navigate(`/dashboard/products/${id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading..." description="Loading product for editing">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted animate-pulse rounded" />
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Product" description="Update product information">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/products')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                    placeholder="Brief product description"
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
                        onChange={(html) => handleInputChange('description', html)}
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

            {/* Pricing & Inventory */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price">Price (৳) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="compare_price">Compare at Price (৳)</Label>
                    <Input
                      id="compare_price"
                      type="number"
                      value={formData.compare_price}
                      onChange={(e) => handleInputChange('compare_price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost_price">Cost Price (৳)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Product SKU"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="track_inventory"
                      checked={!!formData.track_inventory}
                      onCheckedChange={(checked) => handleInputChange('track_inventory', checked)}
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
                        onChange={(e) => handleInputChange('inventory_quantity', e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active">
                      Product is active
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Variations */}
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

          {/* Actions & Payments */}
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

          {/* Media */}
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
                          setFormData((prev) => ({ ...prev, images: newImages }));
                        }}
                        placeholder="Image URL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== index);
                          setFormData((prev) => ({ ...prev, images: newImages }));
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
                      setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, video_url: e.target.value }))}
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

          {/* Category & SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Category & SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="SEO optimized title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  placeholder="SEO meta description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Returns */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch id="free_shipping" checked={enableFreeShipping} onCheckedChange={setEnableFreeShipping} />
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
                  <Switch id="easy_returns" checked={easyReturnsEnabled} onCheckedChange={setEasyReturnsEnabled} />
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

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/products')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </div>

          <ProductDescriptionBuilderDialog
            open={isBuilderOpen}
            onOpenChange={setIsBuilderOpen}
            initialData={descriptionBuilder}
            onSave={(data) => setDescriptionBuilder(data)}
          />
        </form>
      </div>
    </DashboardLayout>
  );
}
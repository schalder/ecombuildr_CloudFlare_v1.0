import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, Package, Upload, X, Plus, MoreVertical, Trash2, Edit, FileImage, Play, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/ui/RichTextEditor";
import ProductDescriptionBuilderDialog from "@/components/products/ProductDescriptionBuilderDialog";
import type { PageBuilderData } from "@/components/page-builder/types";
import VariationsBuilder, { VariationOption } from "@/components/products/VariationsBuilder";
import VariantMatrix, { VariantEntry } from "@/components/products/VariantMatrix";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { parseVideoUrl, buildEmbedUrl } from "@/components/page-builder/utils/videoUtils";
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
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
    weight_kg: '0',
    shipping_config: {
      type: 'default' as 'default' | 'fixed' | 'weight_surcharge' | 'free',
      fixedFee: 0,
      weightSurcharge: 0,
      freeShippingEnabled: false,
    },
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
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        setStoreId(stores[0].id);

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
        weight_grams: Math.round((parseFloat(formData.weight_kg) || 0) * 1000),
        shipping_config: formData.shipping_config,
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
        <Accordion type="multiple" defaultValue={["basic", "product", "pricing", "inventory", "shipping", "variations", "actions", "media", "seo", "status"]} className="space-y-4">
          {/* Selling Channel & Category */}
          <AccordionItem value="basic" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Selling Channel & Category</h3>
                <p className="text-sm text-muted-foreground">Choose website and category for this product.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
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
            </AccordionContent>
          </AccordionItem>

          {/* Product Information */}
          <AccordionItem value="product" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Information
                </h3>
                <p className="text-sm text-muted-foreground">Basic product details and description.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
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
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Pricing */}
          <AccordionItem value="pricing" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Pricing</h3>
                <p className="text-sm text-muted-foreground">Set product prices and costs.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
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
            </AccordionContent>
          </AccordionItem>

          {/* Inventory */}
          <AccordionItem value="inventory" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Inventory</h3>
                <p className="text-sm text-muted-foreground">Track product inventory and weight.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track_inventory"
                    checked={formData.track_inventory}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, track_inventory: checked }))}
                  />
                  <Label htmlFor="track_inventory">Track inventory</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.5"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Product weight in kilograms (e.g., 0.5 for 500g, 2 for 2kg). Used for weight-based shipping calculations.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Shipping Configuration */}
          <AccordionItem value="shipping" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Shipping Configuration</h3>
                <p className="text-sm text-muted-foreground">Configure product-specific shipping options.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <Label>Shipping Type</Label>
                  <Select 
                    value={formData.shipping_config.type} 
                    onValueChange={(value: 'default' | 'fixed' | 'weight_surcharge' | 'free') => 
                      setFormData(prev => ({ 
                        ...prev, 
                        shipping_config: { ...prev.shipping_config, type: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use Website Rules</SelectItem>
                      <SelectItem value="fixed">Fixed Shipping Fee</SelectItem>
                      <SelectItem value="weight_surcharge">Weight Surcharge</SelectItem>
                      <SelectItem value="free">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Override website shipping rules for this product
                  </p>
                </div>

                {formData.shipping_config.type === 'fixed' && (
                  <div>
                    <Label htmlFor="fixed_fee">Fixed Shipping Fee</Label>
                    <Input
                      id="fixed_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                      value={formData.shipping_config.fixedFee}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        shipping_config: { 
                          ...prev.shipping_config, 
                          fixedFee: Number(e.target.value) || 0 
                        }
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Fixed shipping cost per item regardless of quantity
                    </p>
                  </div>
                )}

                {formData.shipping_config.type === 'weight_surcharge' && (
                  <div>
                    <Label htmlFor="weight_surcharge">Weight Surcharge (per gram)</Label>
                    <Input
                      id="weight_surcharge"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.05"
                      value={formData.shipping_config.weightSurcharge}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        shipping_config: { 
                          ...prev.shipping_config, 
                          weightSurcharge: Number(e.target.value) || 0 
                        }
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Additional cost per gram of product weight
                    </p>
                  </div>
                )}

                {formData.shipping_config.type === 'free' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      This product will always ship for free, regardless of order total or weight.
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Variations */}
          <AccordionItem value="variations" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Product Variations</h3>
                <p className="text-sm text-muted-foreground">Manage product variants and options.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="has_variants"
                    checked={hasVariants}
                    onCheckedChange={(checked) => setHasVariants(!!checked)}
                  />
                  <Label htmlFor="has_variants">This product has multiple variants</Label>
                </div>

                {hasVariants && (
                  <>
                    <VariationsBuilder
                      options={variations}
                      onChange={setVariations}
                    />
                    <VariantMatrix
                      options={variations}
                      variants={variantEntries}
                      onChange={setVariantEntries}
                    />
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Actions */}
          <AccordionItem value="actions" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Action Buttons</h3>
                <p className="text-sm text-muted-foreground">Configure buttons like Order Now, Call, WhatsApp.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <Checkbox
                    id="order_now_enabled"
                    checked={actionButtons.order_now.enabled}
                    onCheckedChange={(checked) => setActionButtons(prev => ({ ...prev, order_now: { ...prev.order_now, enabled: !!checked } }))}
                  />
                  <Label htmlFor="order_now_enabled">Enable Order Now Button</Label>
                  {actionButtons.order_now.enabled && (
                    <Input
                      type="text"
                      value={actionButtons.order_now.label}
                      onChange={(e) => setActionButtons(prev => ({ ...prev, order_now: { ...prev.order_now, label: e.target.value } }))}
                      placeholder="Order Now"
                    />
                  )}
                </div>

                <div>
                  <Checkbox
                    id="call_enabled"
                    checked={actionButtons.call.enabled}
                    onCheckedChange={(checked) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, enabled: !!checked } }))}
                  />
                  <Label htmlFor="call_enabled">Enable Call Button</Label>
                  {actionButtons.call.enabled && (
                    <>
                      <Input
                        type="text"
                        value={actionButtons.call.label}
                        onChange={(e) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, label: e.target.value } }))}
                        placeholder="Call Now"
                      />
                      <Input
                        type="tel"
                        value={actionButtons.call.phone}
                        onChange={(e) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, phone: e.target.value } }))}
                        placeholder="Phone Number"
                      />
                    </>
                  )}
                </div>

                <div>
                  <Checkbox
                    id="whatsapp_enabled"
                    checked={actionButtons.whatsapp.enabled}
                    onCheckedChange={(checked) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, enabled: !!checked } }))}
                  />
                  <Label htmlFor="whatsapp_enabled">Enable WhatsApp Button</Label>
                  {actionButtons.whatsapp.enabled && (
                    <>
                      <Input
                        type="text"
                        value={actionButtons.whatsapp.label}
                        onChange={(e) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, label: e.target.value } }))}
                        placeholder="WhatsApp"
                      />
                      <Input
                        type="url"
                        value={actionButtons.whatsapp.url}
                        onChange={(e) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, url: e.target.value } }))}
                        placeholder="WhatsApp URL"
                      />
                    </>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Media */}
          <AccordionItem value="media" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Media</h3>
                <p className="text-sm text-muted-foreground">Upload images and videos for your product.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <Label>Images</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative rounded overflow-hidden border">
                        <img src={img} alt={`Product image ${idx + 1}`} className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                          onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Open file picker or upload dialog
                        // For simplicity, prompt for URL
                        const url = prompt('Enter image URL');
                        if (url) {
                          setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a video URL to showcase your product.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SEO */}
          <AccordionItem value="seo" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">SEO</h3>
                <p className="text-sm text-muted-foreground">Set SEO metadata for this product.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="Awesome Product - Buy Now"
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                    rows={3}
                    placeholder="High quality product with fast shipping."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Status */}
          <AccordionItem value="status" className="border rounded-lg">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-semibold">Status</h3>
                <p className="text-sm text-muted-foreground">Set product visibility and active status.</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>

        {/* Product Description Builder Dialog */}
        <ProductDescriptionBuilderDialog
          open={isBuilderOpen}
          onOpenChange={setIsBuilderOpen}
          data={descriptionBuilder}
          onChange={setDescriptionBuilder}
        />
      </form>
    </DashboardLayout>
  );
}

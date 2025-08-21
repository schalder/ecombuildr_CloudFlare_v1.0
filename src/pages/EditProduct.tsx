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
import { ArrowLeft, Save, Package, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/ui/RichTextEditor";
import ProductDescriptionBuilderDialog from "@/components/products/ProductDescriptionBuilderDialog";
import type { PageBuilderData } from "@/components/page-builder/types";
import VariationsBuilder, { VariationOption } from "@/components/products/VariationsBuilder";
import VariantMatrix, { VariantEntry } from "@/components/products/VariantMatrix";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { parseVideoUrl, buildEmbedUrl } from "@/components/page-builder/utils/videoUtils";
import { useStoreWebsitesForSelection, useProductWebsiteVisibility } from '@/hooks/useWebsiteVisibility';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
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
    inventory_quantity: '',
    category_id: '',
    is_active: true,
    images: [] as string[],
    video_url: '',
    seo_title: '',
    seo_description: '',
    weight_kg: '', // Store weight in kg for UI, convert to grams for backend
  });

  // Collapsible sections state
  const [allSectionsExpanded, setAllSectionsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState([
    "channel-category", "product-info", "pricing", "status", 
    "variations", "actions-payments", "media", "seo", "shipping"
  ]);

  const [hasVariants, setHasVariants] = useState(false);
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>([]);

  // Shipping configuration
  const [shippingType, setShippingType] = useState<'default' | 'fixed' | 'weight_surcharge' | 'free'>('default');
  const [fixedShippingFee, setFixedShippingFee] = useState<string>('');
  const [weightSurcharge, setWeightSurcharge] = useState<string>('');
  
  // Legacy shipping options (for backward compatibility)
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

  // Get websites and visibility for the product
  const { websites: storeWebsites } = useStoreWebsitesForSelection(storeId);
  const { visibleWebsites, updateVisibility } = useProductWebsiteVisibility(id || '');

  useEffect(() => {
    if (user && id) {
      fetchProduct();
      fetchCategories();
    }
  }, [user, id]);

  // Set selected website from visibility data or default to first website
  useEffect(() => {
    if (visibleWebsites.length > 0) {
      setSelectedWebsiteId(visibleWebsites[0]);
    } else if (storeWebsites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(storeWebsites[0].id);
    }
  }, [visibleWebsites, storeWebsites, selectedWebsiteId]);

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
        
        // Set store ID for filtering
        setStoreId(product.store_id);
        
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
          weight_kg: (product as any).weight_grams ? ((product as any).weight_grams / 1000).toString() : '',
        });

        // Shipping configuration
        const shippingConfig = (product as any).shipping_config;
        if (shippingConfig) {
          setShippingType(shippingConfig.type || 'default');
          setFixedShippingFee(shippingConfig.fixedFee?.toString() || '');
          setWeightSurcharge(shippingConfig.weightSurcharge?.toString() || '');
        }

        // Legacy shipping & returns
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

    if (!selectedWebsiteId) {
      toast({
        title: "Error",
        description: "Please select a website for this product",
        variant: "destructive",
      });
      return;
    }

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
        weight_grams: formData.weight_kg ? parseFloat(formData.weight_kg) * 1000 : null, // Convert kg to grams
        shipping_config: {
          type: shippingType,
          fixedFee: shippingType === 'fixed' && fixedShippingFee ? parseFloat(fixedShippingFee) : undefined,
          weightSurcharge: shippingType === 'weight_surcharge' && weightSurcharge ? parseFloat(weightSurcharge) : undefined,
          freeShippingEnabled: shippingType === 'free',
        },
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

      // Update website visibility if changed
      if (selectedWebsiteId && selectedWebsiteId !== visibleWebsites[0]) {
        await updateVisibility([selectedWebsiteId]);
      }

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

  const toggleAllSections = () => {
    const newExpanded = !allSectionsExpanded;
    setAllSectionsExpanded(newExpanded);
    if (newExpanded) {
      setExpandedSections([
        "channel-category", "product-info", "pricing", "status", 
        "variations", "actions-payments", "media", "seo", "shipping"
      ]);
    } else {
      setExpandedSections([]);
    }
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
          <Button
            variant="outline"
            onClick={toggleAllSections}
            className="gap-2"
          >
            {allSectionsExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand All
              </>
            )}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections} className="w-full space-y-4">
            {/* Selling Website & Category - Moved to Top */}
            <AccordionItem value="channel-category" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    Selling Channel & Category
                  </CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website_id">Selling Website *</Label>
                        <Select value={selectedWebsiteId} onValueChange={setSelectedWebsiteId}>
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
                          onValueChange={(value) => handleInputChange('category_id', value)}
                          disabled={!selectedWebsiteId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedWebsiteId ? "Select a category" : "Select a website first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
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
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Product Information */}
            <AccordionItem value="product-info" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter product name"
                          required
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="short_description">Short Description</Label>
                        <Input
                          id="short_description"
                          value={formData.short_description}
                          onChange={(e) => handleInputChange('short_description', e.target.value)}
                          placeholder="Brief product description"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="weight_kg">Weight (kg)</Label>
                        <Input
                          id="weight_kg"
                          type="number"
                          value={formData.weight_kg}
                          onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                          placeholder="e.g. 0.5 for 500g, 2 for 2kg"
                          step="0.01"
                          min="0"
                          className="mt-2 max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Used for shipping calculations. Enter in kilograms (e.g., 0.2 for 200g, 1.5 for 1.5kg)
                        </p>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="use_builder"
                            checked={descriptionMode === 'builder'}
                            onCheckedChange={(v) => setDescriptionMode(v ? 'builder' : 'rich_text')}
                          />
                          <Label htmlFor="use_builder" className="text-sm font-medium">Use Page Builder for Description</Label>
                        </div>

                        {descriptionMode === 'rich_text' ? (
                          <div className="space-y-3">
                            <Label htmlFor="description">Description</Label>
                            <RichTextEditor
                              value={formData.description}
                              onChange={(html) => handleInputChange('description', html)}
                              placeholder="Write a detailed description..."
                              className="mt-2"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Button type="button" onClick={() => setIsBuilderOpen(true)} className="w-full sm:w-auto">
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
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Pricing & Inventory */}
            <AccordionItem value="pricing" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Pricing & Inventory</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
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
                          className="mt-2"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="compare_price">Compare at Price (৳)</Label>
                        <Input
                          id="compare_price"
                          type="number"
                          value={formData.compare_price}
                          onChange={(e) => handleInputChange('compare_price', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="mt-2"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="cost_price">Cost Price (৳)</Label>
                        <Input
                          id="cost_price"
                          type="number"
                          value={formData.cost_price}
                          onChange={(e) => handleInputChange('cost_price', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => handleInputChange('sku', e.target.value)}
                          placeholder="Enter product SKU"
                          className="mt-2 max-w-md"
                        />
                        <p className="text-sm text-muted-foreground">
                          Unique identifier for inventory tracking (optional)
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="track_inventory"
                            checked={!!formData.track_inventory}
                            onCheckedChange={(checked) => handleInputChange('track_inventory', checked)}
                          />
                          <Label htmlFor="track_inventory" className="text-sm font-medium">Track inventory</Label>
                        </div>

                        {formData.track_inventory && (
                          <div className="space-y-4 ml-6">
                            <Label htmlFor="inventory_quantity">Quantity</Label>
                            <Input
                              id="inventory_quantity"
                              type="number"
                              value={formData.inventory_quantity}
                              onChange={(e) => handleInputChange('inventory_quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              className="mt-2 max-w-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Status */}
            <AccordionItem value="status" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Status</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active" className="text-sm font-medium">
                        Product is active and visible to customers
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Inactive products won't appear on your website but remain in your catalog.
                    </p>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Variations */}
            <AccordionItem value="variations" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Variations</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Switch id="has_variants" checked={hasVariants} onCheckedChange={setHasVariants} />
                      <Label htmlFor="has_variants" className="text-sm font-medium">This product has variants (e.g., Size, Color)</Label>
                    </div>
                    
                    {hasVariants && (
                      <div className="space-y-6 pt-4 border-t">
                        <div>
                          <h4 className="text-sm font-medium mb-3">Product Options</h4>
                          <VariationsBuilder options={variations} onChange={setVariations} />
                        </div>
                        
                        {variations.length > 0 && (
                          <VariantMatrix options={variations} variants={variantEntries} onChange={setVariantEntries} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Actions & Payments */}
            <AccordionItem value="actions-payments" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Product Actions & Payments</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Order Now Button */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="order_now_enabled"
                            checked={actionButtons.order_now.enabled}
                            onCheckedChange={(v) => setActionButtons(prev => ({ ...prev, order_now: { ...prev.order_now, enabled: v } }))}
                          />
                          <Label htmlFor="order_now_enabled" className="text-sm font-medium">Enable "Order Now" button</Label>
                        </div>
                        <div className="space-y-3 ml-6">
                          <Label htmlFor="order_now_label">Button Text</Label>
                          <Input 
                            id="order_now_label" 
                            value={actionButtons.order_now.label}
                            onChange={(e) => setActionButtons(prev => ({ ...prev, order_now: { ...prev.order_now, label: e.target.value } }))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Call Button */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="call_enabled"
                            checked={actionButtons.call.enabled}
                            onCheckedChange={(v) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, enabled: v } }))}
                          />
                          <Label htmlFor="call_enabled" className="text-sm font-medium">Enable Call button</Label>
                        </div>
                        <div className="space-y-3 ml-6">
                          <div>
                            <Label htmlFor="call_label">Button Text</Label>
                            <Input 
                              id="call_label" 
                              value={actionButtons.call.label}
                              onChange={(e) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, label: e.target.value } }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="call_phone">Phone Number</Label>
                            <Input 
                              id="call_phone" 
                              placeholder="e.g. +8801XXXXXXXXX" 
                              value={actionButtons.call.phone || ''}
                              onChange={(e) => setActionButtons(prev => ({ ...prev, call: { ...prev.call, phone: e.target.value } }))}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* WhatsApp Button */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="whatsapp_enabled"
                          checked={actionButtons.whatsapp.enabled}
                          onCheckedChange={(v) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, enabled: v } }))}
                        />
                        <Label htmlFor="whatsapp_enabled" className="text-sm font-medium">Enable WhatsApp button</Label>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ml-6">
                        <div className="space-y-3">
                          <Label htmlFor="whatsapp_label">Button Text</Label>
                          <Input 
                            id="whatsapp_label" 
                            value={actionButtons.whatsapp.label}
                            onChange={(e) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, label: e.target.value } }))}
                            className="mt-2"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="whatsapp_url">WhatsApp URL</Label>
                          <Input 
                            id="whatsapp_url" 
                            placeholder="e.g. https://wa.me/8801XXXXXXXXX?text=Hello" 
                            value={actionButtons.whatsapp.url || ''}
                            onChange={(e) => setActionButtons(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, url: e.target.value } }))}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Methods */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Allowed Payment Methods</Label>
                        <p className="text-sm text-muted-foreground mt-1">Select which payment methods customers can use for this product</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {['cod','bkash','nagad','sslcommerz'].map((method) => (
                          <label key={method} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <Checkbox
                              checked={allowedPayments.includes(method)}
                              onCheckedChange={(v) => setAllowedPayments(prev => v ? [...prev, method] : prev.filter(x => x !== method))}
                            />
                            <span className="capitalize text-sm font-medium">{method === 'sslcommerz' ? 'SSLCommerz' : method}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Leave all unchecked to allow all available payment methods from your store settings.
                      </p>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Media */}
            <AccordionItem value="media" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Media</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
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
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* SEO */}
            <AccordionItem value="seo" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">SEO</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4">
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
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Shipping & Returns */}
            <AccordionItem value="shipping" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Shipping & Returns</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    {/* Product Shipping Configuration */}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="shipping_type" className="text-sm font-medium">Shipping Configuration</Label>
                        <Select value={shippingType} onValueChange={(value: 'default' | 'fixed' | 'weight_surcharge' | 'free') => setShippingType(value)}>
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Select shipping type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Use Website Default</SelectItem>
                            <SelectItem value="fixed">Fixed Shipping Fee</SelectItem>
                            <SelectItem value="weight_surcharge">Weight Surcharge</SelectItem>
                            <SelectItem value="free">Free Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose how shipping is calculated for this product
                        </p>
                      </div>

                      {shippingType === 'fixed' && (
                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                          <Label htmlFor="fixed_shipping_fee" className="text-sm font-medium">Fixed Shipping Fee</Label>
                          <Input
                            id="fixed_shipping_fee"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 50"
                            value={fixedShippingFee}
                            onChange={(e) => setFixedShippingFee(e.target.value)}
                            className="max-w-xs"
                          />
                          <p className="text-sm text-muted-foreground">
                            Fixed fee charged per item regardless of location or weight
                          </p>
                        </div>
                      )}

                      {shippingType === 'weight_surcharge' && (
                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                          <Label htmlFor="weight_surcharge" className="text-sm font-medium">Weight Surcharge (per gram)</Label>
                          <Input
                            id="weight_surcharge"
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="e.g., 0.1"
                            value={weightSurcharge}
                            onChange={(e) => setWeightSurcharge(e.target.value)}
                            className="max-w-xs"
                          />
                          <p className="text-sm text-muted-foreground">
                            Additional fee per gram on top of base shipping (e.g., 0.1 = 10 BDT per 100g)
                          </p>
                        </div>
                      )}

                      {shippingType === 'free' && (
                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                          <div className="flex items-center gap-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm font-medium">Free shipping enabled for this product</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This product will have free shipping regardless of location or order amount
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Legacy Free Shipping Threshold */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch id="free_shipping" checked={enableFreeShipping} onCheckedChange={setEnableFreeShipping} />
                        <Label htmlFor="free_shipping" className="text-sm font-medium">Store-wide free shipping over minimum amount</Label>
                      </div>
                      {enableFreeShipping && (
                        <div className="space-y-3 ml-6">
                          <Label htmlFor="free_shipping_min">Minimum Amount</Label>
                          <Input
                            id="free_shipping_min"
                            type="number"
                            step="0.01"
                            placeholder="e.g., 1000"
                            value={freeShippingMin}
                            onChange={(e) => setFreeShippingMin(e.target.value)}
                            className="max-w-xs"
                          />
                          <p className="text-sm text-muted-foreground">
                            This applies to the entire store, not just this product
                          </p>
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
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

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
          onSave={setDescriptionBuilder}
        />
        </form>
      </div>
    </DashboardLayout>
  );
}
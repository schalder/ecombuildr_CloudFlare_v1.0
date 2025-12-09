import { useState, useEffect, useRef } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Package, Upload, X, Plus, ChevronUp, ChevronDown, Globe, Info, DollarSign, Box, ToggleLeft, Layers, CreditCard, Image, Search, Truck } from "lucide-react";
import { CompactMediaSelector } from "@/components/page-builder/components/CompactMediaSelector";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/ui/RichTextEditor";
import ProductDescriptionBuilderDialog from "@/components/products/ProductDescriptionBuilderDialog";
import type { PageBuilderData } from "@/components/page-builder/types";
import VariationsBuilder, { VariationOption } from "@/components/products/VariationsBuilder";
import VariantMatrix, { VariantEntry } from "@/components/products/VariantMatrix";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { parseVideoUrl, buildEmbedUrl } from "@/components/page-builder/utils/videoUtils";
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';
import { SimpleCategorySelect } from '@/components/products/SimpleCategorySelect';
import { DigitalFileUpload } from '@/components/products/DigitalFileUpload';

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  // Collapsible sections state
  const [allSectionsExpanded, setAllSectionsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState([
    "channel-category", "product-info", "pricing", "status", 
    "variations", "actions-payments", "media", "seo", "shipping"
  ]);
  
  // Active section tracking for sidebar navigation
  const [activeSection, setActiveSection] = useState<string>("channel-category");

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
    show_on_website: true,
    category_id: '',
    seo_title: '',
    seo_description: '',
    images: [] as string[],
    video_url: '',
    weight_kg: '',
    product_type: 'physical' as 'physical' | 'digital',
    digital_files: [] as any[],
    download_limit: 5,
    download_expiry_hours: 168, // 7 days
  });

  // New local states
  const [hasVariants, setHasVariants] = useState(false);
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>([]);
  
  // Shipping configuration
  const [shippingType, setShippingType] = useState<'default' | 'fixed' | 'weight_surcharge' | 'free' | 'custom_options'>('default');
  const [fixedShippingFee, setFixedShippingFee] = useState<string>('');
  const [weightSurcharge, setWeightSurcharge] = useState<string>('');
  const [customShippingOptions, setCustomShippingOptions] = useState<any[]>([]);
  
  // Legacy shipping options (for backward compatibility)
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

  // Navigate to section
  const navigateToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Expand the section if it's collapsed
      if (!expandedSections.includes(sectionId)) {
        setExpandedSections([...expandedSections, sectionId]);
        // Wait a bit for the accordion to expand before scrolling
        setTimeout(() => {
          scrollToSection(element);
        }, 200);
      } else {
        scrollToSection(element);
      }
      setActiveSection(sectionId);
    }
  };

  // Scroll to section with proper offset
  const scrollToSection = (element: HTMLElement) => {
    // Find the scrolling container - use a more reliable selector
    const mainElement = document.querySelector('main') as HTMLElement;
    if (mainElement && mainElement.classList.contains('overflow-auto')) {
      // Calculate proper offset: header (64px) + container padding (24px) = 88px
      const headerHeight = 64; // h-16 = 64px
      const containerPadding = 24; // p-6 = 24px
      const scrollOffset = headerHeight + containerPadding; // 88px
      
      const elementRect = element.getBoundingClientRect();
      const containerRect = mainElement.getBoundingClientRect();
      const scrollPosition = mainElement.scrollTop + (elementRect.top - containerRect.top) - scrollOffset;
      
      mainElement.scrollTo({
        top: Math.max(0, scrollPosition), // Ensure non-negative
        behavior: 'smooth'
      });
    } else {
      // Fallback to default scrollIntoView with offset
      const yOffset = -88; // Account for header + padding
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section elements
    const sectionIds = [
      "channel-category", "product-info", "pricing", "inventory", 
      "status", "variations", "actions-payments", "media", "seo", "shipping"
    ];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [expandedSections]);

  // Define section navigation items
  const sectionNavItems = [
    { id: "channel-category", label: "Channel & Category", icon: Globe },
    { id: "product-info", label: "Product Information", icon: Info },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    ...(formData.product_type === 'physical' ? [{ id: "inventory", label: "Inventory", icon: Box }] : []),
    { id: "status", label: "Status", icon: ToggleLeft },
    { id: "variations", label: "Variations", icon: Layers },
    { id: "actions-payments", label: "Actions & Payments", icon: CreditCard },
    { id: "media", label: "Media", icon: Image },
    { id: "seo", label: "SEO", icon: Search },
    ...(formData.product_type === 'physical' ? [{ id: "shipping", label: "Shipping", icon: Truck }] : []),
  ];

  // Fetch store ID
  useEffect(() => {
    if (user) {
      fetchStoreId();
    }
  }, [user]);

  // Preselect first website if available
  useEffect(() => {
    if (storeWebsites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(storeWebsites[0].id);
    }
  }, [storeWebsites, selectedWebsiteId]);

  const fetchStoreId = async () => {
    try {
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        setStoreId(stores[0].id);
      }
    } catch (error) {
      console.error('🏪 AddProduct - Error fetching store ID:', error);
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
      // Create fallback slug if baseSlug is empty
      let slug = baseSlug || `p-${Date.now().toString(36)}`;
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

      // Guard: Ensure website is selected
      console.log('💾 AddProduct - Form submission validation:', {
        selectedWebsiteId,
        formDataCategoryId: formData.category_id
      });

      if (!selectedWebsiteId) {
        console.log('❌ AddProduct - No website selected, blocking submission');
        toast({
          title: "Error",
          description: "Please select a website for this product.",
          variant: "destructive",
        });
        return;
      }

      // Build insert object explicitly (avoid spreading UI-only fields)
      const productData = {
        store_id: stores[0].id,
        slug,
        name: formData.name,
        short_description: formData.short_description,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        sku: formData.sku || null,
        track_inventory: formData.product_type === 'physical' ? formData.track_inventory : false,
        inventory_quantity: formData.product_type === 'physical' ? parseInt(formData.inventory_quantity) || 0 : 0,
        is_active: formData.is_active,
        show_on_website: formData.show_on_website,
        category_id: formData.category_id || null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        images: formData.images,
        video_url: formData.video_url || null,
        weight_grams: Math.round((parseFloat(formData.weight_kg) || 0) * 1000),
        // New fields
        variations: hasVariants ? { options: variations, variants: variantEntries } : [],
        shipping_config: formData.product_type === 'physical' ? {
          type: shippingType,
          fixedFee: shippingType === 'fixed' && fixedShippingFee ? parseFloat(fixedShippingFee) : undefined,
          weightSurcharge: shippingType === 'weight_surcharge' && weightSurcharge ? parseFloat(weightSurcharge) : undefined,
          freeShippingEnabled: shippingType === 'free',
          customOptions: shippingType === 'custom_options' ? customShippingOptions : undefined,
        } : null,
        free_shipping_min_amount: formData.product_type === 'physical' && enableFreeShipping && freeShippingMin ? parseFloat(freeShippingMin) : null,
        easy_returns_enabled: easyReturnsEnabled,
        easy_returns_days: easyReturnsEnabled && easyReturnsDays ? parseInt(easyReturnsDays) : null,
        action_buttons: actionButtons as any,
        allowed_payment_methods: allowedPayments.length ? allowedPayments : null,
        description_mode: descriptionMode,
        description_builder: descriptionBuilder as any,
        product_type: formData.product_type,
        digital_files: formData.digital_files,
        download_limit: formData.download_limit,
        download_expiry_hours: formData.download_expiry_hours,
      };

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Add website visibility records
      console.log('🔗 AddProduct - Creating website visibility:', {
        selectedWebsiteId,
        newProductId: newProduct?.id
      });

      if (selectedWebsiteId && newProduct?.id) {
        const { error: visibilityError } = await supabase
          .from('product_website_visibility')
          .insert({
            product_id: newProduct.id,
            website_id: selectedWebsiteId
          });

        if (visibilityError) {
          console.error('❌ AddProduct - Visibility error:', visibilityError);
          throw visibilityError;
        }
        
        console.log('✅ AddProduct - Website visibility created successfully');
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
      <div className="space-y-8">
        {/* Header with Collapse All */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Product</h1>
            <p className="text-muted-foreground">Create a new product for your store</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loading}
            >
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
        </div>

        <div className="flex gap-6 items-start relative">
          {/* Main Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 space-y-6">
          <Accordion 
            type="multiple" 
            value={expandedSections} 
            onValueChange={setExpandedSections} 
            className="w-full space-y-4"
          >
            {/* Selling Channel & Category */}
            <AccordionItem value="channel-category" id="channel-category" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    Selling Channel & Category
                  </CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="website_id">Selling Website *</Label>
                        <Select value={selectedWebsiteId} onValueChange={(value) => {
                          console.log('🌐 AddProduct - Website selection changed:', {
                            from: selectedWebsiteId,
                            to: value,
                            websiteName: storeWebsites.find(w => w.id === value)?.name
                          });
                          setSelectedWebsiteId(value);
                        }}>
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

                      <div className="space-y-3">
                        <SimpleCategorySelect
                          value={formData.category_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                          storeId={storeId}
                          websiteId={selectedWebsiteId}
                          disabled={!selectedWebsiteId}
                          placeholder={selectedWebsiteId ? "Select a category" : "Select a website first"}
                        />
                        <p className="text-sm text-muted-foreground">
                          Select a main category first, then choose a subcategory if available.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Product Information */}
            <AccordionItem value="product-info" id="product-info" className="border rounded-lg">
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
                      {/* Product Type Selector */}
                      <div>
                        <Label htmlFor="product_type">Product Type *</Label>
                        <Select
                          value={formData.product_type}
                          onValueChange={(value: 'physical' | 'digital') => 
                            setFormData(prev => ({ ...prev, product_type: value }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physical">Physical Product</SelectItem>
                            <SelectItem value="digital">Digital Product</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                          onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                          placeholder="Brief product description"
                          className="mt-2"
                        />
                      </div>

                      {formData.product_type === 'physical' && (
                        <div>
                          <Label htmlFor="weight_kg">Weight (kg)</Label>
                          <Input
                            id="weight_kg"
                            type="number"
                            value={formData.weight_kg}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                            placeholder="e.g. 0.5 for 500g, 2 for 2kg"
                            step="0.01"
                            min="0"
                            className="mt-2 max-w-xs"
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            Used for shipping calculations. Enter in kilograms (e.g., 0.2 for 200g, 1.5 for 1.5kg)
                          </p>
                        </div>
                      )}

                      {/* Digital Product Settings */}
                      {formData.product_type === 'digital' && (
                        <div className="space-y-4">
                          <DigitalFileUpload
                            files={formData.digital_files}
                            onChange={(files) => setFormData(prev => ({ ...prev, digital_files: files }))}
                            label="Digital Files"
                            storeId={storeId}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="download_limit">Download Limit</Label>
                              <Input
                                id="download_limit"
                                type="number"
                                value={formData.download_limit}
                                onChange={(e) => setFormData(prev => ({ ...prev, download_limit: parseInt(e.target.value) || 5 }))}
                                placeholder="5"
                                min="1"
                                max="100"
                                className="mt-2"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Maximum number of downloads per customer
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="download_expiry_hours">Download Expiry (Hours)</Label>
                              <Select
                                value={formData.download_expiry_hours.toString()}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, download_expiry_hours: parseInt(value) }))}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="24">24 Hours (1 Day)</SelectItem>
                                  <SelectItem value="72">72 Hours (3 Days)</SelectItem>
                                  <SelectItem value="168">168 Hours (7 Days)</SelectItem>
                                  <SelectItem value="336">336 Hours (14 Days)</SelectItem>
                                  <SelectItem value="720">720 Hours (30 Days)</SelectItem>
                                  <SelectItem value="0">Never Expire</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-muted-foreground mt-1">
                                How long download links remain active
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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
                              onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
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

            {/* Pricing */}
            <AccordionItem value="pricing" id="pricing" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Pricing</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          required
                          className="mt-2"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="compare_price">Compare at Price</Label>
                        <Input
                          id="compare_price"
                          type="number"
                          step="0.01"
                          value={formData.compare_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, compare_price: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="cost_price">Cost Price</Label>
                        <Input
                          id="cost_price"
                          type="number"
                          step="0.01"
                          value={formData.cost_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Inventory - Only for physical products */}
            {formData.product_type === 'physical' && (
              <AccordionItem value="inventory" id="inventory" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Inventory</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="track_inventory"
                        checked={formData.track_inventory}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, track_inventory: checked }))}
                      />
                      <Label htmlFor="track_inventory" className="text-sm font-medium">Track inventory</Label>
                    </div>

                    {formData.track_inventory && (
                      <div className="space-y-4">
                        <Label htmlFor="inventory_quantity">Quantity</Label>
                        <Input
                          id="inventory_quantity"
                          type="number"
                          value={formData.inventory_quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, inventory_quantity: e.target.value }))}
                          placeholder="0"
                          min="0"
                          className="mt-2 max-w-xs"
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-4">
                      <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Enter product SKU"
                        className="mt-2 max-w-md"
                      />
                      <p className="text-sm text-muted-foreground">
                        Unique identifier for inventory tracking (optional)
                      </p>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
            )}

            {/* Status */}
            <AccordionItem value="status" id="status" className="border rounded-lg">
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
                        Product is active
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-9">
                      Active products can be used in funnels and orders. Inactive products are disabled everywhere.
                    </p>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-3">
                      <Switch
                        id="show_on_website"
                        checked={formData.show_on_website}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_on_website: checked }))}
                        disabled={!formData.is_active}
                      />
                      <Label htmlFor="show_on_website" className="text-sm font-medium">
                        Show on website
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-9">
                      {formData.is_active 
                        ? "When enabled, this product will appear on your website storefront. When disabled, it will be hidden from the website but can still be used in funnels."
                        : "Enable 'Product is active' first to control website visibility."
                      }
                    </p>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Variations */}
            <AccordionItem value="variations" id="variations" className="border rounded-lg">
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
            <AccordionItem value="actions-payments" id="actions-payments" className="border rounded-lg">
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
                              placeholder="e.g. +8801XXXXXXXXXX" 
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
                            placeholder="e.g. https://wa.me/8801XXXXXXXXXX?text=Hello" 
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
                        {['cod','bkash','nagad','eps','ebpay','stripe'].map((method) => (
                          <label key={method} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <Checkbox
                              checked={allowedPayments.includes(method)}
                              onCheckedChange={(v) => setAllowedPayments(prev => v ? [...prev, method] : prev.filter(x => x !== method))}
                            />
                            <span className="capitalize text-sm font-medium">
                              {method === 'eps' ? 'EPS' : 
                               method === 'ebpay' ? 'EB Pay' : 
                               method === 'stripe' ? 'Stripe' : 
                               method}
                            </span>
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
            <AccordionItem value="media" id="media" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">Media</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Product Images</Label>
                      <div className="space-y-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <CompactMediaSelector
                              value={image}
                              onChange={(newUrl) => {
                                const newImages = [...formData.images];
                                newImages[index] = newUrl;
                                setFormData((prev) => ({ ...prev, images: newImages }));
                              }}
                              label={`Image ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newImages = formData.images.filter((_, i) => i !== index);
                                setFormData((prev) => ({ ...prev, images: newImages }));
                              }}
                              className="mt-3"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Image
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Image
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="video_url">Product Video (optional)</Label>
                      <Input
                        id="video_url"
                        type="url"
                        value={formData.video_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        Add a video URL to showcase your product.
                      </p>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* SEO */}
            <AccordionItem value="seo" id="seo" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <CardTitle className="text-base font-semibold">SEO</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={formData.seo_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                        placeholder="Awesome Product - Buy Now"
                        className="mt-2"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label htmlFor="seo_description">SEO Description</Label>
                      <Textarea
                        id="seo_description"
                        value={formData.seo_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        rows={3}
                        placeholder="High quality product with fast shipping."
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Shipping & Returns - Only for physical products */}
            {formData.product_type === 'physical' && (
              <AccordionItem value="shipping" id="shipping" className="border rounded-lg">
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
                            <SelectItem value="custom_options">Custom Shipping Options</SelectItem>
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

                      {shippingType === 'custom_options' && (
                        <div className="space-y-4 pl-4 border-l-2 border-muted">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Custom Shipping Options</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOption = {
                                  id: Date.now().toString(),
                                  label: 'New Option',
                                  fee: 0,
                                  description: '',
                                  isDefault: customShippingOptions.length === 0
                                };
                                setCustomShippingOptions([...customShippingOptions, newOption]);
                              }}
                            >
                              Add Option
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Create specific shipping choices for customers (e.g., "Inside Dhaka City", "Outside Dhaka")
                          </p>
                          
                          {customShippingOptions.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              No custom shipping options yet. Click "Add Option" to create one.
                            </div>
                          )}
                          
                          {customShippingOptions.map((option, index) => (
                            <div key={option.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="defaultShippingOption"
                                    checked={option.isDefault}
                                    onChange={() => {
                                      setCustomShippingOptions(opts => 
                                        opts.map(opt => ({ ...opt, isDefault: opt.id === option.id }))
                                      );
                                    }}
                                  />
                                  <span className="text-sm font-medium">Default Option</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCustomShippingOptions(opts => opts.filter(opt => opt.id !== option.id));
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-sm">Option Label</Label>
                                  <Input
                                    value={option.label}
                                    onChange={(e) => {
                                      setCustomShippingOptions(opts =>
                                        opts.map(opt => opt.id === option.id ? { ...opt, label: e.target.value } : opt)
                                      );
                                    }}
                                    placeholder="e.g., Inside Dhaka City"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Shipping Fee</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={option.fee}
                                    onChange={(e) => {
                                      setCustomShippingOptions(opts =>
                                        opts.map(opt => opt.id === option.id ? { ...opt, fee: parseFloat(e.target.value) || 0 } : opt)
                                      );
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm">Description (Optional)</Label>
                                <Input
                                  value={option.description || ''}
                                  onChange={(e) => {
                                    setCustomShippingOptions(opts =>
                                      opts.map(opt => opt.id === option.id ? { ...opt, description: e.target.value } : opt)
                                    );
                                  }}
                                  placeholder="e.g., Delivery within 24 hours"
                                />
                              </div>
                            </div>
                          ))}
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

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch id="easy_returns" checked={easyReturnsEnabled} onCheckedChange={setEasyReturnsEnabled} />
                        <Label htmlFor="easy_returns" className="text-sm font-medium">Enable Easy Returns</Label>
                      </div>
                      {easyReturnsEnabled && (
                        <div className="space-y-3 ml-6">
                          <Label htmlFor="easy_returns_days">Return Period (Days)</Label>
                          <Input
                            id="easy_returns_days"
                            type="number"
                            placeholder="e.g., 30"
                            value={easyReturnsDays}
                            onChange={(e) => setEasyReturnsDays(e.target.value)}
                            className="mt-2 max-w-xs"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
            )}
          </Accordion>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-6 border-t">
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
            initialData={descriptionBuilder}
            onSave={setDescriptionBuilder}
          />
        </form>

        {/* Spacer for sidebar on desktop - maintains layout spacing */}
        <div className="hidden lg:block w-64 shrink-0" aria-hidden="true" />

        {/* Fixed Sidebar Navigation - Positioned relative to viewport */}
        <aside className="hidden lg:block fixed right-6 top-[136px] w-64 z-40">
          <Card className="border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1 px-2 pb-4">
                {sectionNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateToSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>
      </div>
      </div>
    </DashboardLayout>
  );
}

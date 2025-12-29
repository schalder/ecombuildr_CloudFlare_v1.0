import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, Save, Package, ChevronUp, ChevronDown, X, Plus, Clock, Globe, Info, DollarSign, Box, ToggleLeft, Layers, CreditCard, Image, Search, Truck } from "lucide-react";
import { CompactMediaSelector } from "@/components/page-builder/components/CompactMediaSelector";
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
import { SimpleCategorySelect } from "@/components/products/SimpleCategorySelect";
import { DigitalFileUpload } from '@/components/products/DigitalFileUpload';

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
  product_type: 'physical' | 'digital';
  digital_files: any[];
  download_limit: number;
  download_expiry_hours: number;
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
  const formRef = useRef<HTMLFormElement>(null);
  
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
    show_on_website: true,
    images: [] as string[],
    video_url: '',
    seo_title: '',
    seo_description: '',
    weight_kg: '', // Store weight in kg for UI, convert to grams for backend
    urgency_timer_enabled: false,
    urgency_timer_duration: 60,
    urgency_timer_text: 'Limited Time Offer!',
    urgency_timer_color: '#ef4444',
    urgency_timer_text_color: '#ffffff',
    product_type: 'physical' as 'physical' | 'digital',
    digital_files: [] as any[],
    download_limit: 5,
    download_expiry_hours: 168, // 7 days
  });

  // Collapsible sections state
  const [allSectionsExpanded, setAllSectionsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState([
    "channel-category", "product-info", "pricing", "status", 
    "variations", "actions-payments", "media", "seo", "shipping"
  ]);
  
  // Active section tracking for sidebar navigation
  const [activeSection, setActiveSection] = useState<string>("channel-category");

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

  // Action buttons & payments
  const [actionButtons, setActionButtons] = useState({
    order_now: { enabled: false, label: 'Order Now' },
    call: { enabled: false, label: 'Call Now', phone: '' },
    whatsapp: { enabled: false, label: 'WhatsApp', url: '' },
  });
const [allowedPayments, setAllowedPayments] = useState<string[]>([]);

  // COD upfront shipping collection
  const [collectShippingUpfront, setCollectShippingUpfront] = useState(false);
  const [upfrontShippingPaymentMethod, setUpfrontShippingPaymentMethod] = useState<string>('');

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

  // Set selected website from visibility data or default to first website (only on initial load)
  useEffect(() => {
    // Only set initial website selection, don't override user changes
    if (!selectedWebsiteId) {
      if (visibleWebsites.length > 0) {
        setSelectedWebsiteId(visibleWebsites[0]);
      } else if (storeWebsites.length > 0) {
        setSelectedWebsiteId(storeWebsites[0].id);
      }
    }
  }, [visibleWebsites, storeWebsites]); // Removed selectedWebsiteId from dependencies

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

        // Don't clear category_id - let user see their original selection
        // This preserves the product's original category on edit page load
      } catch (error) {
        console.error('📂 EditProduct - Error filtering categories:', error);
        setFilteredCategories([]);
      }
    };

    filterCategories();
  }, [selectedWebsiteId, categories, formData.category_id]);

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
        
        const categoryIdValue = product.category_id || '';
        
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
          category_id: categoryIdValue,
          is_active: product.is_active,
          show_on_website: (product as any).show_on_website !== undefined ? (product as any).show_on_website : true,
          images: Array.isArray(product.images) ? product.images.filter((i: any) => typeof i === 'string') : [],
          video_url: (product as any).video_url || '',
          seo_title: (product as any).seo_title || '',
          seo_description: (product as any).seo_description || '',
          weight_kg: (product as any).weight_grams ? ((product as any).weight_grams / 1000).toString() : '',
          urgency_timer_enabled: !!(product as any).urgency_timer_enabled,
          urgency_timer_duration: (product as any).urgency_timer_duration || 60,
          urgency_timer_text: (product as any).urgency_timer_text || 'Limited Time Offer!',
          urgency_timer_color: (product as any).urgency_timer_color || '#ef4444',
          urgency_timer_text_color: (product as any).urgency_timer_text_color || '#ffffff',
          product_type: (product as any).product_type || 'physical',
          digital_files: (product as any).digital_files || [],
          download_limit: (product as any).download_limit || 5,
          download_expiry_hours: (product as any).download_expiry_hours || 168,
        });

        // Shipping configuration
        const shippingConfig = (product as any).shipping_config;
        if (shippingConfig) {
          setShippingType(shippingConfig.type || 'default');
          setFixedShippingFee(shippingConfig.fixedFee?.toString() || '');
          setWeightSurcharge(shippingConfig.weightSurcharge?.toString() || '');
          setCustomShippingOptions(shippingConfig.customOptions || []);
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
        
        // COD upfront shipping collection
        setCollectShippingUpfront(!!(product as any).collect_shipping_upfront);
        setUpfrontShippingPaymentMethod((product as any).upfront_shipping_payment_method || '');
        
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

    // Validate upfront shipping payment method
    if (formData.product_type === 'physical' && collectShippingUpfront && !upfrontShippingPaymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please select a payment method for upfront shipping fee collection.",
        variant: "destructive",
      });
      setSaving(false);
      // Navigate to the actions-payments section
      navigateToSection('actions-payments');
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
        urgency_timer_enabled: formData.urgency_timer_enabled,
        urgency_timer_duration: formData.urgency_timer_duration,
        urgency_timer_text: formData.urgency_timer_text,
        urgency_timer_color: formData.urgency_timer_color,
        urgency_timer_text_color: formData.urgency_timer_text_color,
        shipping_config: {
          type: shippingType,
          fixedFee: shippingType === 'fixed' && fixedShippingFee ? parseFloat(fixedShippingFee) : undefined,
          weightSurcharge: shippingType === 'weight_surcharge' && weightSurcharge ? parseFloat(weightSurcharge) : undefined,
          freeShippingEnabled: shippingType === 'free',
          customOptions: shippingType === 'custom_options' ? customShippingOptions : undefined,
        },
        free_shipping_min_amount: enableFreeShipping && freeShippingMin ? parseFloat(freeShippingMin) : null,
        easy_returns_enabled: easyReturnsEnabled,
        easy_returns_days: easyReturnsEnabled && easyReturnsDays ? parseInt(easyReturnsDays) : null,
        is_active: formData.is_active,
        show_on_website: formData.show_on_website,
        updated_at: new Date().toISOString(),
        variations: hasVariants ? { options: variations, variants: variantEntries } : [],
        action_buttons: actionButtons as any,
        allowed_payment_methods: allowedPayments.length ? allowedPayments : null,
        description_mode: descriptionMode,
        description_builder: descriptionBuilder as any,
        product_type: formData.product_type,
        digital_files: formData.digital_files,
        download_limit: formData.download_limit,
        download_expiry_hours: formData.download_expiry_hours,
        collect_shipping_upfront: formData.product_type === 'physical' ? collectShippingUpfront : false,
        upfront_shipping_payment_method: formData.product_type === 'physical' && collectShippingUpfront && upfrontShippingPaymentMethod ? upfrontShippingPaymentMethod : null,
      } as any;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Always update website visibility to ensure product is visible on selected website
      // This handles moving products between websites within the same store
      await updateVisibility([selectedWebsiteId]);

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

  const handleInputChange = (field: string, value: string | boolean | number) => {
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={saving}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Product
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

        <div className="flex flex-wrap gap-6 items-start relative lg:pr-72">
          {/* Main Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="w-full lg:flex-1 lg:max-w-5xl space-y-6">
          <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections} className="w-full space-y-4">
            {/* Selling Website & Category - Moved to Top */}
            <AccordionItem value="channel-category" id="channel-category" className="border rounded-lg">
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
                        <Select value={selectedWebsiteId} onValueChange={(value) => {
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

                      <SimpleCategorySelect
                        value={formData.category_id}
                        onValueChange={(value) => {
                          handleInputChange('category_id', value);
                        }}
                        storeId={storeId}
                        websiteId={selectedWebsiteId}
                        disabled={!selectedWebsiteId}
                        placeholder={selectedWebsiteId ? "Select a category" : "Select a website first"}
                      />
                      {/* Debug: Show current formData.category_id */}
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Debug: formData.category_id = "{formData.category_id}" | selectedWebsiteId = "{selectedWebsiteId}" | storeId = "{storeId}"
                        </p>
                      )}
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

                      {formData.product_type === 'physical' && (
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
                      )}

                      {/* Digital Product Settings */}
                      {formData.product_type === 'digital' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <Label className="text-sm font-medium">Digital Product Settings</Label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="download_limit">Download Limit</Label>
                              <Input
                                id="download_limit"
                                type="number"
                                value={formData.download_limit}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  download_limit: parseInt(e.target.value) || 5 
                                }))}
                                min="1"
                                max="100"
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Maximum number of downloads per purchase
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="download_expiry_hours">Download Expiry (hours)</Label>
                              <Input
                                id="download_expiry_hours"
                                type="number"
                                value={formData.download_expiry_hours}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  download_expiry_hours: parseInt(e.target.value) || 168 
                                }))}
                                min="1"
                                max="8760"
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Hours after purchase when downloads expire (168 = 7 days)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator className="my-6" />

                      {/* Digital Files for Digital Products */}
                      {formData.product_type === 'digital' && (
                        <div className="space-y-4">
                          <DigitalFileUpload
                            files={formData.digital_files}
                            onChange={(files) => setFormData(prev => ({ ...prev, digital_files: files }))}
                            label="Digital Files"
                            storeId={storeId}
                          />
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
            <AccordionItem value="pricing" id="pricing" className="border rounded-lg">
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
                            checked={formData.product_type === 'physical' ? !!formData.track_inventory : false}
                            onCheckedChange={(checked) => handleInputChange('track_inventory', checked)}
                            disabled={formData.product_type === 'digital'}
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

                    {/* Urgency Timer */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Urgency Timer</Label>
                        <p className="text-sm text-muted-foreground mt-1">Add an evergreen countdown timer to create urgency and boost conversions</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch
                          id="urgency_timer_enabled"
                          checked={!!formData.urgency_timer_enabled}
                          onCheckedChange={(checked) => handleInputChange('urgency_timer_enabled', checked)}
                        />
                        <Label htmlFor="urgency_timer_enabled" className="text-sm font-medium">Enable urgency timer</Label>
                      </div>

                      {formData.urgency_timer_enabled && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ml-6 pt-4 border-t border-border/50">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="urgency_timer_duration">Timer Duration (minutes)</Label>
                              <Input
                                id="urgency_timer_duration"
                                type="number"
                                min="1"
                                max="1440"
                                value={formData.urgency_timer_duration || 60}
                                onChange={(e) => handleInputChange('urgency_timer_duration', parseInt(e.target.value) || 60)}
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">How long the timer should run (1-1440 minutes)</p>
                            </div>
                            
                            <div>
                              <Label htmlFor="urgency_timer_text">Timer Text</Label>
                              <Input
                                id="urgency_timer_text"
                                value={formData.urgency_timer_text || 'Limited Time Offer!'}
                                onChange={(e) => handleInputChange('urgency_timer_text', e.target.value)}
                                placeholder="Limited Time Offer!"
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Text displayed with the timer</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="urgency_timer_color">Background Color</Label>
                              <Input
                                id="urgency_timer_color"
                                type="color"
                                value={formData.urgency_timer_color || '#ef4444'}
                                onChange={(e) => handleInputChange('urgency_timer_color', e.target.value)}
                                className="mt-2 h-10 w-20"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Timer background color</p>
                            </div>
                            
                            <div>
                              <Label htmlFor="urgency_timer_text_color">Text Color</Label>
                              <Input
                                id="urgency_timer_text_color"
                                type="color"
                                value={formData.urgency_timer_text_color || '#ffffff'}
                                onChange={(e) => handleInputChange('urgency_timer_text_color', e.target.value)}
                                className="mt-2 h-10 w-20"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Timer text color</p>
                            </div>
                          </div>
                        </div>
                      )}
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

                    {/* COD Upfront Shipping Collection - Only for physical products */}
                    {formData.product_type === 'physical' && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">COD Shipping Fee Collection</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Collect shipping fee upfront to reduce fake orders. Product price will still be collected on delivery.
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              id="collect_shipping_upfront"
                              checked={collectShippingUpfront}
                              onCheckedChange={(checked) => {
                                setCollectShippingUpfront(checked);
                                if (!checked) {
                                  setUpfrontShippingPaymentMethod('');
                                }
                              }}
                            />
                            <Label htmlFor="collect_shipping_upfront" className="text-sm font-medium">
                              Collect shipping fee upfront for COD orders
                            </Label>
                          </div>
                          {collectShippingUpfront && (
                            <div className="ml-6 space-y-3">
                              <div>
                                <Label htmlFor="upfront_shipping_payment_method" className="text-sm font-medium">
                                  Payment Method for Upfront Shipping Fee <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={upfrontShippingPaymentMethod}
                                  onValueChange={setUpfrontShippingPaymentMethod}
                                >
                                  <SelectTrigger className="mt-2 max-w-md">
                                    <SelectValue placeholder="Select payment method" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="eps">EPS</SelectItem>
                                    <SelectItem value="ebpay">EB Pay</SelectItem>
                                    <SelectItem value="stripe">Stripe</SelectItem>
                                    <SelectItem value="bkash">bKash</SelectItem>
                                    <SelectItem value="nagad">Nagad</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Customers will pay the shipping fee using this method. Product price will be collected on delivery (COD).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
                  <CardContent className="space-y-4">
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
            <AccordionItem value="seo" id="seo" className="border rounded-lg">
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
                        <Select value={shippingType} onValueChange={(value: 'default' | 'fixed' | 'weight_surcharge' | 'free' | 'custom_options') => setShippingType(value)}>
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
            )}
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

        {/* Fixed Sidebar Navigation - always visible on scroll, vertically centered */}
        <aside className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 w-64 z-40 h-fit max-h-[calc(100vh-6rem)] overflow-auto">
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
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDomainManagement } from '@/hooks/useDomainManagement';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';

const websiteSettingsSchema = z.object({
  name: z.string().min(1, 'Website name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Website slug is required'),
  domain: z.string().optional(),
  is_published: z.boolean(),
  is_active: z.boolean(),
  favicon_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  header_tracking_code: z.string().optional(),
  footer_tracking_code: z.string().optional(),
  facebook_pixel_id: z.string().optional(),
  google_analytics_id: z.string().optional(),
  google_ads_id: z.string().optional(),
  currency_code: z.enum(['BDT','USD','INR','EUR','GBP']).default('BDT'),
  // SEO defaults
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  og_image: z.string().optional(),
  meta_robots: z.string().optional(),
  canonical_domain: z.string().optional(),
  // Product button styles
  product_button_bg: z.string().optional(),
  product_button_text: z.string().optional(),
  product_button_hover_bg: z.string().optional(),
  product_button_hover_text: z.string().optional(),
  variant_button_selected_bg: z.string().optional(),
  variant_button_selected_text: z.string().optional(),
  variant_button_hover_bg: z.string().optional(),
  variant_button_hover_text: z.string().optional(),
});

type WebsiteSettingsForm = z.infer<typeof websiteSettingsSchema>;

interface Website {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  settings: any;
}

interface WebsiteSettingsProps {
  website: Website;
}

// Shipping settings types for per-website configuration
type ShippingCityRule = { city: string; fee: number; label?: string };
type ShippingWeightTier = { maxWeight: number; fee: number; label?: string };
type ShippingSettings = {
  enabled: boolean;
  country?: string;
  restOfCountryFee: number;
  cityRules: ShippingCityRule[];
  // Enhanced settings
  weightTiers?: ShippingWeightTier[];
  freeShippingThreshold?: number; // minimum order amount for free shipping
  freeShippingMinWeight?: number; // minimum weight for free shipping (in grams)
};

export const WebsiteSettings: React.FC<WebsiteSettingsProps> = ({ website }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { 
    domains, 
    connections, 
    loading: domainsLoading, 
    connectContent, 
    removeConnection 
  } = useDomainManagement();

  // Accordion state management for mobile optimization
  const [openSections, setOpenSections] = React.useState<string[]>(
    isMobile ? [] : ['basic', 'domain', 'buttons', 'currency', 'shipping', 'seo', 'tracking']
  );

  const toggleAllSections = () => {
    const allSections = ['basic', 'domain', 'buttons', 'currency', 'shipping', 'seo', 'tracking'];
    if (openSections.length === allSections.length) {
      setOpenSections([]);
    } else {
      setOpenSections(allSections);
    }
  };

  // Find connected domain for this website
  const connectedDomain = React.useMemo(() => {
    const connection = connections.find(c => 
      c.content_type === 'website' && 
      c.content_id === website.id
    );
    if (!connection) return null;
    return domains.find(d => d.id === connection.domain_id) || null;
  }, [connections, domains, website.id]);

  const form = useForm<WebsiteSettingsForm>({
    resolver: zodResolver(websiteSettingsSchema),
    defaultValues: {
      name: website.name || '',
      description: website.description || '',
      slug: website.slug || '',
      domain: connectedDomain?.domain || '',
      is_published: website.is_published,
      is_active: website.is_active,
      favicon_url: website.settings?.favicon_url || '',
      header_tracking_code: website.settings?.header_tracking_code || '',
      footer_tracking_code: website.settings?.footer_tracking_code || '',
      facebook_pixel_id: (website as any).facebook_pixel_id || website.settings?.facebook_pixel_id || '',
      google_analytics_id: website.settings?.google_analytics_id || '',
      google_ads_id: website.settings?.google_ads_id || '',
      currency_code: website.settings?.currency?.code || 'BDT',
      seo_title: (website as any).seo_title || '',
      seo_description: (website as any).seo_description || '',
      og_image: (website as any).og_image || '',
      meta_robots: (website as any).meta_robots || 'index, follow',
      canonical_domain: (website as any).canonical_domain || connectedDomain?.domain || '',
      product_button_bg: website.settings?.product_button_bg || '',
      product_button_text: website.settings?.product_button_text || '',
      product_button_hover_bg: website.settings?.product_button_hover_bg || '',
      product_button_hover_text: website.settings?.product_button_hover_text || '',
      variant_button_selected_bg: website.settings?.variant_button_selected_bg || '',
      variant_button_selected_text: website.settings?.variant_button_selected_text || '',
      variant_button_hover_bg: website.settings?.variant_button_hover_bg || '',
      variant_button_hover_text: website.settings?.variant_button_hover_text || '',
    },
  });

  // Update form when connected domain changes
  React.useEffect(() => {
    form.setValue('domain', connectedDomain?.domain || '');
    form.setValue('canonical_domain', connectedDomain?.domain || '');
  }, [connectedDomain, form]);

  const [pages, setPages] = React.useState<{ id: string; title: string; slug: string; is_published: boolean }[]>([]);
  const [loadingPages, setLoadingPages] = React.useState(false);
  const [productDetailTemplateId, setProductDetailTemplateId] = React.useState<string>(website.settings?.system_pages?.product_detail_page_id || '');

  // Shipping settings state
  const [shippingSettings, setShippingSettings] = React.useState<ShippingSettings>(
    website.settings?.shipping || {
      enabled: false,
      country: '',
      restOfCountryFee: 0,
      cityRules: [],
      weightTiers: [],
      freeShippingThreshold: 0,
      freeShippingMinWeight: 0,
    }
  );

  const [slugError, setSlugError] = React.useState<string>('');
  const [checkingSlug, setCheckingSlug] = React.useState(false);

  React.useEffect(() => {
    const fetchPages = async () => {
      setLoadingPages(true);
      const { data, error } = await supabase
        .from('website_pages')
        .select('id, title, slug, is_published')
        .eq('website_id', website.id)
        .order('title');
      if (!error && data) setPages(data);
      setLoadingPages(false);
    };
    fetchPages();
  }, [website.id]);

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === website.slug) {
      setSlugError('');
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('id')
        .eq('slug', slug)
        .neq('id', website.id);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSlugError('This slug is already taken');
      } else {
        setSlugError('');
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugError('Error checking slug availability');
    } finally {
      setCheckingSlug(false);
    }
  };

  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: WebsiteSettingsForm) => {
      const { 
        favicon_url, 
        header_tracking_code, 
        footer_tracking_code, 
        facebook_pixel_id, 
        google_analytics_id, 
        google_ads_id, 
        currency_code, 
        domain,
        product_button_bg,
        product_button_text,
        product_button_hover_bg,
        product_button_hover_text,
        variant_button_selected_bg,
        variant_button_selected_text,
        variant_button_hover_bg,
        variant_button_hover_text,
        ...basicFields 
      } = data;
      
      const settings = {
        ...website.settings,
        favicon_url: favicon_url || null,
        header_tracking_code: header_tracking_code || null,
        footer_tracking_code: footer_tracking_code || null,
        facebook_pixel_id: facebook_pixel_id || null,
        google_analytics_id: google_analytics_id || null,
        google_ads_id: google_ads_id || null,
        system_pages: {
          ...(website.settings?.system_pages || {}),
          product_detail_page_id: productDetailTemplateId || null,
        },
        currency: { code: currency_code || 'BDT' },
        shipping: shippingSettings,
        product_button_bg: product_button_bg || null,
        product_button_text: product_button_text || null,
        product_button_hover_bg: product_button_hover_bg || null,
        product_button_hover_text: product_button_hover_text || null,
        variant_button_selected_bg: variant_button_selected_bg || null,
        variant_button_selected_text: variant_button_selected_text || null,
        variant_button_hover_bg: variant_button_hover_bg || null,
        variant_button_hover_text: variant_button_hover_text || null,
      };

      // Determine canonical domain for this website
      let canonicalDomain = null;
      if (domain && domain !== 'none') {
        canonicalDomain = domain;
      }

      // Update the website settings first
      const { error } = await supabase
        .from('websites')
        .update({
          ...basicFields,
          facebook_pixel_id: facebook_pixel_id || null,
          google_analytics_id: google_analytics_id || null,
          google_ads_id: google_ads_id || null,
          settings,
          canonical_domain: canonicalDomain,
          updated_at: new Date().toISOString(),
        })
        .eq('id', website.id);
      
      if (error) throw error;

      // Handle domain connection changes
      const currentConnection = connections.find(c => 
        c.content_type === 'website' && 
        c.content_id === website.id
      );

      // If user selected "none" or empty domain, remove existing connection
      if (!domain || domain === 'none') {
        if (currentConnection) {
          await removeConnection(currentConnection.id);
        }
      } else {
        // User selected a domain
        const selectedDomain = domains.find(d => d.domain === domain);
        if (selectedDomain) {
          // If there's an existing connection to a different domain, remove it first
          if (currentConnection && currentConnection.domain_id !== selectedDomain.id) {
            await removeConnection(currentConnection.id);
          }
          
          // Create new connection if needed
          if (!currentConnection || currentConnection.domain_id !== selectedDomain.id) {
            await connectContent(selectedDomain.id, 'website', website.id, '/', true);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', website.id] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast({ 
        title: 'Settings saved',
        description: 'Website settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update website settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update website:', error);
    },
  });

  const onSubmit = (data: WebsiteSettingsForm) => {
    updateWebsiteMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Website Settings</h2>
          <p className="text-muted-foreground">Configure your website's basic information and settings.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleAllSections}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          {openSections.length === 7 ? (
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion 
            type="multiple" 
            value={openSections} 
            onValueChange={setOpenSections}
            className="space-y-4"
          >
            <AccordionItem value="basic" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">Basic Information</h3>
                  <p className="text-sm text-muted-foreground">Manage your website's basic details and visibility settings.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('basic') ? 'block space-y-4' : 'hidden'}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Website" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the display name for your website.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of your website..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description for your website.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Slug</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="my-awesome-website" 
                        {...field}
                        onChange={(e) => {
                          const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                          field.onChange(slug);
                          const timeoutId = setTimeout(() => checkSlugAvailability(slug), 500);
                          return () => clearTimeout(timeoutId);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier for your website. Only lowercase letters, numbers, and hyphens.
                      {checkingSlug && ' Checking availability...'}
                    </FormDescription>
                    {slugError && (
                      <p className="text-sm text-destructive">{slugError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <FormDescription>
                          Make this website publicly accessible.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable or disable this website.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="domain" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">Domain & Branding</h3>
                  <p className="text-sm text-muted-foreground">Configure your website's domain and visual branding.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('domain') ? 'block space-y-4' : 'hidden'}>
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => {
                  const verifiedDomains = domains.filter(d => d.is_verified && d.dns_configured);
                  const selectedDomain = verifiedDomains.find(d => d.domain === field.value);
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Custom Domain
                        {selectedDomain && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Connected
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value || 'none'} onValueChange={field.onChange} disabled={domainsLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder={domainsLoading ? "Loading domains..." : "Select a domain"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (no custom domain)</SelectItem>
                            {verifiedDomains.length > 0 ? (
                              verifiedDomains.map(domain => {
                                const isConnectedElsewhere = connections.some(c => 
                                  c.domain_id === domain.id && 
                                  c.content_id !== website.id
                                );
                                return (
                                  <SelectItem 
                                    key={domain.id} 
                                    value={domain.domain}
                                    disabled={isConnectedElsewhere}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{domain.domain}</span>
                                      {domain.ssl_status === 'issued' && (
                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      )}
                                      {isConnectedElsewhere && (
                                        <Badge variant="secondary" className="text-xs">
                                          In Use
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <div className="px-2 py-3 text-sm text-muted-foreground">
                                No verified domains available
                              </div>
                            )}
                            <div className="border-t mt-2 pt-2">
                              <Link to="/dashboard/domains">
                                <SelectItem value="manage" className="text-primary cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Manage Domains</span>
                                  </div>
                                </SelectItem>
                              </Link>
                            </div>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {verifiedDomains.length === 0 ? (
                          <span>
                            No verified domains available.{' '}
                            <Link to="/dashboard/domains" className="text-primary hover:underline">
                              Add and verify a domain first
                            </Link>
                            .
                          </span>
                        ) : (
                          'Select a verified domain to connect to this website.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="favicon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/favicon.ico" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to your website's favicon (16x16 or 32x32 pixels).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="buttons" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">Product Button Colors</h3>
                  <p className="text-sm text-muted-foreground">Customize the appearance of product buttons across your website.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('buttons') ? 'block space-y-6' : 'hidden'}>
              <div>
                <h3 className="text-sm font-semibold mb-4">Add to Cart & Order Now Buttons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="product_button_bg"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Background Color"
                        />
                        <FormDescription>
                          Default background color for product buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="product_button_text"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Text Color"
                        />
                        <FormDescription>
                          Text color for product buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="product_button_hover_bg"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Hover Background Color"
                        />
                        <FormDescription>
                          Background color when hovering over buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="product_button_hover_text"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Hover Text Color"
                        />
                        <FormDescription>
                          Text color when hovering over buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-4">Product Variant Buttons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="variant_button_selected_bg"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Selected Background Color"
                        />
                        <FormDescription>
                          Background color for selected variant buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="variant_button_selected_text"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Selected Text Color"
                        />
                        <FormDescription>
                          Text color for selected variant buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="variant_button_hover_bg"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Hover Background Color"
                        />
                        <FormDescription>
                          Background color when hovering over variant buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="variant_button_hover_text"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker 
                          color={field.value || ''} 
                          onChange={field.onChange}
                          label="Hover Text Color"
                        />
                        <FormDescription>
                          Text color when hovering over variant buttons.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="currency" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">Localization & Currency</h3>
                  <p className="text-sm text-muted-foreground">Choose the currency used across this website.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('currency') ? 'block space-y-4' : 'hidden'}>
              <FormField
                control={form.control}
                name="currency_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BDT">Bangladeshi Taka (BDT)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      This currency will be applied globally across your website.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
              )}
            />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">Shipping & Delivery</h3>
                  <p className="text-sm text-muted-foreground">Configure location-based delivery charges for this website.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('shipping') ? 'block space-y-4' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Shipping Rules</FormLabel>
                    <FormDescription>Turn on to apply fees by city and for the rest of the country.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={shippingSettings.enabled}
                      onCheckedChange={(v) => setShippingSettings((s) => ({ ...s, enabled: v }))}
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Bangladesh"
                      value={shippingSettings.country || ''}
                      onChange={(e) => setShippingSettings((s) => ({ ...s, country: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>
                    Used for your shipping context. Rules below apply within this country.
                  </FormDescription>
                </FormItem>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Default fee (rest of country)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={shippingSettings.restOfCountryFee}
                      onChange={(e) => setShippingSettings((s) => ({ ...s, restOfCountryFee: Number(e.target.value) || 0 }))}
                    />
                  </FormControl>
                  <FormDescription>
                    Applied to all locations not matched by a city rule.
                  </FormDescription>
                </FormItem>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>City-specific rules</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShippingSettings((s) => ({ ...s, cityRules: [...s.cityRules, { city: '', fee: 0 }] }))}
                  >
                    Add City Rule
                  </Button>
                </div>

                {shippingSettings.cityRules.length === 0 && (
                  <p className="text-sm text-muted-foreground">No city rules yet. Add one to override the default fee for a city.</p>
                )}

                {shippingSettings.cityRules.map((rule, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Dhaka"
                          value={rule.city}
                          onChange={(e) => setShippingSettings((s) => {
                            const cityRules = [...s.cityRules];
                            cityRules[idx] = { ...cityRules[idx], city: e.target.value };
                            return { ...s, cityRules };
                          })}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Fee</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={rule.fee}
                          onChange={(e) => setShippingSettings((s) => {
                            const cityRules = [...s.cityRules];
                            cityRules[idx] = { ...cityRules[idx], fee: Number(e.target.value) || 0 };
                            return { ...s, cityRules };
                          })}
                        />
                      </FormControl>
                    </FormItem>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        className="md:self-start"
                        onClick={() => setShippingSettings((s) => ({ ...s, cityRules: s.cityRules.filter((_, i) => i !== idx) }))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Free Shipping Thresholds */}
              <div className="space-y-4">
                <FormLabel>Free Shipping Rules</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Free shipping threshold (amount)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0"
                        value={shippingSettings.freeShippingThreshold || ''}
                        onChange={(e) => setShippingSettings((s) => ({ 
                          ...s, 
                          freeShippingThreshold: Number(e.target.value) || 0 
                        }))}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum order amount for free shipping. Set to 0 to disable.
                    </FormDescription>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel>Free shipping min weight (grams)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={shippingSettings.freeShippingMinWeight || ''}
                        onChange={(e) => setShippingSettings((s) => ({ 
                          ...s, 
                          freeShippingMinWeight: Number(e.target.value) || 0 
                        }))}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum total weight for free shipping. Set to 0 to disable.
                    </FormDescription>
                  </FormItem>
                </div>
              </div>

              <Separator />

              {/* Weight-based Shipping Tiers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Weight-based shipping tiers</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShippingSettings((s) => ({ 
                      ...s, 
                      weightTiers: [...(s.weightTiers || []), { maxWeight: 1000, fee: 0, label: '' }] 
                    }))}
                  >
                    Add Weight Tier
                  </Button>
                </div>

                <FormDescription>
                  Configure shipping fees based on total order weight. Products need to have weight specified.
                </FormDescription>

                {(!shippingSettings.weightTiers || shippingSettings.weightTiers.length === 0) && (
                  <p className="text-sm text-muted-foreground">No weight tiers configured. Add one to charge based on total order weight.</p>
                )}

                {(shippingSettings.weightTiers || []).map((tier, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <FormItem>
                      <FormLabel>Max Weight (grams)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="1000"
                          value={tier.maxWeight}
                          onChange={(e) => setShippingSettings((s) => {
                            const weightTiers = [...(s.weightTiers || [])];
                            weightTiers[idx] = { ...weightTiers[idx], maxWeight: Number(e.target.value) || 1 };
                            return { ...s, weightTiers };
                          })}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Fee</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="50.00"
                          value={tier.fee}
                          onChange={(e) => setShippingSettings((s) => {
                            const weightTiers = [...(s.weightTiers || [])];
                            weightTiers[idx] = { ...weightTiers[idx], fee: Number(e.target.value) || 0 };
                            return { ...s, weightTiers };
                          })}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Label (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Light items"
                          value={tier.label || ''}
                          onChange={(e) => setShippingSettings((s) => {
                            const weightTiers = [...(s.weightTiers || [])];
                            weightTiers[idx] = { ...weightTiers[idx], label: e.target.value };
                            return { ...s, weightTiers };
                          })}
                        />
                      </FormControl>
                    </FormItem>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setShippingSettings((s) => ({ 
                          ...s, 
                          weightTiers: (s.weightTiers || []).filter((_, i) => i !== idx) 
                        }))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {(shippingSettings.weightTiers && shippingSettings.weightTiers.length > 0) && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Weight tiers are applied in ascending order. 
                      If order weight is ≤ max weight, that tier's fee is used. 
                      If weight exceeds all tiers, the highest tier fee applies.
                    </p>
                  </div>
                )}
              </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="seo" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">SEO Defaults</h3>
                  <p className="text-sm text-muted-foreground">Set default SEO metadata for this website. Individual pages can override these values.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('seo') ? 'block space-y-4' : 'hidden'}>
              <FormField
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default SEO Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Awesome Store - Great Products" {...field} />
                    </FormControl>
                    <FormDescription>
                      Recommended under 60 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Shop quality products with fast shipping and great support."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Keep it under 160 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="og_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default OG Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/og-image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for social sharing previews.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_robots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Robots</FormLabel>
                      <FormControl>
                        <Input placeholder="index, follow" {...field} />
                      </FormControl>
                      <FormDescription>
                        e.g., "index, follow" or "noindex, nofollow".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="canonical_domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canonical Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used to build canonical URLs (protocol added automatically). Leave blank to use current host.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
            )}
          />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tracking" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold">Tracking & Analytics</h3>
                  <p className="text-sm text-muted-foreground">Configure pixel IDs for automated tracking and custom code snippets.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('tracking') ? 'block space-y-6' : 'hidden'}>
              <div className="space-y-4">
                <div className="text-sm font-medium">Marketing Pixels</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="facebook_pixel_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Pixel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Facebook Pixel ID for conversion tracking and advertising.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="google_analytics_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Analytics ID</FormLabel>
                        <FormControl>
                          <Input placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Google Analytics measurement ID for website analytics.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="google_ads_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Ads ID</FormLabel>
                      <FormControl>
                        <Input placeholder="AW-XXXXXXXXX" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your Google Ads conversion ID for tracking ad performance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="text-sm font-medium">Custom Code</div>
                <FormField
                  control={form.control}
                  name="header_tracking_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Tracking Code</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="<!-- Additional custom tracking code -->"
                          className="resize-none font-mono text-sm"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional code inserted in the &lt;head&gt; section (pixels above are automatic).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footer_tracking_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Tracking Code</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="<!-- Chat widgets, additional tracking, etc. -->"
                          className="resize-none font-mono text-sm"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Code inserted before the closing &lt;/body&gt; tag.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Save Button - Sticky on mobile for better UX */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4 sm:mx-0 sm:relative sm:bottom-auto sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0">
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateWebsiteMutation.isPending}
                className="min-w-32 w-full sm:w-auto"
              >
                {updateWebsiteMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

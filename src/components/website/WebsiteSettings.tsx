import React, { useState, useCallback } from 'react';
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
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { debounce } from '@/lib/utils';

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
  // Product button styling
  product_button_color: z.string().optional(),
  product_button_hover_color: z.string().optional(),
  // SEO defaults
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  og_image: z.string().optional(),
  meta_robots: z.string().optional(),
  canonical_domain: z.string().optional(),
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

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface WebsiteSettingsProps {
  website: Website;
}

// Shipping settings types for per-website configuration
type ShippingCityRule = { city: string; fee: number; label?: string };
type ShippingSettings = {
  enabled: boolean;
  country?: string;
  restOfCountryFee: number;
  cityRules: ShippingCityRule[];
};

export const WebsiteSettings: React.FC<WebsiteSettingsProps> = ({ website }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    domains, 
    connections, 
    loading: domainsLoading, 
    connectContent, 
    removeConnection 
  } = useDomainManagement();

  // Find connected domain for this website
  const connectedDomain = React.useMemo(() => {
    const connection = connections.find(c => 
      c.content_type === 'website' && 
      c.content_id === website.id
    );
    if (!connection) return null;
    return domains.find(d => d.id === connection.domain_id) || null;
  }, [connections, domains, website.id]);

  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [suggestedSlug, setSuggestedSlug] = useState('');

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
      product_button_color: website.settings?.product_button_color || '',
      product_button_hover_color: website.settings?.product_button_hover_color || '',
      seo_title: (website as any).seo_title || '',
      seo_description: (website as any).seo_description || '',
      og_image: (website as any).og_image || '',
      meta_robots: (website as any).meta_robots || 'index, follow',
      canonical_domain: (website as any).canonical_domain || connectedDomain?.domain || '',
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
    }
  );

  // Slug validation functions
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) return;
    
    setSlugStatus('checking');
    
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('slug')
        .eq('store_id', (website as any).store_id)
        .eq('slug', slug)
        .neq('id', website.id)  // Exclude current website
        .maybeSingle();
      
      if (error) {
        setSlugStatus('error');
        return;
      }
      
      if (data) {
        // Slug is taken, generate unique one
        const uniqueSlug = await generateUniqueSlug(slug);
        setSuggestedSlug(uniqueSlug);
        setSlugStatus('taken');
      } else {
        // Slug is available
        setSuggestedSlug('');
        setSlugStatus('available');
      }
    } catch (error) {
      console.error('Slug check error:', error);
      setSlugStatus('error');
    }
  };

  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let counter = 1;
    let candidateSlug = `${baseSlug}-${counter}`;
    
    while (true) {
      const { data } = await supabase
        .from('websites')
        .select('slug')
        .eq('store_id', (website as any).store_id)
        .eq('slug', candidateSlug)
        .neq('id', website.id)
        .maybeSingle();
      
      if (!data) {
        return candidateSlug;
      }
      
      counter++;
      candidateSlug = `${baseSlug}-${counter}`;
    }
  };

  // Debounced slug validation
  const debouncedCheckSlug = useCallback(
    debounce((slug: string) => checkSlugAvailability(slug), 500),
    [(website as any).store_id, website.id]
  );

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

  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: WebsiteSettingsForm) => {
      const { favicon_url, header_tracking_code, footer_tracking_code, facebook_pixel_id, google_analytics_id, google_ads_id, currency_code, product_button_color, product_button_hover_color, domain, ...basicFields } = data;
      
      const settings = {
        ...website.settings,
        favicon_url: favicon_url || null,
        header_tracking_code: header_tracking_code || null,
        footer_tracking_code: footer_tracking_code || null,
        facebook_pixel_id: facebook_pixel_id || null,
        google_analytics_id: google_analytics_id || null,
        google_ads_id: google_ads_id || null,
        product_button_color: product_button_color || null,
        product_button_hover_color: product_button_hover_color || null,
        system_pages: {
          ...(website.settings?.system_pages || {}),
          product_detail_page_id: productDetailTemplateId || null,
        },
        currency: { code: currency_code || 'BDT' },
        shipping: shippingSettings,
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
      <div>
        <h2 className="text-xl font-semibold">Website Settings</h2>
        <p className="text-muted-foreground">Configure your website's basic information and settings.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Manage your website's basic details and visibility settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <div className="relative">
                        <Input
                          placeholder="my-website"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value) {
                              debouncedCheckSlug(e.target.value);
                            } else {
                              setSlugStatus('idle');
                            }
                          }}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {slugStatus === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {slugStatus === 'available' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {slugStatus === 'taken' && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {slugStatus === 'error' && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    
                    {/* Status Messages */}
                    {slugStatus === 'checking' && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking availability...
                      </p>
                    )}
                    {slugStatus === 'available' && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Slug is available
                      </p>
                    )}
                    {slugStatus === 'taken' && suggestedSlug && (
                      <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Slug already exists. Using "{suggestedSlug}" instead
                      </p>
                    )}
                    
                    <FormDescription>
                      Used in the URL to identify your website (letters, numbers, hyphens only).
                    </FormDescription>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Domain & Branding</CardTitle>
              <CardDescription>
                Configure your website's domain and visual branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localization & Currency</CardTitle>
              <CardDescription>
                Choose the currency used across this website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Button Styling</CardTitle>
              <CardDescription>
                Customize the appearance of product buttons (Add to Cart, Order Now, etc.) across all product pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_button_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          color={field.value || ''}
                          onChange={field.onChange}
                          label=""
                        />
                      </FormControl>
                      <FormDescription>
                        Default color for product action buttons.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_button_hover_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Hover Color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          color={field.value || ''}
                          onChange={field.onChange}
                          label=""
                        />
                      </FormControl>
                      <FormDescription>
                        Color when hovering over buttons.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Delivery</CardTitle>
              <CardDescription>
                Configure location-based delivery charges for this website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* SEO Defaults */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Defaults</CardTitle>
              <CardDescription>
                Set default SEO metadata for this website. Individual pages can override these values.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking & Analytics</CardTitle>
              <CardDescription>
                Configure pixel IDs for automated tracking and custom code snippets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateWebsiteMutation.isPending}
              className="min-w-32"
            >
              {updateWebsiteMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

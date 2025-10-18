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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDomainManagement } from '@/hooks/useDomainManagement';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';

const funnelSettingsSchema = z.object({
  name: z.string().min(1, 'Funnel name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Funnel slug is required'),
  domain: z.string().optional(),
  is_published: z.boolean(),
  is_active: z.boolean(),
  header_tracking_code: z.string().optional(),
  footer_tracking_code: z.string().optional(),
  facebook_pixel_id: z.string().optional(),
  google_analytics_id: z.string().optional(),
  google_ads_id: z.string().optional(),
  favicon_url: z.string().optional(),
  // SEO defaults
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  og_image: z.string().optional(),
  meta_robots: z.string().optional(),
  canonical_domain: z.string().optional(),
});

type FunnelSettingsForm = z.infer<typeof funnelSettingsSchema>;

interface Funnel {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  settings: any;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  meta_robots?: string;
  canonical_domain?: string;
}

interface FunnelSettingsProps {
  funnel: Funnel;
}

export const FunnelSettings: React.FC<FunnelSettingsProps> = ({ funnel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { 
    domains, 
    connections, 
    loading: domainsLoading, 
    connectContent, 
    removeConnection,
    setHomepage
  } = useDomainManagement();

  // Accordion state management - default to all sections collapsed
  const [openSections, setOpenSections] = React.useState<string[]>([]);

  const toggleAllSections = () => {
    const allSections = ['basic', 'domain', 'seo', 'tracking'];
    if (openSections.length === allSections.length) {
      setOpenSections([]);
    } else {
      setOpenSections(allSections);
    }
  };

  // Find connected domain for this funnel
  const connectedDomain = React.useMemo(() => {
    const connection = connections.find(c => 
      c.content_type === 'funnel' && 
      c.content_id === funnel.id
    );
    if (!connection) return null;
    return domains.find(d => d.id === connection.domain_id) || null;
  }, [connections, domains, funnel.id]);

  const form = useForm<FunnelSettingsForm>({
    resolver: zodResolver(funnelSettingsSchema),
    defaultValues: {
      name: funnel.name || '',
      description: funnel.description || '',
      slug: funnel.slug || '',
      domain: connectedDomain?.domain || '',
      is_published: funnel.is_published,
      is_active: funnel.is_active,
      header_tracking_code: funnel.settings?.header_tracking_code || '',
      footer_tracking_code: funnel.settings?.footer_tracking_code || '',
      facebook_pixel_id: funnel.settings?.facebook_pixel_id || '',
      google_analytics_id: funnel.settings?.google_analytics_id || '',
      google_ads_id: funnel.settings?.google_ads_id || '',
      favicon_url: funnel.settings?.favicon_url || '',
      seo_title: funnel.seo_title || '',
      seo_description: funnel.seo_description || '',
      og_image: funnel.og_image || '',
      meta_robots: funnel.meta_robots || 'index, follow',
      canonical_domain: funnel.canonical_domain || connectedDomain?.domain || '',
    },
  });

  // Update form when connected domain changes
  React.useEffect(() => {
    form.setValue('domain', connectedDomain?.domain || '');
    form.setValue('canonical_domain', connectedDomain?.domain || '');
  }, [connectedDomain, form]);

  const [slugError, setSlugError] = React.useState<string>('');
  const [checkingSlug, setCheckingSlug] = React.useState(false);

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === funnel.slug) {
      setSlugError('');
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('id')
        .eq('slug', slug)
        .neq('id', funnel.id);
      
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

  const updateFunnelMutation = useMutation({
    mutationFn: async (data: FunnelSettingsForm) => {
      const { 
        header_tracking_code, 
        footer_tracking_code, 
        facebook_pixel_id, 
        google_analytics_id, 
        google_ads_id, 
        favicon_url,
        domain,
        seo_title,
        seo_description,
        og_image,
        meta_robots,
        canonical_domain,
        ...basicFields 
      } = data;
      
      const settings = {
        ...funnel.settings,
        header_tracking_code: header_tracking_code || null,
        footer_tracking_code: footer_tracking_code || null,
        facebook_pixel_id: facebook_pixel_id || null,
        google_analytics_id: google_analytics_id || null,
        google_ads_id: google_ads_id || null,
        favicon_url: favicon_url || null,
      };

      // Determine canonical domain for this funnel
      let finalCanonicalDomain = null;
      if (domain && domain !== 'none') {
        finalCanonicalDomain = domain;
      }

      // Update the funnel settings first
      const { error } = await supabase
        .from('funnels')
        .update({
          ...basicFields,
          settings,
          seo_title: seo_title || null,
          seo_description: seo_description || null,
          og_image: og_image || null,
          meta_robots: meta_robots || null,
          canonical_domain: finalCanonicalDomain,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funnel.id);
      
      if (error) throw error;

      // Handle domain connection changes
      const currentConnection = connections.find(c => 
        c.content_type === 'funnel' && 
        c.content_id === funnel.id
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
          
          // Create new connection if needed (set is_homepage to false by default)
          if (!currentConnection || currentConnection.domain_id !== selectedDomain.id) {
            await connectContent(selectedDomain.id, 'funnel', funnel.id, '/', false);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel', funnel.id] });
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      toast({ 
        title: 'Settings saved',
        description: 'Funnel settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update funnel settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update funnel:', error);
    },
  });

  const onSubmit = (data: FunnelSettingsForm) => {
    updateFunnelMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Funnel Settings</h2>
          <p className="text-muted-foreground">Configure your funnel's basic information and settings.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="submit"
            form="funnel-settings-form"
            size="sm"
            disabled={updateFunnelMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateFunnelMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAllSections}
            className="flex items-center gap-2"
          >
            {openSections.length === 4 ? (
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

      <Form {...form}>
        <form id="funnel-settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion 
            type="multiple" 
            value={openSections} 
            onValueChange={setOpenSections}
            className="space-y-4"
          >
            <AccordionItem value="basic" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
                  <p className="text-sm text-muted-foreground">Manage your funnel's basic details and visibility settings.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('basic') ? 'block space-y-4' : 'hidden'}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funnel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Funnel" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the display name for your funnel.
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
                            placeholder="A brief description of your funnel..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description for your funnel.
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
                        <FormLabel>Funnel Slug</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="my-awesome-funnel" 
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
                          URL-friendly identifier for your funnel. Only lowercase letters, numbers, and hyphens.
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
                              Make this funnel publicly accessible.
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
                              Enable or disable this funnel.
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
                  <h3 className="text-base font-semibold text-foreground">Domain & Publishing</h3>
                  <p className="text-sm text-muted-foreground">Connect a custom domain to your funnel and manage publishing settings.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('domain') ? 'block space-y-4' : 'hidden'}>
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connected Domain</FormLabel>
                        <Select
                          value={field.value || 'none'}
                          onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                          disabled={domainsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a domain..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No domain connected</SelectItem>
                            {domains.map((domain) => (
                              <SelectItem 
                                key={domain.id} 
                                value={domain.domain}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{domain.domain}</span>
                                  <div className="flex items-center gap-2">
                                    {domain.is_verified ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a verified domain to connect to this funnel. 
                          {connectedDomain && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <span>Connected: {connectedDomain.domain}</span>
                                {connectedDomain.is_verified ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                )}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild 
                                className="h-6 px-2 text-xs"
                              >
                                <a 
                                  href={`https://${connectedDomain.domain}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  Visit <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          )}
                          {(() => {
                            const selectedDomainValue = form.watch('domain');
                            if (!selectedDomainValue || selectedDomainValue === 'none') return null;
                            
                            const selectedDomain = domains.find(d => d.domain === selectedDomainValue);
                            if (!selectedDomain) return null;
                            
                            const websiteConnection = connections.find(c => 
                              c.domain_id === selectedDomain.id && 
                              c.content_type === 'website'
                            );
                            
                            if (websiteConnection) {
                              return (
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                  <p className="text-sm text-muted-foreground">
                                    ℹ️ This domain is already connected to a website. 
                                    {websiteConnection.is_homepage && ' The website is currently set as the homepage.'}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                     )}
                   />

                   {/* Homepage Setting Control */}
                   {(() => {
                     const selectedDomainValue = form.watch('domain');
                     if (!selectedDomainValue || selectedDomainValue === 'none') return null;
                     
                     const selectedDomain = domains.find(d => d.domain === selectedDomainValue);
                     if (!selectedDomain) return null;
                     
                     const currentFunnelConnection = connections.find(c => 
                       c.content_type === 'funnel' && 
                       c.content_id === funnel.id &&
                       c.domain_id === selectedDomain.id
                     );
                     
                     const currentHomepage = connections.find(c => 
                       c.domain_id === selectedDomain.id && 
                       c.is_homepage === true
                     );
                     
                     return (
                       <div className="space-y-4 pt-4 border-t">
                         <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                             <FormLabel className="text-base">Set as Homepage</FormLabel>
                             <FormDescription>
                               Make this funnel the homepage for {selectedDomain.domain}
                               {currentHomepage && currentHomepage.content_id !== funnel.id && (
                                 <span className="block text-xs text-muted-foreground mt-1">
                                   Currently, {currentHomepage.content_type === 'website' ? 'a website' : 'another funnel'} is set as homepage
                                 </span>
                               )}
                             </FormDescription>
                           </div>
                           <Switch
                             checked={currentFunnelConnection?.is_homepage || false}
                             onCheckedChange={async (checked) => {
                               if (checked && currentFunnelConnection) {
                                 try {
                                   await setHomepage(currentFunnelConnection.id, selectedDomain.id);
                                   toast({
                                     title: "Homepage updated",
                                     description: "This funnel is now the homepage for " + selectedDomain.domain,
                                   });
                                 } catch (error) {
                                   toast({
                                     title: "Error",
                                     description: "Failed to set as homepage",
                                     variant: "destructive",
                                   });
                                 }
                               }
                             }}
                             disabled={!currentFunnelConnection}
                           />
                         </div>
                       </div>
                     );
                   })()}
                 </div>
               </AccordionContent>
             </AccordionItem>

            <AccordionItem value="seo" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-base font-semibold text-foreground">SEO Defaults</h3>
                  <p className="text-sm text-muted-foreground">Set default SEO metadata for your funnel. Steps can override these settings.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('seo') ? 'block space-y-4' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="seo_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default SEO Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Amazing Funnel - High Conversions" {...field} />
                          </FormControl>
                          <FormDescription>
                            Under 60 characters recommended.
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
                            e.g., index, follow or noindex, nofollow
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Meta Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Compelling funnel that converts visitors into customers."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Keep under 160 characters.
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
                             <Input placeholder="https://example.com/og.jpg" {...field} />
                           </FormControl>
                           <FormDescription>
                             Social sharing image.
                           </FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     <FormField
                       control={form.control}
                       name="favicon_url"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Favicon URL</FormLabel>
                           <FormControl>
                             <Input placeholder="https://example.com/favicon.png" {...field} />
                           </FormControl>
                           <FormDescription>
                             Custom favicon for this funnel (PNG/ICO format).
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
                           Used to build canonical URLs.
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
                  <h3 className="text-base font-semibold text-foreground">Tracking & Integrations</h3>
                  <p className="text-sm text-muted-foreground">Configure analytics and tracking codes for your funnel.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent forceMount className="px-6 pb-6">
                <div className={openSections.includes('tracking') ? 'block space-y-4' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            Facebook Pixel ID for tracking.
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
                            <Input placeholder="G-XXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormDescription>
                            GA4 Measurement ID.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="google_ads_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Ads ID</FormLabel>
                          <FormControl>
                            <Input placeholder="AW-XXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormDescription>
                            Google Ads Conversion ID.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="header_tracking_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header Tracking Code</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="<!-- Custom tracking code for header -->"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Custom HTML/JavaScript code injected in the head section.
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
                            rows={4}
                            placeholder="<!-- Custom tracking code for footer -->"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Custom HTML/JavaScript code injected before closing body tag.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={updateFunnelMutation.isPending}
              className="min-w-[120px]"
            >
              {updateFunnelMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
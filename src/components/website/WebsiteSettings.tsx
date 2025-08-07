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

const websiteSettingsSchema = z.object({
  name: z.string().min(1, 'Website name is required'),
  description: z.string().optional(),
  domain: z.string().optional(),
  is_published: z.boolean(),
  is_active: z.boolean(),
  favicon_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  header_tracking_code: z.string().optional(),
  footer_tracking_code: z.string().optional(),
});

type WebsiteSettingsForm = z.infer<typeof websiteSettingsSchema>;

interface Website {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  is_active: boolean;
  is_published: boolean;
  settings: any;
}

interface WebsiteSettingsProps {
  website: Website;
}

export const WebsiteSettings: React.FC<WebsiteSettingsProps> = ({ website }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WebsiteSettingsForm>({
    resolver: zodResolver(websiteSettingsSchema),
    defaultValues: {
      name: website.name || '',
      description: website.description || '',
      domain: website.domain || '',
      is_published: website.is_published,
      is_active: website.is_active,
      favicon_url: website.settings?.favicon_url || '',
      header_tracking_code: website.settings?.header_tracking_code || '',
      footer_tracking_code: website.settings?.footer_tracking_code || '',
    },
  });

  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: WebsiteSettingsForm) => {
      const { favicon_url, header_tracking_code, footer_tracking_code, ...basicFields } = data;
      
      const settings = {
        ...website.settings,
        favicon_url: favicon_url || null,
        header_tracking_code: header_tracking_code || null,
        footer_tracking_code: footer_tracking_code || null,
      };

      const { error } = await supabase
        .from('websites')
        .update({
          ...basicFields,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', website.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', website.id] });
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="www.mywebsite.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional custom domain for your website.
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
              <CardTitle>Tracking & Analytics</CardTitle>
              <CardDescription>
                Add custom tracking codes to your website header and footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="header_tracking_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header Tracking Code</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="<!-- Google Analytics, Facebook Pixel, etc. -->"
                        className="resize-none font-mono text-sm"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Code that will be inserted in the &lt;head&gt; section of every page.
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
                      Code that will be inserted before the closing &lt;/body&gt; tag.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
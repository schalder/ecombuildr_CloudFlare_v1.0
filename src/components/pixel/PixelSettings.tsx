import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Facebook, BarChart3, Target, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PixelSettingsProps {
  form: any;
  title?: string;
  description?: string;
}

export const PixelSettings: React.FC<PixelSettingsProps> = ({ 
  form, 
  title = "Pixel & Analytics Integration",
  description = "Configure tracking pixels for Facebook Ads, Google Ads, and Google Analytics to optimize your marketing campaigns."
}) => {
  const facebookPixelId = form.watch('facebook_pixel_id');
  const googleAnalyticsId = form.watch('google_analytics_id');
  const googleAdsId = form.watch('google_ads_id');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Facebook Pixel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Facebook Pixel</h4>
              {facebookPixelId && (
                <Badge variant="outline" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open('https://business.facebook.com/events_manager', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Events Manager
            </Button>
          </div>

          <FormField
            control={form.control}
            name="facebook_pixel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook Pixel ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123456789012345"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Find your Pixel ID in Facebook Events Manager. Required for Facebook Ads conversion tracking.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Google Analytics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium">Google Analytics</h4>
              {googleAnalyticsId && (
                <Badge variant="outline" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open('https://analytics.google.com', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Analytics
            </Button>
          </div>

          <FormField
            control={form.control}
            name="google_analytics_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Analytics Measurement ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Your Google Analytics Measurement ID (GA4) or Tracking ID (Universal Analytics).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Google Ads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Google Ads</h4>
              {googleAdsId && (
                <Badge variant="outline" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open('https://ads.google.com', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Google Ads
            </Button>
          </div>

          <FormField
            control={form.control}
            name="google_ads_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Ads Conversion ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="AW-123456789"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Your Google Ads Conversion Tracking ID. Required for Google Ads conversion tracking and optimization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Events Tracking Info */}
        {(facebookPixelId || googleAnalyticsId || googleAdsId) && (
          <div className="p-4 bg-muted rounded-lg">
            <h5 className="font-medium mb-2">Automatic Event Tracking</h5>
            <p className="text-sm text-muted-foreground mb-3">
              The following events will be automatically tracked:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>• Page Views</div>
              <div>• Product Views</div>
              <div>• Add to Cart</div>
              <div>• Checkout Started</div>
              <div>• Purchases</div>
              <div>• Search Events</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
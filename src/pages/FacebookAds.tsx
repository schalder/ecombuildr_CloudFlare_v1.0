import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Facebook, Settings, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { PixelEventOverview } from '@/components/analytics/PixelEventOverview';
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel';
import { EventTimeline } from '@/components/analytics/EventTimeline';
import { TopProductsAnalytics } from '@/components/analytics/TopProductsAnalytics';
import { useFacebookPixelAnalytics } from '@/hooks/useFacebookPixelAnalytics';
import { useUserStore } from '@/hooks/useUserStore';
import { useStoreWebsites } from '@/hooks/useStoreWebsites';
import { useStoreFunnels } from '@/hooks/useStoreFunnels';

export default function FacebookAds() {
  const [dateRange, setDateRange] = useState('30');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('all');
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { store } = useUserStore();
  const { websites, loading: websitesLoading, refetch: refetchWebsites } = useStoreWebsites(store?.id || '');
  const { funnels, loading: funnelsLoading, refetch: refetchFunnels } = useStoreFunnels(store?.id || '');
  const { refetch: refetchStore } = useUserStore();
  
  const { analytics, loading, error, refetch: refetchAnalytics } = useFacebookPixelAnalytics(
    store?.id || '',
    parseInt(dateRange, 10),
    selectedWebsiteId === 'all' ? undefined : selectedWebsiteId,
    selectedFunnelId === 'all' ? undefined : funnels.find(f => f.id === selectedFunnelId)?.slug
  );

  // Get pixel ID based on selection - only website/funnel level pixels
  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
  const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
  
  const hasPixelId = selectedWebsiteId !== 'all' 
    ? selectedWebsite?.facebook_pixel_id
    : selectedFunnelId !== 'all'
    ? selectedFunnel?.settings?.facebook_pixel_id
    : websites.some(w => w.facebook_pixel_id) || funnels.some(f => f.settings?.facebook_pixel_id);
  
  const displayPixelId = selectedWebsiteId !== 'all' 
    ? selectedWebsite?.facebook_pixel_id 
    : selectedFunnelId !== 'all'
    ? selectedFunnel?.settings?.facebook_pixel_id
    : 'Multiple';

  // Refresh function to manually refresh all data
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        refetchStore(),
        refetchWebsites(),
        refetchFunnels()
      ]);
      // Also refresh analytics data and wait for it to complete
      await refetchAnalytics();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // OnboardingGate ensures store exists, so this shouldn't happen
  if (!store) {
    return null;
  }

  return (
    <DashboardLayout title="Facebook Pixel Analytics" description="Track your Facebook pixel events and conversions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Facebook className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Facebook Pixel Analytics</h1>
              {hasPixelId ? (
                <Badge variant="secondary" className="mt-1">
                  Pixel ID: {displayPixelId}
                </Badge>
              ) : (
                <Badge variant="destructive" className="mt-1">
                  No Pixel Configured
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!websitesLoading && !funnelsLoading && (websites.length > 0 || funnels.length > 0) && (
              <>
                <Select value={selectedWebsiteId} onValueChange={(value) => { setSelectedWebsiteId(value); setSelectedFunnelId('all'); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Website" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Websites</SelectItem>
                    {websites.map((website) => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedFunnelId} onValueChange={(value) => { setSelectedFunnelId(value); setSelectedWebsiteId('all'); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Funnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funnels</SelectItem>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={websitesLoading || funnelsLoading || loading || isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${websitesLoading || funnelsLoading || loading || isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://business.facebook.com/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Events Manager</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Pixel Configuration Warning */}
        {!hasPixelId && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Facebook Pixel Not Configured</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedWebsiteId !== 'all' 
                      ? `The selected website "${selectedWebsite?.name}" doesn't have a Facebook Pixel ID configured.`
                      : selectedFunnelId !== 'all'
                      ? `The selected funnel "${selectedFunnel?.name}" doesn't have a Facebook Pixel ID configured.`
                      : 'To track Facebook pixel events, you need to configure Facebook Pixel ID in your website or funnel settings.'
                    }
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href={selectedWebsiteId !== 'all' ? "/dashboard/websites" : selectedFunnelId !== 'all' ? "/dashboard/funnels" : "/dashboard/websites"}>
                      <Settings className="h-4 w-4 mr-2" />
                      {selectedWebsiteId !== 'all' ? 'Configure Website Pixel' : selectedFunnelId !== 'all' ? 'Configure Funnel Pixel' : 'Configure Pixels'}
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Overview */}
        <PixelEventOverview analytics={analytics} loading={loading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel analytics={analytics} loading={loading} />
          <TopProductsAnalytics topProducts={analytics?.topProducts || []} loading={loading} />
        </div>

        {/* Event Timeline */}
        <EventTimeline dailyEvents={analytics?.dailyEvents || []} loading={loading} />

        {/* Facebook Ads Manager Link */}
        <Card>
          <CardHeader>
            <CardTitle>Facebook Advertising</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Facebook className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Create Facebook Ad Campaigns</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use Facebook Ads Manager to create campaigns with your pixel data for better targeting and optimization.
              </p>
              <Button asChild>
                <a 
                  href="https://www.facebook.com/adsmanager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Ads Manager</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error loading analytics: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
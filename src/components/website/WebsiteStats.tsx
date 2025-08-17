import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWebsiteStats } from '@/hooks/useWebsiteStats';
import { Loader2, RefreshCw, ExternalLink, Eye, FileText, Users, DollarSign, Calendar, Globe, TrendingUp, Monitor, Smartphone, Tablet, MessageSquare, Mail, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface WebsiteStatsProps {
  websiteId: string;
  websiteName: string;
  websiteSlug: string;
}

export function WebsiteStats({ websiteId, websiteName, websiteSlug }: WebsiteStatsProps) {
  const { stats, loading, error, refetch } = useWebsiteStats(websiteId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Website Statistics</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4" />
                <div className="h-8 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Website Statistics</h2>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              {error || "Failed to load website statistics"}
            </p>
            <Button variant="outline" onClick={refetch}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get website URL from stats
  const websiteUrl = stats.website.url;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Website Statistics</h2>
          <p className="text-sm text-muted-foreground">
            Overview of your website's performance and analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(websiteUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Site
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Row - Website Overview and Traffic Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Website Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Website Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex gap-1">
                <Badge variant={stats.website.is_active ? "default" : "secondary"} className="text-xs px-2 py-0">
                  {stats.website.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={stats.website.is_published ? "default" : "outline"} className="text-xs px-2 py-0">
                  {stats.website.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Domain</span>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-mono">
                  {websiteUrl.replace('https://', '')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-xs">
                {(() => {
                  if (!stats.website.created_at) return 'Unknown';
                  const date = new Date(stats.website.created_at);
                  return isNaN(date.getTime()) ? 'Unknown' : format(date, 'MMM dd, yyyy');
                })()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-xs">
                {(() => {
                  if (!stats.website.updated_at) return 'Unknown';
                  const date = new Date(stats.website.updated_at);
                  return isNaN(date.getTime()) ? 'Unknown' : format(date, 'MMM dd, yyyy');
                })()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Analytics */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Traffic Analytics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.analytics.totalPageViews}</div>
                <div className="text-xs text-muted-foreground">Total Page Views</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.analytics.totalUniqueVisitors}</div>
                <div className="text-xs text-muted-foreground">Unique Visitors</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.analytics.averageBounceRate}%</div>
                <div className="text-xs text-muted-foreground">Bounce Rate</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{Math.floor(stats.analytics.averageSessionDuration / 60)}m {stats.analytics.averageSessionDuration % 60}s</div>
                <div className="text-xs text-muted-foreground">Avg. Session</div>
              </div>
            </div>

            {stats.analytics.conversionRate > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Conversion Rate</span>
                </div>
                <div className="text-xl font-bold text-primary">{stats.analytics.conversionRate}%</div>
                <div className="text-xs text-muted-foreground">
                  {stats.revenue.total_orders} orders from {stats.analytics.totalUniqueVisitors} visitors
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Key Metrics, Traffic Sources, Device Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-500" />
                <span className="text-sm">Total Pages</span>
              </div>
              <span className="font-bold">{stats.metrics.pages}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-purple-500" />
                <span className="text-sm">Form Submissions</span>
              </div>
              <span className="font-bold">{stats.metrics.form_submissions}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-orange-500" />
                <span className="text-sm">Newsletter Signups</span>
              </div>
              <span className="font-bold">{stats.metrics.newsletter_signups}</span>
            </div>

            {stats.revenue.total_orders > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3 text-orange-600" />
                    <span className="text-sm">Total Orders</span>
                  </div>
                  <span className="font-bold">{stats.revenue.total_orders}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-sm">Total Revenue</span>
                  </div>
                  <span className="font-bold">৳{stats.revenue.total_revenue.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources (Compact) */}
        {stats.analytics.trafficSources.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.analytics.trafficSources.slice(0, 5).map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm capitalize">{source.source}</span>
                    </div>
                    <span className="text-sm font-mono">{source.visitors} visitors</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Device Types (Compact) */}
        {stats.analytics.deviceBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.analytics.deviceBreakdown.map((device) => {
                  const Icon = device.device === 'mobile' ? Smartphone : 
                              device.device === 'tablet' ? Tablet : Monitor;
                  return (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm capitalize">{device.device}</span>
                      </div>
                      <span className="text-sm font-mono">{device.visitors} visitors</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Page Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Page Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.analytics.pagePerformance.map((page, index) => (
              <div key={page.path} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <span className="font-medium text-sm capitalize">{page.title}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">{page.views} views</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bounce Rate:</span>
                  <span className={`font-medium ${page.bounce_rate > 70 ? 'text-red-500' : page.bounce_rate > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {page.bounce_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(websiteUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Website
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`${websiteUrl}?preview=true`, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Mode
            </Button>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
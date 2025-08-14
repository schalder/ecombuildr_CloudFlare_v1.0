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
  const websiteUrl = stats.websiteUrl;

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Website Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Website Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex gap-2">
                <Badge variant={stats.isActive ? "default" : "secondary"}>
                  {stats.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={stats.isPublished ? "default" : "outline"}>
                  {stats.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Domain</span>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">
                  {websiteUrl.replace('https://', '')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">
                {format(new Date(stats.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm">
                {format(new Date(stats.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Analytics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Traffic Analytics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stats.analytics.totalPageViews}</div>
                <div className="text-sm text-muted-foreground">Total Page Views</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stats.analytics.totalUniqueVisitors}</div>
                <div className="text-sm text-muted-foreground">Unique Visitors</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stats.analytics.averageBounceRate}%</div>
                <div className="text-sm text-muted-foreground">Bounce Rate</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl md:text-3xl font-bold text-primary">{Math.floor(stats.analytics.averageSessionDuration / 60)}m {stats.analytics.averageSessionDuration % 60}s</div>
                <div className="text-sm text-muted-foreground">Avg. Session</div>
              </div>
            </div>

            {stats.analytics.conversionRate > 0 && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-medium">Conversion Rate</span>
                </div>
                <div className="text-2xl font-bold text-primary">{stats.analytics.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">
                  {stats.totalOrders} orders from {stats.analytics.totalUniqueVisitors} visitors
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">Total Pages</span>
              </div>
              <span className="text-lg font-bold">{stats.totalPages}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="font-medium">Published Pages</span>
              </div>
              <span className="text-lg font-bold">{stats.publishedPages}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Form Submissions</span>
              </div>
              <span className="text-lg font-bold">{stats.totalFormSubmissions}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Newsletter Signups</span>
              </div>
              <span className="text-lg font-bold">{stats.totalNewsletterSignups}</span>
            </div>

            {stats.totalOrders > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Total Orders</span>
                  </div>
                  <span className="text-lg font-bold">{stats.totalOrders}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Total Revenue</span>
                  </div>
                  <span className="text-lg font-bold">৳{stats.totalRevenue.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      {stats.analytics.trafficSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.analytics.trafficSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" 
                         style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }} />
                    <span className="capitalize font-medium">{source.source}</span>
                  </div>
                  <span className="text-sm font-mono">{source.visitors} visitors</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Device Breakdown */}
        {stats.analytics.deviceBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.analytics.deviceBreakdown.map((device) => {
                  const Icon = device.device === 'mobile' ? Smartphone : 
                              device.device === 'tablet' ? Tablet : Monitor;
                  return (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize font-medium">{device.device}</span>
                      </div>
                      <span className="text-sm font-mono">{device.visitors} visitors</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Page Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Page Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.analytics.pagePerformance.map((page, index) => (
                <div key={page.pageType} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <span className="font-medium capitalize">{page.pageType}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">{page.pageViews} views</div>
                      <div className="text-xs text-muted-foreground">{page.uniqueVisitors} unique</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bounce Rate:</span>
                    <span className={`font-medium ${page.bounceRate > 70 ? 'text-red-600' : page.bounceRate > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {page.bounceRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
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
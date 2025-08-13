import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWebsiteStats } from "@/hooks/useWebsiteStats";
import { 
  Globe, 
  FileText, 
  Eye, 
  EyeOff, 
  Calendar, 
  DollarSign, 
  ShoppingCart, 
  MessageSquare, 
  Mail,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  const websiteUrl = stats.connectedDomain 
    ? `https://${stats.connectedDomain}` 
    : `/site/${websiteSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Website Statistics</h2>
          <p className="text-sm text-muted-foreground">
            Overview of your website's performance and content
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Website Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <div className="flex items-center gap-2">
              <Badge variant={stats.isActive ? "default" : "secondary"}>
                {stats.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={stats.isPublished ? "default" : "secondary"}>
                {stats.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Domain</span>
            <span className="text-sm text-muted-foreground">
              {stats.connectedDomain || `${websiteSlug}.lovable.app`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Created</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(stats.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Updated</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(stats.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalPages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPages} published
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published Pages</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.publishedPages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPages - stats.publishedPages} in draft
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Form Submissions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalFormSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Contact & inquiry forms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Newsletter Signups</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalNewsletterSignups}</div>
            <p className="text-xs text-muted-foreground">
              Active subscribers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Orders Section */}
      {(stats.totalOrders > 0 || stats.totalRevenue > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue & Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Orders</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Orders processed through store
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold">৳{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Revenue from store orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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

      {/* Additional Info */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <h3 className="font-medium mb-2">More Analytics Coming Soon</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're working on advanced analytics including visitor tracking, page performance, 
            conversion rates, and more detailed insights about your website's performance.
          </p>
          <Badge variant="secondary" className="text-xs">
            Advanced Analytics - Coming Soon
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebsiteSales } from '@/hooks/useWebsiteSales';
import { Loader2, RefreshCw, DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface WebsiteSalesProps {
  websiteId: string;
  websiteName: string;
}

export function WebsiteSales({ websiteId, websiteName }: WebsiteSalesProps) {
  const { sales, loading, error, refetch } = useWebsiteSales(websiteId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sales Analytics</h2>
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

  if (error || !sales) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sales Analytics</h2>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              {error || "Failed to load sales data"}
            </p>
            <Button variant="outline" onClick={refetch}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sales Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Sales performance and revenue insights for {websiteName}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(sales.todayRevenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue today</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Yesterday's Sales */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yesterday's Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(sales.yesterdayRevenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue yesterday</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Period Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Period Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(sales.totalRevenue)}</p>
                <div className="flex items-center gap-1">
                  {sales.comparison.changes.revenue.percentage !== 0 && (
                    <Badge variant={sales.comparison.changes.revenue.percentage > 0 ? "default" : "destructive"} className="text-xs">
                      {sales.comparison.changes.revenue.percentage > 0 ? '+' : ''}{sales.comparison.changes.revenue.percentage}%
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">vs previous period</p>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Period Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Period Orders</p>
                <p className="text-2xl font-bold">{sales.totalOrders}</p>
                <div className="flex items-center gap-1">
                  {sales.comparison.changes.orders.percentage !== 0 && (
                    <Badge variant={sales.comparison.changes.orders.percentage > 0 ? "default" : "destructive"} className="text-xs">
                      {sales.comparison.changes.orders.percentage > 0 ? '+' : ''}{sales.comparison.changes.orders.percentage}%
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">vs previous period</p>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New Customers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Customers</p>
                <p className="text-2xl font-bold">{sales.totalCustomers}</p>
                <div className="flex items-center gap-1">
                  {sales.comparison.changes.customers.percentage !== 0 && (
                    <Badge variant={sales.comparison.changes.customers.percentage > 0 ? "default" : "destructive"} className="text-xs">
                      {sales.comparison.changes.customers.percentage > 0 ? '+' : ''}{sales.comparison.changes.customers.percentage}%
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">vs previous period</p>
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(sales.averageOrderValue)}</p>
                <p className="text-xs text-muted-foreground">Per order average</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      {sales.analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Best selling products in this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales.analytics.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.total_quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(product.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">{product.total_orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Sales Message */}
      {sales.totalRevenue === 0 && sales.totalOrders === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No sales yet</h3>
            <p className="text-muted-foreground mb-2">
              Sales data will appear here when customers place orders through this website.
            </p>
            <p className="text-xs text-muted-foreground">
              Note: Only orders with website tracking will show here. Orders placed through the main storefront appear in the general Orders page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
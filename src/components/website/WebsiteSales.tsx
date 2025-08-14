import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebsiteSales } from '@/hooks/useWebsiteSales';
import { DateRangeFilter, DateRange } from '@/components/ui/date-range-filter';
import { 
  Loader2, 
  RefreshCw, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  CreditCard,
  MapPin,
  Package,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface WebsiteSalesProps {
  websiteId: string;
  websiteName: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

const formatCurrency = (amount: number) => `৳${Math.round(amount).toLocaleString()}`;

const TrendIndicator = ({ value, className }: { value: number; className?: string }) => {
  if (value > 0) {
    return <ArrowUp className={cn("h-3 w-3 text-green-600", className)} />;
  } else if (value < 0) {
    return <ArrowDown className={cn("h-3 w-3 text-red-600", className)} />;
  }
  return <Minus className={cn("h-3 w-3 text-muted-foreground", className)} />;
};

const ComparisonCard = ({ 
  title, 
  currentValue, 
  previousValue, 
  change, 
  icon: Icon, 
  formatValue = formatCurrency 
}: {
  title: string;
  currentValue: number;
  previousValue: number;
  change: { value: number; percentage: number };
  icon: any;
  formatValue?: (value: number) => string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
      <div className="flex items-center space-x-2 text-xs">
        <div className="flex items-center space-x-1">
          <TrendIndicator value={change.percentage} />
          <span className={cn(
            change.percentage > 0 ? "text-green-600" : 
            change.percentage < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            {Math.abs(change.percentage)}%
          </span>
        </div>
        <span className="text-muted-foreground">vs previous period</span>
      </div>
    </CardContent>
  </Card>
);

export function WebsiteSales({ websiteId, websiteName }: WebsiteSalesProps) {
  const { sales, loading, error, refetch, updateDateRange } = useWebsiteSales(websiteId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Website Sales Analytics</h2>
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
          <h2 className="text-xl font-semibold">Website Sales Analytics</h2>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h2 className="text-xl font-semibold">Sales Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Sales performance and revenue insights for {websiteName}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <DateRangeFilter 
            value={sales.dateRange} 
            onChange={updateDateRange}
          />
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Today vs Yesterday Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(sales.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yesterday's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(sales.yesterdayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ComparisonCard
          title="Period Revenue"
          currentValue={sales.comparison.currentPeriod.revenue}
          previousValue={sales.comparison.previousPeriod.revenue}
          change={sales.comparison.changes.revenue}
          icon={DollarSign}
        />
        <ComparisonCard
          title="Period Orders"
          currentValue={sales.comparison.currentPeriod.orders}
          previousValue={sales.comparison.previousPeriod.orders}
          change={sales.comparison.changes.orders}
          icon={ShoppingCart}
          formatValue={(value) => value.toString()}
        />
        <ComparisonCard
          title="New Customers"
          currentValue={sales.comparison.currentPeriod.customers}
          previousValue={sales.comparison.previousPeriod.customers}
          change={sales.comparison.changes.customers}
          icon={Users}
          formatValue={(value) => value.toString()}
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend ({sales.dateRange.label})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales.analytics.revenueTimeline}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [`৳${value}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sales.analytics.monthlyTrends}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [`৳${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Orders",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sales.analytics.paymentMethods}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="method"
                  >
                    {sales.analytics.paymentMethods.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                    <p className="font-medium">৳{product.total_revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{product.total_orders} orders</p>
                  </div>
                </div>
              ))}
              {sales.analytics.topProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-6">No product sales yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Orders by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sales.analytics.geographicData.slice(0, 5).map((location, index) => (
                <div key={location.city} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{location.city}</p>
                      <p className="text-xs text-muted-foreground">{location.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-medium">৳{location.revenue.toLocaleString()}</p>
                </div>
              ))}
              {sales.analytics.geographicData.length === 0 && (
                <p className="text-center text-muted-foreground py-6">No location data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Order Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sales.analytics.orderStatuses.map((status) => (
              <div key={status.status} className="text-center p-4 border rounded-lg">
                <Badge variant="outline" className="mb-2">
                  {status.status}
                </Badge>
                <div className="text-lg font-bold">{status.count}</div>
                <div className="text-sm text-muted-foreground">
                  ৳{status.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
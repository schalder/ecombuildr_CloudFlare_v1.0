import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { useFunnelSales } from '@/hooks/useFunnelSales';
import { formatCurrency } from '@/lib/currency';

interface FunnelSalesProps {
  funnelId: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const FunnelSales: React.FC<FunnelSalesProps> = ({ funnelId }) => {
  const { sales, loading, error, updateDateRange } = useFunnelSales(funnelId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Funnel Sales</h2>
          <DateRangeFilter value={sales?.dateRange || { from: new Date(), to: new Date(), preset: 'last7days', label: 'Last 7 days' }} onChange={updateDateRange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
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
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Funnel Sales</h2>
          <DateRangeFilter value={sales?.dateRange || { from: new Date(), to: new Date(), preset: 'last7days', label: 'Last 7 days' }} onChange={updateDateRange} />
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Failed to load sales data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Funnel Sales</h2>
          <p className="text-muted-foreground">{sales.funnelName}</p>
        </div>
        <DateRangeFilter value={sales.dateRange} onChange={updateDateRange} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(sales.totalRevenue, { code: sales.currencyCode as any })}</p>
                <div className="flex items-center mt-2">
                  {sales.comparison.changes.revenue.percentage >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${sales.comparison.changes.revenue.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(sales.comparison.changes.revenue.percentage)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{sales.totalOrders.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {sales.comparison.changes.orders.percentage >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${sales.comparison.changes.orders.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(sales.comparison.changes.orders.percentage)}%
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(sales.averageOrderValue, { code: sales.currencyCode as any })}</p>
                <p className="text-sm text-muted-foreground mt-2">Per order</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{sales.analytics.conversionRate.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground mt-2">Visitors to customers</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Timeline</CardTitle>
          <CardDescription>Daily revenue and orders for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales.analytics.revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.analytics.paymentMethods.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sales.analytics.paymentMethods}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ method, revenue }) => `${method}: ${formatCurrency(revenue, { code: sales.currencyCode as any })}`}
                    >
                      {sales.analytics.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
          <CardDescription>Breakdown of orders by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sales.analytics.orderStatuses.map((status, index) => (
              <div key={status.status} className="text-center">
                <p className="text-2xl font-bold">{status.count}</p>
                <p className="text-sm font-medium capitalize">{status.status}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(status.revenue, { code: sales.currencyCode as any })}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
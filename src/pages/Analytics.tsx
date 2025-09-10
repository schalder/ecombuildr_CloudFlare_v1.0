import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, ShoppingCart, DollarSign, Eye, MousePointer } from 'lucide-react';

interface AnalyticsData {
  id: string;
  date: string;
  visitors: number;
  page_views: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
  store_id: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [prevTotals, setPrevTotals] = useState({ visitors: 0, pageViews: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Get user stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (!stores || stores.length === 0) return;

      const storeIds = stores.map(store => store.id);
      
      // Calculate date ranges
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Calculate previous period for comparison
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevEndDate.getDate() - days);

      // Get websites for these stores
      const { data: websites } = await supabase
        .from('websites')
        .select('id, store_id')
        .in('store_id', storeIds);

      const websiteIds = websites?.map(w => w.id) || [];

      // Parallel queries for current and previous periods using pixel_events for traffic data
      const [
        { data: currentPixelEvents },
        { data: currentOrders },
        { data: prevPixelEvents },
        { data: prevOrders }
      ] = await Promise.all([
        // Current period pixel events (for traffic data)
        supabase
          .from('pixel_events')
          .select('created_at, event_type, session_id')
          .in('store_id', storeIds)
          .in('event_type', ['PageView', 'page_view'])
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        // Current period orders
        supabase
          .from('orders')
          .select('created_at, total, status')
          .in('store_id', storeIds)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .neq('status', 'cancelled'),
        
        // Previous period pixel events (for traffic data)
        supabase
          .from('pixel_events')
          .select('created_at, event_type, session_id')
          .in('store_id', storeIds)
          .in('event_type', ['PageView', 'page_view'])
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString()),
        
        // Previous period orders
        supabase
          .from('orders')
          .select('created_at, total, status')
          .in('store_id', storeIds)
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString())
          .neq('status', 'cancelled')
      ]);

      // Aggregate current period data by date
      const dailyData: { [date: string]: AnalyticsData } = {};
      
      // Fill in all dates with zeros
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyData[dateStr] = {
          id: dateStr,
          date: dateStr,
          visitors: 0,
          page_views: 0,
          orders: 0,
          revenue: 0,
          conversion_rate: 0,
          store_id: storeIds[0] // Use first store ID for compatibility
        };
      }

      // Aggregate pixel events data by date
      const pixelEventsByDate: { [date: string]: { pageViews: number; sessions: Set<string> } } = {};
      
      currentPixelEvents?.forEach(event => {
        const date = event.created_at.split('T')[0];
        if (!pixelEventsByDate[date]) {
          pixelEventsByDate[date] = { pageViews: 0, sessions: new Set() };
        }
        pixelEventsByDate[date].pageViews += 1;
        if (event.session_id) {
          pixelEventsByDate[date].sessions.add(event.session_id);
        }
      });

      // Apply pixel events data to daily data
      Object.entries(pixelEventsByDate).forEach(([date, data]) => {
        if (dailyData[date]) {
          dailyData[date].page_views = data.pageViews;
          dailyData[date].visitors = data.sessions.size;
        }
      });

      // Aggregate orders
      currentOrders?.forEach(order => {
        const date = order.created_at.split('T')[0];
        if (dailyData[date]) {
          dailyData[date].orders += 1;
          dailyData[date].revenue += Number(order.total) || 0;
        }
      });

      // Calculate conversion rates
      Object.values(dailyData).forEach(day => {
        day.conversion_rate = day.visitors > 0 ? (day.orders / day.visitors) * 100 : 0;
      });

      // Calculate previous period totals for comparison from pixel events
      const prevPixelEventsByDate: { [date: string]: { pageViews: number; sessions: Set<string> } } = {};
      
      prevPixelEvents?.forEach(event => {
        const date = event.created_at.split('T')[0];
        if (!prevPixelEventsByDate[date]) {
          prevPixelEventsByDate[date] = { pageViews: 0, sessions: new Set() };
        }
        prevPixelEventsByDate[date].pageViews += 1;
        if (event.session_id) {
          prevPixelEventsByDate[date].sessions.add(event.session_id);
        }
      });

      const prevTotals = {
        visitors: Object.values(prevPixelEventsByDate).reduce((sum, data) => sum + data.sessions.size, 0),
        pageViews: Object.values(prevPixelEventsByDate).reduce((sum, data) => sum + data.pageViews, 0),
        orders: prevOrders?.length || 0,
        revenue: prevOrders?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0
      };

      // Store previous totals for change calculation
      setPrevTotals(prevTotals);

      setAnalytics(Object.values(dailyData).reverse()); // Most recent first
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = analytics.reduce(
    (acc, curr) => ({
      visitors: acc.visitors + curr.visitors,
      pageViews: acc.pageViews + curr.page_views,
      orders: acc.orders + curr.orders,
      revenue: acc.revenue + curr.revenue,
    }),
    { visitors: 0, pageViews: 0, orders: 0, revenue: 0 }
  );

  const avgConversionRate = analytics.length > 0 
    ? analytics.reduce((acc, curr) => acc + curr.conversion_rate, 0) / analytics.length 
    : 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const statsCards = [
    {
      title: "Total Visitors",
      value: totals.visitors.toLocaleString(),
      icon: Users,
      change: calculateChange(totals.visitors, prevTotals.visitors),
      changeType: totals.visitors >= prevTotals.visitors ? "positive" as const : "negative" as const,
    },
    {
      title: "Page Views",
      value: totals.pageViews.toLocaleString(),
      icon: Eye,
      change: calculateChange(totals.pageViews, prevTotals.pageViews),
      changeType: totals.pageViews >= prevTotals.pageViews ? "positive" as const : "negative" as const,
    },
    {
      title: "Total Orders",
      value: totals.orders.toLocaleString(),
      icon: ShoppingCart,
      change: calculateChange(totals.orders, prevTotals.orders),
      changeType: totals.orders >= prevTotals.orders ? "positive" as const : "negative" as const,
    },
    {
      title: "Revenue",
      value: `৳${totals.revenue.toLocaleString()}`,
      icon: DollarSign,
      change: calculateChange(totals.revenue, prevTotals.revenue),
      changeType: totals.revenue >= prevTotals.revenue ? "positive" as const : "negative" as const,
    },
    {
      title: "Conversion Rate",
      value: `${avgConversionRate.toFixed(2)}%`,
      icon: MousePointer,
      change: calculateChange(avgConversionRate, prevTotals.orders > 0 && prevTotals.visitors > 0 ? (prevTotals.orders / prevTotals.visitors) * 100 : 0),
      changeType: avgConversionRate >= (prevTotals.orders > 0 && prevTotals.visitors > 0 ? (prevTotals.orders / prevTotals.visitors) * 100 : 0) ? "positive" as const : "negative" as const,
    },
    {
      title: "Avg. Order Value",
      value: totals.orders > 0 ? `৳${(totals.revenue / totals.orders).toFixed(2)}` : "৳0",
      icon: TrendingUp,
      change: calculateChange(
        totals.orders > 0 ? totals.revenue / totals.orders : 0,
        prevTotals.orders > 0 ? prevTotals.revenue / prevTotals.orders : 0
      ),
      changeType: (totals.orders > 0 ? totals.revenue / totals.orders : 0) >= (prevTotals.orders > 0 ? prevTotals.revenue / prevTotals.orders : 0) ? "positive" as const : "negative" as const,
    },
  ];

  return (
    <DashboardLayout title="Analytics" description="Track your store's performance and insights">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
            </Badge>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="h-8 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statsCards.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </h3>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                          {stat.change}
                        </span>{' '}
                        from last period
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No analytics data available for the selected period.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.slice(0, 10).map((day) => (
                      <div key={day.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {day.visitors} visitors • {day.page_views} page views
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{day.orders} orders</p>
                          <p className="text-sm text-muted-foreground">৳{day.revenue.toFixed(2)}</p>
                        </div>
                        <div className="ml-4">
                          <Badge variant={day.conversion_rate > 2 ? "default" : "secondary"}>
                            {day.conversion_rate.toFixed(2)}% CVR
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
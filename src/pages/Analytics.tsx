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
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (!stores || stores.length === 0) return;

      const storeIds = stores.map(store => store.id);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .in('store_id', storeIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setAnalytics(data || []);
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

  const statsCards = [
    {
      title: "Total Visitors",
      value: totals.visitors.toLocaleString(),
      icon: Users,
      change: "+12.5%",
      changeType: "positive" as const,
    },
    {
      title: "Page Views",
      value: totals.pageViews.toLocaleString(),
      icon: Eye,
      change: "+8.2%",
      changeType: "positive" as const,
    },
    {
      title: "Total Orders",
      value: totals.orders.toLocaleString(),
      icon: ShoppingCart,
      change: "+23.1%",
      changeType: "positive" as const,
    },
    {
      title: "Revenue",
      value: `$${totals.revenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+18.7%",
      changeType: "positive" as const,
    },
    {
      title: "Conversion Rate",
      value: `${avgConversionRate.toFixed(2)}%`,
      icon: MousePointer,
      change: "+2.4%",
      changeType: "positive" as const,
    },
    {
      title: "Avg. Order Value",
      value: totals.orders > 0 ? `$${(totals.revenue / totals.orders).toFixed(2)}` : "$0",
      icon: TrendingUp,
      change: "+5.3%",
      changeType: "positive" as const,
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
                          <p className="text-sm text-muted-foreground">${day.revenue}</p>
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
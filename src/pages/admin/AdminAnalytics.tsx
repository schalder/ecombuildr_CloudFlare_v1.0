import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyData {
  month: string;
  gmv: number;
  users: number;
  websites: number;
}

const AdminAnalytics = () => {
  const { isAdmin, platformStats, loading: adminLoading } = useAdminData();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchMonthlyTrends();
    }
  }, [isAdmin]);

  const fetchMonthlyTrends = async () => {
    try {
      // Get last 12 months of data
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

      // Fetch orders for GMV trends
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Fetch users for growth trends
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Fetch websites for growth trends
      const { data: websites } = await supabase
        .from('websites')
        .select('created_at')
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Create monthly buckets
      const monthlyMap: Record<string, MonthlyData> = {};
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        monthlyMap[monthKey] = {
          month: monthName,
          gmv: 0,
          users: 0,
          websites: 0
        };
      }

      // Aggregate data by month
      orders?.forEach(order => {
        const monthKey = order.created_at.slice(0, 7);
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].gmv += Number(order.total);
        }
      });

      users?.forEach(user => {
        const monthKey = user.created_at.slice(0, 7);
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].users += 1;
        }
      });

      websites?.forEach(website => {
        const monthKey = website.created_at.slice(0, 7);
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].websites += 1;
        }
      });

      setMonthlyData(Object.values(monthlyMap));
    } catch (err) {
      console.error('Error fetching monthly trends:', err);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || isAdmin === null || loading) {
    return (
      <AdminLayout title="Platform Analytics" description="Comprehensive platform performance metrics">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Platform Analytics">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only super admins can access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Analytics" description="Comprehensive platform performance metrics">
      <div className="space-y-6">
        {/* Stats Cards */}
        <AdminStatsCards stats={platformStats} />
        
        {/* GMV Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Merchant GMV Trends
            </CardTitle>
            <CardDescription>
              Monthly merchant gross merchandise value (customer orders)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString('en-US')}`, 'Merchant GMV']} />
                  <Area 
                    type="monotone" 
                    dataKey="gmv" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Users</span>
                  <span className="font-medium">{platformStats?.total_users || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="text-green-600 font-medium">{platformStats?.active_users || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>This Month</span>
                  <span className="font-medium">+{monthlyData[monthlyData.length - 1]?.users || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Website Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Sites</span>
                  <span className="font-medium">{(platformStats?.total_websites || 0) + (platformStats?.total_funnels || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Sites</span>
                  <span className="text-green-600 font-medium">{(platformStats?.active_websites || 0) + (platformStats?.active_funnels || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>This Month</span>
                  <span className="font-medium">+{monthlyData[monthlyData.length - 1]?.websites || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Order Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Orders</span>
                  <span className="font-medium">{platformStats?.total_orders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly GMV</span>
                  <span className="text-green-600 font-medium">${(platformStats?.monthly_gmv || 0).toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Order Value</span>
                  <span className="font-medium">${((platformStats?.merchant_gmv || 0) / Math.max(platformStats?.total_orders || 1, 1)).toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
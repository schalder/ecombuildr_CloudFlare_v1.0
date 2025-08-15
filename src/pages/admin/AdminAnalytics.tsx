import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

// Mock data for revenue chart
const mockRevenueData = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 15000 },
  { month: 'Mar', revenue: 18000 },
  { month: 'Apr', revenue: 22000 },
  { month: 'May', revenue: 19000 },
  { month: 'Jun', revenue: 25000 },
  { month: 'Jul', revenue: 28000 },
  { month: 'Aug', revenue: 30000 },
];

const AdminAnalytics = () => {
  const { isAdmin, platformStats, loading } = useAdminData();

  if (loading || isAdmin === null) {
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
        
        {/* Revenue Chart */}
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
                <AreaChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString('en-US')}`, 'Merchant GMV']} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
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
                  <span>This Month</span>
                  <span className="font-medium">+{platformStats?.total_users || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Growth Rate</span>
                  <span className="text-green-600 font-medium">+12.5%</span>
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
                  <span>This Month</span>
                  <span className="font-medium">+{platformStats?.total_orders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Growth Rate</span>
                  <span className="text-green-600 font-medium">+15.7%</span>
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
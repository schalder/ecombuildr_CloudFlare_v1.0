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
  const { isAdmin, platformStats } = useAdminData();

  if (!isAdmin) {
    return (
      <AdminLayout title="Platform Analytics">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
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
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Monthly revenue trends across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`৳${value.toLocaleString('en-US')}`, 'Revenue']} />
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
                Store Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>This Month</span>
                  <span className="font-medium">+{platformStats?.total_stores || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Growth Rate</span>
                  <span className="text-green-600 font-medium">+8.3%</span>
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
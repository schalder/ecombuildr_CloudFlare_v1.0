import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { 
  DollarSign, 
  TrendingUp, 
  Download, 
  AlertCircle,
  Calendar,
  Users,
  ShoppingBag
} from 'lucide-react';

const AdminRevenue = () => {
  const { isAdmin, platformStats } = useAdminData();

  if (!isAdmin) {
    return (
      <AdminLayout title="Revenue Management">
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

  // Mock data for top customers and products
  const topCustomers = [
    { name: 'John Doe', email: 'john@example.com', revenue: 5200, orders: 12 },
    { name: 'Jane Smith', email: 'jane@example.com', revenue: 4800, orders: 8 },
    { name: 'Alex Johnson', email: 'alex@example.com', revenue: 3600, orders: 6 },
  ];

  const topProducts = [
    { name: 'Premium T-Shirt', category: 'Apparel', revenue: 15000, units: 150 },
    { name: 'Smart Watch', category: 'Electronics', revenue: 12000, units: 80 },
    { name: 'Coffee Mug', category: 'Kitchen', revenue: 8500, units: 340 },
  ];

  return (
    <AdminLayout title="Revenue Management" description="Track SaaS subscription revenue and merchant GMV">
      <div className="space-y-6">
        {/* Revenue Overview - SaaS vs Merchant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                SaaS Revenue (Platform)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${formatCurrency(platformStats?.subscription_mrr || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  From {platformStats?.paid_users || 0} paying subscribers
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Merchant GMV (Customer Orders)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(platformStats?.merchant_gmv || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total merchant sales volume</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  From {platformStats?.total_orders || 0} customer orders
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly GMV</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(platformStats?.monthly_gmv || 0)}
              </div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Customer orders this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(2850)}
              </div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">Visitors to customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Export and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Reports</CardTitle>
                <CardDescription>
                  Export detailed revenue reports and analytics
                </CardDescription>
              </div>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Monthly Report
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Customer Report
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Product Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Highest revenue generating customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(customer.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{customer.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{product.units} units sold</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRevenue;
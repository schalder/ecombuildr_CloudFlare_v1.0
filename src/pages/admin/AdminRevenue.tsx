import React, { useState, useEffect } from 'react';
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
  ShoppingBag,
  Store
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  total_spent: number;
  total_orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  category?: string;
  revenue: number;
  units_sold: number;
}

interface StoreRevenue {
  store_id: string;
  store_name: string;
  owner_email: string;
  revenue: number;
  orders_count: number;
}

const AdminRevenue = () => {
  const { isAdmin, platformStats, loading: adminLoading } = useAdminData();
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [storeRevenues, setStoreRevenues] = useState<StoreRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchRevenueData();
    }
  }, [isAdmin]);

  const fetchRevenueData = async () => {
    try {
      // Fetch top customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, email, total_spent, total_orders')
        .order('total_spent', { ascending: false })
        .limit(10);

      setTopCustomers(customers?.map(c => ({
        id: c.id,
        name: c.full_name,
        email: c.email || 'No email',
        total_spent: c.total_spent || 0,
        total_orders: c.total_orders || 0
      })) || []);

      // Fetch top products by revenue
      const { data: productRevenue } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products!inner(name, categories(name)),
          total,
          quantity
        `);

      // Aggregate product revenue
      const productMap: Record<string, any> = {};
      productRevenue?.forEach(item => {
        const productId = item.product_id;
        if (!productMap[productId]) {
          productMap[productId] = {
            id: productId,
            name: item.products.name,
            category: item.products.categories?.name || 'Uncategorized',
            revenue: 0,
            units_sold: 0
          };
        }
        productMap[productId].revenue += Number(item.total);
        productMap[productId].units_sold += item.quantity;
      });

      const topProductsList = Object.values(productMap)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10) as TopProduct[];

      setTopProducts(topProductsList);

      // Fetch store revenue breakdown
      const { data: storeData } = await supabase
        .from('orders')
        .select(`
          store_id,
          total,
          stores!inner(name, profiles!inner(email))
        `);

      // Aggregate by store
      const storeMap: Record<string, any> = {};
      storeData?.forEach(order => {
        const storeId = order.store_id;
        if (!storeMap[storeId]) {
          storeMap[storeId] = {
            store_id: storeId,
            store_name: order.stores.name,
            owner_email: order.stores.profiles.email,
            revenue: 0,
            orders_count: 0
          };
        }
        storeMap[storeId].revenue += Number(order.total);
        storeMap[storeId].orders_count += 1;
      });

      const storeRevenueList = Object.values(storeMap)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10) as StoreRevenue[];

      setStoreRevenues(storeRevenueList);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || isAdmin === null || loading) {
    return (
      <AdminLayout title="Revenue Tracking (Merchants)" description="Track merchant GMV and customer order analytics">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Revenue Tracking (Merchants)">
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

  const avgOrderValue = (platformStats?.merchant_gmv || 0) / Math.max(platformStats?.total_orders || 1, 1);

  return (
    <AdminLayout title="Revenue Tracking (Merchants)" description="Track merchant GMV and customer order analytics">
      <div className="space-y-6">
        {/* Merchant GMV Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchant GMV</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(platformStats?.merchant_gmv || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All-time customer orders</p>
            </CardContent>
          </Card>

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
                This month's orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(avgOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">Per customer order</p>
            </CardContent>
          </Card>
        </div>

        {/* Export and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Merchant Revenue Reports</CardTitle>
                <CardDescription>
                  Export detailed merchant GMV reports and analytics
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
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                GMV Report
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Customer Report
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Store Performance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers
              </CardTitle>
              <CardDescription>Highest spending customers across all stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(customer.total_spent)}</div>
                        <div className="text-sm text-muted-foreground">{customer.total_orders} orders</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No customer data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Top Products
              </CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.revenue)}</div>
                        <div className="text-sm text-muted-foreground">{product.units_sold} units sold</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Performance
            </CardTitle>
            <CardDescription>Revenue breakdown by merchant stores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storeRevenues.length > 0 ? (
                storeRevenues.map((store) => (
                  <div key={store.store_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{store.store_name}</div>
                      <div className="text-sm text-muted-foreground">{store.owner_email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(store.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{store.orders_count} orders</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No store data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminRevenue;
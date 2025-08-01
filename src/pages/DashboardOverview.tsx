import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Eye, Edit, ExternalLink, ShoppingCart, Store, FileText, Users, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";

interface Store {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stores
      const { data: storesData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (storesData) {
        setStores(storesData);

        // Fetch stats for the first store (or aggregate across all stores)
        if (storesData.length > 0) {
          const storeId = storesData[0].id;
          
          // Get total products
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('store_id', storeId);

          // Get total orders and revenue
          const { data: ordersData } = await supabase
            .from('orders')
            .select('total')
            .eq('store_id', storeId);

          // Get total customers
          const { count: customersCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('store_id', storeId);

          // Get recent orders
          const { data: recentOrdersData } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, total, status, created_at')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
            .limit(5);

          const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
          const totalOrders = ordersData?.length || 0;

          setStats({
            totalRevenue,
            totalOrders,
            totalCustomers: customersCount || 0,
            totalProducts: productsCount || 0,
          });

          setRecentOrders(recentOrdersData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-success-light text-success';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Welcome back! Here's what's happening with your store"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={stats || undefined} loading={loading} />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest customer orders</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <NavLink to="/dashboard/orders">
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </NavLink>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name} • {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <div className="font-medium">৳{Number(order.total).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No orders yet</p>
                  <p className="text-sm">Orders will appear here once customers start purchasing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Stores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Stores</CardTitle>
                <CardDescription>Manage your F-Commerce stores</CardDescription>
              </div>
              <Button asChild size="sm">
                <NavLink to="/dashboard/stores/create">
                  <Plus className="h-4 w-4" />
                </NavLink>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-3 border rounded">
                      <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : stores.length > 0 ? (
                <div className="space-y-3">
                  {stores.slice(0, 3).map((store) => (
                    <div key={store.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{store.name}</div>
                        <Badge variant={store.is_active ? "default" : "secondary"}>
                          {store.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {store.domain || `${store.slug}.f-commerce.com`}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <NavLink to={`/dashboard/stores/${store.id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </NavLink>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <a href={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {stores.length > 3 && (
                    <Button asChild variant="outline" className="w-full">
                      <NavLink to="/dashboard/stores">
                        View All Stores ({stores.length})
                      </NavLink>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Store className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No stores created yet</p>
                  <Button asChild className="mt-2">
                    <NavLink to="/dashboard/stores/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Store
                    </NavLink>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <NavLink to="/dashboard/products/add">
                  <Plus className="h-6 w-6" />
                  Add Product
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <NavLink to="/dashboard/pages/builder">
                  <FileText className="h-6 w-6" />
                  Build Page
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <NavLink to="/dashboard/customers">
                  <Users className="h-6 w-6" />
                  View Customers
                </NavLink>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <NavLink to="/dashboard/analytics">
                  <BarChart3 className="h-6 w-6" />
                  Analytics
                </NavLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
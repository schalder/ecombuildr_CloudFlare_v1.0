import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Edit, Eye, Settings, BarChart3, Package, Users, ShoppingCart } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  domain?: string;
  created_at: string;
  updated_at: string;
}

interface StoreStats {
  total_products: number;
  total_orders: number;
  total_customers: number;
  total_revenue: number;
}

const StoreManagement = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      // Fetch store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Fetch store statistics
      const [productsResult, ordersResult, customersResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('store_id', storeId),
        supabase.from('orders').select('id, total', { count: 'exact' }).eq('store_id', storeId),
        supabase.from('customers').select('id', { count: 'exact' }).eq('store_id', storeId)
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      setStats({
        total_products: productsResult.count || 0,
        total_orders: ordersResult.count || 0,
        total_customers: customersResult.count || 0,
        total_revenue: totalRevenue
      });

    } catch (error: any) {
      console.error('Error fetching store data:', error);
      toast({
        title: "Error",
        description: "Failed to load store data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStore = async () => {
    if (!store) return;
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !store.is_active })
        .eq('id', store.id);

      if (error) throw error;

      setStore({ ...store, is_active: !store.is_active });
      toast({
        title: "Success",
        description: `Store ${store.is_active ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update store status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Store Management" description="Manage your store settings and view analytics">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout title="Store Not Found" description="The requested store could not be found">
        <Card>
          <CardContent className="pt-6">
            <p>Store not found or you don't have permission to access it.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={store.name} description="Manage your store settings and view performance">
      <div className="space-y-6">
        {/* Store Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {store.logo_url && (
                  <img 
                    src={store.logo_url} 
                    alt={store.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-2xl">{store.name}</CardTitle>
                  <CardDescription>{store.description || 'No description'}</CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={store.is_active ? "default" : "secondary"}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">/{store.slug}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/store/${store.slug}`, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Store
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/settings/store`)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant={store.is_active ? "destructive" : "default"}
                  onClick={handleToggleStore}
                >
                  {store.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_products}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_orders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_customers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৳{stats.total_revenue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Store Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Overview</CardTitle>
                <CardDescription>General information about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Store URL</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        /store/{store.slug}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`/store/${store.slug}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(store.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={() => navigate('/dashboard/products')}>
                    Manage Products
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard/orders')}>
                    View Orders
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard/customers')}>
                    Manage Customers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage your store's products</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/dashboard/products')}>
                  Go to Products
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View and manage your store's orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/dashboard/orders')}>
                  Go to Orders
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>Manage your store's customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/dashboard/customers')}>
                  Go to Customers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StoreManagement;
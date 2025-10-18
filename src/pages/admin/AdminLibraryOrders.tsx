import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Store, User, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface LibraryProductOrder {
  order_id: string;
  order_number: string;
  store_name: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
  product_name: string;
  quantity: number;
  price: number;
}

export default function AdminLibraryOrders() {
  const { id } = useParams<{ id: string }>();
  const [orders, setOrders] = useState<LibraryProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchOrders();
      fetchProductName();
    }
  }, [id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_library_product_orders', { library_product_id_param: id });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching library product orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductName = async () => {
    try {
      const { data, error } = await supabase
        .from('product_library')
        .select('name')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProductName(data?.name || '');
    } catch (error) {
      console.error('Error fetching product name:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
  const totalOrders = orders.length;
  const uniqueStores = new Set(orders.map(order => order.store_name)).size;

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/product-library">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders for {productName}</h1>
            <p className="text-muted-foreground">View all orders containing this library product</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueStores}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>All orders containing this product</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found for this product yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div key={`${order.order_id}-${index}`} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{order.order_number}</Badge>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <strong>Store:</strong> {order.store_name}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <strong>Customer:</strong> {order.customer_name}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <strong>Quantity:</strong> {order.quantity} × ৳{order.price}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <strong>Email:</strong> {order.customer_email}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Product Total: ৳{(order.price * order.quantity).toFixed(2)}
                      </span>
                      <span className="font-semibold">
                        Order Total: ৳{parseFloat(order.total.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
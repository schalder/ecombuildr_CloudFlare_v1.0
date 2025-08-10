import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Package, MapPin, CreditCard, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';
import { nameWithVariant } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_area: string;
  payment_method: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount?: number;
  discount_code?: string;
  shipping_method?: string;
  total: number;
  created_at: string;
  notes?: string;
  custom_fields?: any;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku?: string;
  price: number;
  quantity: number;
  total: number;
  variation?: any;
}

export const OrderConfirmation: React.FC = () => {
  const { slug, websiteId, orderId: orderIdParam } = useParams<{ slug?: string; websiteId?: string; orderId?: string }>();
  const [searchParams] = useSearchParams();
  const { store, loadStore, loadStoreById } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const paths = useEcomPaths();
  const orderId = orderIdParam || searchParams.get('orderId') || '';
useEffect(() => {
  if (slug) {
    loadStore(slug);
  } else if (websiteId) {
    (async () => {
      const { data: website } = await supabase
        .from('websites')
        .select('store_id')
        .eq('id', websiteId)
        .single();
      if (website?.store_id) {
        await loadStoreById(website.store_id);
      }
    })();
  }
}, [slug, websiteId, loadStore, loadStoreById]);


  useEffect(() => {
    if (store && orderId) {
      fetchOrder();
    }
  }, [store, orderId]);

  const fetchOrder = async () => {
    if (!store || !orderId) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-order', {
        body: { orderId },
      });
      if (error) throw error;
      if (!data || !data.order) {
        setOrder(null);
        setOrderItems([]);
      } else {
        setOrder(data.order as Order);
        setOrderItems((data.items || []) as OrderItem[]);
      }
    } catch (error) {
      console.error('Error fetching order via edge function:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (order?.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'shipped':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (!store) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Store not found</div>
        </div>
      </StorefrontLayout>
    );
  }

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!order) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The requested order could not be found or does not belong to this store.
            </p>
            <Link to={paths.home}>
              <Button>Return to Store</Button>
            </Link>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll send you updates via email.
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{order.order_number}</span>
                <Badge className={`${getStatusColor(order.status)} text-white`}>
                  <span className="flex items-center">
                    {getStatusIcon()}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold flex items-center mb-3">
                  <MapPin className="h-4 w-4 mr-2" />
                  Customer Information
                </h3>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {order.customer_name}</p>
                  <p><strong>Email:</strong> {order.customer_email}</p>
                  <p><strong>Phone:</strong> {order.customer_phone}</p>
                </div>
              </div>

              <Separator />

              {/* Shipping Information */}
              <div>
                <h3 className="font-semibold flex items-center mb-3">
                  <Package className="h-4 w-4 mr-2" />
                  Shipping Address
                </h3>
                <div className="text-sm">
                  <p>{order.shipping_address}</p>
                  <p>{order.shipping_city}{order.shipping_area && `, ${order.shipping_area}`}</p>
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold flex items-center mb-3">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Method
                </h3>
                <p className="text-sm capitalize">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
              </div>

              {/* Custom Fields */}
              {Array.isArray((order as any).custom_fields) && (order as any).custom_fields.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Additional Information</h3>
                    <div className="space-y-1">
                      {(order as any).custom_fields.map((cf: any, idx: number) => (
                        <p key={idx} className="text-sm"><strong>{cf.label || cf.id}:</strong> {String(cf.value)}</p>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {!Array.isArray((order as any).custom_fields) && (order as any).custom_fields && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Additional Information</h3>
                    <div className="space-y-1">
                      {Object.entries((order as any).custom_fields).map(([key, val]: any) => (
                        <p key={key} className="text-sm"><strong>{key}:</strong> {String(val)}</p>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Order Notes</h3>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{nameWithVariant(item.product_name, (item as any).variation)}</p>
                      {item.product_sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${order.shipping_cost.toFixed(2)}</span>
                </div>
                {(order.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${(order.discount_amount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Date */}
          <div className="text-center text-sm text-muted-foreground mb-6">
            Order placed on {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link to={paths.home} className="flex-1">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="flex-1"
            >
              Print Order
            </Button>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
};
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Package, MapPin, CreditCard, Clock, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';
import { nameWithVariant } from '@/lib/utils';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import jsPDF from 'jspdf';
import CourseOrderConfirmation from '@/components/course/CourseOrderConfirmation';

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
  const { slug, websiteId, websiteSlug, orderId: orderIdParam } = useParams<{ slug?: string; websiteId?: string; websiteSlug?: string; orderId?: string }>();
  const [searchParams] = useSearchParams();
  const { store, loadStore, loadStoreById } = useStore();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCourseOrder, setIsCourseOrder] = useState(false);
  const paths = useEcomPaths();
  const orderId = orderIdParam || searchParams.get('orderId') || '';
  const orderToken = searchParams.get('ot') || '';
  const isWebsiteContext = Boolean(websiteId || websiteSlug);
  const { pixels } = usePixelContext();
  const { trackPurchase } = usePixelTracking(pixels, store?.id);
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
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, orderToken, store]);

  // If this is a course order, delegate to the dedicated component
  if (isCourseOrder) {
    return <CourseOrderConfirmation />;
  }


  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      // If no token is present, this is likely a course order. Try course lookup first.
      if (!orderToken) {
        const { data: courseData, error: courseError } = await supabase.functions.invoke('get-course-order-public', {
          body: { orderId }
        });
        if (!courseError && courseData?.order) {
          setIsCourseOrder(true);
          setLoading(false);
          return;
        }
      }

      if (!store) return;

      // Use public order access with token for storefront orders
      const { data, error } = await supabase.functions.invoke('get-order-public', {
        body: { 
          orderId,
          storeId: store.id,
          token: orderToken 
        },
      });
      if (error) throw error;
      if (!data || !data.order) {
        // As a fallback, try course order lookup even if token exists
        const { data: courseData } = await supabase.functions.invoke('get-course-order-public', {
          body: { orderId }
        });
        if (courseData?.order) {
          setIsCourseOrder(true);
          setLoading(false);
          return;
        }

        setOrder(null);
        setOrderItems([]);
      } else {
        const orderData = data.order as Order;
        const itemsData = (data.items || []) as OrderItem[];
        
        setOrder(orderData);
        setOrderItems(itemsData);
        
        // Clear cart when order confirmation is successfully loaded
        clearCart();
        
        // Track Purchase event when order confirmation page loads (for online payments)
        // Check if purchase was already tracked (e.g., from PaymentProcessing for deferred payments)
        const alreadyTracked = sessionStorage.getItem('purchase_tracked_' + orderData.id) === 'true';
        
        if (!alreadyTracked && orderData && itemsData.length > 0) {
          const trackingItems = itemsData.map(item => ({
            item_id: item.id,
            item_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            item_category: undefined
          }));
          
          trackPurchase({
            transaction_id: orderData.id,
            value: orderData.total,
            items: trackingItems
          });
          
          // Store tracking flag to prevent future duplicates
          sessionStorage.setItem('purchase_tracked_' + orderData.id, 'true');
        }
        
        // Clear tracking flag after processing
        if (alreadyTracked) {
          sessionStorage.removeItem('purchase_tracked_' + orderData.id);
        }
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

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header
    pdf.setFontSize(20);
    pdf.text('Order Confirmation', pageWidth / 2, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(16);
    pdf.text(`Order #${order?.order_number}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Customer Information
    pdf.setFontSize(14);
    pdf.text('Customer Information:', 20, y);
    y += 10;
    pdf.setFontSize(10);
    pdf.text(`Name: ${order?.customer_name}`, 20, y);
    y += 6;
    pdf.text(`Email: ${order?.customer_email}`, 20, y);
    y += 6;
    pdf.text(`Phone: ${order?.customer_phone}`, 20, y);
    y += 15;

    // Shipping Information
    pdf.setFontSize(14);
    pdf.text('Shipping Address:', 20, y);
    y += 10;
    pdf.setFontSize(10);
    pdf.text(`${order?.shipping_address}`, 20, y);
    y += 6;
    pdf.text(`${order?.shipping_city}${order?.shipping_area ? `, ${order?.shipping_area}` : ''}`, 20, y);
    y += 15;

    // Order Items
    pdf.setFontSize(14);
    pdf.text('Order Items:', 20, y);
    y += 10;
    
    orderItems.forEach((item) => {
      pdf.setFontSize(10);
      const itemName = nameWithVariant(item.product_name, (item as any).variation);
      pdf.text(`${itemName} x${item.quantity}`, 20, y);
      pdf.text(`$${item.total.toFixed(2)}`, pageWidth - 40, y);
      y += 6;
    });

    y += 10;
    pdf.text(`Subtotal: $${order?.subtotal.toFixed(2)}`, pageWidth - 80, y);
    y += 6;
    pdf.text(`Shipping: $${order?.shipping_cost.toFixed(2)}`, pageWidth - 80, y);
    if ((order?.discount_amount ?? 0) > 0) {
      y += 6;
      pdf.text(`Discount: -$${(order?.discount_amount ?? 0).toFixed(2)}`, pageWidth - 80, y);
    }
    y += 6;
    pdf.setFontSize(12);
    pdf.text(`Total: $${order?.total.toFixed(2)}`, pageWidth - 80, y);

    pdf.save(`order-${order?.order_number}.pdf`);
  };

  if (!store && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Store not found</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Order Processing</h1>
          <p className="text-muted-foreground mb-6">
            Please wait while we process your order...
          </p>
          <Link to={paths.home}>
            <Button>Return to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  const content = (
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

            {/* Custom Fields and Notes - simplified for space */}
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
        <div className="flex space-x-2">
          <Link to={paths.home} className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          <Button
            onClick={downloadPDF}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );

  if (isWebsiteContext) {
    return content;
  }

  return content;
};
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InvoiceDialog } from "@/components/dashboard/InvoiceDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  ShoppingCart,
  Filter
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { nameWithVariant } from '@/lib/utils';

interface Order {
  id: string;
  store_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  created_at: string;
  payment_method: string;
  shipping_city?: string;
  shipping_address?: string;
  shipping_area?: string;
  notes?: string;
  courier_name?: string | null;
  tracking_number?: string | null;
}

const statusColors = {
  pending: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
} as const;

export default function Orders() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ order: any; items: any[] } | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, any[]>>({});
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [existingShipment, setExistingShipment] = useState<any | null>(null);
  const [orderToPush, setOrderToPush] = useState<Order | null>(null);
  const [pushing, setPushing] = useState(false);
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            store_id,
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            status,
            total,
            created_at,
            payment_method,
            shipping_city,
            shipping_area,
            shipping_address,
            courier_name,
            tracking_number,
            notes
          `)
          .in('store_id', stores.map(store => store.id))
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(orders || []);

        // Fetch items for these orders to summarize products/variants in list
        const orderIds = (orders || []).map(o => o.id);
        if (orderIds.length > 0) {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('id, order_id, product_name, variation, quantity, price, total')
            .in('order_id', orderIds);
          if (itemsError) throw itemsError;
          const map: Record<string, any[]> = {};
          (items || []).forEach((it: any) => {
            if (!map[it.order_id]) map[it.order_id] = [];
            map[it.order_id].push(it);
          });
          setOrderItemsMap(map);
        } else {
          setOrderItemsMap({});
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const steadfastTrackUrl = (code?: string | null) => code ? `https://steadfast.com.bd/t/${encodeURIComponent(code)}` : '#';

  const handlePushToSteadfast = async (order: Order, force: boolean = false) => {
    try {
      if (!force) {
        const { data: shipment, error: shipErr } = await supabase
          .from('courier_shipments')
          .select('id, consignment_id, tracking_code, invoice, status, created_at')
          .eq('order_id', order.id)
          .eq('provider', 'steadfast')
          .order('created_at', { ascending: false })
          .maybeSingle();
        if (shipErr) {
          console.error('Check shipment error', shipErr);
        }
        if (shipment) {
          setExistingShipment(shipment);
          setOrderToPush(order);
          setPushDialogOpen(true);
          return;
        }
      }

      setPushing(true);
      toast({ title: "Sending to Steadfast...", description: "Creating consignment" });
      const { data, error } = await supabase.functions.invoke('steadfast-create-order', {
        body: { store_id: order.store_id, order_id: order.id },
      });
      if (error) throw error;
      if (data?.ok) {
        const consignment = data?.consignment || {};
        const tracking = consignment?.tracking_code || consignment?.consignment_id || data?.message;
        setOrders(prev => prev.map(o => 
          o.id === order.id 
            ? { 
                ...o, 
                status: 'processing', 
                courier_name: 'steadfast', 
                tracking_number: consignment?.tracking_code || consignment?.consignment_id || null 
              }
            : o
        ));
        toast({ title: "Pushed to Steadfast", description: tracking ? String(tracking) : "Consignment created." });
      } else {
        throw new Error(data?.error || "Failed to create consignment");
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Steadfast error", description: e?.message || "Failed to create consignment", variant: "destructive" });
    } finally {
      setPushing(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <DashboardLayout 
      title="Orders" 
      description="Manage your orders and track fulfillment"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orderStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{orderStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">{orderStats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold">{orderStats.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
                  Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("shipped")}>
                  Shipped
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("delivered")}>
                  Delivered
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Orders will appear here when customers place them'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Shipping</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          {order.shipping_city && (
                            <div className="text-sm text-muted-foreground">
                              to {order.shipping_city}
                            </div>
                          )}
                          {Array.isArray(orderItemsMap[order.id]) && orderItemsMap[order.id].length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {orderItemsMap[order.id].slice(0, 2).map((it: any, i: number) => (
                                <div key={i}>{nameWithVariant(it.product_name, it.variation)} × {it.quantity}</div>
                              ))}
                              {orderItemsMap[order.id].length > 2 && (
                                <div>+{orderItemsMap[order.id].length - 2} more item(s)</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                          {(order.shipping_city || order.shipping_area || order.shipping_address) && (
                            <div className="text-xs text-muted-foreground">
                              Ship: {order.shipping_city || ''}{order.shipping_area ? `, ${order.shipping_area}` : ''}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[order.status as keyof typeof statusColors] || "secondary"}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{order.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {order.payment_method.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {order.courier_name ? (
                          <div className="space-y-1">
                            <div className="text-sm">{order.courier_name === 'steadfast' ? 'Steadfast' : order.courier_name}</div>
                            {order.tracking_number && (
                              <div className="text-xs">
                                <a
                                  href={`https://steadfast.com.bd/t/${encodeURIComponent(order.tracking_number)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  Track ({order.tracking_number})
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={async () => {
                                setSelectedOrder(order);
                                // Fetch full details for dialog
                                try {
                                  const { data, error } = await supabase.functions.invoke('get-order', { body: { orderId: order.id } });
                                  if (error) throw error;
                                  if (data) {
                                    setSelectedOrder({ ...order, ...data.order });
                                    setSelectedOrderItems(data.items || []);
                                  }
                                } catch (e) { console.error(e); }
                                setIsOrderDetailsOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {order.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order.id, 'processing')}
                              >
                                Mark Processing
                              </DropdownMenuItem>
                            )}
                            {order.status === 'processing' && (
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order.id, 'shipped')}
                              >
                                Mark Shipped
                              </DropdownMenuItem>
                            )}
                            {order.status === 'shipped' && (
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                              >
                                Mark Delivered
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={async () => {
                                setSelectedOrder(order);
                                try {
                                  const { data } = await supabase.functions.invoke('get-order', { body: { orderId: order.id } });
                                  if (data) {
                                    setInvoiceData({ order: data.order, items: data.items || [] });
                                    setInvoiceOpen(true);
                                  }
                                } catch (e) { console.error(e); }
                              }}
                            >
                              Invoice / PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePushToSteadfast(order)}
                            >
                              Push to Steadfast
                            </DropdownMenuItem>
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!confirm('Cancel this order?')) return;
                                  await updateOrderStatus(order.id, 'cancelled');
                                }}
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={async () => {
                                if (!confirm('Delete this order permanently? This cannot be undone.')) return;
                                try {
                                  const { error } = await supabase.functions.invoke('delete-order', { body: { orderId: order.id } });
                                  if (error) throw error;
                                  setOrders(orders.filter(o => o.id !== order.id));
                                  toast({ title: 'Deleted', description: 'Order deleted successfully.' });
                                } catch (e) {
                                  console.error(e);
                                  toast({ title: 'Error', description: 'Failed to delete order', variant: 'destructive' });
                                }
                              }}
                            >
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Customer</h4>
                    <p>{selectedOrder.customer_name}</p>
                    <p>{selectedOrder.customer_phone}</p>
                    <p>{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Shipping</h4>
                    <p>{selectedOrder.shipping_address}</p>
                    <p>{selectedOrder.shipping_city}{selectedOrder.shipping_area ? `, ${selectedOrder.shipping_area}` : ''}</p>
                  </div>
                </div>
                {/* Custom Fields */}
                {Array.isArray((selectedOrder as any).custom_fields) && (selectedOrder as any).custom_fields.length > 0 && (
                  <div>
                    <h4 className="font-medium">Additional Information</h4>
                    <div className="mt-2 space-y-1">
                      {(selectedOrder as any).custom_fields.map((cf: any, idx: number) => (
                        <p key={idx} className="text-sm"><strong>{cf.label || cf.id}:</strong> {String(cf.value)}</p>
                      ))}
                    </div>
                  </div>
                )}
                {!Array.isArray((selectedOrder as any).custom_fields) && (selectedOrder as any).custom_fields && (
                  <div>
                    <h4 className="font-medium">Additional Information</h4>
                    <div className="mt-2 space-y-1">
                      {Object.entries((selectedOrder as any).custom_fields).map(([key, val]: any) => (
                        <p key={key} className="text-sm"><strong>{key}:</strong> {String(val)}</p>
                      ))}
                    </div>
                  </div>
                )}
                  <div>
                    <h4 className="font-medium">Order Summary</h4>
                    <p>Status: <Badge>{selectedOrder.status}</Badge></p>
                    <p>Total: ৳{selectedOrder.total.toLocaleString()}</p>
                    <p>Payment: {selectedOrder.payment_method}</p>
                    <p>Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    {selectedOrder.courier_name && (
                      <p>
                        Shipping: {selectedOrder.courier_name === 'steadfast' ? 'Steadfast' : selectedOrder.courier_name}
                        {selectedOrder.tracking_number && (
                          <> — <a href={`https://steadfast.com.bd/t/${encodeURIComponent(selectedOrder.tracking_number)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Track</a></>
                        )}
                      </p>
                    )}
                  </div>
                <div>
                  <h4 className="font-medium">Order Items</h4>
                  <div className="mt-2 space-y-1">
                    {selectedOrderItems.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{nameWithVariant(it.product_name, it.variation)} × {it.quantity}</span>
                        <span>৳{Number(it.total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Steadfast Re-push Dialog */}
        <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order already pushed to Steadfast</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>This order has already been pushed to Steadfast.</p>
              {existingShipment && (
                <div className="space-y-1">
                  <p>Parcel ID: <strong>{existingShipment.consignment_id || '—'}</strong></p>
                  {existingShipment.tracking_code && (
                    <p>
                      Tracking: <a href={steadfastTrackUrl(existingShipment.tracking_code)} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {existingShipment.tracking_code}
                      </a>
                    </p>
                  )}
                </div>
              )}
              <p>Do you want to push it again?</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPushDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { setPushDialogOpen(false); orderToPush && handlePushToSteadfast(orderToPush, true); }} disabled={pushing}>
                {pushing ? "Pushing..." : "Push Again"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <InvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} data={invoiceData} />
      </div>
    </DashboardLayout>
  );
}
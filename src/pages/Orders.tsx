import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  ShoppingCart,
  Filter,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  X,
  Package,
  Trash2,
  Ban,
  CheckCircle
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { nameWithVariant, openWhatsApp } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizePhoneNumber } from "@/utils/authValidation";

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
  payment_transaction_number?: string;
  shipping_city?: string;
  shipping_address?: string;
  shipping_area?: string;
  notes?: string;
  courier_name?: string | null;
  tracking_number?: string | null;
  website_id?: string;
  funnel_id?: string;
  ip_address?: string | null;
  is_potential_fake?: boolean;
  marked_not_fake?: boolean;
}

const statusColors = {
  pending: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
} as const;

// Normalize IP address (remove port, trim whitespace)
function normalizeIP(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  // Remove port if present (e.g., "192.168.1.1:8080" -> "192.168.1.1")
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    // Check if it's IPv4 with port (2 parts, second is numeric)
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      return parts[0];
    }
    // For IPv6, return as-is for now
    return trimmed;
  }
  return trimmed;
}

// Helper function to determine if payment is confirmed
const isPaymentConfirmed = (order: Order): boolean => {
  // For EPS/EB Pay: payment is already collected immediately, so always show checkmark
  if (order.payment_method === 'eps' || order.payment_method === 'ebpay') {
    return true;
  }
  // For COD: payment is collected only when order is delivered
  if (order.payment_method === 'cod' && order.status === 'delivered') {
    return true;
  }
  return false;
};

export default function Orders() {
  const { user } = useAuth();
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "");
  const [activeTab, setActiveTab] = useState<'all' | 'fake'>('all');
  const [fakeOrderFilter, setFakeOrderFilter] = useState<'all' | 'blocked'>('all');
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
  const [websiteMap, setWebsiteMap] = useState<Record<string, string>>({});
  const [funnelMap, setFunnelMap] = useState<Record<string, string>>({});
  const [isIPBlocked, setIsIPBlocked] = useState<boolean>(false);
  const [blockedIPInfo, setBlockedIPInfo] = useState<any>(null);
  
  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkActionProgress, setBulkActionProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ordersPerPage = 10;
  
  const isMobile = useIsMobile();
  useEffect(() => {
    if (user) {
      if (activeTab === 'fake') {
        if (fakeOrderFilter === 'blocked') {
          fetchBlockedIPOrders();
        } else {
          fetchFakeOrders();
        }
      } else {
        fetchOrders();
      }
    }
  }, [user, currentPage, searchTerm, statusFilter, activeTab, fakeOrderFilter]);

  // Check if IP is blocked when order details open
  useEffect(() => {
    const checkIPBlocked = async () => {
      if (!selectedOrder?.ip_address || !selectedOrder?.store_id) {
        setIsIPBlocked(false);
        setBlockedIPInfo(null);
        return;
      }

      // Normalize IP address before checking
      const normalizedIP = normalizeIP(selectedOrder.ip_address);
      if (!normalizedIP) {
        setIsIPBlocked(false);
        setBlockedIPInfo(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('blocked_ips')
          .select('*')
          .eq('store_id', selectedOrder.store_id)
          .eq('ip_address', normalizedIP)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking blocked IP:', error);
          setIsIPBlocked(false);
          setBlockedIPInfo(null);
          return;
        }

        if (data) {
          setIsIPBlocked(true);
          setBlockedIPInfo(data);
        } else {
          setIsIPBlocked(false);
          setBlockedIPInfo(null);
        }
      } catch (error) {
        console.error('Error checking blocked IP:', error);
        setIsIPBlocked(false);
        setBlockedIPInfo(null);
      }
    };

    if (isOrderDetailsOpen && selectedOrder) {
      checkIPBlocked();
    }
  }, [isOrderDetailsOpen, selectedOrder]);

  useEffect(() => {
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    if (status) {
      setStatusFilter(status);
    }
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle orderId parameter from notifications
  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Open the order details dialog
        const openOrderDetails = async () => {
          try {
            const { data, error } = await supabase.functions.invoke('get-order-admin', { body: { orderId: order.id } });
            if (error) throw error;
            if (data) {
              setSelectedOrder({ ...order, ...data.order });
              setSelectedOrderItems(data.items || []);
              setIsOrderDetailsOpen(true);
            }
          } catch (e) { 
            console.error('Error fetching order details:', e);
            toast({
              title: "Error",
              description: "Could not load order details",
              variant: "destructive",
            });
          }
        };
        openOrderDetails();
      }
    }
  }, [orderId, orders]);

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
        const storeIds = stores.map(store => store.id);
        
        // Build search query
        let ordersQuery = supabase
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
            payment_transaction_number,
            shipping_city,
            shipping_area,
            shipping_address,
            courier_name,
            tracking_number,
            notes,
            website_id,
            funnel_id,
            ip_address,
            is_potential_fake,
            marked_not_fake
          `)
          .in('store_id', storeIds);

        // Apply search filter if searchTerm exists
        if (searchTerm.trim()) {
          ordersQuery = ordersQuery.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
        }

        // Exclude fake orders from "All Orders" tab (show orders that are not potential fake, or marked as not fake)
        if (activeTab === 'all') {
          ordersQuery = ordersQuery.or('is_potential_fake.is.null,is_potential_fake.eq.false,marked_not_fake.eq.true');
        }

        // Apply status filter if statusFilter exists
        if (statusFilter) {
          ordersQuery = ordersQuery.eq('status', statusFilter as 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled');
        }

        // Get total count for pagination with same filters
        let countQuery = supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds);

        // Exclude fake orders from "All Orders" tab count (show orders that are not potential fake, or marked as not fake)
        if (activeTab === 'all') {
          countQuery = countQuery.or('is_potential_fake.is.null,is_potential_fake.eq.false,marked_not_fake.eq.true');
        }

        if (searchTerm.trim()) {
          countQuery = countQuery.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
        }

        if (statusFilter) {
          countQuery = countQuery.eq('status', statusFilter as 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled');
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        setTotalCount(count || 0);
        
        // Calculate offset for pagination
        const offset = (currentPage - 1) * ordersPerPage;
        
        // Fetch orders, websites, and funnels in parallel
        const [
          { data: orders, error: ordersError },
          { data: websites, error: websitesError },
          { data: funnels, error: funnelsError }
        ] = await Promise.all([
          ordersQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + ordersPerPage - 1),
          supabase
            .from('websites')
            .select('id, name')
            .in('store_id', storeIds)
            .eq('is_active', true),
          supabase
            .from('funnels')
            .select('id, name')
            .in('store_id', storeIds)
            .eq('is_active', true)
        ]);

        // Create lookup maps
        const websiteNameMap: Record<string, string> = {};
        const funnelNameMap: Record<string, string> = {};
        
        (websites || []).forEach(w => {
          websiteNameMap[w.id] = w.name;
        });
        
        (funnels || []).forEach(f => {
          funnelNameMap[f.id] = f.name;
        });

        setWebsiteMap(websiteNameMap);
        setFunnelMap(funnelNameMap);

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

  const fetchFakeOrders = async () => {
    try {
      setLoading(true);
      
      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id);

      if (storesError) throw storesError;

      if (stores && stores.length > 0) {
        const storeIds = stores.map(store => store.id);
        
        // Build query for fake orders
        let ordersQuery = supabase
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
            payment_transaction_number,
            shipping_city,
            shipping_area,
            shipping_address,
            courier_name,
            tracking_number,
            notes,
            website_id,
            funnel_id,
            ip_address,
            is_potential_fake,
            marked_not_fake
          `)
          .in('store_id', storeIds)
          .eq('is_potential_fake', true)
          .eq('marked_not_fake', false);

        // Apply search filter if searchTerm exists
        if (searchTerm.trim()) {
          ordersQuery = ordersQuery.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
        }

        // Apply status filter if statusFilter exists
        if (statusFilter) {
          ordersQuery = ordersQuery.eq('status', statusFilter as 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled');
        }

        // Apply pagination
        const offset = (currentPage - 1) * ordersPerPage;
        const { data: orders, error: ordersError } = await ordersQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + ordersPerPage - 1);

        if (ordersError) throw ordersError;
        setOrders(orders || []);

        // Get total count for pagination with same filters
        let countQuery = supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .eq('is_potential_fake', true)
          .eq('marked_not_fake', false);

        if (searchTerm.trim()) {
          countQuery = countQuery.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
        }

        if (statusFilter) {
          countQuery = countQuery.eq('status', statusFilter as 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled');
        }

        const { count } = await countQuery;
        setTotalCount(count || 0);

        // Fetch order items for all orders
        if (orders && orders.length > 0) {
          const orderIds = orders.map(o => o.id);
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);

          if (!itemsError && items) {
            const map: Record<string, any[]> = {};
            items.forEach(item => {
              if (!map[item.order_id]) map[item.order_id] = [];
              map[item.order_id].push(item);
            });
            setOrderItemsMap(map);
          } else {
            setOrderItemsMap({});
          }
        }
      }
    } catch (error) {
      console.error('Error fetching fake orders:', error);
      toast({
        title: "Error",
        description: "Failed to load fake orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedIPOrders = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // First get user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id);

      if (storesError) throw storesError;

      if (!stores || stores.length === 0) {
        setOrders([]);
        setTotalCount(0);
        return;
      }

      const storeIds = stores.map(store => store.id);

      // Get all blocked IPs for these stores
      const { data: blockedIPs, error: blockedError } = await supabase
        .from('blocked_ips')
        .select('ip_address')
        .in('store_id', storeIds)
        .eq('is_active', true);

      if (blockedError) {
        console.error('Error fetching blocked IPs:', blockedError);
        setOrders([]);
        setTotalCount(0);
        return;
      }

      const blockedIPAddresses = (blockedIPs || []).map(b => b.ip_address);

      if (blockedIPAddresses.length === 0) {
        setOrders([]);
        setTotalCount(0);
        return;
      }

      // Fetch orders from blocked IPs
      let ordersQuery = supabase
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
          payment_transaction_number,
          shipping_city,
          shipping_area,
          shipping_address,
          courier_name,
          tracking_number,
          notes,
          website_id,
          funnel_id,
          ip_address,
          is_potential_fake,
          marked_not_fake
        `)
        .in('store_id', storeIds)
        .in('ip_address', blockedIPAddresses);

      // Apply search filter if searchTerm exists
      if (searchTerm.trim()) {
        ordersQuery = ordersQuery.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
      }

      // Apply status filter if statusFilter exists
      if (statusFilter) {
        ordersQuery = ordersQuery.eq('status', statusFilter as 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled');
      }

      // Apply pagination
      const offset = (currentPage - 1) * ordersPerPage;
      const { data: orders, error: ordersError } = await ordersQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + ordersPerPage - 1);

      if (ordersError) throw ordersError;
      setOrders(orders || []);

      // Get count
      let countQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('store_id', storeIds)
        .in('ip_address', blockedIPAddresses);

      if (searchTerm.trim()) {
        countQuery = countQuery.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
      }

      if (statusFilter) {
        countQuery = countQuery.eq('status', statusFilter as 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled');
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Fetch order items for all orders
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (!itemsError && items) {
          const map: Record<string, any[]> = {};
          items.forEach(item => {
            if (!map[item.order_id]) map[item.order_id] = [];
            map[item.order_id].push(item);
          });
          setOrderItemsMap(map);
        } else {
          setOrderItemsMap({});
        }
      }
    } catch (error) {
      console.error('Error fetching blocked IP orders:', error);
      toast({
        title: "Error",
        description: "Failed to load blocked IP orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markOrderAsNotFake = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          marked_not_fake: true, 
          is_potential_fake: false 
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order marked as not fake and moved to regular list",
      });
      
      // Refresh orders
      if (activeTab === 'fake') {
        if (fakeOrderFilter === 'blocked') {
          fetchBlockedIPOrders();
        } else {
          fetchFakeOrders();
        }
      } else {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error marking order as not fake:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const markOrderAsPotentialFake = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          is_potential_fake: true, 
          marked_not_fake: false 
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order marked as potential fake",
      });
      
      // Refresh orders and update selected order
      if (activeTab === 'fake') {
        if (fakeOrderFilter === 'blocked') {
          fetchBlockedIPOrders();
        } else {
          fetchFakeOrders();
        }
      } else {
        fetchOrders();
      }
      
      // Update selected order in dialog
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          is_potential_fake: true,
          marked_not_fake: false
        });
      }
    } catch (error) {
      console.error('Error marking order as potential fake:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const blockIPAddress = async (ipAddress: string, orderId?: string) => {
    if (!user?.id) return;
    
    // Get store_id from the order
    const order = orders.find(o => o.id === orderId) || selectedOrder;
    if (!order?.store_id) {
      toast({
        title: "Error",
        description: "Cannot determine store for this order",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize IP address before storing
    const normalizedIP = normalizeIP(ipAddress);
    if (!normalizedIP) {
      toast({
        title: "Error",
        description: "Invalid IP address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if record exists (even if is_active: false)
      const { data: existingBlock } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('store_id', order.store_id)
        .eq('ip_address', normalizedIP)
        .maybeSingle();
      
      if (existingBlock) {
        // Update existing record to re-block
        const { error } = await supabase
          .from('blocked_ips')
          .update({
            blocked_by: user.id,
            reason: orderId ? `Blocked from order ${order.order_number}` : 'Manual block',
            is_active: true,
            blocked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBlock.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('blocked_ips')
          .insert({
            store_id: order.store_id,
            ip_address: normalizedIP,
            blocked_by: user.id,
            reason: orderId ? `Blocked from order ${order.order_number}` : 'Manual block',
            is_active: true,
            blocked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `IP address ${normalizedIP} has been blocked`,
      });

      // Refresh blocked IP status in order details
      // Check if the order's IP matches (normalized)
      const orderIP = normalizeIP((selectedOrder as any)?.ip_address);
      if (isOrderDetailsOpen && selectedOrder && orderIP === normalizedIP) {
        setIsIPBlocked(true);
        // Refresh blocked IP info
        const { data } = await supabase
          .from('blocked_ips')
          .select('*')
          .eq('store_id', order.store_id)
          .eq('ip_address', normalizedIP)
          .eq('is_active', true)
          .maybeSingle();
        if (data) setBlockedIPInfo(data);
      }

      // Refresh orders if on blocked IPs filter
      if (activeTab === 'fake' && fakeOrderFilter === 'blocked') {
        fetchBlockedIPOrders();
      }
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast({
        title: "Error",
        description: "Failed to block IP address",
        variant: "destructive",
      });
    }
  };

  const unblockIPAddress = async (ipAddress: string) => {
    if (!user?.id) return;
    
    // Get store_id from the order
    const order = orders.find(o => o.ip_address === ipAddress) || selectedOrder;
    if (!order?.store_id) {
      toast({
        title: "Error",
        description: "Cannot determine store for this IP",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize IP address before unblocking
    const normalizedIP = normalizeIP(ipAddress);
    if (!normalizedIP) {
      toast({
        title: "Error",
        description: "Invalid IP address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', order.store_id)
        .eq('ip_address', normalizedIP)
        .eq('is_active', true);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `IP address ${normalizedIP} has been unblocked`,
      });

      // Refresh blocked IP status in order details
      // Check if the order's IP matches (normalized)
      const orderIP = normalizeIP((selectedOrder as any)?.ip_address);
      if (isOrderDetailsOpen && selectedOrder && orderIP === normalizedIP) {
        setIsIPBlocked(false);
        setBlockedIPInfo(null);
      }

      // Refresh orders if on blocked IPs filter
      if (activeTab === 'fake' && fakeOrderFilter === 'blocked') {
        fetchBlockedIPOrders();
      } else if (activeTab === 'fake') {
        fetchFakeOrders();
      }
    } catch (error) {
      console.error('Error unblocking IP:', error);
      toast({
        title: "Error",
        description: "Failed to unblock IP address",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, status: newStatus }
          : o
      ));

      // Send cancellation email if order is cancelled
      if (newStatus === 'cancelled') {
        try {
          await supabase.functions.invoke('send-order-email', {
            body: {
              order_id: orderId,
              store_id: order.store_id,
              website_id: order.website_id,
              event_type: 'order_cancelled'
            }
          });
          console.log('Order cancellation email sent successfully');
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }

      // Check for low stock after order delivery
      if (newStatus === 'delivered') {
        try {
          // Fetch order items with product details to check for low stock
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              product_id,
              products!inner(
                id,
                name,
                inventory_quantity,
                track_inventory,
                store_id
              )
            `)
            .eq('order_id', orderId);

          if (!itemsError && orderItems) {
            for (const item of orderItems) {
              const product = item.products;
              if (product.track_inventory && product.inventory_quantity <= 5) {
                try {
                  await supabase.functions.invoke('send-low-stock-email', {
                    body: {
                      store_id: product.store_id,
                      product_id: product.id
                    }
                  });
                  console.log(`Low stock email sent for product: ${product.name}`);
                } catch (lowStockError) {
                  console.error('Failed to send low stock email:', lowStockError);
                }
              }
            }
          }
        } catch (stockCheckError) {
          console.error('Error checking stock levels:', stockCheckError);
        }
      }

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

  // Bulk selection helpers
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const selectAllOrders = () => {
    if (selectedOrderIds.size === orders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map(o => o.id)));
    }
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  const isAllSelected = orders.length > 0 && selectedOrderIds.size === orders.length;
  const isSomeSelected = selectedOrderIds.size > 0 && selectedOrderIds.size < orders.length;

  // Bulk action functions
  const bulkUpdateOrderStatus = async (newStatus: 'pending' | 'processing' | 'delivered' | 'confirmed' | 'shipped' | 'cancelled') => {
    if (selectedOrderIds.size === 0) return;

    const orderIds = Array.from(selectedOrderIds);
    setIsBulkProcessing(true);
    setBulkActionProgress({ current: 0, total: orderIds.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i];
        setBulkActionProgress({ current: i + 1, total: orderIds.length });

        try {
          const order = orders.find(o => o.id === orderId);
          if (!order) {
            failCount++;
            errors.push(`Order ${orderId} not found`);
            continue;
          }

          const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

          if (error) throw error;

          // Update local state
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, status: newStatus } : o
          ));

          // Send cancellation email if order is cancelled
          if (newStatus === 'cancelled') {
            try {
              await supabase.functions.invoke('send-order-email', {
                body: {
                  order_id: orderId,
                  store_id: order.store_id,
                  website_id: order.website_id,
                  event_type: 'order_cancelled'
                }
              });
            } catch (emailError) {
              console.error('Failed to send cancellation email:', emailError);
            }
          }

          // Check for low stock after order delivery
          if (newStatus === 'delivered') {
            try {
              const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                  product_id,
                  products!inner(
                    id,
                    name,
                    inventory_quantity,
                    track_inventory,
                    store_id
                  )
                `)
                .eq('order_id', orderId);

              if (orderItems) {
                for (const item of orderItems) {
                  const product = item.products;
                  if (product.track_inventory && product.inventory_quantity <= 5) {
                    try {
                      await supabase.functions.invoke('send-low-stock-email', {
                        body: {
                          store_id: product.store_id,
                          product_id: product.id
                        }
                      });
                    } catch (lowStockError) {
                      console.error('Failed to send low stock email:', lowStockError);
                    }
                  }
                }
              }
            } catch (stockCheckError) {
              console.error('Error checking stock levels:', stockCheckError);
            }
          }

          successCount++;
        } catch (error: any) {
          failCount++;
          const order = orders.find(o => o.id === orderId);
          errors.push(`Order ${order?.order_number || orderId}: ${error.message || 'Failed to update'}`);
          console.error(`Error updating order ${orderId}:`, error);
        }
      }

      // Show summary toast
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Success",
          description: `Successfully updated ${successCount} order${successCount > 1 ? 's' : ''} to ${newStatus}`,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Success",
          description: `Updated ${successCount} order${successCount > 1 ? 's' : ''}. ${failCount} failed.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update ${failCount} order${failCount > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }

      // Clear selection on success
      if (failCount === 0) {
        clearSelection();
      }
    } finally {
      setIsBulkProcessing(false);
      setBulkActionProgress(null);
    }
  };

  const bulkPushToSteadfast = async () => {
    if (selectedOrderIds.size === 0) return;

    const orderIds = Array.from(selectedOrderIds);
    const selectedOrders = orders.filter(o => orderIds.includes(o.id));
    
    setIsBulkProcessing(true);
    setBulkActionProgress({ current: 0, total: selectedOrders.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedOrders.length; i++) {
        const order = selectedOrders[i];
        setBulkActionProgress({ current: i + 1, total: selectedOrders.length });

        try {
          // Check if already pushed
          const { data: shipments } = await supabase
            .from('courier_shipments')
            .select('id, consignment_id, tracking_code')
            .eq('order_id', order.id)
            .eq('provider', 'steadfast')
            .order('created_at', { ascending: false })
            .limit(1);

          if (shipments && shipments.length > 0) {
            // Already pushed, skip
            successCount++;
            continue;
          }

          const { data, error } = await supabase.functions.invoke('steadfast-create-order', {
            body: { store_id: order.store_id, order_id: order.id },
          });

          if (error) throw error;
          
          if (data?.ok) {
            const consignment = data?.consignment || {};
            setOrders(prev => prev.map(o => 
              o.id === order.id 
                ? { 
                    ...o, 
                    status: 'shipped', 
                    courier_name: 'steadfast', 
                    tracking_number: consignment?.tracking_code || consignment?.consignment_id || null 
                  }
                : o
            ));
            successCount++;
          } else {
            throw new Error(data?.error || "Failed to create consignment");
          }
        } catch (error: any) {
          failCount++;
          errors.push(`Order ${order.order_number}: ${error.message || 'Failed to push'}`);
          console.error(`Error pushing order ${order.id}:`, error);
        }
      }

      // Show summary toast
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Success",
          description: `Successfully pushed ${successCount} order${successCount > 1 ? 's' : ''} to Steadfast`,
        });
        clearSelection();
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Success",
          description: `Pushed ${successCount} order${successCount > 1 ? 's' : ''}. ${failCount} failed.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to push ${failCount} order${failCount > 1 ? 's' : ''} to Steadfast`,
          variant: "destructive",
        });
      }
    } finally {
      setIsBulkProcessing(false);
      setBulkActionProgress(null);
    }
  };

  const bulkDeleteOrders = async () => {
    if (selectedOrderIds.size === 0) return;

    const orderIds = Array.from(selectedOrderIds);
    setIsBulkProcessing(true);
    setBulkActionProgress({ current: 0, total: orderIds.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i];
        setBulkActionProgress({ current: i + 1, total: orderIds.length });

        try {
          const { error } = await supabase.functions.invoke('delete-order', { 
            body: { orderId } 
          });

          if (error) throw error;

          setOrders(prev => prev.filter(o => o.id !== orderId));
          successCount++;
        } catch (error: any) {
          failCount++;
          const order = orders.find(o => o.id === orderId);
          errors.push(`Order ${order?.order_number || orderId}: ${error.message || 'Failed to delete'}`);
          console.error(`Error deleting order ${orderId}:`, error);
        }
      }

      // Show summary toast
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${successCount} order${successCount > 1 ? 's' : ''}`,
        });
        clearSelection();
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Success",
          description: `Deleted ${successCount} order${successCount > 1 ? 's' : ''}. ${failCount} failed.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to delete ${failCount} order${failCount > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsBulkProcessing(false);
      setBulkActionProgress(null);
    }
  };

  const handlePushToSteadfast = async (order: Order, force: boolean = false) => {
    try {
      if (!force) {
        const { data: shipments, error: shipErr } = await supabase
          .from('courier_shipments')
          .select('id, consignment_id, tracking_code, invoice, status, created_at')
          .eq('order_id', order.id)
          .eq('provider', 'steadfast')
          .order('created_at', { ascending: false })
          .limit(1);
        if (shipErr) {
          console.error('Check shipment error', shipErr);
        }
        const shipment = Array.isArray(shipments) && shipments.length ? shipments[0] : null;
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
                status: 'shipped', 
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
      
      // Check if we have error details from courier_shipments table
      try {
        const { data: errorShipment } = await supabase
          .from('courier_shipments')
          .select('error, response_payload')
          .eq('order_id', order.id)
          .eq('provider', 'steadfast')
          .eq('status', 'error')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (errorShipment?.error || (errorShipment?.response_payload && typeof errorShipment.response_payload === 'object' && 'message' in errorShipment.response_payload)) {
          const specificError = errorShipment.error || (typeof errorShipment.response_payload === 'object' && errorShipment.response_payload && 'message' in errorShipment.response_payload ? (errorShipment.response_payload as any).message : null);
          toast({ 
            title: "Steadfast Error", 
            description: specificError, 
            variant: "destructive" 
          });
          return;
        }
      } catch (shipmentQueryError) {
        console.error('Failed to query shipment error details:', shipmentQueryError);
      }
      
      toast({ title: "Steadfast error", description: e?.message || "Failed to create consignment", variant: "destructive" });
    } finally {
      setPushing(false);
    }
  };

  // Orders are already filtered by the database query, no need for client-side filtering
  const filteredOrders = orders;

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / ordersPerPage);
  
  const orderStats = {
    total: totalCount,
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
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 text-foreground ${isMobile ? 'w-full' : 'w-80'}`}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={isMobile ? 'w-full justify-start' : ''}>
                  <Filter className="h-4 w-4 mr-2" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 bg-background border shadow-md">
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
              Orders ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
              >
                All Orders
              </Button>
              <Button
                variant={activeTab === 'fake' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('fake');
                  setCurrentPage(1);
                }}
              >
                Fake Orders
              </Button>
            </div>

            {/* Fake Orders Filter */}
            {activeTab === 'fake' && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant={fakeOrderFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFakeOrderFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  All Fake Orders
                </Button>
                <Button
                  variant={fakeOrderFilter === 'blocked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFakeOrderFilter('blocked');
                    setCurrentPage(1);
                  }}
                >
                  Blocked IPs
                </Button>
              </div>
            )}

            {/* Bulk Action Toolbar */}
            {selectedOrderIds.size > 0 && !loading && (
              <div className="flex items-center justify-between p-4 bg-primary/5 border rounded-lg mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedOrderIds.size} order{selectedOrderIds.size > 1 ? 's' : ''} selected
                  </span>
                  {bulkActionProgress && (
                    <span className="text-sm text-muted-foreground">
                      Processing {bulkActionProgress.current} of {bulkActionProgress.total}...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const selectedOrders = orders.filter(o => selectedOrderIds.has(o.id));
                    const allPending = selectedOrders.every(o => o.status === 'pending');
                    const allProcessing = selectedOrders.every(o => o.status === 'processing');
                    const allShipped = selectedOrders.every(o => o.status === 'shipped');
                    const canCancel = selectedOrders.every(o => o.status !== 'cancelled' && o.status !== 'delivered');
                    
                    return (
                      <>
                        {allPending && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bulkUpdateOrderStatus('processing')}
                            disabled={isBulkProcessing}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Mark Processing
                          </Button>
                        )}
                        {allProcessing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bulkUpdateOrderStatus('shipped')}
                            disabled={isBulkProcessing}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Mark Shipped
                          </Button>
                        )}
                        {allShipped && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bulkUpdateOrderStatus('delivered')}
                            disabled={isBulkProcessing}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Mark Delivered
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Push ${selectedOrderIds.size} order${selectedOrderIds.size > 1 ? 's' : ''} to Steadfast?`)) {
                              bulkPushToSteadfast();
                            }
                          }}
                          disabled={isBulkProcessing}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Push to Steadfast
                        </Button>
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Cancel ${selectedOrderIds.size} order${selectedOrderIds.size > 1 ? 's' : ''}?`)) {
                                bulkUpdateOrderStatus('cancelled');
                              }
                            }}
                            disabled={isBulkProcessing}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancel Order{selectedOrderIds.size > 1 ? 's' : ''}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Delete ${selectedOrderIds.size} order${selectedOrderIds.size > 1 ? 's' : ''} permanently? This cannot be undone.`)) {
                              bulkDeleteOrders();
                            }
                          }}
                          disabled={isBulkProcessing}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Order{selectedOrderIds.size > 1 ? 's' : ''}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearSelection}
                          disabled={isBulkProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Selection
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-muted-foreground">
                  Orders will appear here when customers place them
                </p>
              </div>
            ) : isMobile ? (
              // Mobile Card View
              <div className="space-y-4 overflow-x-hidden">
                {/* Select All for Mobile */}
                {orders.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={selectAllOrders}
                      disabled={isBulkProcessing}
                    />
                    <label className="text-sm font-medium cursor-pointer" onClick={selectAllOrders}>
                      Select All
                    </label>
                  </div>
                )}
                {orders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <Checkbox
                            checked={selectedOrderIds.has(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                            disabled={isBulkProcessing}
                            className="mt-1"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="font-semibold text-sm"># {order.order_number}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusColors[order.status as keyof typeof statusColors] || "secondary"} className="text-xs">
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            {order.is_potential_fake && !order.marked_not_fake && (
                              <Badge variant="destructive" className="text-xs">
                                Potential Fake
                              </Badge>
                            )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-semibold">৳{order.total.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <span>{order.payment_method.toUpperCase()}</span>
                                {isPaymentConfirmed(order) && (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                )}
                              </div>
                              {order.payment_transaction_number && ` - ${order.payment_transaction_number}`}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 touch-manipulation">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="z-[100] bg-background border shadow-lg min-w-[200px] touch-manipulation"
                              sideOffset={5}
                            >
                              <DropdownMenuItem 
                                onClick={async () => {
                                  setSelectedOrder(order);
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
                                className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
                              >
                                <Eye className="mr-3 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {order.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => updateOrderStatus(order.id, 'processing')}
                                  className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
                                >
                                  Mark Processing
                                </DropdownMenuItem>
                              )}
                              {order.status === 'processing' && (
                                <DropdownMenuItem
                                  onClick={() => updateOrderStatus(order.id, 'shipped')}
                                  className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
                                >
                                  Mark Shipped
                                </DropdownMenuItem>
                              )}
                              {order.status === 'shipped' && (
                                <DropdownMenuItem
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
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
                                className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
                              >
                                Invoice / PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePushToSteadfast(order)}
                                className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
                              >
                                Push to Steadfast
                              </DropdownMenuItem>
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (!confirm('Cancel this order?')) return;
                                    await updateOrderStatus(order.id, 'cancelled');
                                  }}
                                  className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation"
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
                                className="flex items-center py-3 px-4 text-sm cursor-pointer touch-manipulation text-destructive"
                              >
                                Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{order.customer_phone}</span>
                        </div>
                        {order.customer_email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{order.customer_email}</span>
                          </div>
                        )}
                        {order.shipping_city && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{order.shipping_city}{order.shipping_area ? `, ${order.shipping_area}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Items Summary */}
                      {Array.isArray(orderItemsMap[order.id]) && orderItemsMap[order.id].length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</div>
                          <div className="text-sm space-y-1">
                             {orderItemsMap[order.id].slice(0, 2).map((it: any, i: number) => (
                               <div key={i} className="flex items-start gap-2 min-w-0">
                                 <span className="flex-1 whitespace-normal break-words min-w-0">{nameWithVariant(it.product_name, it.variation)}</span>
                                 <span className="flex-shrink-0 text-muted-foreground">× {it.quantity}</span>
                               </div>
                             ))}
                            {orderItemsMap[order.id].length > 2 && (
                              <div className="text-xs text-muted-foreground">+{orderItemsMap[order.id].length - 2} more item(s)</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          {order.funnel_id ? (
                            <span>{funnelMap[order.funnel_id] || 'Funnel'}</span>
                          ) : order.website_id ? (
                            <span>{websiteMap[order.website_id] || 'Website'}</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Shipping Info */}
                      {order.courier_name && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Shipped via:</span>
                          <div className="text-right">
                            <div>{order.courier_name === 'steadfast' ? 'Steadfast' : order.courier_name}</div>
                            {order.tracking_number && (
                              <a
                                href={`https://steadfast.com.bd/t/${encodeURIComponent(order.tracking_number)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                              >
                                Track
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={selectAllOrders}
                        disabled={isBulkProcessing}
                      />
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Channel</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="hidden lg:table-cell">Payment</TableHead>
                    <TableHead className="hidden lg:table-cell">Shipping</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrderIds.has(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                          disabled={isBulkProcessing}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{order.order_number}</div>
                            {order.is_potential_fake && !order.marked_not_fake && (
                              <Badge variant="destructive" className="text-xs">
                                Potential Fake
                              </Badge>
                            )}
                          </div>
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
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span>{order.customer_phone}</span>
                            {order.customer_phone && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const normalizedPhone = normalizePhoneNumber(order.customer_phone);
                                  openWhatsApp(normalizedPhone);
                                }}
                                className="text-green-600 hover:text-green-700 transition-colors"
                                title="Open WhatsApp chat"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {(order.shipping_city || order.shipping_area || order.shipping_address) && (
                            <div className="text-xs text-muted-foreground">
                              Ship: {order.shipping_city || ''}{order.shipping_area ? `, ${order.shipping_area}` : ''}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.funnel_id ? (
                          <div className="text-sm">
                            {funnelMap[order.funnel_id] || 'Funnel'}
                          </div>
                        ) : order.website_id ? (
                          <div className="text-sm">
                            {websiteMap[order.website_id] || 'Website'}
                          </div>
                        ) : null}
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
                        <div className="flex items-center gap-2">
                          <span>{order.payment_method.toUpperCase()}</span>
                          {isPaymentConfirmed(order) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {order.payment_transaction_number && (
                          <div className="text-xs text-muted-foreground">TXN: {order.payment_transaction_number}</div>
                        )}
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
                            <Button variant="ghost" className="h-9 w-9 p-0 touch-manipulation">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="z-[100] bg-background border shadow-lg min-w-[200px] touch-manipulation"
                            sideOffset={5}
                          >
                            <DropdownMenuItem 
                              onClick={async () => {
                                setSelectedOrder(order);
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
                              className="flex items-center py-2 px-3 text-sm cursor-pointer"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} ({totalCount} total orders)
        </div>

        {/* Order Details Dialog */}
        <Dialog 
          open={isOrderDetailsOpen} 
          onOpenChange={(open) => {
            setIsOrderDetailsOpen(open);
            // If closing the dialog and we came from a notification link, navigate back to orders
            if (!open && orderId) {
              navigate('/dashboard/orders', { replace: true });
            }
          }}
        >
          <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[90vh] overflow-y-auto' : 'max-w-2xl'}`}>
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
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
                    <p>Payment: {selectedOrder.payment_method}
                      {selectedOrder.payment_transaction_number && ` (TXN: ${selectedOrder.payment_transaction_number})`}
                    </p>
                    <p>Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    {(selectedOrder as any).ip_address && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          IP Address: {(selectedOrder as any).ip_address}
                        </p>
                        {selectedOrder.is_potential_fake && !selectedOrder.marked_not_fake && (
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              Potential Fake Order
                            </Badge>
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {selectedOrder.is_potential_fake && !selectedOrder.marked_not_fake && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markOrderAsNotFake(selectedOrder.id)}
                            >
                              Mark as Not Fake
                            </Button>
                          )}
                          {(!selectedOrder.is_potential_fake || selectedOrder.marked_not_fake) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markOrderAsPotentialFake(selectedOrder.id)}
                            >
                              Mark as Potential Fake
                            </Button>
                          )}
                          {(selectedOrder as any).ip_address && (
                            <>
                              {isIPBlocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => unblockIPAddress((selectedOrder as any).ip_address)}
                                >
                                  Unblock IP
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => blockIPAddress((selectedOrder as any).ip_address, selectedOrder.id)}
                                >
                                  Block IP
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        {blockedIPInfo && (
                          <p className="text-xs text-muted-foreground">
                            Blocked on: {new Date(blockedIPInfo.blocked_at).toLocaleString()}
                            {blockedIPInfo.reason && ` - ${blockedIPInfo.reason}`}
                          </p>
                        )}
                      </div>
                    )}
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
          <DialogContent className={isMobile ? 'max-w-[95vw]' : ''}>
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
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueTimeline: Array<{ date: string; revenue: number; orders: number; }>;
  topProducts: Array<{ 
    product_name: string; 
    product_id: string;
    total_revenue: number; 
    total_quantity: number;
    total_orders: number;
  }>;
  paymentMethods: Array<{ method: string; count: number; revenue: number; }>;
  orderStatuses: Array<{ status: string; count: number; revenue: number; }>;
  geographicData: Array<{ city: string; orders: number; revenue: number; }>;
  monthlyTrends: Array<{ month: string; revenue: number; orders: number; }>;
}

interface WebsiteSales {
  // Core sales metrics
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  
  // Advanced analytics
  analytics: SalesAnalytics;
  
  // Website info
  websiteName: string;
  websiteUrl: string;
  storeId: string;
}

interface WebsiteSalesHookReturn {
  sales: WebsiteSales | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWebsiteSales(websiteId: string): WebsiteSalesHookReturn {
  const [sales, setSales] = useState<WebsiteSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get website basic info
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (websiteError) throw websiteError;

      // Get store info for domain construction
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('id', website.store_id)
        .single();

      if (!store) throw new Error('Store not found');

      // Get connected domain info
      const { data: domainConnection } = await supabase
        .from('domain_connections')
        .select(`
          custom_domains (domain)
        `)
        .eq('content_type', 'website')
        .eq('content_id', websiteId)
        .maybeSingle();

      // Build proper website URL
      const customDomain = (domainConnection?.custom_domains as any)?.domain;
      const websiteUrl = customDomain 
        ? `https://${customDomain}` 
        : `https://${website.slug}.${store.slug}.lovable.app`;

      // Get orders from this store (last 90 days for better trends)
      const nineDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          subtotal,
          status,
          payment_method,
          shipping_city,
          shipping_country,
          customer_name,
          customer_email,
          created_at
        `)
        .eq('store_id', website.store_id)
        .gte('created_at', nineDaysAgo)
        .order('created_at', { ascending: false });

      if (ordersError && ordersError.code !== 'PGRST116') throw ordersError;

      // Get order items for product analysis
      const orderIds = orders?.map(o => o.id) || [];
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      // Get website analytics for conversion rate calculation
      const { data: analyticsData } = await supabase
        .from('website_analytics')
        .select('unique_visitors')
        .eq('website_id', websiteId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 30 days

      // Calculate core metrics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const totalCustomers = new Set(orders?.map(o => o.customer_email).filter(Boolean)).size || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate conversion rate
      const totalUniqueVisitors = analyticsData?.reduce((sum, row) => sum + (row.unique_visitors || 0), 0) || 0;
      const conversionRate = totalUniqueVisitors > 0 ? (totalOrders / totalUniqueVisitors) * 100 : 0;

      // Revenue timeline (last 30 days)
      const revenueTimeline = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = orders?.filter(o => o.created_at?.split('T')[0] === dateStr) || [];
        revenueTimeline.push({
          date: dateStr,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
          orders: dayOrders.length
        });
      }

      // Top products analysis
      const productStats = (orderItems || []).reduce((acc, item) => {
        const key = item.product_id;
        if (!acc[key]) {
          acc[key] = {
            product_name: item.product_name || 'Unknown Product',
            product_id: item.product_id,
            total_revenue: 0,
            total_quantity: 0,
            total_orders: 0
          };
        }
        acc[key].total_revenue += item.total || 0;
        acc[key].total_quantity += item.quantity || 0;
        acc[key].total_orders += 1;
        return acc;
      }, {} as Record<string, any>);

      const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      // Payment methods breakdown
      const paymentStats = (orders || []).reduce((acc, order) => {
        const method = order.payment_method || 'unknown';
        if (!acc[method]) {
          acc[method] = { method, count: 0, revenue: 0 };
        }
        acc[method].count += 1;
        acc[method].revenue += order.total || 0;
        return acc;
      }, {} as Record<string, any>);

      const paymentMethods = Object.values(paymentStats)
        .sort((a: any, b: any) => b.revenue - a.revenue);

      // Order statuses breakdown
      const statusStats = (orders || []).reduce((acc, order) => {
        const status = order.status || 'pending';
        if (!acc[status]) {
          acc[status] = { status, count: 0, revenue: 0 };
        }
        acc[status].count += 1;
        acc[status].revenue += order.total || 0;
        return acc;
      }, {} as Record<string, any>);

      const orderStatuses = Object.values(statusStats)
        .sort((a: any, b: any) => b.count - a.count);

      // Geographic breakdown
      const geoStats = (orders || []).reduce((acc, order) => {
        const city = order.shipping_city || 'Unknown';
        if (!acc[city]) {
          acc[city] = { city, orders: 0, revenue: 0 };
        }
        acc[city].orders += 1;
        acc[city].revenue += order.total || 0;
        return acc;
      }, {} as Record<string, any>);

      const geographicData = Object.values(geoStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      // Monthly trends (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthOrders = orders?.filter(o => {
          const orderDate = new Date(o.created_at || '');
          return orderDate >= monthStart && orderDate <= monthEnd;
        }) || [];

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthOrders.reduce((sum, o) => sum + (o.total || 0), 0),
          orders: monthOrders.length
        });
      }

      setSales({
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        analytics: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          conversionRate: Math.round(conversionRate * 100) / 100,
          revenueTimeline,
          topProducts,
          paymentMethods,
          orderStatuses,
          geographicData,
          monthlyTrends,
        },
        websiteName: website.name,
        websiteUrl,
        storeId: website.store_id,
      });

    } catch (err: any) {
      console.error('Error fetching website sales:', err);
      setError(err.message || 'Failed to fetch website sales data');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch website sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (websiteId) {
      fetchSales();
    }
  }, [websiteId]);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
  };
}
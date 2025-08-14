import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
  percentage: number;
}

interface GeographicData {
  city: string;
  orders: number;
  revenue: number;
}

interface WebsiteSalesData {
  metrics: SalesMetrics;
  salesTimeline: SalesData[];
  topProducts: TopProduct[];
  paymentMethods: PaymentMethodData[];
  geographicData: GeographicData[];
  orderStatusDistribution: { status: string; count: number; percentage: number }[];
}

interface UseWebsiteSalesReturn {
  salesData: WebsiteSalesData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWebsiteSales(websiteId: string, timeRange: string = '30d'): UseWebsiteSalesReturn {
  const [salesData, setSalesData] = useState<WebsiteSalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get website info to find store_id
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('store_id')
        .eq('id', websiteId)
        .single();

      if (websiteError) throw websiteError;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          subtotal,
          status,
          payment_method,
          shipping_city,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('store_id', website.store_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get website analytics for visitor data (for conversion rate)
      const { data: analytics, error: analyticsError } = await supabase
        .from('website_analytics')
        .select('unique_visitors')
        .eq('website_id', websiteId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (analyticsError && analyticsError.code !== 'PGRST116') throw analyticsError;

      // Process the data
      const processedData = processSalesData(orders || [], analytics || []);
      setSalesData(processedData);

    } catch (err: any) {
      console.error('Error fetching website sales data:', err);
      setError(err.message || 'Failed to fetch sales data');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processSalesData = (orders: any[], analytics: any[]): WebsiteSalesData => {
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const totalVisitors = analytics.reduce((sum, day) => sum + (day.unique_visitors || 0), 0);
    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;

    // Sales timeline (group by date)
    const salesByDate = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total || 0;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { revenue: number; orders: number }>);

    const salesTimeline = Object.entries(salesByDate)
      .map(([date, data]) => ({ 
        date, 
        revenue: (data as { revenue: number; orders: number }).revenue, 
        orders: (data as { revenue: number; orders: number }).orders 
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Top products
    const productStats = orders.reduce((acc, order) => {
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = {
              id: item.product_id,
              name: item.product_name,
              totalQuantity: 0,
              totalRevenue: 0,
              orders: 0
            };
          }
          acc[item.product_id].totalQuantity += Number(item.quantity) || 0;
          acc[item.product_id].totalRevenue += Number(item.total) || 0;
          acc[item.product_id].orders += 1;
        });
      }
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productStats)
      .map((product: any) => ({
        ...product,
        averagePrice: product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0
      }))
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Payment methods distribution
    const paymentMethodCounts = orders.reduce((acc, order) => {
      const method = order.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentMethods = Object.entries(paymentMethodCounts).map(([method, count]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      count: Number(count),
      percentage: totalOrders > 0 ? (Number(count) / totalOrders) * 100 : 0
    }));

    // Geographic data
    const geographicCounts = orders.reduce((acc, order) => {
      const city = order.shipping_city || 'Unknown';
      if (!acc[city]) {
        acc[city] = { orders: 0, revenue: 0 };
      }
      acc[city].orders += 1;
      acc[city].revenue += Number(order.total) || 0;
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);

    const geographicData = Object.entries(geographicCounts)
      .map(([city, data]) => ({ 
        city, 
        orders: (data as { orders: number; revenue: number }).orders, 
        revenue: (data as { orders: number; revenue: number }).revenue 
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Order status distribution
    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const orderStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: Number(count),
      percentage: totalOrders > 0 ? (Number(count) / totalOrders) * 100 : 0
    }));

    return {
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate
      },
      salesTimeline,
      topProducts,
      paymentMethods,
      geographicData,
      orderStatusDistribution
    };
  };

  useEffect(() => {
    if (websiteId) {
      fetchSalesData();
    }
  }, [websiteId, timeRange]);

  return {
    salesData,
    loading,
    error,
    refetch: fetchSalesData
  };
}
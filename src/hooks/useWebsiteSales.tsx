import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/components/ui/date-range-filter';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

interface SalesComparison {
  currentPeriod: {
    revenue: number;
    orders: number;
    customers: number;
  };
  previousPeriod: {
    revenue: number;
    orders: number;
    customers: number;
  };
  changes: {
    revenue: { value: number; percentage: number };
    orders: { value: number; percentage: number };
    customers: { value: number; percentage: number };
  };
}

interface WebsiteSales {
  // Core sales metrics
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  
  // Advanced analytics
  analytics: SalesAnalytics;
  
  // Comparison data
  comparison: SalesComparison;
  
  // Today's specific metrics
  todayRevenue: number;
  yesterdayRevenue: number;
  
  // Website info
  websiteName: string;
  websiteUrl: string;
  storeId: string;
  dateRange: DateRange;
}

interface WebsiteSalesHookReturn {
  sales: WebsiteSales | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateDateRange: (dateRange: DateRange) => void;
}

export function useWebsiteSales(websiteId: string, initialDateRange?: DateRange): WebsiteSalesHookReturn {
  const [sales, setSales] = useState<WebsiteSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange || {
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
    preset: 'last3months',
    label: 'Last 30 days'
  });
  const { toast } = useToast();

  const getComparisonPeriod = (current: DateRange) => {
    const diffDays = Math.ceil((current.to.getTime() - current.from.getTime()) / (1000 * 60 * 60 * 24));
    return {
      from: startOfDay(subDays(current.from, diffDays + 1)),
      to: endOfDay(subDays(current.to, diffDays + 1))
    };
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

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
        : `https://${website.slug}.${store.slug}.ecombuildr.com`;

      // Get comparison period dates
      const comparisonPeriod = getComparisonPeriod(dateRange);
      const startDate = comparisonPeriod.from.toISOString();
      const endDate = dateRange.to.toISOString();

      // Get orders for both current and comparison periods - filtered by website_id
      const { data: allOrders, error: ordersError } = await supabase
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
        .eq('website_id', websiteId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (ordersError && ordersError.code !== 'PGRST116') throw ordersError;

      // Filter orders for current and comparison periods
      const currentOrders = allOrders?.filter(o => 
        new Date(o.created_at || '') >= dateRange.from && 
        new Date(o.created_at || '') <= dateRange.to
      ) || [];
      
      const comparisonOrders = allOrders?.filter(o => 
        new Date(o.created_at || '') >= comparisonPeriod.from && 
        new Date(o.created_at || '') <= comparisonPeriod.to
      ) || [];

      // Get today's and yesterday's orders for specific metrics
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));
      const todayOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at || '');
        return orderDate >= today && orderDate <= endOfDay(new Date());
      }) || [];
      
      const yesterdayOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at || '');
        return orderDate >= yesterday && orderDate < today;
      }) || [];

      // Get order items for product analysis (current period only)
      const currentOrderIds = currentOrders.map(o => o.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', currentOrderIds);

      // Note: Conversion rate is now calculated from pixel events below

      // Calculate current period metrics
      const totalOrders = currentOrders.length;
      const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalCustomers = new Set(currentOrders.map(o => o.customer_email).filter(Boolean)).size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate comparison period metrics
      const comparisonRevenue = comparisonOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const comparisonOrdersCount = comparisonOrders.length;
      const comparisonCustomers = new Set(comparisonOrders.map(o => o.customer_email).filter(Boolean)).size;

      // Calculate today and yesterday revenue
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Calculate changes and percentages
      const revenueChange = totalRevenue - comparisonRevenue;
      const ordersChange = totalOrders - comparisonOrdersCount;
      const customersChange = totalCustomers - comparisonCustomers;

      const comparison: SalesComparison = {
        currentPeriod: { revenue: totalRevenue, orders: totalOrders, customers: totalCustomers },
        previousPeriod: { revenue: comparisonRevenue, orders: comparisonOrdersCount, customers: comparisonCustomers },
        changes: {
          revenue: { value: revenueChange, percentage: calculatePercentageChange(totalRevenue, comparisonRevenue) },
          orders: { value: ordersChange, percentage: calculatePercentageChange(totalOrders, comparisonOrdersCount) },
          customers: { value: customersChange, percentage: calculatePercentageChange(totalCustomers, comparisonCustomers) },
        }
      };

      // Calculate conversion rate from pixel events
      const [pixelEventsRes] = await Promise.all([
        supabase.from('pixel_events')
          .select('session_id, event_type')
          .eq('website_id', websiteId)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
      ]);
      
      const pixelEvents = pixelEventsRes.data || [];
      const pageViewSessions = new Set(
        pixelEvents
          .filter(e => e.event_type === 'PageView' || e.event_type === 'page_view')
          .map(e => e.session_id)
          .filter(Boolean)
      );
      
      const uniqueVisitors = pageViewSessions.size;
      const conversionRate = uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0;

      // Revenue timeline for the current period (day by day)
      const revenueTimeline = [];
      const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= diffDays; i++) {
        const date = new Date(dateRange.from.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = currentOrders.filter(o => o.created_at?.split('T')[0] === dateStr);
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
      const paymentStats = currentOrders.reduce((acc, order) => {
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
      const statusStats = currentOrders.reduce((acc, order) => {
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
      const geoStats = currentOrders.reduce((acc, order) => {
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
        
        const monthOrders = currentOrders.filter(o => {
          const orderDate = new Date(o.created_at || '');
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

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
        comparison,
        todayRevenue,
        yesterdayRevenue,
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
        dateRange,
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

  const updateDateRange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  useEffect(() => {
    if (websiteId) {
      fetchSales();
    }
  }, [websiteId, dateRange]);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    updateDateRange,
  };
}
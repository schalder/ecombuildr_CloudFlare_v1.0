import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/components/ui/date-range-filter';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface FunnelSalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueTimeline: Array<{ date: string; revenue: number; orders: number; }>;
  stepPerformance: Array<{ 
    step_title: string; 
    step_type: string;
    views: number; 
    conversions: number;
    conversion_rate: number;
  }>;
  paymentMethods: Array<{ method: string; count: number; revenue: number; }>;
  orderStatuses: Array<{ status: string; count: number; revenue: number; }>;
}

interface FunnelSalesComparison {
  currentPeriod: {
    revenue: number;
    orders: number;
    visitors: number;
  };
  previousPeriod: {
    revenue: number;
    orders: number;
    visitors: number;
  };
  changes: {
    revenue: { value: number; percentage: number };
    orders: { value: number; percentage: number };
    visitors: { value: number; percentage: number };
  };
}

interface FunnelSales {
  totalRevenue: number;
  totalOrders: number;
  totalVisitors: number;
  averageOrderValue: number;
  analytics: FunnelSalesAnalytics;
  comparison: FunnelSalesComparison;
  todayRevenue: number;
  yesterdayRevenue: number;
  funnelName: string;
  funnelUrl: string;
  dateRange: DateRange;
}

interface FunnelSalesHookReturn {
  sales: FunnelSales | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateDateRange: (dateRange: DateRange) => void;
}

export function useFunnelSales(funnelId: string, initialDateRange?: DateRange): FunnelSalesHookReturn {
  const [sales, setSales] = useState<FunnelSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange || {
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
    preset: 'last7days',
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

      // Get funnel basic info
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', funnelId)
        .single();

      if (funnelError) throw funnelError;

      // Get funnel steps for step performance analysis
      const { data: funnelSteps } = await supabase
        .from('funnel_steps')
        .select('id, title, step_type')
        .eq('funnel_id', funnelId)
        .order('step_order');

      // Get comparison period dates
      const comparisonPeriod = getComparisonPeriod(dateRange);
      const startDate = comparisonPeriod.from.toISOString();
      const endDate = dateRange.to.toISOString();

      // Get orders for both current and comparison periods
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          subtotal,
          status,
          payment_method,
          customer_name,
          customer_email,
          created_at
        `)
        .eq('funnel_id', funnelId)
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

      // Get today's and yesterday's orders
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

      // Get pixel events for visitor count and step performance
      const { data: pixelEvents } = await supabase
        .from('pixel_events')
        .select('event_type, page_url, created_at')
        .like('page_url', `%/funnel/${funnel.slug}%`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: comparisonPixelEvents } = await supabase
        .from('pixel_events')
        .select('event_type')
        .like('page_url', `%/funnel/${funnel.slug}%`)
        .gte('created_at', comparisonPeriod.from.toISOString())
        .lte('created_at', comparisonPeriod.to.toISOString());

      // Calculate current period metrics
      const totalOrders = currentOrders.length;
      const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalVisitors = pixelEvents?.filter(e => e.event_type === 'PageView').length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate comparison period metrics
      const comparisonRevenue = comparisonOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const comparisonOrdersCount = comparisonOrders.length;
      const comparisonVisitors = comparisonPixelEvents?.filter(e => e.event_type === 'PageView').length || 0;

      // Calculate today and yesterday revenue
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Calculate changes and percentages
      const revenueChange = totalRevenue - comparisonRevenue;
      const ordersChange = totalOrders - comparisonOrdersCount;
      const visitorsChange = totalVisitors - comparisonVisitors;

      const comparison: FunnelSalesComparison = {
        currentPeriod: { revenue: totalRevenue, orders: totalOrders, visitors: totalVisitors },
        previousPeriod: { revenue: comparisonRevenue, orders: comparisonOrdersCount, visitors: comparisonVisitors },
        changes: {
          revenue: { value: revenueChange, percentage: calculatePercentageChange(totalRevenue, comparisonRevenue) },
          orders: { value: ordersChange, percentage: calculatePercentageChange(totalOrders, comparisonOrdersCount) },
          visitors: { value: visitorsChange, percentage: calculatePercentageChange(totalVisitors, comparisonVisitors) },
        }
      };

      // Calculate conversion rate
      const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;

      // Revenue timeline for the current period
      const revenueTimeline = [];
      const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 1000));
      
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

      // Step performance analysis
      const stepPerformance = (funnelSteps || []).map(step => {
        const stepViews = pixelEvents?.filter(e => 
          e.event_type === 'PageView' && e.page_url?.includes(`/step/${step.id}`)
        ).length || 0;

        const stepConversions = currentOrders.length; // All orders count as conversions for funnel
        const conversionRate = stepViews > 0 ? (stepConversions / stepViews) * 100 : 0;

        return {
          step_title: step.title,
          step_type: step.step_type,
          views: stepViews,
          conversions: stepConversions,
          conversion_rate: conversionRate
        };
      });

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

      setSales({
        totalRevenue,
        totalOrders,
        totalVisitors,
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
          stepPerformance,
          paymentMethods,
          orderStatuses,
        },
        funnelName: funnel.name,
        funnelUrl: `https://lovable.app/funnel/${funnel.slug}`,
        dateRange,
      });

    } catch (err: any) {
      console.error('Error fetching funnel sales:', err);
      setError(err.message || 'Failed to fetch funnel sales data');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch funnel sales data",
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
    if (funnelId) {
      fetchSales();
    }
  }, [funnelId, dateRange]);

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    updateDateRange,
  };
}
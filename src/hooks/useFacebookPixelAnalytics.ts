import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PixelAnalytics {
  totalEvents: number;
  pageViews: number;
  viewContent: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  conversionRate: number;
  revenue: number;
  topProducts: Array<{
    product_id: string;
    product_name: string;
    views: number;
    conversions: number;
  }>;
  dailyEvents: Array<{
    date: string;
    page_views: number;
    view_content: number;
    add_to_cart: number;
    initiate_checkout: number;
    purchases: number;
  }>;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export const useFacebookPixelAnalytics = (storeId: string, dateRange: DateRange) => {
  const [analytics, setAnalytics] = useState<PixelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !storeId) return;
      
      setLoading(true);
      setError(null);

      try {
        const startDate = dateRange.startDate.toISOString().split('T')[0];
        const endDate = dateRange.endDate.toISOString().split('T')[0];

        // For now, use mock data since pixel_events table needs to be created
        const eventCounts: Array<{ event_type: string }> = [];
        const eventError = null;

        // Fetch orders with pixel data for revenue calculation
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total, facebook_pixel_data')
          .eq('store_id', storeId)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .not('facebook_pixel_data', 'is', null);

        if (ordersError) throw ordersError;

        // Calculate event counts
        const eventTypeCount = eventCounts.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const pageViews = eventTypeCount['PageView'] || 0;
        const viewContent = eventTypeCount['ViewContent'] || 0;
        const addToCart = eventTypeCount['AddToCart'] || 0;
        const initiateCheckout = eventTypeCount['InitiateCheckout'] || 0;
        const purchases = eventTypeCount['Purchase'] || 0;

        // Calculate conversion rate (purchases / page views)
        const conversionRate = pageViews > 0 ? (purchases / pageViews) * 100 : 0;

        // Calculate revenue from orders with pixel data
        const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

        // For now, use mock data since pixel_events table needs to be created
        const topProductsData: Array<{ event_data: any }> = [];
        const topProductsError = null;

        // Process top products data
        const productStats: Record<string, { name: string; views: number; conversions: number }> = {};
        
        topProductsData.forEach(event => {
          const eventData = event.event_data as any;
          if (eventData?.content_ids?.[0]) {
            const productId = eventData.content_ids[0];
            const productName = eventData.content_name || 'Unknown Product';
            
            if (!productStats[productId]) {
              productStats[productId] = { name: productName, views: 0, conversions: 0 };
            }
            
            if (eventData.event_type === 'ViewContent') {
              productStats[productId].views++;
            } else if (eventData.event_type === 'Purchase') {
              productStats[productId].conversions++;
            }
          }
        });

        const topProducts = Object.entries(productStats)
          .map(([product_id, stats]) => ({
            product_id,
            product_name: stats.name,
            views: stats.views,
            conversions: stats.conversions,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);

        // For now, use mock data since pixel_events table needs to be created
        const dailyEventsData: Array<{ created_at: string; event_type: string }> = [];
        const dailyError = null;

        // Group events by date
        const dailyEventsByDate: Record<string, Record<string, number>> = {};
        
        dailyEventsData.forEach(event => {
          const date = event.created_at.split('T')[0];
          if (!dailyEventsByDate[date]) {
            dailyEventsByDate[date] = {};
          }
          dailyEventsByDate[date][event.event_type] = (dailyEventsByDate[date][event.event_type] || 0) + 1;
        });

        const dailyEvents = Object.entries(dailyEventsByDate).map(([date, events]) => ({
          date,
          page_views: events['PageView'] || 0,
          view_content: events['ViewContent'] || 0,
          add_to_cart: events['AddToCart'] || 0,
          initiate_checkout: events['InitiateCheckout'] || 0,
          purchases: events['Purchase'] || 0,
        }));

        setAnalytics({
          totalEvents: eventCounts.length,
          pageViews,
          viewContent,
          addToCart,
          initiateCheckout,
          purchases,
          conversionRate,
          revenue,
          topProducts,
          dailyEvents,
        });
      } catch (err: any) {
        console.error('Failed to fetch pixel analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, storeId, dateRange.startDate, dateRange.endDate]);

  return { analytics, loading, error };
};
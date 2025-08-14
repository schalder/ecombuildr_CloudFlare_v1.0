import { useState, useEffect, useRef } from 'react';
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

export const useFacebookPixelAnalytics = (storeId: string, dateRange: DateRange, websiteId?: string) => {
  const [analytics, setAnalytics] = useState<PixelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRequestInProgressRef = useRef(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !storeId) {
        setLoading(false);
        return;
      }

      // Prevent multiple simultaneous requests
      if (isRequestInProgressRef.current) {
        return;
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      isRequestInProgressRef.current = true;
      
      setLoading(true);
      setError(null);

      try {
        const startDate = dateRange.startDate.toISOString().split('T')[0];
        const endDate = dateRange.endDate.toISOString().split('T')[0];

        // Fetch event counts with abort signal
        let eventQuery = supabase
          .from('pixel_events')
          .select('event_type')
          .eq('store_id', storeId)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59');

        if (websiteId) {
          eventQuery = eventQuery.eq('website_id', websiteId);
        }

        const { data: eventCounts, error: eventError } = await eventQuery
          .abortSignal(abortControllerRef.current.signal);

        if (eventError) throw eventError;

        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) return;

        // Fetch orders with pixel data for revenue calculation
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total, facebook_pixel_data')
          .eq('store_id', storeId)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .not('facebook_pixel_data', 'is', null)
          .abortSignal(abortControllerRef.current.signal);

        if (ordersError) throw ordersError;

        if (abortControllerRef.current.signal.aborted) return;

        // Calculate event counts with null safety
        const eventTypeCount = (eventCounts || []).reduce((acc, event) => {
          if (event?.event_type) {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          }
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
        const revenue = (orders || []).reduce((sum, order) => sum + Number(order.total || 0), 0);

        // Fetch top products
        let topProductsQuery = supabase
          .from('pixel_events')
          .select('event_type, event_data')
          .eq('store_id', storeId)
          .in('event_type', ['ViewContent', 'Purchase'])
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59');

        if (websiteId) {
          topProductsQuery = topProductsQuery.eq('website_id', websiteId);
        }

        const { data: topProductsData, error: topProductsError } = await topProductsQuery
          .abortSignal(abortControllerRef.current.signal);

        if (topProductsError) throw topProductsError;

        if (abortControllerRef.current.signal.aborted) return;

        // Process top products data with null safety
        const productStats: Record<string, { name: string; views: number; conversions: number }> = {};
        
        (topProductsData || []).forEach(event => {
          if (!event?.event_data || !event?.event_type) return;
          
          const eventData = event.event_data as any;
          if (eventData?.content_ids?.[0]) {
            const productId = eventData.content_ids[0];
            const productName = eventData.content_name || 'Unknown Product';
            
            if (!productStats[productId]) {
              productStats[productId] = { name: productName, views: 0, conversions: 0 };
            }
            
            if (event.event_type === 'ViewContent') {
              productStats[productId].views++;
            } else if (event.event_type === 'Purchase') {
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

        // Fetch daily events data
        let dailyEventsQuery = supabase
          .from('pixel_events')
          .select('created_at, event_type')
          .eq('store_id', storeId)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .order('created_at');

        if (websiteId) {
          dailyEventsQuery = dailyEventsQuery.eq('website_id', websiteId);
        }

        const { data: dailyEventsData, error: dailyError } = await dailyEventsQuery
          .abortSignal(abortControllerRef.current.signal);

        if (dailyError) throw dailyError;

        if (abortControllerRef.current.signal.aborted) return;

        // Group events by date with null safety
        const dailyEventsByDate: Record<string, Record<string, number>> = {};
        
        (dailyEventsData || []).forEach(event => {
          if (!event?.created_at || !event?.event_type) return;
          
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

        if (!abortControllerRef.current.signal.aborted) {
          setAnalytics({
            totalEvents: (eventCounts || []).length,
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
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch pixel analytics:', err);
          setError(err.message || 'Failed to fetch analytics data');
        }
      } finally {
        isRequestInProgressRef.current = false;
        setLoading(false);
      }
    };

    // Add debounce delay to prevent rapid successive calls
    const timeoutId = setTimeout(fetchAnalytics, 100);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isRequestInProgressRef.current = false;
    };
  }, [user, storeId, websiteId, dateRange.startDate.getTime(), dateRange.endDate.getTime()]);

  return { analytics, loading, error };
};
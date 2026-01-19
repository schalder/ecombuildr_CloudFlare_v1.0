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

export const useFacebookPixelAnalytics = (
  storeId: string, 
  dateRangeDays: number, 
  websiteId?: string, 
  funnelId?: string, 
  providerFilter: 'facebook' | 'all' = 'facebook',
  websites?: Array<{ id: string; facebook_server_side_enabled?: boolean | null }>,
  funnels?: Array<{ id: string; settings?: any }>
) => {
  const [analytics, setAnalytics] = useState<PixelAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Compute date range fresh on each fetch
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - dateRangeDays);

        // ✅ Fetch website/funnel configs if not provided (for server-side tracking check)
        let websiteConfigs: Record<string, boolean> = {};
        let funnelConfigs: Record<string, boolean> = {};
        
        if (!websites || !funnels) {
          // Fetch all websites and funnels for this store to check server-side status
          const [websitesResult, funnelsResult] = await Promise.all([
            supabase
              .from('websites')
              .select('id, facebook_server_side_enabled')
              .eq('store_id', storeId)
              .eq('is_active', true),
            supabase
              .from('funnels')
              .select('id, settings')
              .eq('store_id', storeId)
              .eq('is_active', true)
          ]);
          
          if (websitesResult.data && !websitesResult.error) {
            websitesResult.data.forEach((w: any) => {
              websiteConfigs[w.id] = w.facebook_server_side_enabled === true;
            });
          }
          
          if (funnelsResult.data && !funnelsResult.error) {
            funnelsResult.data.forEach((f: any) => {
              const settings = f.settings as any;
              funnelConfigs[f.id] = settings?.facebook_server_side_enabled === true;
            });
          }
        } else {
          // Use provided arrays
          websites.forEach(w => {
            websiteConfigs[w.id] = w.facebook_server_side_enabled === true;
          });
          funnels.forEach(f => {
            funnelConfigs[f.id] = f.settings?.facebook_server_side_enabled === true;
          });
        }

        // Build query filters
        // Build base query
        let queryBuilder: any = supabase
          .from('pixel_events')
          .select('*')
          .eq('store_id', storeId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());

        // Apply website filter if provided
        if (websiteId) {
          queryBuilder = queryBuilder.eq('website_id', websiteId);
        }

        // Apply funnel filter if provided
        // Note: funnel_id column exists but TypeScript types may not be updated
        if (funnelId) {
          queryBuilder = queryBuilder.eq('funnel_id', funnelId);
        }

        const { data: events, error: fetchError } = await queryBuilder;

        if (fetchError) {
          console.error('Error fetching pixel events:', fetchError);
          setError('Failed to fetch analytics data');
          return;
        }

        // ✅ FIX: Filter events to show all events attempted/sent to Facebook
        // Deduplicate by event_id since Facebook deduplicates browser + server events with same ID
        const eventIdMap = new Map<string, any>();
        
        const filteredEvents = providerFilter === 'facebook' 
          ? (events || []).filter(event => {
              const eventData = event.event_data as any;
              const providers = eventData?._providers?.facebook;
              
              // ✅ FIX: Include events if Facebook was configured OR attempted
              // This ensures we show all events that were meant for Facebook
              if (!providers) return false;
              
              // Check if Facebook pixel was configured (pixel ID exists)
              const wasConfigured = providers.configured === true;
              
              // Check if Facebook pixel was attempted (even if it failed due to ad blocker)
              const wasAttempted = providers.attempted === true;
              
              // ✅ Only include events where Facebook was configured OR attempted
              if (!wasConfigured && !wasAttempted) return false;
              
              // ✅ Include events if:
              // 1. Browser pixel succeeded (success === true), OR
              // 2. Server-side tracking is enabled (forwarded to Facebook), OR
              // 3. Browser pixel was attempted (even if blocked by ad blocker - we still tried to send it)
              const browserSuccess = providers.success === true;
              
              // Check if server-side tracking was enabled for this event
              // Note: funnel_id exists in DB but TypeScript types may not be updated
              const eventAny = event as any;
              let serverSideEnabled = false;
              if (eventAny.website_id) {
                serverSideEnabled = websiteConfigs[eventAny.website_id] === true;
              } else if (eventAny.funnel_id) {
                serverSideEnabled = funnelConfigs[eventAny.funnel_id] === true;
              }
              
              // Include if browser succeeded OR server-side enabled OR was attempted (shows intent to track)
              const shouldInclude = browserSuccess || serverSideEnabled || wasAttempted;
              
              if (!shouldInclude) return false;
              
              // ✅ Deduplicate by event_id (Facebook deduplicates browser + server events with same ID)
              const eventId = eventData?.event_id;
              if (eventId) {
                // If we've seen this event_id before, skip it (already counted)
                // Facebook deduplicates events with same event_id, so we should too
                if (eventIdMap.has(eventId)) {
                  return false;
                }
                eventIdMap.set(eventId, event);
              }
              
              return true;
            })
          : (events || []);

        // Process events data
        const eventCounts = {
          totalEvents: filteredEvents.length,
          pageViews: 0,
          viewContent: 0,
          addToCart: 0,
          initiateCheckout: 0,
          purchases: 0,
        };

        let totalRevenue = 0;
        const productViews: Record<string, { name: string; views: number; conversions: number }> = {};
        const dailyEvents: Record<string, any> = {};
        const productIds = new Set<string>();

        // First pass: collect all product IDs and count events
        filteredEvents.forEach((event) => {
          const eventType = event.event_type;
          const eventData = event.event_data as any || {};
          const eventDate = new Date(event.created_at).toISOString().split('T')[0];

          // Initialize daily events for this date
          if (!dailyEvents[eventDate]) {
            dailyEvents[eventDate] = {
              date: eventDate,
              page_views: 0,
              view_content: 0,
              add_to_cart: 0,
              initiate_checkout: 0,
              purchases: 0,
            };
          }

          // Count events by type
          switch (eventType) {
            case 'PageView':
              eventCounts.pageViews++;
              dailyEvents[eventDate].page_views++;
              break;
            case 'ViewContent':
              eventCounts.viewContent++;
              dailyEvents[eventDate].view_content++;
              
              // Collect product IDs from ViewContent events
              if (eventData.content_ids) {
                const ids = Array.isArray(eventData.content_ids) 
                  ? eventData.content_ids 
                  : [eventData.content_ids];
                ids.forEach((id: string) => {
                  if (id && id !== 'unknown') {
                    productIds.add(id);
                  }
                });
              }
              break;
            case 'AddToCart':
              eventCounts.addToCart++;
              dailyEvents[eventDate].add_to_cart++;
              break;
            case 'InitiateCheckout':
              eventCounts.initiateCheckout++;
              dailyEvents[eventDate].initiate_checkout++;
              break;
            case 'Purchase':
              eventCounts.purchases++;
              dailyEvents[eventDate].purchases++;
              
              // Calculate revenue
              if (eventData.value) {
                totalRevenue += parseFloat(String(eventData.value)) || 0;
              }
              
              // Collect product IDs from Purchase events
              if (eventData.contents && Array.isArray(eventData.contents)) {
                eventData.contents.forEach((item: any) => {
                  if (item.id && item.id !== 'unknown') {
                    productIds.add(item.id);
                  }
                });
              }
              break;
          }
        });

        // Fetch product names from database
        const productLookup: Record<string, string> = {};
        if (productIds.size > 0) {
          try {
            const { data: products } = await supabase
              .from('products')
              .select('id, name')
              .in('id', Array.from(productIds));
            
            products?.forEach((product) => {
              productLookup[product.id] = product.name;
            });
          } catch (err) {
            console.warn('Failed to fetch product names:', err);
          }
        }

        // Second pass: process events with proper product names
        filteredEvents.forEach((event) => {
          const eventType = event.event_type;
          const eventData = event.event_data as any || {};

          switch (eventType) {
            case 'ViewContent':
              // Track product views with proper names
              if (eventData.content_ids) {
                const ids = Array.isArray(eventData.content_ids) 
                  ? eventData.content_ids 
                  : [eventData.content_ids];
                
                ids.forEach((productId: string) => {
                  if (productId && productId !== 'unknown') {
                    const productName = productLookup[productId] || eventData.content_name || 'Unknown Product';
                    if (!productViews[productId]) {
                      productViews[productId] = { name: productName, views: 0, conversions: 0 };
                    }
                    productViews[productId].views++;
                  }
                });
              }
              break;
            case 'Purchase':
              // Track product conversions with proper names
              if (eventData.contents && Array.isArray(eventData.contents)) {
                eventData.contents.forEach((item: any) => {
                  const productId = item.id;
                  if (productId && productId !== 'unknown') {
                    const productName = productLookup[productId] || item.name || 'Unknown Product';
                    if (!productViews[productId]) {
                      productViews[productId] = { name: productName, views: 0, conversions: 0 };
                    }
                    productViews[productId].conversions++;
                  }
                });
              }
              break;
          }
        });

        // Calculate conversion rate
        const conversionRate = eventCounts.pageViews > 0 
          ? (eventCounts.purchases / eventCounts.pageViews) * 100 
          : 0;

        // Convert products object to array and sort by views
        const topProducts = Object.entries(productViews)
          .map(([productId, data]) => ({
            product_id: productId,
            product_name: data.name,
            views: data.views,
            conversions: data.conversions,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        // Convert daily events to array and sort by date
        const dailyEventsArray = Object.values(dailyEvents)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setAnalytics({
          ...eventCounts,
          conversionRate: Math.round(conversionRate * 100) / 100,
          revenue: Math.round(totalRevenue * 100) / 100,
          topProducts,
          dailyEvents: dailyEventsArray,
        });

      } catch (err) {
        console.error('Error processing analytics:', err);
        setError('Failed to process analytics data');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!user || !storeId) return;
    fetchAnalytics();
  }, [user, storeId, websiteId, funnelId, dateRangeDays, providerFilter]);

  const refetch = () => {
    return fetchAnalytics();
  };

  return { analytics, loading, error, refetch };
};
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/hooks/useUserStore";
import { PlanStatusBanner } from "@/components/dashboard/PlanStatusBanner";

import { PlanUpgradeModal2 } from "@/components/dashboard/PlanUpgradeModal2";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { OperationalCards } from "@/components/dashboard/OperationalCards";
import { DateFilter, DateFilterOption, getDateRange } from "@/components/dashboard/DateFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Eye, Edit, ExternalLink, ShoppingCart, Store, FileText, Users, BarChart3, Globe, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";

type CurrencyCode = 'BDT' | 'USD' | 'INR' | 'EUR' | 'GBP';

const SUPPORTED_CURRENCIES: CurrencyCode[] = ['BDT', 'USD', 'INR', 'EUR', 'GBP'];

const currencySymbols: Record<CurrencyCode, string> = {
  BDT: '৳',
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

const currencyLocales: Record<CurrencyCode, string> = {
  BDT: 'en-BD',
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'en-IE',
  GBP: 'en-GB',
};

const isCurrencyCode = (value: unknown): value is CurrencyCode => {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
};

interface Store {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
}

interface DashboardStats {
  totalRevenue: number; // Keep for backward compatibility
  revenueByCurrency?: Record<CurrencyCode, number>; // New: revenue grouped by currency
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface OperationalStats {
  pendingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  courierBalance: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  website_id?: string;
  funnel_id?: string;
}

interface Website {
  id: string;
  name: string;
  slug: string;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  canonical_domain: string | null;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const { store, loading: storeLoading } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [operationalStats, setOperationalStats] = useState<OperationalStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [websiteMap, setWebsiteMap] = useState<Record<string, string>>({});
  const [funnelMap, setFunnelMap] = useState<Record<string, string>>({});
  const [websiteCurrencyMap, setWebsiteCurrencyMap] = useState<Record<string, CurrencyCode>>({});
  const [funnelCurrencyMap, setFunnelCurrencyMap] = useState<Record<string, CurrencyCode>>({});
  const [loading, setLoading] = useState(true);
  const [operationalLoading, setOperationalLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { userProfile } = usePlanLimits();
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');

  useEffect(() => {
    if (store) {
      fetchDashboardData();
      fetchOperationalData();
    } else if (!storeLoading) {
      setLoading(false);
      setOperationalLoading(false);
    }
  }, [store, storeLoading, dateFilter]);

  // Auto-show upgrade modal for read-only users (expired trial/subscription)
  useEffect(() => {
    if (userProfile?.account_status === 'read_only') {
      setShowUpgradeModal(true);
    }
  }, [userProfile?.account_status]);

  const fetchDashboardData = async () => {
    if (!store) return;

    try {
      setLoading(true);
      
      // Get date range for filtering
      const { start, end } = getDateRange(dateFilter);
      
      // Get total products (always unfiltered)
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', store.id);

      // Build orders query with date filter
      // Exclude incomplete/failed/cancelled orders from stats calculations
      // Excluded statuses: pending_payment, payment_failed, cancelled
      let ordersQuery = supabase
        .from('orders')
        .select('total, created_at, website_id, funnel_id')
        .eq('store_id', store.id)
        .neq('status', 'pending_payment' as any)
        .neq('status', 'payment_failed' as any)
        .neq('status', 'cancelled' as any);

      if (start && end) {
        ordersQuery = ordersQuery
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }

      const { data: ordersData } = await ordersQuery;

      // Build customers query with date filter
      // Only count customers with completed purchases (total_orders > 0)
      // Exclude customers who only have incomplete/failed/cancelled orders
      let customersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('store_id', store.id)
        .gt('total_orders', 0); // Only customers with completed purchases

      if (start && end) {
        customersQuery = customersQuery
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }

      const { count: customersCount } = await customersQuery;

      // Get websites and funnels with settings for currency
      const [
        { data: websitesData },
        { data: funnelsData },
        { data: recentOrdersData }
      ] = await Promise.all([
        supabase
          .from('websites')
          .select('id, name, slug, settings')
          .eq('store_id', store.id)
          .eq('is_active', true),
        supabase
          .from('funnels')
          .select('id, name, slug, canonical_domain, settings')
          .eq('store_id', store.id)
          .eq('is_active', true),
        supabase
          .from('orders')
          .select('id, order_number, customer_name, total, status, created_at, website_id, funnel_id')
          .eq('store_id', store.id)
          .neq('status', 'pending_payment' as any)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Create lookup maps
      const websiteNameMap: Record<string, string> = {};
      const funnelNameMap: Record<string, string> = {};
      const websiteCurrencyLookup: Record<string, CurrencyCode> = {};
      const funnelCurrencyLookup: Record<string, CurrencyCode> = {};
      
      (websitesData || []).forEach(w => {
        websiteNameMap[w.id] = w.name;
        const code = (w.settings as any)?.currency?.code || (w.settings as any)?.currency_code;
        if (isCurrencyCode(code)) {
          websiteCurrencyLookup[w.id] = code;
        }
      });
      
      (funnelsData || []).forEach(f => {
        funnelNameMap[f.id] = f.name;
        const code = (f.settings as any)?.currency_code;
        if (isCurrencyCode(code)) {
          funnelCurrencyLookup[f.id] = code;
        }
      });

      setWebsites(websitesData || []);
      setFunnels(funnelsData || []);
      setWebsiteMap(websiteNameMap);
      setFunnelMap(funnelNameMap);
      setWebsiteCurrencyMap(websiteCurrencyLookup);
      setFunnelCurrencyMap(funnelCurrencyLookup);

      // Helper function to determine currency for an order
      const getOrderCurrencyFromData = (order: { website_id?: string; funnel_id?: string }): CurrencyCode => {
        if (order.funnel_id && funnelCurrencyLookup[order.funnel_id]) {
          return funnelCurrencyLookup[order.funnel_id];
        }
        if (order.website_id && websiteCurrencyLookup[order.website_id]) {
          return websiteCurrencyLookup[order.website_id];
        }
        return 'BDT'; // Default fallback
      };

      // Calculate revenue grouped by currency
      const revenueByCurrency: Record<CurrencyCode, number> = {
        BDT: 0,
        USD: 0,
        INR: 0,
        EUR: 0,
        GBP: 0,
      };

      ordersData?.forEach(order => {
        const currency = getOrderCurrencyFromData(order);
        revenueByCurrency[currency] += Number(order.total);
      });

      // Calculate total revenue (sum of all currencies) for backward compatibility
      const totalRevenue = Object.values(revenueByCurrency).reduce((sum, amount) => sum + amount, 0);
      const totalOrders = ordersData?.length || 0;

      setStats({
        totalRevenue,
        revenueByCurrency,
        totalOrders,
        totalCustomers: customersCount || 0,
        totalProducts: productsCount || 0,
      });

      setRecentOrders(recentOrdersData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationalData = async () => {
    if (!store) return;

    try {
      setOperationalLoading(true);
      
      // Get date range for filtering
      const { start, end } = getDateRange(dateFilter);
      
      // Build order count queries with date filter
      // Exclude incomplete orders (pending_payment status) from operational stats
      let pendingQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'pending')
        .neq('status', 'pending_payment' as any);

      let shippedQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'shipped')
        .neq('status', 'pending_payment' as any);

      let cancelledQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'cancelled')
        .neq('status', 'pending_payment' as any);

      // Apply date filtering if specified
      if (start && end) {
        pendingQuery = pendingQuery
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        shippedQuery = shippedQuery
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        cancelledQuery = cancelledQuery
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }

      // Get order counts by status
      const [
        { count: pendingCount },
        { count: shippedCount },
        { count: cancelledCount }
      ] = await Promise.all([
        pendingQuery,
        shippedQuery,
        cancelledQuery
      ]);

      // Get courier balance from Steadfast API
      let courierBalance = 0;
      try {
        const { data: balanceData } = await supabase.functions.invoke('steadfast-balance');
        courierBalance = balanceData?.current_balance || 0;
      } catch (error) {
        console.error('Error fetching courier balance:', error);
      }

      setOperationalStats({
        pendingOrders: pendingCount || 0,
        shippedOrders: shippedCount || 0,
        cancelledOrders: cancelledCount || 0,
        courierBalance,
      });
    } catch (error) {
      console.error('Error fetching operational data:', error);
    } finally {
      setOperationalLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-success-light text-success';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderCurrency = (order: RecentOrder | null | undefined): CurrencyCode => {
    if (!order) return 'BDT';
    if (order.funnel_id && funnelCurrencyMap[order.funnel_id]) return funnelCurrencyMap[order.funnel_id];
    if (order.website_id && websiteCurrencyMap[order.website_id]) return websiteCurrencyMap[order.website_id];
    return 'BDT';
  };

  const formatOrderTotal = (order: RecentOrder): string => {
    const currency = getOrderCurrency(order);
    const symbol = currencySymbols[currency];
    const locale = currencyLocales[currency];
    const amount = Number(order.total);
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Welcome back! Here's what's happening with your business"
    >
      <div className="space-y-6">
        <PlanStatusBanner onUpgrade={() => setShowUpgradeModal(true)} />
        
        {/* Date Filter */}
        <Card className="bg-gradient-card border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Dashboard Analytics</CardTitle>
            <CardDescription>Filter your revenue, orders, and customer data by time period</CardDescription>
          </CardHeader>
          <CardContent>
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </CardContent>
        </Card>
        
        {/* Stats Cards */}
        <StatsCards stats={stats || undefined} loading={loading} dateFilter={dateFilter} />
        
        {/* Operational Cards */}
        <OperationalCards stats={operationalStats || undefined} loading={operationalLoading} />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="md:col-span-2 lg:col-span-5 space-y-6">
            {/* Recent Orders */}
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest customer orders</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <NavLink to="/dashboard/orders">
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </NavLink>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name} • {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        {(order.website_id || order.funnel_id) && (
                          <div className="text-xs text-muted-foreground">
                            from {order.website_id ? websiteMap[order.website_id] : funnelMap[order.funnel_id!]}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <div className="font-medium">{formatOrderTotal(order)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No orders yet</p>
                  <p className="text-sm">Orders will appear here once customers start purchasing</p>
                </div>
              )}
            </CardContent>
          </Card>

          
          </div>
          
          {/* Quick Access Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            
            
            {/* Websites Quick Access */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Websites</CardTitle>
                  <CardDescription>Quick access to your websites</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <NavLink to="/dashboard/websites/create">
                    <Plus className="h-4 w-4" />
                  </NavLink>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : websites.length > 0 ? (
                  <div className="space-y-2">
                    {websites.slice(0, 3).map((website) => (
                      <div key={website.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{website.name}</div>
                          <div className="text-xs text-muted-foreground">{website.slug}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <NavLink to={`/dashboard/websites/${website.id}`}>
                              <Edit className="h-3 w-3" />
                            </NavLink>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <a href={`/site/${website.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {websites.length > 3 && (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <NavLink to="/dashboard/websites">View All ({websites.length})</NavLink>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Globe className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No websites yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <NavLink to="/dashboard/websites/create">
                        <Plus className="h-3 w-3 mr-1" />
                        Create Website
                      </NavLink>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Funnels Quick Access */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Funnels</CardTitle>
                  <CardDescription>Quick access to your funnels</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <NavLink to="/dashboard/funnels/create">
                    <Plus className="h-4 w-4" />
                  </NavLink>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : funnels.length > 0 ? (
                  <div className="space-y-2">
                    {funnels.slice(0, 3).map((funnel) => (
                      <div key={funnel.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{funnel.name}</div>
                          <div className="text-xs text-muted-foreground">{funnel.slug}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <NavLink to={`/dashboard/funnels/${funnel.id}`}>
                              <Edit className="h-3 w-3" />
                            </NavLink>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <a 
                              href={funnel.canonical_domain ? `https://${funnel.canonical_domain}` : `/funnel/${funnel.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {funnels.length > 3 && (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <NavLink to="/dashboard/funnels">View All ({funnels.length})</NavLink>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Zap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No funnels yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <NavLink to="/dashboard/funnels/create">
                        <Plus className="h-3 w-3 mr-1" />
                        Create Funnel
                      </NavLink>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
      
      {/* Use unified upgrade modal - only mount when needed */}
      {showUpgradeModal && (
        <PlanUpgradeModal2 
          open={true} 
          onOpenChange={setShowUpgradeModal}
        />
      )}
    </DashboardLayout>
  );
}
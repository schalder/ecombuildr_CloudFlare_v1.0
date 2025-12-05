import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { DateFilterOption } from "./DateFilter";
import { formatCurrency, type CurrencyCode } from '@/lib/currency';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

function StatCard({ title, value, description, icon: Icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-card border-border shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted animate-pulse rounded mb-1" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border shadow-soft hover:shadow-medium transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {description && <span>{description}</span>}
          {trend && (
            <div className={`flex items-center gap-1 ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats?: {
    totalRevenue: number;
    revenueByCurrency?: Record<string, number>; // New: currency breakdown
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  };
  loading?: boolean;
  dateFilter?: DateFilterOption;
}

export function StatsCards({ stats, loading = false, dateFilter = 'allTime' }: StatsCardsProps) {
  const defaultStats = {
    totalRevenue: 0,
    revenueByCurrency: {},
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  };

  const data = stats || defaultStats;

  // Currency symbols mapping
  const currencySymbols: Record<CurrencyCode, string> = {
    BDT: '৳',
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  // Format multi-currency revenue display
  const formatMultiCurrencyRevenue = (revenueByCurrency?: Record<string, number>): string => {
    if (!revenueByCurrency || Object.keys(revenueByCurrency).length === 0) {
      // Fallback to totalRevenue with BDT if revenueByCurrency is not available
      return formatCurrency(data.totalRevenue, { code: 'BDT' });
    }
    
    // Filter out currencies with zero revenue and sort by amount (descending)
    const currencies = Object.entries(revenueByCurrency)
      .filter(([_, amount]) => amount > 0)
      .sort(([_, a], [__, b]) => b - a) as [CurrencyCode, number][];
    
    if (currencies.length === 0) {
      return formatCurrency(0, { code: 'BDT' });
    }
    
    if (currencies.length === 1) {
      // Single currency: show formatted amount
      const [code, amount] = currencies[0];
      return formatCurrency(amount, { code });
    }
    
    // Multiple currencies: show up to 3, then "and X more" if needed
    const displayCurrencies = currencies.slice(0, 3);
    const remaining = currencies.length - 3;
    
    const formatted = displayCurrencies
      .map(([code, amount]) => {
        const symbol = currencySymbols[code];
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
        return `${symbol}${formatted} ${code}`;
      })
      .join(' + ');
    
    if (remaining > 0) {
      return `${formatted} + ${remaining} more`;
    }
    
    return formatted;
  };

  const getFilterDescription = (filter: DateFilterOption) => {
    switch (filter) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'last7days':
        return 'Last 7 days';
      case 'thisMonth':
        return 'This month';
      case 'lastMonth':
        return 'Last month';
      case 'allTime':
      default:
        return 'All time';
    }
  };

  const filterDescription = getFilterDescription(dateFilter);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatMultiCurrencyRevenue(data.revenueByCurrency)}
        description={filterDescription}
        icon={DollarSign}
        loading={loading}
      />
      <StatCard
        title="Orders"
        value={data.totalOrders.toLocaleString()}
        description={filterDescription}
        icon={ShoppingCart}
        loading={loading}
      />
      <StatCard
        title="Customers"
        value={data.totalCustomers.toLocaleString()}
        description={filterDescription}
        icon={Users}
        loading={loading}
      />
      <StatCard
        title="Products"
        value={data.totalProducts.toLocaleString()}
        description="In catalog"
        icon={Package}
        loading={loading}
      />
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react";

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
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  };
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const defaultStats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  };

  const data = stats || defaultStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={`৳${data.totalRevenue.toLocaleString()}`}
        description="This month"
        icon={DollarSign}
        trend={{ value: 12.5, isPositive: true }}
        loading={loading}
      />
      <StatCard
        title="Orders"
        value={data.totalOrders.toLocaleString()}
        description="Total orders"
        icon={ShoppingCart}
        trend={{ value: 8.2, isPositive: true }}
        loading={loading}
      />
      <StatCard
        title="Customers"
        value={data.totalCustomers.toLocaleString()}
        description="Active customers"
        icon={Users}
        trend={{ value: 3.1, isPositive: true }}
        loading={loading}
      />
      <StatCard
        title="Products"
        value={data.totalProducts.toLocaleString()}
        description="In catalog"
        icon={Package}
        trend={{ value: 5.4, isPositive: false }}
        loading={loading}
      />
    </div>
  );
}
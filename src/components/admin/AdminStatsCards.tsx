import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Globe, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  ShoppingCart,
  Target,
  Zap
} from 'lucide-react';

interface PlatformStats {
  total_users: number;
  active_users: number;
  trial_users: number;
  paid_users: number;
  merchant_gmv: number;
  monthly_gmv: number;
  total_websites: number;
  active_websites: number;
  total_funnels: number;
  active_funnels: number;
  total_orders: number;
  subscription_mrr: number;
}

interface AdminStatsCardsProps {
  stats: PlatformStats | null;
  loading?: boolean;
}

export const AdminStatsCards = ({ stats, loading }: AdminStatsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      description: `${stats?.active_users || 0} active`,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Paid Subscribers',
      value: stats?.paid_users || 0,
      description: `${stats?.trial_users || 0} on trial`,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: 'Websites',
      value: stats?.total_websites || 0,
      description: `${stats?.active_websites || 0} active`,
      icon: Globe,
      color: 'text-purple-600',
    },
    {
      title: 'Funnels',
      value: stats?.total_funnels || 0,
      description: `${stats?.active_funnels || 0} active`,
      icon: Zap,
      color: 'text-orange-600',
    },
    {
      title: 'SaaS MRR',
      value: `$${stats?.subscription_mrr || 0}`,
      description: 'Monthly recurring revenue',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Merchant GMV',
      value: formatCurrency(stats?.merchant_gmv || 0),
      description: `${stats?.total_orders || 0} orders`,
      icon: ShoppingCart,
      color: 'text-indigo-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
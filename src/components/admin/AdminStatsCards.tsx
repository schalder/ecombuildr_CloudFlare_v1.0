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
  Zap,
  AlertCircle
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  totalWebsites: number;
  activeWebsites: number;
  totalFunnels: number;
  activeFunnels: number;
  totalOrders: number;
  totalGMV: number;
  monthlyGMV: number;
  averageOrderValue: number;
  estimatedMRR: number;
  // Detailed MRR breakdown
  activeMRR?: number;
  trialPotentialMRR?: number;
  trialEndedPotentialMRR?: number;
  totalPotentialMRR?: number;
  potentialLossMRR?: number;
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
      value: stats?.totalUsers || 0,
      description: `${stats?.activeUsers || 0} active`,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      description: `${stats?.trialUsers || 0} on trial`,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: 'Websites',
      value: stats?.totalWebsites || 0,
      description: `${stats?.activeWebsites || 0} active`,
      icon: Globe,
      color: 'text-purple-600',
    },
    {
      title: 'Funnels',
      value: stats?.totalFunnels || 0,
      description: `${stats?.activeFunnels || 0} active`,
      icon: Zap,
      color: 'text-orange-600',
    },
    {
      title: 'Active MRR',
      value: formatCurrency(stats?.activeMRR ?? stats?.estimatedMRR ?? 0),
      description: 'Actual revenue from paying customers',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Trial Potential MRR',
      value: formatCurrency(stats?.trialPotentialMRR || 0),
      description: 'Potential if trial users upgrade',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Trial Ended Potential',
      value: formatCurrency(stats?.trialEndedPotentialMRR || 0),
      description: 'Lost opportunity from non-upgraded',
      icon: AlertCircle,
      color: 'text-orange-600',
    },
    {
      title: 'Total Potential MRR',
      value: formatCurrency(stats?.totalPotentialMRR || 0),
      description: 'All potential revenue combined',
      icon: Target,
      color: 'text-purple-600',
    },
    {
      title: 'Merchant GMV',
      value: formatCurrency(stats?.totalGMV || 0),
      description: `${stats?.totalOrders || 0} orders`,
      icon: ShoppingCart,
      color: 'text-indigo-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
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
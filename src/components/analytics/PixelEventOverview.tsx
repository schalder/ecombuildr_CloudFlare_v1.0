import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingCart, CreditCard, DollarSign, TrendingUp, Activity } from 'lucide-react';

interface PixelEventOverviewProps {
  analytics: {
    totalEvents: number;
    pageViews: number;
    viewContent: number;
    addToCart: number;
    initiateCheckout: number;
    purchases: number;
    conversionRate: number;
    revenue: number;
  } | null;
  loading: boolean;
}

export const PixelEventOverview = ({ analytics, loading }: PixelEventOverviewProps) => {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/3 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Events',
      value: analytics.totalEvents.toLocaleString(),
      icon: Activity,
      description: 'All pixel events',
      color: 'text-blue-600',
    },
    {
      title: 'Page Views',
      value: analytics.pageViews.toLocaleString(),
      icon: Eye,
      description: 'Unique page visits',
      color: 'text-green-600',
    },
    {
      title: 'Add to Cart',
      value: analytics.addToCart.toLocaleString(),
      icon: ShoppingCart,
      description: 'Products added',
      color: 'text-orange-600',
    },
    {
      title: 'Purchases',
      value: analytics.purchases.toLocaleString(),
      icon: CreditCard,
      description: 'Completed orders',
      color: 'text-purple-600',
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversionRate.toFixed(2)}%`,
      icon: TrendingUp,
      description: 'Purchase conversion',
      color: 'text-red-600',
    },
    {
      title: 'Revenue',
      value: `৳${analytics.revenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'From pixel events',
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                  {card.title === 'Conversion Rate' && analytics.conversionRate > 2 && (
                    <Badge variant="secondary" className="text-xs">Good</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
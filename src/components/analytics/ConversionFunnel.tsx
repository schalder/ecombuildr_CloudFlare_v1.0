import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, MousePointer, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';

interface ConversionFunnelProps {
  analytics: {
    pageViews: number;
    viewContent: number;
    addToCart: number;
    initiateCheckout: number;
    purchases: number;
  } | null;
  loading: boolean;
}

export const ConversionFunnel = ({ analytics, loading }: ConversionFunnelProps) => {
  if (loading || !analytics) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-muted rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxValue = analytics.pageViews || 1;

  const funnelSteps = [
    {
      name: 'Page Views',
      value: analytics.pageViews,
      icon: Eye,
      color: 'bg-blue-500',
      percentage: 100,
    },
    {
      name: 'View Content',
      value: analytics.viewContent,
      icon: MousePointer,
      color: 'bg-green-500',
      percentage: maxValue > 0 ? (analytics.viewContent / maxValue) * 100 : 0,
    },
    {
      name: 'Add to Cart',
      value: analytics.addToCart,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      percentage: maxValue > 0 ? (analytics.addToCart / maxValue) * 100 : 0,
    },
    {
      name: 'Initiate Checkout',
      value: analytics.initiateCheckout,
      icon: CreditCard,
      color: 'bg-purple-500',
      percentage: maxValue > 0 ? (analytics.initiateCheckout / maxValue) * 100 : 0,
    },
    {
      name: 'Purchase',
      value: analytics.purchases,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      percentage: maxValue > 0 ? (analytics.purchases / maxValue) * 100 : 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <p className="text-sm text-muted-foreground">
          Customer journey from page view to purchase
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {funnelSteps.map((step, index) => (
          <div key={step.name} className="relative">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg text-white ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{step.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">
                      {step.value.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({step.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <Progress value={step.percentage} className="h-2" />
              </div>
            </div>
            
            {index < funnelSteps.length - 1 && (
              <div className="ml-6 mt-2 mb-2">
                <div className="w-px h-4 bg-border"></div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
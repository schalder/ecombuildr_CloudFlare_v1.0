import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface EventTimelineProps {
  dailyEvents: Array<{
    date: string;
    page_views: number;
    view_content: number;
    add_to_cart: number;
    initiate_checkout: number;
    purchases: number;
  }>;
  loading: boolean;
  providerFilter?: 'facebook' | 'all';
}

export const EventTimeline = ({ dailyEvents, loading, providerFilter = 'facebook' }: EventTimelineProps) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have data but all values are zero
  const hasData = dailyEvents && dailyEvents.length > 0;
  const hasNonZeroData = hasData && dailyEvents.some(event => 
    event.page_views > 0 || event.view_content > 0 || event.add_to_cart > 0 || 
    event.initiate_checkout > 0 || event.purchases > 0
  );

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No event data available</p>
              <p className="text-sm">Events will appear here once tracking begins</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasNonZeroData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">
                {providerFilter === 'facebook' ? 'No Facebook pixel events found' : 'No events recorded'}
              </p>
              <p className="text-sm">
                {providerFilter === 'facebook' 
                  ? 'Configure Facebook Pixel or switch to "Internal Data" to see all events'
                  : 'Events will appear here once tracking begins'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = dailyEvents.map(event => ({
    ...event,
    date: new Date(event.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }));

  // Chart configuration for consistent theming
  const chartConfig = {
    page_views: {
      label: "Page Views",
      color: "hsl(var(--chart-1))",
    },
    view_content: {
      label: "View Content", 
      color: "hsl(var(--chart-2))",
    },
    add_to_cart: {
      label: "Add to Cart",
      color: "hsl(var(--chart-3))",
    },
    initiate_checkout: {
      label: "Initiate Checkout",
      color: "hsl(var(--chart-4))",
    },
    purchases: {
      label: "Purchases",
      color: "hsl(var(--chart-5))",
    },
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Daily breakdown of pixel events
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
            />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="page_views"
              stroke={chartConfig.page_views.color}
              strokeWidth={2}
              name={chartConfig.page_views.label}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="view_content"
              stroke={chartConfig.view_content.color}
              strokeWidth={2}
              name={chartConfig.view_content.label}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="add_to_cart"
              stroke={chartConfig.add_to_cart.color}
              strokeWidth={2}
              name={chartConfig.add_to_cart.label}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="initiate_checkout"
              stroke={chartConfig.initiate_checkout.color}
              strokeWidth={2}
              name={chartConfig.initiate_checkout.label}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="purchases"
              stroke={chartConfig.purchases.color}
              strokeWidth={2}
              name={chartConfig.purchases.label}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
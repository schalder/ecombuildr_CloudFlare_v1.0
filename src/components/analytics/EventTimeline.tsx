import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
}

export const EventTimeline = ({ dailyEvents, loading }: EventTimelineProps) => {
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

  if (!dailyEvents || dailyEvents.length === 0) {
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

  // Format data for chart
  const chartData = dailyEvents.map(event => ({
    ...event,
    date: new Date(event.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Daily breakdown of pixel events
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
            />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="page_views"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Page Views"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="view_content"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="View Content"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="add_to_cart"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="Add to Cart"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="initiate_checkout"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              name="Initiate Checkout"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="purchases"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              name="Purchases"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
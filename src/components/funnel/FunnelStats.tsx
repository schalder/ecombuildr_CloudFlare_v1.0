import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { Eye, Users, Percent, Clock, FileText, CheckCircle } from 'lucide-react';
import { useFunnelStats } from '@/hooks/useFunnelStats';

interface FunnelStatsProps {
  funnelId: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const FunnelStats: React.FC<FunnelStatsProps> = ({ funnelId }) => {
  const { stats, loading, error } = useFunnelStats(funnelId);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Funnel Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Funnel Statistics</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Failed to load statistics'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Funnel Statistics</h2>
          <p className="text-muted-foreground">Overview of your funnel performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Steps</p>
                <p className="text-2xl font-bold">{stats.totalSteps}</p>
                <p className="text-sm text-muted-foreground mt-2">{stats.publishedSteps} published</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{stats.analytics.totalPageViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">Last 30 days</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold">{stats.analytics.totalUniqueVisitors.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">Last 30 days</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.analytics.averageConversionRate.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground mt-2">Visitors to customers</p>
              </div>
              <Percent className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-green-500">$</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Step Performance</CardTitle>
          <CardDescription>Performance analytics for each funnel step</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.analytics.stepAnalytics.map((step, index) => (
              <div key={step.step_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{step.step_title}</p>
                    <p className="text-sm text-muted-foreground capitalize">{step.step_type}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">{step.conversion_rate.toFixed(1)}%</Badge>
                    <span className="text-sm text-muted-foreground">{step.unique_visitors} visitors</span>
                  </div>
                </div>
                <Progress value={step.conversion_rate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Visitor flow through funnel steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Funnel
                  dataKey="visitors"
                  data={stats.analytics.conversionFunnel}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
                <Tooltip />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.analytics.trafficSources.length > 0 ? (
              <div className="space-y-3">
                {stats.analytics.trafficSources.slice(0, 5).map((source, index) => {
                  const total = stats.analytics.trafficSources.reduce((sum, s) => sum + s.visitors, 0);
                  const percentage = total > 0 ? (source.visitors / total) * 100 : 0;
                  return (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{source.source}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">{source.visitors}</span>
                        <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No traffic data available</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};
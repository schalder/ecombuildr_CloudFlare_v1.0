import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Eye, ShoppingCart } from 'lucide-react';

interface TopProductsAnalyticsProps {
  topProducts: Array<{
    product_id: string;
    product_name: string;
    views: number;
    conversions: number;
  }>;
  loading: boolean;
}

export const TopProductsAnalytics = ({ topProducts, loading }: TopProductsAnalyticsProps) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-muted rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!topProducts || topProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No product data available</p>
              <p className="text-sm">Product analytics will appear here once customers interact with your products</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxViews = Math.max(...topProducts.map(p => p.views));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <p className="text-sm text-muted-foreground">
          Most viewed and converted products
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {topProducts.slice(0, 10).map((product, index) => {
          const conversionRate = product.views > 0 ? (product.conversions / product.views) * 100 : 0;
          const viewPercentage = maxViews > 0 ? (product.views / maxViews) * 100 : 0;
          
          return (
            <div key={product.product_id} className="flex items-center space-x-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    #{index + 1}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate pr-2">
                    {product.product_name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {conversionRate > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        High CVR
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{product.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{product.conversions} conversions</span>
                    </div>
                    <span className="font-medium">
                      {conversionRate.toFixed(1)}% CVR
                    </span>
                  </div>
                  
                  <Progress value={viewPercentage} className="h-1.5" />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, Package, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface LibraryOrderSummary {
  library_item_id: string;
  product_name: string;
  total_orders: number;
  total_quantity: number;
  revenue: number;
  last_order_at: string;
}

export default function AdminLibraryOrdersSummary() {
  const [summaries, setSummaries] = useState<LibraryOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_library_orders_summary');
      
      if (error) {
        console.error('Error fetching library orders summary:', error);
        return;
      }

      setSummaries(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = (libraryItemId: string) => {
    navigate(`/admin/product-library/${libraryItemId}/orders`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">Loading library orders summary...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Library Orders Summary</h1>
            <p className="text-muted-foreground">
              Overview of all product library orders across all stores
            </p>
          </div>
        </div>

        {summaries.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No library product orders found</p>
                <p className="text-sm">Orders will appear here once customers start purchasing library products</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Product Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaries.map((summary) => (
                  <div key={summary.library_item_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{summary.product_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Orders</p>
                              <p className="font-semibold">{summary.total_orders}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Quantity Sold</p>
                              <p className="font-semibold">{summary.total_quantity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-yellow-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Revenue</p>
                              <p className="font-semibold">${summary.revenue}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Last Order</p>
                              <p className="font-semibold">
                                {format(new Date(summary.last_order_at), 'MMM dd')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrders(summary.library_item_id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
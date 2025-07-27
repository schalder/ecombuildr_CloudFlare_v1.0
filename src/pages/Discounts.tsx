import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Percent, Plus, Tag, Calendar } from 'lucide-react';

export default function Discounts() {
  return (
    <DashboardLayout title="Discounts & Coupons" description="Create and manage discount codes and promotional offers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">0 active discounts</Badge>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Total Uses</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-sm text-muted-foreground">Discount code uses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Percent className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Total Savings</h3>
              </div>
              <p className="text-2xl font-bold mt-2">$0</p>
              <p className="text-sm text-muted-foreground">Customer savings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Active Codes</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Discount Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No discount codes yet</h3>
              <p className="mb-4">Create discount codes to boost sales and reward customers.</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Discount
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
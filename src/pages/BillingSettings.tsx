import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Calendar, CheckCircle } from 'lucide-react';

export default function BillingSettings() {
  return (
    <DashboardLayout title="Billing & Subscription" description="Manage your subscription and billing information">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Free Plan</h3>
                <p className="text-muted-foreground">Perfect for getting started</p>
                <Badge variant="secondary" className="mt-2">Active</Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">$0</p>
                <p className="text-muted-foreground">per month</p>
                <Button className="mt-2">Upgrade Plan</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Up to 100 products</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Email support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">SSL certificate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span>N/A (Free Plan)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment method</span>
                  <span>None required</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing email</span>
                  <span>user@example.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No billing history</h3>
              <p className="mb-4">You're currently on the free plan. Upgrade to see billing history.</p>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
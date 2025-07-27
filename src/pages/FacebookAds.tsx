import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, Plus, Play, Pause, BarChart3 } from 'lucide-react';

export default function FacebookAds() {
  return (
    <DashboardLayout title="Facebook Ads" description="Create and manage your Facebook advertising campaigns">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">0 active campaigns</Badge>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Total Reach</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Total Spend</h3>
              </div>
              <p className="text-2xl font-bold mt-2">$0</p>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">ROAS</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0x</p>
              <p className="text-sm text-muted-foreground">Return on ad spend</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Facebook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No campaigns yet</h3>
              <p className="mb-4">Create your first Facebook ad campaign to start reaching new customers.</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
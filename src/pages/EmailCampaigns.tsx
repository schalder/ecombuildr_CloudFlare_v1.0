import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Send, Users } from 'lucide-react';

export default function EmailCampaigns() {
  return (
    <DashboardLayout title="Email Campaigns" description="Send newsletters and promotional emails to your customers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">0 campaigns sent</Badge>
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
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Subscribers</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-sm text-muted-foreground">Total email subscribers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Open Rate</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0%</p>
              <p className="text-sm text-muted-foreground">Average open rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Click Rate</h3>
              </div>
              <p className="text-2xl font-bold mt-2">0%</p>
              <p className="text-sm text-muted-foreground">Average click rate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No campaigns yet</h3>
              <p className="mb-4">Create your first email campaign to engage with your customers.</p>
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
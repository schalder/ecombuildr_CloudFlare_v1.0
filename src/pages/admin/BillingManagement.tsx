import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Search,
  Download,
  RefreshCw,
  CreditCard,
  Users,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SaasSubscriber {
  id: string;
  user_email: string;
  user_name: string;
  subscription_tier: string;
  subscribed: boolean;
  subscription_end: string | null;
  created_at: string;
}

const BillingManagement = () => {
  const { isAdmin, platformStats, loading: adminLoading } = useAdminData();
  const [subscribers, setSubscribers] = useState<SaasSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      fetchSaasSubscribers();
    }
  }, [isAdmin, searchTerm, tierFilter, statusFilter]);

  const fetchSaasSubscribers = async () => {
    setLoading(true);
    try {
      // This would query a `subscribers` table when Stripe integration is added
      // For now, show message about connecting Stripe
      setSubscribers([]);
    } catch (err) {
      console.error('Error fetching SaaS subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US')}`;
  };

  // Calculate SaaS-specific metrics
  const totalMRR = platformStats?.subscription_mrr || 0;
  const totalARR = totalMRR * 12;
  const activeSubscribers = platformStats?.paid_users || 0;
  const averageARPU = activeSubscribers > 0 ? totalMRR / activeSubscribers : 0;

  if (adminLoading || isAdmin === null) {
    return (
      <AdminLayout title="Billing & Payments (SaaS)" description="Manage SaaS subscription revenue and billing">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Billing & Payments (SaaS)">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only super admins can access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Billing & Payments (SaaS)" description="Manage SaaS subscription revenue and billing">
      <div className="space-y-6">
        {/* SaaS Revenue Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMRR)}</div>
              <p className="text-xs text-muted-foreground">MRR</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalARR)}</div>
              <p className="text-xs text-muted-foreground">ARR</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscribers}</div>
              <p className="text-xs text-muted-foreground">Paying users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(averageARPU)}</div>
              <p className="text-xs text-muted-foreground">ARPU</p>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Integration
            </CardTitle>
            <CardDescription>
              Connect Stripe to enable subscription billing and payment management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <div className="font-medium">Stripe Not Connected</div>
                <div className="text-sm text-muted-foreground">
                  Set up Stripe integration to manage SaaS subscriptions, billing, and customer payments.
                </div>
              </div>
              <Button className="shrink-0">
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Stripe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters (Disabled until Stripe integration) */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Management</CardTitle>
            <CardDescription>
              Search and filter SaaS subscribers (available after Stripe integration)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end opacity-50">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search subscribers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter} disabled>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchSaasSubscribers} variant="outline" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Records */}
        <Card>
          <CardHeader>
            <CardTitle>SaaS Subscription Records</CardTitle>
            <CardDescription>All platform subscriptions and billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Connect Stripe to View Subscriptions</p>
              <p>Once Stripe is integrated, you'll see all subscriber data, billing history, and payment details here.</p>
              <Button className="mt-4">
                <ExternalLink className="h-4 w-4 mr-2" />
                Set up Stripe Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BillingManagement;
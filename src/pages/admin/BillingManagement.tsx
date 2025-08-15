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
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BillingRecord {
  id: string;
  user_email: string;
  user_name: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  next_billing_date?: string;
}

const BillingManagement = () => {
  const { isAdmin, platformStats } = useAdminData();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      fetchBillingRecords();
    }
  }, [isAdmin, searchTerm, statusFilter, planFilter]);

  const fetchBillingRecords = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from a billing/payments table
      // For now, we'll simulate billing data based on user subscriptions
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          subscription_plan,
          account_status,
          trial_expires_at,
          created_at
        `)
        .neq('subscription_plan', 'free');

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      if (planFilter !== 'all') {
        query = query.eq('subscription_plan', planFilter as any);
      }

      const { data: users, error } = await query.limit(50);
      
      if (error) throw error;

      // Transform user data into billing records
      const mockBillingRecords: BillingRecord[] = users?.map((user, index) => {
        const planPrices = {
          starter: 500,
          professional: 1500,
          enterprise: 2999
        };

        const amount = planPrices[user.subscription_plan as keyof typeof planPrices] || 0;
        
        return {
          id: user.id,
          user_email: user.email,
          user_name: user.full_name || user.email,
          plan: user.subscription_plan,
          amount: amount,
          currency: 'BDT',
          status: user.account_status === 'active' ? 'paid' : 
                  user.account_status === 'trial' ? 'trial' : 'pending',
          payment_method: 'bKash', // Mock payment method
          created_at: user.created_at,
          next_billing_date: user.trial_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      }) || [];

      setBillingRecords(mockBillingRecords);
    } catch (err) {
      console.error('Error fetching billing records:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-US')}`;
  };

  const totalRevenue = billingRecords.reduce((sum, record) => 
    record.status === 'paid' ? sum + record.amount : sum, 0);

  const monthlyRevenue = platformStats?.monthly_gmv || 0;

  if (!isAdmin) {
    return (
      <AdminLayout title="Billing Management">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Billing Management" description="Manage all payments and subscriptions">
      <div className="space-y-6">
        {/* Revenue Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {billingRecords.filter(r => r.status === 'paid').length}
              </div>
              <p className="text-xs text-muted-foreground">Paid users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalRevenue / Math.max(billingRecords.length, 1))}
              </div>
              <p className="text-xs text-muted-foreground">Per user</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
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

              <Button onClick={fetchBillingRecords} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Records */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Records</CardTitle>
            <CardDescription>All payments and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : billingRecords.length > 0 ? (
              <div className="space-y-3">
                {billingRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{record.user_name}</div>
                          <div className="text-sm text-muted-foreground">{record.user_email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPlanColor(record.plan)}>
                          {record.plan}
                        </Badge>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {record.payment_method}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(record.amount)}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.created_at).toLocaleDateString('en-US')}
                      </div>
                      {record.next_billing_date && (
                        <div className="text-xs text-muted-foreground">
                          Next: {new Date(record.next_billing_date).toLocaleDateString('en-US')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No billing records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BillingManagement;
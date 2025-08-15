import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, DollarSign, Users, TrendingUp, RefreshCw, Download, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

export default function BillingManagement() {
  const { isAdmin, loading: adminLoading, platformStats, saasSubscribers, fetchSaasSubscribers } = useAdminData();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  useEffect(() => {
    if (isAdmin) {
      fetchSaasSubscribers();
    }
  }, [isAdmin, statusFilter, tierFilter]);

  // Calculate SaaS revenue metrics from actual subscriptions
  const totalMRR = saasSubscribers
    .filter(s => s.subscription_status === 'active')
    .reduce((sum, sub) => sum + (sub.plan_price_bdt || 0), 0);
  
  const totalARR = totalMRR * 12;
  const activeSubscribers = saasSubscribers.filter(s => s.subscription_status === 'active').length;
  const averageARPU = activeSubscribers > 0 ? totalMRR / activeSubscribers : 0;

  // Filter subscribers based on search and filters
  const filteredSubscribers = saasSubscribers.filter(subscriber => {
    const matchesSearch = !searchTerm || 
      subscriber.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subscriber.subscription_status === statusFilter;
    const matchesTier = tierFilter === 'all' || subscriber.plan_name === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

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
              <div className="text-2xl font-bold">{formatCurrency(totalMRR, { code: 'BDT' })}</div>
              <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalARR, { code: 'BDT' })}</div>
              <p className="text-xs text-muted-foreground">Annual recurring revenue</p>
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
              <div className="text-2xl font-bold">{formatCurrency(averageARPU, { code: 'BDT' })}</div>
              <p className="text-xs text-muted-foreground">Average revenue per user</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual SaaS Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              SaaS Subscription Management
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </CardTitle>
            <CardDescription>
              Manage user subscriptions manually. Accept payments via bKash, Nagad, SSL Commerz, or manual transfer.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Records</CardTitle>
            <CardDescription>
              Manage user subscriptions and payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search subscribers by email, name, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchSaasSubscribers}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Subscribers Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Payment Method</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Expires</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        </tr>
                      ))
                    ) : filteredSubscribers.length > 0 ? (
                      filteredSubscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{subscriber.user_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{subscriber.user_email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{subscriber.plan_name}</Badge>
                          </td>
                          <td className="p-4 font-medium">
                            {formatCurrency(subscriber.plan_price_bdt, { code: 'BDT' })}
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              subscriber.payment_method === 'bkash' ? 'default' :
                              subscriber.payment_method === 'nagad' ? 'secondary' :
                              subscriber.payment_method === 'sslcommerz' ? 'outline' : 'default'
                            }>
                              {subscriber.payment_method}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              subscriber.subscription_status === 'active' ? 'default' :
                              subscriber.subscription_status === 'expired' ? 'destructive' : 'secondary'
                            }>
                              {subscriber.subscription_status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">
                            {subscriber.expires_at ? new Date(subscriber.expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <Button variant="outline" size="sm">Edit</Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No Subscribers Found</h3>
                          <p className="text-sm">Start by adding your first SaaS subscriber.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
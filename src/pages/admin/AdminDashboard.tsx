import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Store, 
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Shield
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { 
    isAdmin, 
    loading, 
    users, 
    platformStats, 
    error,
    refetch 
  } = useAdminData();
  
  const [enforcing, setEnforcing] = useState(false);

  const handleManualEnforcement = async () => {
    setEnforcing(true);
    try {
      const { data, error } = await supabase.functions.invoke('account-enforcement');
      
      if (error) {
        toast.error('Failed to run account enforcement: ' + error.message);
      } else {
        toast.success(`Account enforcement completed. ${data?.enforcedCount || 0} accounts enforced.`);
        refetch(); // Refresh the data
      }
    } catch (err) {
      toast.error('Error running account enforcement');
    } finally {
      setEnforcing(false);
    }
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading || isAdmin === null) {
    return (
      <AdminLayout title="Dashboard" description="Platform Overview">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Route guard already ensures only super admins reach this component

  const recentUsers = users?.slice(0, 5) || [];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <AdminLayout title="Admin Dashboard" description="Platform Overview & Statistics">
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleManualEnforcement}
            disabled={enforcing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            {enforcing ? 'Enforcing...' : 'Run Account Enforcement'}
          </Button>
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <AdminStatsCards stats={platformStats} loading={loading} />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Newly registered users</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href="/admin/users">
                  View All
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.full_name || user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • {new Date(user.created_at).toLocaleDateString('en-US')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPlanColor(user.subscription_plan)}>
                          {user.subscription_plan}
                        </Badge>
                        <Badge className={getStatusColor(user.account_status)}>
                          {user.account_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
              <CardDescription>Current system status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Gateway</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Errors</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Issues Detected</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/users">
                  <Users className="h-6 w-6" />
                  User Management
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/sites">
                  <Store className="h-6 w-6" />
                  Sites Management
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/billing">
                  <DollarSign className="h-6 w-6" />
                  Billing Management
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/analytics">
                  <TrendingUp className="h-6 w-6" />
                  Detailed Analytics
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/training">
                  <BookOpen className="h-6 w-6" />
                  Manage Training
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
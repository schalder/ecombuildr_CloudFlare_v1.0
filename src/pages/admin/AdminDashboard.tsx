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
  CheckCircle
} from 'lucide-react';
import { useEffect } from 'react';

const AdminDashboard = () => {
  const { 
    isAdmin, 
    loading, 
    users, 
    platformStats, 
    error,
    refetch 
  } = useAdminData();

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading || isAdmin === null) {
    return (
      <AdminLayout title="ড্যাশবোর্ড" description="প্ল্যাটফর্মের সার্বিক চিত্র">
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

  if (!isAdmin) {
    return (
      <AdminLayout title="অ্যাক্সেস অস্বীকৃত">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              অ্যাক্সেস অস্বীকৃত
            </CardTitle>
            <CardDescription>
              আপনার এই পেজ দেখার অনুমতি নেই। শুধুমাত্র সুপার অ্যাডমিনরা এই পেজ দেখতে পারেন।
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  const recentUsers = users?.slice(0, 5) || [];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="অ্যাডমিন ড্যাশবোর্ড" description="প্ল্যাটফর্মের সার্বিক পরিস্থিতি ও পরিসংখ্যান">
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            রিফ্রেশ
          </Button>
        </div>

        {/* Stats Cards */}
        <AdminStatsCards stats={platformStats} loading={loading} />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>সাম্প্রতিক ব্যবহারকারী</CardTitle>
                <CardDescription>নতুন নিবন্ধিত ব্যবহারকারীগণ</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href="/admin/users">
                  সব দেখুন
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
                          {user.email} • {new Date(user.created_at).toLocaleDateString('bn-BD')}
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
                  <p>কোন ব্যবহারকারী পাওয়া যায়নি</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle>প্ল্যাটফর্ম স্বাস্থ্য</CardTitle>
              <CardDescription>সিস্টেমের বর্তমান অবস্থা</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">সিস্টেম স্ট্যাটাস</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">সক্রিয়</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ডেটাবেস</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">সংযুক্ত</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">পেমেন্ট গেটওয়ে</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">কার্যকর</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ত্রুটি</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">সমস্যা আছে</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>দ্রুত অ্যাকশন</CardTitle>
            <CardDescription>সাধারণ অ্যাডমিন কাজ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/users">
                  <Users className="h-6 w-6" />
                  ব্যবহারকারী পরিচালনা
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/stores">
                  <Store className="h-6 w-6" />
                  স্টোর পরিচালনা
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/billing">
                  <DollarSign className="h-6 w-6" />
                  বিলিং ম্যানেজমেন্ট
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <a href="/admin/analytics">
                  <TrendingUp className="h-6 w-6" />
                  বিস্তারিত অ্যানালিটিক্স
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
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  Eye,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const UserManagement = () => {
  const { users, loading, fetchUsers, updateUserPlan, updateUserStatus, loginAsUser } = useAdminData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers(searchTerm, planFilter);
  }, [searchTerm, planFilter]);

  const handlePlanUpdate = async (userId: string, newPlan: string) => {
    const success = await updateUserPlan(userId, newPlan);
    if (success) {
      toast({
        title: 'প্ল্যান আপডেট সফল',
        description: 'ব্যবহারকারীর প্ল্যান সফলভাবে আপডেট করা হয়েছে।',
      });
    } else {
      toast({
        title: 'প্ল্যান আপডেট ব্যর্থ',
        description: 'প্ল্যান আপডেট করতে সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    const success = await updateUserStatus(userId, newStatus);
    if (success) {
      toast({
        title: 'স্ট্যাটাস আপডেট সফল',
        description: 'ব্যবহারকারীর স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।',
      });
    } else {
      toast({
        title: 'স্ট্যাটাস আপডেট ব্যর্থ',
        description: 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    }
  };

  const handleLoginAsUser = async (userId: string) => {
    const success = await loginAsUser(userId);
    if (success) {
      toast({
        title: 'ব্যবহারকারী হিসেবে লগইন',
        description: 'সাপোর্টের জন্য ব্যবহারকারী অ্যাকাউন্টে প্রবেশ করা হয়েছে।',
      });
      // Redirect would happen in the hook
    } else {
      toast({
        title: 'লগইন ব্যর্থ',
        description: 'ব্যবহারকারী হিসেবে লগইন করতে সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    }
  };

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
    <AdminLayout title="ব্যবহারকারী ব্যবস্থাপনা" description="সকল ব্যবহারকারী পরিচালনা ও নিয়ন্ত্রণ">
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>ফিল্টার ও অনুসন্ধান</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="ইমেইল বা নাম দিয়ে খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="প্ল্যান ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব প্ল্যান</SelectItem>
                  <SelectItem value="free">ফ্রি</SelectItem>
                  <SelectItem value="starter">স্টার্টার</SelectItem>
                  <SelectItem value="professional">প্রফেশনাল</SelectItem>
                  <SelectItem value="enterprise">এন্টারপ্রাইজ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>ব্যবহারকারীর তালিকা</CardTitle>
            <CardDescription>মোট {users.length} জন ব্যবহারকারী</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{user.full_name || 'নাম নেই'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPlanColor(user.subscription_plan)}>
                          {user.subscription_plan}
                        </Badge>
                        <Badge className={getStatusColor(user.account_status)}>
                          {user.account_status}
                        </Badge>
                        {user.trial_expires_at && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            ট্রায়াল: {new Date(user.trial_expires_at).toLocaleDateString('bn-BD')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        বিস্তারিত
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleLoginAsUser(user.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            ব্যবহারকারী হিসেবে লগইন
                          </DropdownMenuItem>
                          
                          {user.account_status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(user.id, 'suspended')}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              স্থগিত করুন
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(user.id, 'active')}
                              className="text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              সক্রিয় করুন
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handlePlanUpdate(user.id, 'enterprise')}>
                            <Crown className="h-4 w-4 mr-2" />
                            এন্টারপ্রাইজ প্ল্যান দিন
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>কোন ব্যবহারকারী পাওয়া যায়নি</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ব্যবহারকারীর বিস্তারিত তথ্য</DialogTitle>
              <DialogDescription>
                {selectedUser?.email} এর সম্পূর্ণ প্রোফাইল
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">নাম</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.full_name || 'নাম দেওয়া হয়নি'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ইমেইল</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">বর্তমান প্ল্যান</label>
                    <div className="mt-1">
                      <Badge className={getPlanColor(selectedUser.subscription_plan)}>
                        {selectedUser.subscription_plan}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">অ্যাকাউন্ট স্ট্যাটাস</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedUser.account_status)}>
                        {selectedUser.account_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">নিবন্ধনের তারিখ</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  {selectedUser.trial_expires_at && (
                    <div>
                      <label className="text-sm font-medium">ট্রায়াল শেষের তারিখ</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedUser.trial_expires_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleLoginAsUser(selectedUser.id)}>
                    ব্যবহারকারী হিসেবে লগইন
                  </Button>
                  <Select onValueChange={(value) => handlePlanUpdate(selectedUser.id, value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="প্ল্যান পরিবর্তন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">ফ্রি</SelectItem>
                      <SelectItem value="starter">স্টার্টার</SelectItem>
                      <SelectItem value="professional">প্রফেশনাল</SelectItem>
                      <SelectItem value="enterprise">এন্টারপ্রাইজ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  Eye,
  Calendar,
  Plus,
  Users,
  Clock,
  Lock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const UserManagement = () => {
  const { users, loading, fetchUsers, updateUserPlan, updateUserStatus, extendTrial, loginAsUser, usersTotalCount, createCustomSubscription, userStats, fetchUserStats } = useAdminData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [planLimits, setPlanLimits] = useState<any[]>([]);

  // Upgrade form state
  const [upgradeForm, setUpgradeForm] = useState({
    plan: '',
    duration: '1',
    durationType: 'month',
    paymentMethod: 'manual',
    paymentReference: '',
    notes: ''
  });

  useEffect(() => {
    fetchUsers(searchTerm, planFilter, statusFilter, dateFilter, currentPage, itemsPerPage);
    fetchUserStats();
  }, [searchTerm, planFilter, statusFilter, dateFilter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planFilter, statusFilter, dateFilter]);

  // Fetch plan limits from database
  useEffect(() => {
    const fetchPlanLimits = async () => {
      try {
        const { data, error } = await supabase
          .from('plan_limits')
          .select('plan_name, price_bdt')
          .order('price_bdt', { ascending: true });

        if (error) throw error;
        setPlanLimits(data || []);
      } catch (err) {
        console.error('Error loading plan limits:', err);
        toast({
          title: 'Warning',
          description: 'Failed to load plan prices. Using default values.',
          variant: 'destructive',
        });
      }
    };
    fetchPlanLimits();
  }, []);

  const handlePlanUpdate = async (userId: string, newPlan: string) => {
    const success = await updateUserPlan(userId, newPlan);
    if (success) {
      toast({
        title: 'Plan Updated Successfully',
        description: 'User plan has been updated successfully.',
      });
    } else {
      toast({
        title: 'Plan Update Failed',
        description: 'There was an error updating the plan.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    const success = await updateUserStatus(userId, newStatus);
    if (success) {
      toast({
        title: 'Status Updated Successfully',
        description: 'User status has been updated successfully.',
      });
    } else {
      toast({
        title: 'Status Update Failed',
        description: 'There was an error updating the status.',
        variant: 'destructive',
      });
    }
  };

  const handleLoginAsUser = async (userId: string) => {
    const success = await loginAsUser(userId);
    if (success) {
      toast({
        title: 'Logged in as User',
        description: 'Successfully logged in as user for support purposes.',
      });
      // Redirect would happen in the hook
    } else {
      toast({
        title: 'Login Failed',
        description: 'There was an error logging in as user.',
        variant: 'destructive',
      });
    }
  };

  const handleExtendTrial = async (userId: string) => {
    const success = await extendTrial(userId);
    if (success) {
      toast({
        title: 'Trial Extended Successfully',
        description: 'User trial has been extended by 7 days.',
      });
    } else {
      toast({
        title: 'Trial Extension Failed',
        description: 'There was an error extending the trial.',
        variant: 'destructive',
      });
    }
  };

  const handleCustomUpgrade = async () => {
    if (!selectedUser || !upgradeForm.plan) {
      toast({
        title: 'Missing Information',
        description: 'Please select a plan for the upgrade.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate duration in days
    let durationInDays = parseInt(upgradeForm.duration);
    if (upgradeForm.durationType === 'month') {
      durationInDays *= 30;
    } else if (upgradeForm.durationType === 'year') {
      durationInDays *= 365;
    }

    // Calculate price based on plan and duration from database
    const planPrices = planLimits.reduce((acc, plan) => {
      acc[plan.plan_name] = plan.price_bdt;
      return acc;
    }, {} as Record<string, number>);
    
    let totalPrice = planPrices[upgradeForm.plan] || 0;
    if (upgradeForm.durationType === 'year') {
      totalPrice *= 10; // 10 months worth for yearly
    } else if (upgradeForm.durationType === 'month') {
      totalPrice *= parseInt(upgradeForm.duration);
    }

    const success = await createCustomSubscription({
      user_id: selectedUser.id,
      plan_name: upgradeForm.plan,
      plan_price_bdt: totalPrice,
      payment_method: upgradeForm.paymentMethod,
      payment_reference: upgradeForm.paymentReference,
      notes: upgradeForm.notes || `Manual upgrade by admin for ${upgradeForm.duration} ${upgradeForm.durationType}(s)`,
      duration_days: durationInDays
    });

    if (success) {
      toast({
        title: 'User Upgraded Successfully',
        description: `${selectedUser.full_name || selectedUser.email} has been upgraded to ${upgradeForm.plan} for ${upgradeForm.duration} ${upgradeForm.durationType}(s).`,
      });
      setShowUpgradeModal(false);
      setUpgradeForm({
        plan: '',
        duration: '1',
        durationType: 'month',
        paymentMethod: 'manual',
        paymentReference: '',
        notes: ''
      });
      fetchUsers(searchTerm, planFilter, statusFilter, dateFilter, currentPage, itemsPerPage);
      fetchUserStats();
    } else {
      toast({
        title: 'Upgrade Failed',
        description: 'There was an error upgrading the user.',
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
      case 'read_only': return 'bg-orange-100 text-orange-800';
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
    <AdminLayout title="User Management" description="Manage all users and their accounts">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.trial || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Ended</CardTitle>
              <Lock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.trialEnded || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Starter</CardTitle>
              <Crown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.premiumStarter || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Professional</CardTitle>
              <Crown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.premiumProfessional || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Enterprise</CardTitle>
              <Crown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.premiumEnterprise || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
              <Crown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(userStats?.premiumStarter || 0) + (userStats?.premiumProfessional || 0) + (userStats?.premiumEnterprise || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="trial">Free Trial</SelectItem>
                  <SelectItem value="trial_ended">Trial Ended (Read-Only)</SelectItem>
                  <SelectItem value="premium_starter">Premium - Starter</SelectItem>
                  <SelectItem value="premium_professional">Premium - Professional</SelectItem>
                  <SelectItem value="premium_enterprise">Premium - Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Signup Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users List</CardTitle>
            <CardDescription>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, usersTotalCount)} of {usersTotalCount} users
            </CardDescription>
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
                          <div className="font-medium">{user.full_name || 'No Name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">{user.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPlanColor(user.subscription_plan)}>
                          {user.subscription_plan}
                        </Badge>
                        <Badge className={getStatusColor(user.account_status)}>
                          {user.account_status}
                        </Badge>
                        {user.account_status === 'trial' && user.trial_expires_at && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Trial: {new Date(user.trial_expires_at).toLocaleDateString()}
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
                        Details
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
                            Login as User
                          </DropdownMenuItem>
                          
                          {user.account_status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(user.id, 'suspended')}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(user.id, 'active')}
                              className="text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handleExtendTrial(user.id)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Extend Trial (7 days)
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
                <p>No users found</p>
              </div>
            )}

            {/* Pagination */}
            {usersTotalCount > itemsPerPage && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(usersTotalCount / itemsPerPage)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= Math.ceil(usersTotalCount / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete profile for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.full_name || 'No name provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Current Plan</label>
                    <div className="mt-1">
                      <Badge className={getPlanColor(selectedUser.subscription_plan)}>
                        {selectedUser.subscription_plan}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedUser.account_status)}>
                        {selectedUser.account_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Registration Date</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUser.account_status === 'trial' && selectedUser.trial_expires_at && (
                    <div>
                      <label className="text-sm font-medium">Trial Expiry Date</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedUser.trial_expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => handleLoginAsUser(selectedUser.id)}>
                    Login as User
                  </Button>
                  <Button 
                    onClick={() => handleExtendTrial(selectedUser.id)}
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Extend Trial
                  </Button>
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    variant="default"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Manual Upgrade
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Upgrade Modal */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manual User Upgrade</DialogTitle>
              <DialogDescription>
                Manually upgrade {selectedUser?.full_name || selectedUser?.email} to a paid plan
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select value={upgradeForm.plan} onValueChange={(value) => setUpgradeForm(prev => ({ ...prev, plan: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planLimits
                      .filter(plan => plan.plan_name !== 'free')
                      .map(plan => (
                        <SelectItem key={plan.plan_name} value={plan.plan_name}>
                          {plan.plan_name.charAt(0).toUpperCase() + plan.plan_name.slice(1)} (৳{plan.price_bdt.toLocaleString()}/month)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="36"
                    value={upgradeForm.duration}
                    onChange={(e) => setUpgradeForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="durationType">Period</Label>
                  <Select value={upgradeForm.durationType} onValueChange={(value) => setUpgradeForm(prev => ({ ...prev, durationType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Days</SelectItem>
                      <SelectItem value="month">Months</SelectItem>
                      <SelectItem value="year">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={upgradeForm.paymentMethod} onValueChange={(value) => setUpgradeForm(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual/Admin</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="complimentary">Complimentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
                <Input
                  id="paymentReference"
                  value={upgradeForm.paymentReference}
                  onChange={(e) => setUpgradeForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="Transaction ID or reference"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={upgradeForm.notes}
                  onChange={(e) => setUpgradeForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                />
              </div>

              {upgradeForm.plan && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Upgrade Summary:</div>
                  <div className="text-sm text-muted-foreground">
                    Plan: {upgradeForm.plan} for {upgradeForm.duration} {upgradeForm.durationType}(s)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: ৳{(() => {
                      const planPrices = planLimits.reduce((acc, plan) => {
                        acc[plan.plan_name] = plan.price_bdt;
                        return acc;
                      }, {} as Record<string, number>);
                      let totalPrice = planPrices[upgradeForm.plan] || 0;
                      if (upgradeForm.durationType === 'year') {
                        totalPrice *= 10; // 10 months worth for yearly
                      } else if (upgradeForm.durationType === 'month') {
                        totalPrice *= parseInt(upgradeForm.duration);
                      }
                      return totalPrice.toLocaleString();
                    })()}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCustomUpgrade} disabled={!upgradeForm.plan} className="flex-1">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade User
                </Button>
                <Button onClick={() => setShowUpgradeModal(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
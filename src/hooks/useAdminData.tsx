import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  subscription_plan: string;
  account_status: string;
  trial_expires_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  totalWebsites: number;
  activeWebsites: number;
  totalFunnels: number;
  activeFunnels: number;
  totalOrders: number;
  totalGMV: number;
  monthlyGMV: number;
  averageOrderValue: number;
  estimatedMRR: number;
}

interface UserStats {
  total: number;
  trial: number;
  trialEnded: number;
  premiumStarter: number;
  premiumProfessional: number;
  premiumEnterprise: number;
}

interface SaasSubscriber {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price_bdt: number;
  payment_method: string;
  subscription_status: string;
  starts_at: string;
  expires_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export const useAdminData = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotalCount, setUsersTotalCount] = useState(0);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [saasSubscribers, setSaasSubscribers] = useState<SaasSubscriber[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is super admin
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Only check admin status if user is trying to access admin routes
    if (!location.pathname.startsWith('/admin')) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      
      if (error) throw error;
      
      setIsAdmin(data);
      
      if (!data) {
        // Redirect non-admin users only if they're trying to access admin routes
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      if (location.pathname.startsWith('/admin')) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics (counts for cards)
  const fetchUserStats = async () => {
    if (!isAdmin) return;

    try {
      const now = new Date().toISOString();

      // Total users
      const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Trial users (active trial - account_status = 'trial' AND trial_expires_at >= now)
      const { count: trial } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'trial')
        .gte('trial_expires_at', now);

      // Trial ended/read-only users
      // Fetch read_only users
      const { count: readOnlyCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'read_only');

      // Fetch expired trial users (trial status but expired)
      const { count: expiredTrialCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'trial')
        .lt('trial_expires_at', now);

      const trialEnded = (readOnlyCount || 0) + (expiredTrialCount || 0);

      // Premium users by package (account_status = 'active' AND subscription_plan = 'starter'/'professional'/'enterprise')
      const { count: premiumStarter } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active')
        .eq('subscription_plan', 'starter');

      const { count: premiumProfessional } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active')
        .eq('subscription_plan', 'professional');

      const { count: premiumEnterprise } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active')
        .eq('subscription_plan', 'enterprise');

      setUserStats({
        total: total || 0,
        trial: trial || 0,
        trialEnded: trialEnded || 0,
        premiumStarter: premiumStarter || 0,
        premiumProfessional: premiumProfessional || 0,
        premiumEnterprise: premiumEnterprise || 0,
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  // Fetch all users for admin management
  const fetchUsers = async (
    searchTerm?: string, 
    planFilter?: string, 
    statusFilter?: string,
    dateFilter?: string,
    page: number = 1, 
    limit: number = 20
  ) => {
    if (!isAdmin) return;

    try {
      let countQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          subscription_plan,
          account_status,
          trial_expires_at,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        const searchFilter = `email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      if (planFilter && planFilter !== 'all') {
        countQuery = countQuery.eq('subscription_plan', planFilter as any);
        dataQuery = dataQuery.eq('subscription_plan', planFilter as any);
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        const now = new Date().toISOString();
        
        if (statusFilter === 'trial') {
          // Active trial users
          countQuery = countQuery.eq('account_status', 'trial').gte('trial_expires_at', now);
          dataQuery = dataQuery.eq('account_status', 'trial').gte('trial_expires_at', now);
        } else if (statusFilter === 'trial_ended') {
          // Trial ended/read-only users: read_only OR (trial AND expired)
          // Use .or() with separate queries - Supabase doesn't support nested AND in OR
          // We'll fetch read_only users and expired trial users separately, then combine
          // For now, fetch read_only users (most common case)
          countQuery = countQuery.eq('account_status', 'read_only');
          dataQuery = dataQuery.eq('account_status', 'read_only');
          // Note: Expired trial users will be included in a separate query if needed
          // For simplicity, we show read_only users here
        } else if (statusFilter === 'premium_starter') {
          countQuery = countQuery.eq('account_status', 'active').eq('subscription_plan', 'starter');
          dataQuery = dataQuery.eq('account_status', 'active').eq('subscription_plan', 'starter');
        } else if (statusFilter === 'premium_professional') {
          countQuery = countQuery.eq('account_status', 'active').eq('subscription_plan', 'professional');
          dataQuery = dataQuery.eq('account_status', 'active').eq('subscription_plan', 'professional');
        } else if (statusFilter === 'premium_enterprise') {
          countQuery = countQuery.eq('account_status', 'active').eq('subscription_plan', 'enterprise');
          dataQuery = dataQuery.eq('account_status', 'active').eq('subscription_plan', 'enterprise');
        }
      }

      // Date filter
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'last_7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last_30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        if (startDate) {
          countQuery = countQuery.gte('created_at', startDate.toISOString());
          dataQuery = dataQuery.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          countQuery = countQuery.lt('created_at', endDate.toISOString());
          dataQuery = dataQuery.lt('created_at', endDate.toISOString());
        }
      }

      // Get total count
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Get paginated data
      const { data, error } = await dataQuery
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) throw error;

      // Get last sign in data from auth.users (if accessible)
      const usersWithActivity = data?.map(user => ({
        ...user,
        last_sign_in_at: null, // Would need auth.users access
      })) || [];

      setUsers(usersWithActivity);
      setUsersTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  // Fetch platform statistics
  const fetchPlatformStats = async () => {
    if (!isAdmin) return;

    try {
      // Get user counts by plan
      const { data: userStats } = await supabase
        .from('profiles')
        .select('subscription_plan, account_status')
        .not('subscription_plan', 'is', null);

      // Get website and funnel counts
      const { count: totalWebsites } = await supabase
        .from('websites')
        .select('*', { count: 'exact' });

      const { count: activeWebsites } = await supabase
        .from('websites')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Get funnel counts from funnel_steps (derive distinct funnel_id)
      const { data: funnelSteps } = await supabase
        .from('funnel_steps')
        .select('funnel_id, is_published');

      const totalFunnels = new Set(funnelSteps?.map(step => step.funnel_id)).size || 0;
      const activeFunnels = new Set(
        funnelSteps?.filter(step => step.is_published).map(step => step.funnel_id)
      ).size || 0;

      // Get order stats
      const { data: orderData } = await supabase
        .from('orders')
        .select('total, created_at, status');

      // Calculate stats
      const totalUsers = userStats?.length || 0;
      const activeUsers = userStats?.filter(u => u.account_status === 'active').length || 0;
      const trialUsers = userStats?.filter(u => u.account_status === 'trial').length || 0;
      const paidUsers = userStats?.filter(u => 
        u.account_status === 'active'
      ).length || 0;

      // Merchant GMV (Gross Merchandise Value) from orders
      const merchantGmv = orderData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      
      // Monthly GMV (current month)
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthlyGmv = orderData?.filter(order => 
        new Date(order.created_at) >= monthStart
      ).reduce((sum, order) => sum + Number(order.total), 0) || 0;

      const totalOrders = orderData?.length || 0;
      
      // Calculate real SaaS MRR from active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('saas_subscriptions')
        .select('plan_price_bdt')
        .eq('subscription_status', 'active')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const realMrr = activeSubscriptions?.reduce((sum, sub) => sum + Number(sub.plan_price_bdt), 0) || 0;

      setPlatformStats({
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        trialUsers: trialUsers,
        totalWebsites: totalWebsites || 0,
        activeWebsites: activeWebsites || 0,
        totalFunnels: totalFunnels,
        activeFunnels: activeFunnels,
        totalOrders: totalOrders,
        totalGMV: merchantGmv,
        monthlyGMV: monthlyGmv,
        averageOrderValue: totalOrders > 0 ? merchantGmv / totalOrders : 0,
        estimatedMRR: realMrr,
      });
    } catch (err) {
      console.error('Error fetching platform stats:', err);
      setError('Failed to fetch platform statistics');
    }
  };

  // Update user plan
  const updateUserPlan = async (userId: string, newPlan: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_plan: newPlan as any,
          account_status: 'active',
          trial_expires_at: null,
          trial_started_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          subscription_plan: newPlan,
          account_status: 'active',
          trial_expires_at: null
        } : user
      ));

      return true;
    } catch (err) {
      console.error('Error updating user plan:', err);
      return false;
    }
  };

  // Extend user trial by 7 days
  const extendTrial = async (userId: string) => {
    if (!isAdmin) return false;

    try {
      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('trial_expires_at, account_status')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Calculate new expiry date (current expiry + 7 days, or now + 7 days if expired/null)
      const currentExpiry = userData.trial_expires_at ? new Date(userData.trial_expires_at) : new Date();
      const extendFromDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiryDate = new Date(extendFromDate.getTime() + (7 * 24 * 60 * 60 * 1000));

      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_status: 'trial',
          trial_expires_at: newExpiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          account_status: 'trial',
          trial_expires_at: newExpiryDate.toISOString()
        } : user
      ));

      return true;
    } catch (err) {
      console.error('Error extending trial:', err);
      return false;
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, account_status: newStatus } : user
      ));

      return true;
    } catch (err) {
      console.error('Error updating user status:', err);
      return false;
    }
  };

  // Login as user (for support)
  const loginAsUser = async (userId: string) => {
    if (!isAdmin) return false;

    try {
      // Call the admin impersonation edge function
      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('Impersonation error:', error);
        return false;
      }

      if (data.success && data.impersonation_url) {
        // Store admin context before impersonation
        sessionStorage.setItem('admin_impersonation', JSON.stringify({
          admin_user_id: user?.id,
          admin_email: user?.email,
          target_user_id: userId,
          target_user_email: data.target_user_email,
          impersonation_start: new Date().toISOString()
        }));

        // Redirect to the magic link to sign in as the target user
        window.location.href = data.impersonation_url;
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error logging in as user:', err);
      return false;
    }
  };

  // Create subscription manually
  const createSubscription = async (subscriptionData: {
    user_id: string;
    plan_name: string;
    plan_price_bdt: number;
    payment_method: string;
    payment_reference?: string;
    notes?: string;
  }) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('saas_subscriptions')
        .insert({
          ...subscriptionData,
          subscription_status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        });

      if (error) throw error;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: subscriptionData.plan_name as any,
          account_status: 'active',
          trial_expires_at: null,
          trial_started_at: null,
        })
        .eq('id', subscriptionData.user_id);

      if (profileError) throw profileError;

      fetchSaasSubscribers();
      return true;
    } catch (err) {
      console.error('Error creating subscription:', err);
      return false;
    }
  };

  // Update subscription
  const updateSubscription = async (subscriptionId: string, updates: {
    plan_name?: string;
    plan_price_bdt?: number;
    payment_method?: string;
    payment_reference?: string;
    subscription_status?: string;
    notes?: string;
  }) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('saas_subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (error) throw error;

      fetchSaasSubscribers();
      return true;
    } catch (err) {
      console.error('Error updating subscription:', err);
      return false;
    }
  };

  // Delete subscription
  const deleteSubscription = async (subscriptionId: string, userId: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('saas_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      // Update user profile to trial or read-only
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          account_status: 'read_only',
          subscription_plan: 'starter',
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      fetchSaasSubscribers();
      return true;
    } catch (err) {
      console.error('Error deleting subscription:', err);
      return false;
    }
  };

  // Create custom subscription with specific duration
  const createCustomSubscription = async (subscriptionData: {
    user_id: string;
    plan_name: string;
    plan_price_bdt: number;
    payment_method: string;
    payment_reference?: string;
    notes?: string;
    duration_days: number;
  }) => {
    if (!isAdmin) return false;

    try {
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + (subscriptionData.duration_days * 24 * 60 * 60 * 1000));

      const { error } = await supabase
        .from('saas_subscriptions')
        .insert({
          user_id: subscriptionData.user_id,
          plan_name: subscriptionData.plan_name,
          plan_price_bdt: subscriptionData.plan_price_bdt,
          payment_method: subscriptionData.payment_method,
          payment_reference: subscriptionData.payment_reference || `Manual-${Date.now()}`,
          notes: subscriptionData.notes,
          subscription_status: 'active',
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: subscriptionData.plan_name as any,
          account_status: 'active',
          trial_expires_at: null,
          trial_started_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionData.user_id);

      if (profileError) throw profileError;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === subscriptionData.user_id ? { 
          ...user, 
          subscription_plan: subscriptionData.plan_name,
          account_status: 'active',
          trial_expires_at: null
        } : user
      ));

      fetchSaasSubscribers();
      return true;
    } catch (err) {
      console.error('Error creating custom subscription:', err);
      return false;
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const fetchSaasSubscribers = async () => {
    try {
      const { data: subscriptions, error } = await supabase
        .from('saas_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user details separately to avoid foreign key issues
      const userIds = subscriptions?.map(sub => sub.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(profile => [profile.id, profile]) || []);

      const formattedSubscriptions = subscriptions?.map(sub => ({
        ...sub,
        user_email: profileMap.get(sub.user_id)?.email || 'N/A',
        user_name: profileMap.get(sub.user_id)?.full_name || 'N/A'
      })) || [];

      setSaasSubscribers(formattedSubscriptions);
    } catch (error) {
      console.error('Error fetching SaaS subscribers:', error);
      setError('Failed to fetch SaaS subscribers');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPlatformStats();
      fetchUserStats();
      fetchSaasSubscribers();
    }
  }, [isAdmin]);

  return {
    isAdmin,
    loading,
    users,
    usersTotalCount,
    platformStats,
    userStats,
    saasSubscribers,
    error,
    fetchUsers,
    fetchPlatformStats,
    fetchUserStats,
    fetchSaasSubscribers,
    updateUserPlan,
    updateUserStatus,
    extendTrial,
    loginAsUser,
    createSubscription,
    createCustomSubscription,
    updateSubscription,
    deleteSubscription,
    refetch: () => {
      fetchUsers();
      fetchPlatformStats();
      fetchUserStats();
      fetchSaasSubscribers();
    }
  };
};
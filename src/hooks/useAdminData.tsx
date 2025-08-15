import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [saasSubscribers, setSaasSubscribers] = useState<SaasSubscriber[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is super admin
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      
      if (error) throw error;
      
      setIsAdmin(data);
      
      if (!data) {
        // Redirect non-admin users
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users for admin management
  const fetchUsers = async (searchTerm?: string, planFilter?: string) => {
    if (!isAdmin) return;

    try {
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
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      if (planFilter && planFilter !== 'all') {
        query = query.eq('subscription_plan', planFilter as any);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;

      // Get last sign in data from auth.users (if accessible)
      const usersWithActivity = data?.map(user => ({
        ...user,
        last_sign_in_at: null, // Would need auth.users access
      })) || [];

      setUsers(usersWithActivity);
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
        u.subscription_plan !== 'free' && u.account_status === 'active'
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
      
      // Calculate estimated SaaS MRR (Monthly Recurring Revenue)
      // For now, use a simple estimation based on paid users
      const subscriptionMrr = paidUsers * 50; // Assuming average $50/month per paid user

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
        estimatedMRR: subscriptionMrr,
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
        .update({ subscription_plan: newPlan as any })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, subscription_plan: newPlan } : user
      ));

      return true;
    } catch (err) {
      console.error('Error updating user plan:', err);
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
      // This would typically require a special admin endpoint
      // For now, we'll just redirect to their dashboard
      // In a real implementation, you'd generate a temporary auth token
      
      console.log('Login as user:', userId);
      // Implementation would depend on your auth strategy
      
      return true;
    } catch (err) {
      console.error('Error logging in as user:', err);
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
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSubscriptions = subscriptions?.map(sub => ({
        ...sub,
        user_email: sub.profiles?.email,
        user_name: sub.profiles?.full_name
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
      fetchSaasSubscribers();
    }
  }, [isAdmin]);

  return {
    isAdmin,
    loading,
    users,
    platformStats,
    saasSubscribers,
    error,
    fetchUsers,
    fetchPlatformStats,
    fetchSaasSubscribers,
    updateUserPlan,
    updateUserStatus,
    loginAsUser,
    refetch: () => {
      fetchUsers();
      fetchPlatformStats();
      fetchSaasSubscribers();
    }
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PlanLimits {
  plan_name: string;
  price_bdt: number;
  trial_days: number;
  max_stores: number | null;
  max_websites: number | null;
  max_funnels: number | null;
  max_pages_per_store: number | null;
  max_products_per_store: number | null;
  max_orders_per_month: number | null;
  custom_domain_allowed: boolean;
  priority_support: boolean;
  white_label: boolean;
}

export interface UserUsage {
  current_stores: number;
  current_websites: number;
  current_funnels: number;
  current_orders_this_month: number;
}

export interface UserProfile {
  subscription_plan: string;
  account_status: string;
  trial_started_at?: string;
  trial_expires_at?: string;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user profile with plan info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, account_status, trial_started_at, trial_expires_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setUserProfile(profile);

      // Get plan limits for user's current plan
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', profile.subscription_plan)
        .single();

      if (limitsError) throw limitsError;

      setPlanLimits(limits);

      // Get user's current usage
      const { data: usage, error: usageError } = await supabase
        .from('user_usage')
        .select('current_stores, current_websites, current_funnels, current_orders_this_month')
        .eq('user_id', user.id)
        .single();

      if (usageError) throw usageError;

      setUserUsage(usage);

    } catch (err) {
      console.error('Error fetching plan data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const canCreateResource = async (resourceType: 'store' | 'website' | 'funnel'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('can_create_resource', {
        _user_id: user.id,
        _resource_type: resourceType
      });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error checking resource limits:', err);
      return false;
    }
  };

  const isTrialExpired = (): boolean => {
    if (userProfile?.account_status === 'trial' && userProfile?.trial_expires_at) {
      return new Date(userProfile.trial_expires_at) < new Date();
    }
    return false;
  };

  const getTrialDaysRemaining = (): number => {
    if (userProfile?.account_status === 'trial' && userProfile?.trial_expires_at) {
      const expiryDate = new Date(userProfile.trial_expires_at);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  const getUsagePercentage = (resourceType: keyof UserUsage): number => {
    if (!userUsage || !planLimits) return 0;
    
    const usage = userUsage[resourceType];
    let limit: number | null = null;

    switch (resourceType) {
      case 'current_stores':
        limit = planLimits.max_stores;
        break;
      case 'current_websites':
        limit = planLimits.max_websites;
        break;
      case 'current_funnels':
        limit = planLimits.max_funnels;
        break;
      case 'current_orders_this_month':
        limit = planLimits.max_orders_per_month;
        break;
    }

    if (limit === null) return 0; // Unlimited
    if (limit === 0) return 100; // No allowance

    return Math.min(100, (usage / limit) * 100);
  };

  const isAtLimit = (resourceType: keyof UserUsage): boolean => {
    if (!userUsage || !planLimits) return false;
    
    const usage = userUsage[resourceType];
    let limit: number | null = null;

    switch (resourceType) {
      case 'current_stores':
        limit = planLimits.max_stores;
        break;
      case 'current_websites':
        limit = planLimits.max_websites;
        break;
      case 'current_funnels':
        limit = planLimits.max_funnels;
        break;
      case 'current_orders_this_month':
        limit = planLimits.max_orders_per_month;
        break;
    }

    if (limit === null) return false; // Unlimited
    return usage >= limit;
  };

  useEffect(() => {
    fetchPlanData();
  }, [user]);

  // Set up real-time subscription for usage updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Usage update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setUserUsage({
              current_stores: payload.new.current_stores,
              current_websites: payload.new.current_websites,
              current_funnels: payload.new.current_funnels,
              current_orders_this_month: payload.new.current_orders_this_month,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    planLimits,
    userUsage,
    userProfile,
    loading,
    error,
    canCreateResource,
    isTrialExpired,
    getTrialDaysRemaining,
    getUsagePercentage,
    isAtLimit,
    refetch: fetchPlanData,
  };
};
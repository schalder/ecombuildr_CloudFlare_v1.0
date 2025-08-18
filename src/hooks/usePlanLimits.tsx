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
  subscription_expires_at?: string;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const MAX_RETRIES = 3;
  const DEBOUNCE_TIME = 5000; // 5 seconds

  const fetchPlanData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent concurrent requests and debounce
    const now = Date.now();
    if (loading || (now - lastFetchTime < DEBOUNCE_TIME)) {
      return;
    }

    // Stop retrying after max retries
    if (retryCount >= MAX_RETRIES) {
      setError('Maximum retries exceeded. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLastFetchTime(now);
      setError(null);
      
      // Get user profile with plan info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, account_status, trial_started_at, trial_expires_at, subscription_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('User profile not found');

      setUserProfile(profile);

      // Get plan limits for user's current plan
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', profile.subscription_plan)
        .maybeSingle();

      if (limitsError) throw limitsError;
      if (!limits) throw new Error(`Plan limits not found for plan: ${profile.subscription_plan}`);

      setPlanLimits(limits);

      // Get user's current usage
      const { data: usage, error: usageError } = await supabase
        .from('user_usage')
        .select('current_stores, current_websites, current_funnels, current_orders_this_month')
        .eq('user_id', user.id)
        .maybeSingle();

      if (usageError) throw usageError;
      if (!usage) {
        // Initialize usage record if it doesn't exist
        const { data: newUsage, error: createError } = await supabase
          .from('user_usage')
          .insert({ user_id: user.id })
          .select('current_stores, current_websites, current_funnels, current_orders_this_month')
          .single();
        
        if (createError) throw createError;
        setUserUsage(newUsage || { 
          current_stores: 0, 
          current_websites: 0, 
          current_funnels: 0, 
          current_orders_this_month: 0 
        });
      } else {
        setUserUsage(usage);
      }

      // Reset retry count on success
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching plan data:', err);
      
      // Don't set error state if it's a network issue and we can retry
      if (errorMessage.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Retry after a delay
        setTimeout(() => {
          fetchPlanData();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError(errorMessage);
      }
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

  const getGraceDaysRemaining = (): number => {
    if (!userProfile) return 0;
    
    // For trial users who have expired
    if (userProfile.account_status === 'trial' && userProfile.trial_expires_at) {
      const trialExpiry = new Date(userProfile.trial_expires_at);
      const graceEnd = new Date(trialExpiry.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days after trial expiry
      const now = new Date();
      
      if (now > trialExpiry && now < graceEnd) {
        const diffTime = graceEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      }
    }
    
    // For active users whose subscription has expired
    if (userProfile.account_status === 'active' && userProfile.subscription_expires_at) {
      const subscriptionExpiry = new Date(userProfile.subscription_expires_at);
      const graceEnd = new Date(subscriptionExpiry.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days after subscription expiry
      const now = new Date();
      
      if (now > subscriptionExpiry && now < graceEnd) {
        const diffTime = graceEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      }
    }
    
    return 0;
  };

  const isInGracePeriod = (): boolean => {
    return getGraceDaysRemaining() > 0;
  };

  const isAccountReadOnly = (): boolean => {
    if (userProfile?.account_status === 'suspended' || userProfile?.account_status === 'read_only') {
      return true;
    }
    
    // Trial expired and grace period over
    if (userProfile?.account_status === 'trial' && userProfile?.trial_expires_at) {
      const trialExpiry = new Date(userProfile.trial_expires_at);
      const graceEnd = new Date(trialExpiry.getTime() + (3 * 24 * 60 * 60 * 1000));
      const now = new Date();
      
      if (now > graceEnd) {
        return true;
      }
    }
    
    // Active subscription expired and grace period over
    if (userProfile?.account_status === 'active' && userProfile?.subscription_expires_at) {
      const subscriptionExpiry = new Date(userProfile.subscription_expires_at);
      const graceEnd = new Date(subscriptionExpiry.getTime() + (3 * 24 * 60 * 60 * 1000));
      const now = new Date();
      
      if (now > graceEnd) {
        return true;
      }
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
    if (user) {
      fetchPlanData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    getGraceDaysRemaining,
    isInGracePeriod,
    isAccountReadOnly,
    getUsagePercentage,
    isAtLimit,
    refetch: fetchPlanData,
  };
};
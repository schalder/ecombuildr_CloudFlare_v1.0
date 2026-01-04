import { useQuery } from '@tanstack/react-query';
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

  const {
    data: planData,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['planData', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user found');

      // Check for active subscription first
      const { data: activeSubscription, error: subscriptionError } = await supabase
        .from('saas_subscriptions')
        .select('plan_name, subscription_status, expires_at')
        .eq('user_id', user.id)
        .eq('subscription_status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      // Get user profile with plan info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, account_status, trial_started_at, trial_expires_at, subscription_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      let userProfile: UserProfile;
      if (profileError && profileError.code === 'PGRST116') {
        // If profile doesn't exist, create a default one
        const selectedPlan = user.user_metadata?.selected_plan || 'starter';
        
        // Get trial days for the selected plan
        const { data: planData } = await supabase
          .from('plan_limits')
          .select('trial_days')
          .eq('plan_name', selectedPlan)
          .single();
        
        const trialDays = planData?.trial_days || 7;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            subscription_plan: selectedPlan,
            account_status: 'trial',
            trial_started_at: new Date().toISOString(),
            trial_expires_at: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
          })
          .select('subscription_plan, account_status, trial_started_at, trial_expires_at, subscription_expires_at')
          .single();
        
        if (createError) throw createError;
        userProfile = newProfile;
      } else if (profileError) {
        throw profileError;
      } else if (!profile) {
        throw new Error('User profile not found');
      } else {
        userProfile = profile;
      }

      // Override profile with active subscription data if available
      if (activeSubscription) {
        userProfile = {
          ...userProfile,
          subscription_plan: activeSubscription.plan_name,
          account_status: 'active',
          subscription_expires_at: activeSubscription.expires_at
        };
      }

      // Get plan limits for user's current plan  
      const planName = userProfile?.subscription_plan || 'starter';
      const validPlanName = ['starter', 'professional', 'enterprise', 'free', 'pro_monthly', 'pro_yearly', 'reseller'].includes(planName) 
        ? planName as any 
        : 'starter' as any;
      
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', validPlanName)
        .maybeSingle();

      if (limitsError) throw limitsError;
      
      const planLimits: PlanLimits = limits || {
        plan_name: validPlanName,
        price_bdt: 500,
        trial_days: 7,
        max_stores: 1,
        max_websites: 1,
        max_funnels: 1,
        max_pages_per_store: 20,
        max_products_per_store: 50,
        max_orders_per_month: 100,
        custom_domain_allowed: true,
        priority_support: true,
        white_label: false,
      };

      // Get user's current usage
      const { data: usage, error: usageError } = await supabase
        .from('user_usage')
        .select('current_stores, current_websites, current_funnels, current_orders_this_month')
        .eq('user_id', user.id)
        .maybeSingle();

      if (usageError) throw usageError;
      
      let userUsage: UserUsage;
      if (!usage) {
        // Initialize usage record if it doesn't exist
        const { data: newUsage, error: createError } = await supabase
          .from('user_usage')
          .insert({ user_id: user.id })
          .select('current_stores, current_websites, current_funnels, current_orders_this_month')
          .single();
        
        if (createError) throw createError;
        userUsage = newUsage || { 
          current_stores: 0, 
          current_websites: 0, 
          current_funnels: 0, 
          current_orders_this_month: 0 
        };
      } else {
        userUsage = usage;
      }

      return { planLimits, userUsage, userProfile };
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5 minutes for faster trial extension updates)
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when user focuses window to get updated trial data
    refetchOnReconnect: true,
  });

  // Extract data from the query result
  const planLimits = planData?.planLimits || null;
  const userUsage = planData?.userUsage || null;
  const userProfile = planData?.userProfile || null;
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

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


  // Disable realtime subscription temporarily to fix WebSocket issues
  // useEffect(() => {
  //   if (!user || !userUsage) return;

  //   let channel: any = null;
    
  //   try {
  //     channel = supabase
  //       .channel(`user-usage-${user.id}`)
  //       .on(
  //         'postgres_changes',
  //         {
  //           event: '*',
  //           schema: 'public',
  //           table: 'user_usage',
  //           filter: `user_id=eq.${user.id}`
  //         },
  //         (payload) => {
  //           console.log('Usage update:', payload);
  //           if (payload.eventType === 'UPDATE' && payload.new) {
  //             setUserUsage({
  //               current_stores: payload.new.current_stores,
  //               current_websites: payload.new.current_websites,
  //               current_funnels: payload.new.current_funnels,
  //               current_orders_this_month: payload.new.current_orders_this_month,
  //             });
  //           }
  //         }
  //       )
  //       .subscribe();
  //   } catch (error) {
  //     console.warn('Failed to set up usage realtime subscription:', error);
  //   }

  //   return () => {
  //     if (channel) {
  //       try {
  //         supabase.removeChannel(channel);
  //       } catch (error) {
  //         console.warn('Failed to cleanup usage realtime subscription:', error);
  //       }
  //     }
  //   };
  // }, [user, userUsage?.current_stores]);

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
    refetch,
  };
};
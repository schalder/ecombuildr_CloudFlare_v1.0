import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlanLimits {
  id: string;
  plan_name: 'starter' | 'professional' | 'enterprise';
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
  created_at: string;
  updated_at: string;
}

interface UserUsage {
  user_id: string;
  current_stores: number;
  current_websites: number;
  current_funnels: number;
  current_products: number;
  current_pages: number;
  created_at?: string;
  updated_at?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'store_owner' | 'admin' | 'super_admin';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_expires_at: string | null;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  created_at: string;
  updated_at: string;
  account_status: string;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['planLimits', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      let userProfile = profileData;

      // If no profile exists, create one
      if (!userProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            subscription_plan: 'starter',
            account_status: 'trial',
            trial_started_at: new Date().toISOString(),
            trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        userProfile = newProfile;
      }

      // Fetch plan limits
      const { data: planData, error: planError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', userProfile.subscription_plan)
        .single();

      if (planError) {
        console.error('Error fetching plan limits:', planError);
        throw planError;
      }

      // Fetch user usage with new columns
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select(`
          user_id,
          current_stores,
          current_websites,
          current_funnels,
          current_products,
          current_pages,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .single();

      let userUsage = usageData;

      if (usageError && usageError.code === 'PGRST116') {
        // No usage record exists, create one
        const { data: newUsage, error: insertError } = await supabase
          .from('user_usage')
          .insert({
            user_id: user.id,
            current_stores: 0,
            current_websites: 0,
            current_funnels: 0,
            current_products: 0,
            current_pages: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user usage:', insertError);
          throw insertError;
        }

        userUsage = newUsage;
      } else if (usageError) {
        console.error('Error fetching user usage:', usageError);
        throw usageError;
      }

      return {
        planLimits: planData,
        userUsage,
        userProfile,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const canCreateResource = async (resourceType: 'store' | 'website' | 'funnel'): Promise<boolean> => {
    if (!user || !data?.userUsage || !data?.planLimits) return false;

    const { userUsage, planLimits } = data;
    const current = resourceType === 'store' ? userUsage.current_stores :
                   resourceType === 'website' ? userUsage.current_websites :
                   userUsage.current_funnels;

    const limit = resourceType === 'store' ? planLimits.max_stores :
                  resourceType === 'website' ? planLimits.max_websites :
                  planLimits.max_funnels;

    if (limit === null) return true; // Unlimited
    return current < limit;
  };

  const isTrialExpired = (): boolean => {
    if (!data?.userProfile?.trial_expires_at) return false;
    return new Date(data.userProfile.trial_expires_at) < new Date();
  };

  const getTrialDaysRemaining = (): number => {
    if (!data?.userProfile?.trial_expires_at) return 0;
    const expiryDate = new Date(data.userProfile.trial_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getGraceDaysRemaining = (): number => {
    if (!data?.userProfile) return 0;
    
    const { subscription_expires_at, trial_expires_at, account_status } = data.userProfile;
    
    // 7 days grace period after subscription or trial expiry
    const gracePeriodDays = 7;
    let expiryDate: Date | null = null;
    
    if (account_status === 'trial' && trial_expires_at) {
      expiryDate = new Date(trial_expires_at);
    } else if (subscription_expires_at) {
      expiryDate = new Date(subscription_expires_at);
    }
    
    if (!expiryDate) return 0;
    
    const graceEndDate = new Date(expiryDate.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffTime = graceEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const isInGracePeriod = (): boolean => {
    if (!data?.userProfile) return false;
    
    const { subscription_expires_at, trial_expires_at, account_status } = data.userProfile;
    const now = new Date();
    
    // Check if trial has expired and we're in grace period
    if (account_status === 'trial' && trial_expires_at) {
      const trialExpiry = new Date(trial_expires_at);
      const graceEnd = new Date(trialExpiry.getTime() + (7 * 24 * 60 * 60 * 1000));
      return now > trialExpiry && now <= graceEnd;
    }
    
    // Check if subscription has expired and we're in grace period
    if (subscription_expires_at) {
      const subExpiry = new Date(subscription_expires_at);
      const graceEnd = new Date(subExpiry.getTime() + (7 * 24 * 60 * 60 * 1000));
      return now > subExpiry && now <= graceEnd;
    }
    
    return false;
  };

  const isAccountReadOnly = (): boolean => {
    if (!data?.userProfile) return false;
    
    const { account_status, trial_expires_at, subscription_expires_at } = data.userProfile;
    
    if (account_status === 'read_only' || account_status === 'suspended') {
      return true;
    }
    
    // Check if grace period has ended
    if (isInGracePeriod()) {
      return false; // Still in grace period
    }
    
    const now = new Date();
    
    // Check if trial has expired and no grace period
    if (account_status === 'trial' && trial_expires_at) {
      const trialExpiry = new Date(trial_expires_at);
      const graceEnd = new Date(trialExpiry.getTime() + (7 * 24 * 60 * 60 * 1000));
      if (now > graceEnd) {
        return true;
      }
    }
    
    // Check if subscription has expired and no grace period
    if (subscription_expires_at) {
      const subExpiry = new Date(subscription_expires_at);
      const graceEnd = new Date(subExpiry.getTime() + (7 * 24 * 60 * 60 * 1000));
      if (now > graceEnd) {
        return true;
      }
    }
    
    return false;
  };

  const getUsagePercentage = (resourceType: keyof UserUsage): number => {
    if (!data?.userUsage || !data?.planLimits) return 0;
    
    const current = Number(data.userUsage[resourceType]);
    let limit: number | null = null;
    
    switch (resourceType) {
      case 'current_stores':
        limit = data.planLimits.max_stores;
        break;
      case 'current_websites':
        limit = data.planLimits.max_websites;
        break;
      case 'current_funnels':
        limit = data.planLimits.max_funnels;
        break;
      case 'current_products':
        limit = data.planLimits.max_products_per_store;
        break;
      case 'current_pages':
        limit = data.planLimits.max_pages_per_store;
        break;
    }
    
    if (!limit || limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const isAtLimit = (resourceType: keyof UserUsage): boolean => {
    if (!data?.userUsage || !data?.planLimits) return false;
    
    const current = Number(data.userUsage[resourceType]);
    let limit: number | null = null;
    
    switch (resourceType) {
      case 'current_stores':
        limit = data.planLimits.max_stores;
        break;
      case 'current_websites':
        limit = data.planLimits.max_websites;
        break;
      case 'current_funnels':
        limit = data.planLimits.max_funnels;
        break;
      case 'current_products':
        limit = data.planLimits.max_products_per_store;
        break;
      case 'current_pages':
        limit = data.planLimits.max_pages_per_store;
        break;
    }
    
    if (!limit) return false; // Unlimited
    return current >= limit;
  };

  // Helper to get monthly orders count
  const getMonthlyOrdersCount = async (): Promise<number> => {
    if (!user) return 0;
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .eq('store_id', (await supabase.from('stores').select('id').eq('owner_id', user.id).single())?.data?.id || '')
      .neq('status', 'cancelled');
    
    if (error) {
      console.error('Error fetching monthly orders:', error);
      return 0;
    }
    
    return orders?.length || 0;
  };

  return {
    planLimits: data?.planLimits || null,
    userUsage: data?.userUsage || null,
    userProfile: data?.userProfile || null,
    loading,
    error: error || queryError?.message || null,
    canCreateResource,
    isTrialExpired,
    getTrialDaysRemaining,
    getGraceDaysRemaining,
    isInGracePeriod,
    isAccountReadOnly,
    getUsagePercentage,
    isAtLimit,
    getMonthlyOrdersCount,
    refetch,
  };
};
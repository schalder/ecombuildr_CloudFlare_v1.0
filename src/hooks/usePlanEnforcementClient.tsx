import { useState, useCallback } from 'react';
import { usePlanLimits } from './usePlanLimits';
import { useToast } from '@/hooks/use-toast';
// import { useStoreData } from './useStoreData';

interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  limitReached?: boolean;
  currentCount?: number;
  limit?: number;
}

export const usePlanEnforcementClient = () => {
  const { planLimits, userUsage, isAccountReadOnly, isTrialExpired } = usePlanLimits();
  const { toast } = useToast();
  // const { stores } = useStoreData();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const checkProductCreation = useCallback((storeId?: string): EnforcementResult => {
    if (isAccountReadOnly()) {
      return { 
        allowed: false, 
        reason: 'Account is read-only. Please upgrade your plan.' 
      };
    }

    if (isTrialExpired()) {
      return { 
        allowed: false, 
        reason: 'Trial has expired. Please upgrade your plan.' 
      };
    }

    // Products per store limit - would need additional implementation
    // const limit = planLimits?.max_products_per_store;

    return { allowed: true };
  }, [planLimits, isAccountReadOnly, isTrialExpired]);

  const checkPageCreation = useCallback((): EnforcementResult => {
    if (isAccountReadOnly()) {
      return { 
        allowed: false, 
        reason: 'Account is read-only. Please upgrade your plan.' 
      };
    }

    if (isTrialExpired()) {
      return { 
        allowed: false, 
        reason: 'Trial has expired. Please upgrade your plan.' 
      };
    }

    // Pages per website limit would need additional tracking
    return { allowed: true };
  }, [isAccountReadOnly, isTrialExpired]);

  const checkOrderCreation = useCallback((): EnforcementResult => {
    if (isAccountReadOnly()) {
      return { 
        allowed: false, 
        reason: 'Account is read-only. Please upgrade your plan.' 
      };
    }

    if (isTrialExpired()) {
      return { 
        allowed: false, 
        reason: 'Trial has expired. Please upgrade your plan.' 
      };
    }

    const limit = planLimits?.max_orders_per_month;
    const current = userUsage?.current_orders_this_month || 0;

    if (limit !== null && current >= limit) {
      return { 
        allowed: false, 
        reason: `Monthly order limit reached (${limit} orders)`,
        limitReached: true,
        currentCount: current,
        limit
      };
    }

    return { allowed: true, currentCount: current, limit: limit || undefined };
  }, [planLimits, userUsage, isAccountReadOnly, isTrialExpired]);

  const showUpgradeToast = useCallback((reason: string, feature?: string) => {
    toast({
      title: 'Upgrade Required',
      description: reason,
      variant: 'destructive',
      action: (
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/80"
        >
          Upgrade Plan
        </button>
      ),
    });
  }, [toast]);

  const enforceProductCreation = useCallback((storeId?: string, showToast: boolean = true): boolean => {
    const result = checkProductCreation(storeId);
    
    if (!result.allowed && showToast && result.reason) {
      showUpgradeToast(result.reason, 'product creation');
    }
    
    return result.allowed;
  }, [checkProductCreation, showUpgradeToast]);

  const enforcePageCreation = useCallback((showToast: boolean = true): boolean => {
    const result = checkPageCreation();
    
    if (!result.allowed && showToast && result.reason) {
      showUpgradeToast(result.reason, 'page creation');
    }
    
    return result.allowed;
  }, [checkPageCreation, showUpgradeToast]);

  const enforceOrderCreation = useCallback((showToast: boolean = true): boolean => {
    const result = checkOrderCreation();
    
    if (!result.allowed && showToast && result.reason) {
      if (result.limitReached) {
        showUpgradeToast(
          `You've reached your monthly limit of ${result.limit} orders. Upgrade to process more orders.`,
          'order processing'
        );
      } else {
        showUpgradeToast(result.reason, 'order processing');
      }
    }
    
    return result.allowed;
  }, [checkOrderCreation, showUpgradeToast]);

  const getUsagePercentage = useCallback((resourceType: 'products' | 'orders' | 'stores' | 'websites' | 'funnels'): number => {
    if (!planLimits || !userUsage) return 0;

    let current = 0;
    let limit = 0;

    switch (resourceType) {
      case 'stores':
        current = userUsage.current_stores;
        limit = planLimits.max_stores || 0;
        break;
      case 'websites':
        current = userUsage.current_websites;
        limit = planLimits.max_websites || 0;
        break;
      case 'funnels':
        current = userUsage.current_funnels;
        limit = planLimits.max_funnels || 0;
        break;
      case 'orders':
        current = userUsage.current_orders_this_month;
        limit = planLimits.max_orders_per_month || 0;
        break;
      case 'products':
        // This would need additional tracking per store
        return 0;
    }

    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  }, [planLimits, userUsage]);

  const isNearLimit = useCallback((resourceType: 'products' | 'orders' | 'stores' | 'websites' | 'funnels', threshold: number = 80): boolean => {
    const percentage = getUsagePercentage(resourceType);
    return percentage >= threshold;
  }, [getUsagePercentage]);

  const getUsageInfo = useCallback((resourceType: 'products' | 'orders' | 'stores' | 'websites' | 'funnels') => {
    if (!planLimits || !userUsage) return { current: 0, limit: 0, unlimited: false };

    let current = 0;
    let limit: number | null = 0;

    switch (resourceType) {
      case 'stores':
        current = userUsage.current_stores;
        limit = planLimits.max_stores;
        break;
      case 'websites':
        current = userUsage.current_websites;
        limit = planLimits.max_websites;
        break;
      case 'funnels':
        current = userUsage.current_funnels;
        limit = planLimits.max_funnels;
        break;
      case 'orders':
        current = userUsage.current_orders_this_month;
        limit = planLimits.max_orders_per_month;
        break;
      case 'products':
        // This would need additional tracking per store
        return { current: 0, limit: 0, unlimited: false };
    }

    return {
      current,
      limit: limit || 0,
      unlimited: limit === null
    };
  }, [planLimits, userUsage]);

  return {
    // Check functions
    checkProductCreation,
    checkPageCreation,
    checkOrderCreation,
    
    // Enforcement functions (with UI feedback)
    enforceProductCreation,
    enforcePageCreation,
    enforceOrderCreation,
    
    // Usage info
    getUsagePercentage,
    isNearLimit,
    getUsageInfo,
    
    // UI state
    showUpgradeModal,
    setShowUpgradeModal,
    
    // Toast helper
    showUpgradeToast,
  };
};
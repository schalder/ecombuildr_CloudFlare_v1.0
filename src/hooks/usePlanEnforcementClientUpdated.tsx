import { useState, useCallback } from 'react';
import { usePlanLimits } from './usePlanLimitsUpdated';
import { useToast } from '@/hooks/use-toast';

interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  limitReached?: boolean;
  currentUsage?: number;
  limit?: number;
}

export const usePlanEnforcementClient = () => {
  const { planLimits, userUsage, isAccountReadOnly, isTrialExpired } = usePlanLimits();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const checkProductCreation = useCallback((storeId?: string): EnforcementResult => {
    // Check if account is read-only
    if (isAccountReadOnly()) {
      return { 
        allowed: false, 
        reason: 'Account read-only', 
        limitReached: true,
        currentUsage: 0,
        limit: 0
      };
    }

    // Check if trial has expired
    if (isTrialExpired()) {
      return { 
        allowed: false, 
        reason: 'Trial expired', 
        limitReached: true,
        currentUsage: 0,
        limit: 0
      };
    }

    // Check product limits
    if (userUsage && planLimits) {
      const current = userUsage.current_products;
      const limit = planLimits.max_products_per_store;
      
      if (limit !== null && current >= limit) {
        return {
          allowed: false,
          reason: 'Product limit reached',
          limitReached: true,
          currentUsage: current,
          limit: limit
        };
      }
    }

    return { allowed: true };
  }, [planLimits, userUsage, isAccountReadOnly, isTrialExpired]);

  const checkPageCreation = useCallback((): EnforcementResult => {
    // Check if account is read-only
    if (isAccountReadOnly()) {
      return { 
        allowed: false, 
        reason: 'Account read-only', 
        limitReached: true,
        currentUsage: 0,
        limit: 0
      };
    }

    // Check if trial has expired
    if (isTrialExpired()) {
      return { 
        allowed: false, 
        reason: 'Trial expired', 
        limitReached: true,
        currentUsage: 0,
        limit: 0
      };
    }

    // Check page limits
    if (userUsage && planLimits) {
      const current = userUsage.current_pages;
      const limit = planLimits.max_pages_per_store;
      
      if (limit !== null && current >= limit) {
        return {
          allowed: false,
          reason: 'Page limit reached',
          limitReached: true,
          currentUsage: current,
          limit: limit
        };
      }
    }

    return { allowed: true };
  }, [planLimits, userUsage, isAccountReadOnly, isTrialExpired]);

  const checkOrderCreation = useCallback(async (): Promise<EnforcementResult> => {
    // Check if account is read-only
    if (isAccountReadOnly()) {
      return { 
        allowed: false, 
        reason: 'Account read-only', 
        limitReached: true,
        currentUsage: 0,
        limit: 0
      };
    }

    // Check if trial has expired
    if (isTrialExpired()) {
      return { 
        allowed: false, 
        reason: 'Trial expired', 
        limitReached: true,
        currentUsage: 0,
        limit: 0
      };
    }

    // Check monthly order limits
    if (planLimits) {
      const limit = planLimits.max_orders_per_month;
      
      if (limit !== null) {
        // This will be dynamically calculated when orders are created
        // The database trigger will enforce this limit
        return { allowed: true };
      }
    }

    return { allowed: true };
  }, [planLimits, isAccountReadOnly, isTrialExpired]);

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

  const enforceOrderCreation = useCallback(async (showToast: boolean = true): Promise<boolean> => {
    const result = await checkOrderCreation();
    
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

  const getUsagePercentage = useCallback((resourceType: 'products' | 'orders' | 'stores' | 'websites' | 'funnels' | 'pages'): number => {
    if (!userUsage || !planLimits) return 0;
    
    let current: number = 0;
    let limit: number | null = null;
    
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
      case 'products':
        current = userUsage.current_products;
        limit = planLimits.max_products_per_store;
        break;
      case 'pages':
        current = userUsage.current_pages;
        limit = planLimits.max_pages_per_store;
        break;
      case 'orders':
        // This will be calculated dynamically
        current = 0;
        limit = planLimits.max_orders_per_month;
        break;
    }
    
    if (!limit || limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  }, [planLimits, userUsage]);

  const isNearLimit = useCallback((resourceType: 'products' | 'orders' | 'stores' | 'websites' | 'funnels' | 'pages', threshold: number = 80): boolean => {
    return getUsagePercentage(resourceType) >= threshold;
  }, [getUsagePercentage]);

  const getUsageInfo = useCallback((resourceType: 'products' | 'orders' | 'stores' | 'websites' | 'funnels' | 'pages') => {
    if (!userUsage || !planLimits) {
      return { current: 0, limit: null, isUnlimited: true };
    }
    
    let current: number = 0;
    let limit: number | null = null;
    
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
      case 'products':
        current = userUsage.current_products;
        limit = planLimits.max_products_per_store;
        break;
      case 'pages':
        current = userUsage.current_pages;
        limit = planLimits.max_pages_per_store;
        break;
      case 'orders':
        // This will be calculated dynamically when needed
        current = 0;
        limit = planLimits.max_orders_per_month;
        break;
    }
    
    return {
      current,
      limit,
      isUnlimited: limit === null
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
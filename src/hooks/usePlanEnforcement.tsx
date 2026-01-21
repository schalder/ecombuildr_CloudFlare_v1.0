import { useState } from 'react';
import { usePlanLimits } from './usePlanLimits';
import { useToast } from '@/hooks/use-toast';

interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  action?: 'upgrade' | 'trial_expired' | 'suspended';
}

export const usePlanEnforcement = () => {
  const { canCreateResource, isTrialExpired, userProfile, planLimits, isAccountReadOnly } = usePlanLimits();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const checkResourceCreation = async (
    resourceType: 'store' | 'website' | 'funnel',
    showToast: boolean = true
  ): Promise<EnforcementResult> => {
    // Check if account is read-only
    if (isAccountReadOnly()) {
      if (showToast) {
        toast({
          title: 'অ্যাকাউন্ট সীমাবদ্ধ',
          description: 'আপনার অ্যাকাউন্ট রিড-অনলি মোডে আছে। নতুন কিছু তৈরি করতে অ্যাকাউন্ট আপগ্রেড করুন।',
          variant: 'destructive',
        });
      }
      return { allowed: false, reason: 'Account read-only', action: 'upgrade' };
    }

    // Check if account is suspended
    if (userProfile?.account_status === 'suspended') {
      if (showToast) {
        toast({
          title: 'অ্যাকাউন্ট স্থগিত',
          description: 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সাপোর্টের সাথে যোগাযোগ করুন।',
          variant: 'destructive',
        });
      }
      return { allowed: false, reason: 'Account suspended', action: 'suspended' };
    }

    // Check if account is fake
    if (userProfile?.account_status === 'fake') {
      if (showToast) {
        toast({
          title: 'অ্যাকাউন্ট ব্লক করা হয়েছে',
          description: 'আপনার অ্যাকাউন্ট ফেক হিসেবে চিহ্নিত করা হয়েছে। সাপোর্টের সাথে যোগাযোগ করুন।',
          variant: 'destructive',
        });
      }
      return { allowed: false, reason: 'Account marked as fake', action: 'suspended' };
    }

    // Check if trial has expired
    if (isTrialExpired()) {
      if (showToast) {
        toast({
          title: 'ট্রায়াল সময় শেষ',
          description: 'আপনার ট্রায়াল সময় শেষ হয়ে গেছে। পেমেন্ট করে প্ল্যান সক্রিয় করুন।',
          variant: 'destructive',
        });
      }
      return { allowed: false, reason: 'Trial expired', action: 'trial_expired' };
    }

    // Check resource-specific limits
    const canCreate = await canCreateResource(resourceType);
    
    if (!canCreate) {
      let resourceName: string = resourceType;
      if (resourceType === 'store') resourceName = 'স্টোর';
      else if (resourceType === 'website') resourceName = 'ওয়েবসাইট';
      else if (resourceType === 'funnel') resourceName = 'ফানেল';

      let limitInfo = '';
      if (planLimits) {
        const limit = resourceType === 'store' ? planLimits.max_stores :
                     resourceType === 'website' ? planLimits.max_websites :
                     planLimits.max_funnels;
        
        if (limit !== null) {
          limitInfo = ` (সর্বোচ্চ ${limit}টি)`;
        }
      }

      if (showToast) {
        toast({
          title: `${resourceName} তৈরির সীমা পূর্ণ`,
          description: `আপনার বর্তমান প্ল্যানে ${resourceName} তৈরির সীমা পূর্ণ হয়ে গেছে${limitInfo}। প্ল্যান আপগ্রেড করুন।`,
          variant: 'destructive',
        });
      }

      return { allowed: false, reason: `${resourceType} limit reached`, action: 'upgrade' };
    }

    return { allowed: true };
  };

  const enforceAndShowUpgrade = async (resourceType: 'store' | 'website' | 'funnel'): Promise<boolean> => {
    const result = await checkResourceCreation(resourceType);
    
    if (!result.allowed && result.action === 'upgrade') {
      setShowUpgradeModal(true);
    }
    
    return result.allowed;
  };

  const getResourceDisplayName = (resourceType: 'store' | 'website' | 'funnel'): string => {
    switch (resourceType) {
      case 'store': return 'স্টোর';
      case 'website': return 'ওয়েবসাইট';
      case 'funnel': return 'ফানেল';
      default: return resourceType;
    }
  };

  const showUpgradePrompt = (resourceType: 'store' | 'website' | 'funnel') => {
    const resourceName = getResourceDisplayName(resourceType);
    toast({
      title: `আরও ${resourceName} তৈরি করতে চান?`,
      description: 'প্ল্যান আপগ্রেড করে আরও রিসোর্স তৈরি করুন।',
      action: (
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
        >
          আপগ্রেড করুন
        </button>
      ),
    });
  };

  return {
    checkResourceCreation,
    enforceAndShowUpgrade,
    showUpgradeModal,
    setShowUpgradeModal,
    showUpgradePrompt,
    getResourceDisplayName,
  };
};
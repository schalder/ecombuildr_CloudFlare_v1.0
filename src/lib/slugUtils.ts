import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a slug conflicts with any funnel step on the same domain
 * @param slug - The slug to check
 * @param domain - The domain to check against
 * @param excludeStepId - Optional step ID to exclude from conflict check (for updates)
 * @returns Promise<boolean> - true if conflict exists, false if available
 */
export const checkDomainSlugConflict = async (
  slug: string, 
  domain: string, 
  excludeStepId?: string
): Promise<boolean> => {
  try {
    // Get all funnel steps for funnels connected to this domain
    const { data: conflictingSteps, error } = await supabase
      .from('funnel_steps')
      .select(`
        id,
        slug,
        funnels!inner(
          id,
          domain_connections!inner(
            custom_domains!inner(
              domain
            )
          )
        )
      `)
      .eq('funnels.domain_connections.custom_domains.domain', domain)
      .eq('slug', slug);

    if (error) {
      console.error('Error checking domain slug conflict:', error);
      return false; // Assume no conflict on error
    }

    // Filter out the excluded step if provided
    const conflicts = conflictingSteps?.filter(step => 
      !excludeStepId || step.id !== excludeStepId
    ) || [];

    return conflicts.length > 0;
  } catch (error) {
    console.error('Error in checkDomainSlugConflict:', error);
    return false;
  }
};

/**
 * Generate a unique slug by adding random characters when conflicts exist
 * @param baseSlug - The base slug to make unique
 * @param domain - The domain to check against
 * @param excludeStepId - Optional step ID to exclude from conflict check
 * @returns Promise<string> - A unique slug
 */
export const generateUniqueDomainSlug = async (
  baseSlug: string, 
  domain: string, 
  excludeStepId?: string
): Promise<string> => {
  let uniqueSlug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const hasConflict = await checkDomainSlugConflict(uniqueSlug, domain, excludeStepId);
    
    if (!hasConflict) {
      return uniqueSlug;
    }

    // Generate random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    uniqueSlug = `${baseSlug}-${randomSuffix}`;
    attempts++;
  }

  // Fallback: add timestamp if still conflicted
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
};

/**
 * Get the domain for a funnel
 * @param funnelId - The funnel ID
 * @returns Promise<string | null> - The domain or null if not found
 */
export const getFunnelDomain = async (funnelId: string): Promise<string | null> => {
  try {
    const { data: funnelData, error } = await supabase
      .from('funnels')
      .select(`
        id,
        domain_connections!inner(
          custom_domains!inner(
            domain
          )
        )
      `)
      .eq('id', funnelId)
      .single();

    if (error || !funnelData) {
      return null;
    }

    return funnelData.domain_connections?.custom_domains?.domain || null;
  } catch (error) {
    console.error('Error getting funnel domain:', error);
    return null;
  }
};

/**
 * Validate and ensure slug uniqueness for funnel steps
 * @param slug - The slug to validate
 * @param funnelId - The funnel ID
 * @param excludeStepId - Optional step ID to exclude from conflict check
 * @returns Promise<{isValid: boolean, uniqueSlug: string, hasConflict: boolean}>
 */
export const validateFunnelStepSlug = async (
  slug: string,
  funnelId: string,
  excludeStepId?: string
): Promise<{
  isValid: boolean;
  uniqueSlug: string;
  hasConflict: boolean;
}> => {
  // Get the domain for this funnel
  const domain = await getFunnelDomain(funnelId);
  
  if (!domain) {
    // If no domain, fall back to funnel-only validation
    return {
      isValid: true,
      uniqueSlug: slug,
      hasConflict: false
    };
  }

  // Check for domain-wide conflicts
  const hasConflict = await checkDomainSlugConflict(slug, domain, excludeStepId);
  
  if (hasConflict) {
    const uniqueSlug = await generateUniqueDomainSlug(slug, domain, excludeStepId);
    return {
      isValid: true,
      uniqueSlug,
      hasConflict: true
    };
  }

  return {
    isValid: true,
    uniqueSlug: slug,
    hasConflict: false
  };
};

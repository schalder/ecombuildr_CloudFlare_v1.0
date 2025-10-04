import { supabase } from '@/integrations/supabase/client';

export interface SlugValidationResult {
  isAvailable: boolean;
  suggestedSlug: string;
  hasConflict: boolean;
  conflictMessage?: string;
}

/**
 * Generate a random string for slug uniqueness
 */
export const generateRandomSuffix = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a unique slug by adding random characters
 */
export const generateUniqueSlug = (baseSlug: string): string => {
  const randomSuffix = generateRandomSuffix();
  return `${baseSlug}-${randomSuffix}`;
};

/**
 * Validate if a funnel step slug is available across all funnels on the same domain
 * This prevents conflicts when multiple funnels use the same custom domain
 */
export const validateFunnelStepSlug = async (
  slug: string, 
  funnelId: string, 
  stepId?: string
): Promise<SlugValidationResult> => {
  if (!slug.trim()) {
    return {
      isAvailable: true,
      suggestedSlug: slug,
      hasConflict: false
    };
  }

  try {
    // Get the funnel to find its connected domain
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, store_id')
      .eq('id', funnelId)
      .single();

    if (funnelError || !funnel) {
      throw new Error('Funnel not found');
    }

    // Get all custom domains connected to this store
    const { data: domains, error: domainsError } = await supabase
      .from('custom_domains')
      .select('id, domain')
      .eq('store_id', funnel.store_id);

    if (domainsError || !domains?.length) {
      // No custom domains, check within funnel only
      return await validateSlugWithinFunnel(slug, funnelId, stepId);
    }

    // Get all domain connections for these domains
    const domainIds = domains.map(d => d.id);
    const { data: connections, error: connectionsError } = await supabase
      .from('domain_connections')
      .select('content_id, content_type')
      .in('domain_id', domainIds)
      .eq('content_type', 'funnel');

    if (connectionsError || !connections?.length) {
      return await validateSlugWithinFunnel(slug, funnelId, stepId);
    }

    // Get all funnel IDs connected to these domains
    const connectedFunnelIds = connections.map(c => c.content_id);
    
    // Check if slug exists in any of these funnels
    const { data: existingSteps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, slug, funnel_id')
      .in('funnel_id', connectedFunnelIds)
      .eq('slug', slug);

    if (stepsError) {
      throw new Error('Error checking slug availability');
    }

    // Filter out current step if editing
    const conflictingSteps = existingSteps?.filter(step => 
      step.id !== stepId
    ) || [];

    if (conflictingSteps.length > 0) {
      const suggestedSlug = generateUniqueSlug(slug);
      return {
        isAvailable: false,
        suggestedSlug,
        hasConflict: true,
        conflictMessage: `Slug already exists. Using "${suggestedSlug}" instead`
      };
    }

    return {
      isAvailable: true,
      suggestedSlug: slug,
      hasConflict: false
    };

  } catch (error) {
    console.error('Slug validation error:', error);
    return {
      isAvailable: false,
      suggestedSlug: generateUniqueSlug(slug),
      hasConflict: true,
      conflictMessage: 'Error checking slug. Using unique slug instead'
    };
  }
};

/**
 * Fallback validation within a single funnel
 */
const validateSlugWithinFunnel = async (
  slug: string, 
  funnelId: string, 
  stepId?: string
): Promise<SlugValidationResult> => {
  try {
    const { data: existingSteps, error } = await supabase
      .from('funnel_steps')
      .select('id, slug')
      .eq('funnel_id', funnelId)
      .eq('slug', slug);

    if (error) {
      throw new Error('Error checking slug availability');
    }

    const conflictingSteps = existingSteps?.filter(step => 
      step.id !== stepId
    ) || [];

    if (conflictingSteps.length > 0) {
      const suggestedSlug = generateUniqueSlug(slug);
      return {
        isAvailable: false,
        suggestedSlug,
        hasConflict: true,
        conflictMessage: `Slug already exists in this funnel. Using "${suggestedSlug}" instead`
      };
    }

    return {
      isAvailable: true,
      suggestedSlug: slug,
      hasConflict: false
    };

  } catch (error) {
    console.error('Funnel slug validation error:', error);
    return {
      isAvailable: false,
      suggestedSlug: generateUniqueSlug(slug),
      hasConflict: true,
      conflictMessage: 'Error checking slug. Using unique slug instead'
    };
  }
};

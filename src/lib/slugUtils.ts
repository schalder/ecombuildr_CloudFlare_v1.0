import { supabase } from '@/integrations/supabase/client';

export interface SlugValidationResult {
  isAvailable: boolean;
  hasConflict: boolean;
  uniqueSlug: string;
  conflictingFunnel?: string;
  conflictingStep?: string;
}

/**
 * Generate a random suffix for slug uniqueness
 */
export function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique slug by adding random suffix
 */
export function generateUniqueSlug(baseSlug: string): string {
  const randomSuffix = generateRandomSuffix();
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Validate funnel step slug across all funnels on the same domain
 * This prevents conflicts when multiple funnels use the same custom domain
 */
export async function validateFunnelStepSlug(
  slug: string,
  currentFunnelId: string,
  currentStepId?: string,
  domainId?: string
): Promise<SlugValidationResult> {
  try {
    if (!slug.trim()) {
      return {
        isAvailable: true,
        hasConflict: false,
        uniqueSlug: slug
      };
    }

    // If we have a domainId, check for conflicts across all funnels on this domain
    if (domainId) {
      const { data: domainConnections, error: domainError } = await supabase
        .from('domain_connections')
        .select(`
          funnel_id,
          funnels!inner(
            id,
            title,
            funnel_steps!inner(
              id,
              slug,
              title
            )
          )
        `)
        .eq('domain_id', domainId)
        .eq('content_type', 'funnel');

      if (domainError) {
        console.error('Error fetching domain connections:', domainError);
        return {
          isAvailable: true,
          hasConflict: false,
          uniqueSlug: slug
        };
      }

      // Check for slug conflicts across all funnels on this domain
      for (const connection of domainConnections || []) {
        const funnel = connection.funnels;
        if (!funnel || !funnel.funnel_steps) continue;

        for (const step of funnel.funnel_steps) {
          // Skip current step if we're editing
          if (currentStepId && step.id === currentStepId) continue;
          
          // Skip steps from current funnel if we're creating a new step
          if (!currentStepId && funnel.id === currentFunnelId) continue;

          if (step.slug === slug) {
            const uniqueSlug = generateUniqueSlug(slug);
            return {
              isAvailable: false,
              hasConflict: true,
              uniqueSlug,
              conflictingFunnel: funnel.title,
              conflictingStep: step.title
            };
          }
        }
      }
    }

    // If no domain conflicts found, check within the current funnel
    const { data: existingSteps, error: stepError } = await supabase
      .from('funnel_steps')
      .select('id, slug, title')
      .eq('funnel_id', currentFunnelId)
      .eq('slug', slug);

    if (stepError) {
      console.error('Error checking funnel steps:', stepError);
      return {
        isAvailable: true,
        hasConflict: false,
        uniqueSlug: slug
      };
    }

    // Filter out current step if editing
    const conflictingSteps = existingSteps?.filter(step => step.id !== currentStepId) || [];
    
    if (conflictingSteps.length > 0) {
      const uniqueSlug = generateUniqueSlug(slug);
      return {
        isAvailable: false,
        hasConflict: true,
        uniqueSlug,
        conflictingFunnel: 'Current Funnel',
        conflictingStep: conflictingSteps[0].title
      };
    }

    return {
      isAvailable: true,
      hasConflict: false,
      uniqueSlug: slug
    };

  } catch (error) {
    console.error('Slug validation error:', error);
    return {
      isAvailable: true,
      hasConflict: false,
      uniqueSlug: slug
    };
  }
}

/**
 * Ensure slug is unique by auto-resolving conflicts
 * This is used when we want to silently fix conflicts
 */
export async function ensureUniqueSlug(
  slug: string,
  currentFunnelId: string,
  currentStepId?: string,
  domainId?: string
): Promise<string> {
  const validation = await validateFunnelStepSlug(slug, currentFunnelId, currentStepId, domainId);
  return validation.uniqueSlug;
}

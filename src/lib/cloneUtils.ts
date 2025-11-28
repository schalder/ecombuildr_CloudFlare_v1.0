import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a unique slug by checking availability
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkFunction: (slug: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  let slug = baseSlug.toLowerCase().trim().replace(/\s+/g, '-');
  let isAvailable = await checkFunction(slug);
  
  if (isAvailable) return slug;
  
  // Try with -copy suffix
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${slug}-copy${i > 1 ? `-${i}` : ''}`;
    isAvailable = await checkFunction(candidate);
    if (isAvailable) return candidate;
  }
  
  // Fallback: timestamp
  return `${slug}-${Date.now()}`;
}

/**
 * Check if a website slug is available in a store
 */
export async function checkWebsiteSlugAvailability(
  storeId: string,
  slug: string,
  excludeWebsiteId?: string
): Promise<boolean> {
  let query = supabase
    .from('websites')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .limit(1);
  
  if (excludeWebsiteId) {
    query = query.neq('id', excludeWebsiteId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error checking website slug:', error);
    return false;
  }
  
  return !data || data.length === 0;
}

/**
 * Check if a funnel slug is available in a store
 */
export async function checkFunnelSlugAvailability(
  storeId: string,
  slug: string,
  excludeFunnelId?: string
): Promise<boolean> {
  let query = supabase
    .from('funnels')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .limit(1);
  
  if (excludeFunnelId) {
    query = query.neq('id', excludeFunnelId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error checking funnel slug:', error);
    return false;
  }
  
  return !data || data.length === 0;
}

/**
 * Check if a website page slug is available in a website
 */
export async function checkWebsitePageSlugAvailability(
  websiteId: string,
  slug: string,
  excludePageId?: string
): Promise<boolean> {
  let query = supabase
    .from('website_pages')
    .select('id')
    .eq('website_id', websiteId)
    .eq('slug', slug)
    .limit(1);
  
  if (excludePageId) {
    query = query.neq('id', excludePageId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error checking website page slug:', error);
    return false;
  }
  
  return !data || data.length === 0;
}

/**
 * Check if a funnel step slug is available in a funnel
 */
export async function checkFunnelStepSlugAvailability(
  funnelId: string,
  slug: string,
  excludeStepId?: string
): Promise<boolean> {
  let query = supabase
    .from('funnel_steps')
    .select('id')
    .eq('funnel_id', funnelId)
    .eq('slug', slug)
    .limit(1);
  
  if (excludeStepId) {
    query = query.neq('id', excludeStepId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error checking funnel step slug:', error);
    return false;
  }
  
  return !data || data.length === 0;
}

/**
 * Get the next available step_order for a funnel
 */
export async function getNextFunnelStepOrder(funnelId: string): Promise<number> {
  const { data, error } = await supabase
    .from('funnel_steps')
    .select('step_order')
    .eq('funnel_id', funnelId)
    .order('step_order', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error getting next step order:', error);
    return 1;
  }
  
  if (!data || data.length === 0) {
    return 1;
  }
  
  return (data[0].step_order || 0) + 1;
}

/**
 * Check if a website has a homepage
 */
export async function hasWebsiteHomepage(websiteId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('website_pages')
    .select('id')
    .eq('website_id', websiteId)
    .eq('is_homepage', true)
    .limit(1);
  
  if (error) {
    console.error('Error checking homepage:', error);
    return false;
  }
  
  return data && data.length > 0;
}


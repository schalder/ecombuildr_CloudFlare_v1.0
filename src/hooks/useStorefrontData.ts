import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Optimized query for website pages (only essential fields for storefront)
const WEBSITE_PAGE_SELECT = `
  id,
  title,
  slug,
  content,
  seo_title,
  seo_description,
  og_image,
  custom_scripts,
  canonical_url,
  meta_robots,
  is_homepage
`;

// Optimized query for funnel steps (only essential fields for storefront)
const FUNNEL_STEP_SELECT = `
  id,
  title,
  slug,
  content,
  seo_title,
  seo_description,
  og_image,
  custom_scripts,
  step_type,
  step_order,
  funnel_id
`;

// Optimized query for website (only essential fields)
const WEBSITE_SELECT = `
  id,
  name,
  slug,
  description,
  domain,
  is_published,
  is_active,
  store_id,
  settings
`;

// Optimized query for funnel (only essential fields)
const FUNNEL_SELECT = `
  id,
  name,
  slug,
  description,
  is_published,
  is_active,
  store_id,
  settings
`;

/**
 * Hook for fetching website page data with aggressive caching
 * Only used for storefront pages - never refetches on focus/reconnect
 */
export const useStorefrontWebsitePage = (
  websiteId: string | null,
  pageSlug: string | null,
  isPreview: boolean = false
) => {
  return useQuery({
    queryKey: ['storefront-website-page', websiteId, pageSlug, isPreview],
    queryFn: async () => {
      if (!websiteId) return null;

      let query = supabase
        .from('website_pages')
        .select(WEBSITE_PAGE_SELECT)
        .eq('website_id', websiteId);

      if (!isPreview) {
        query = query.eq('is_published', true);
      }

      if (pageSlug) {
        query = query.eq('slug', pageSlug);
      } else {
        query = query.eq('is_homepage', true);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!websiteId,
    staleTime: 10 * 60 * 1000, // 10 minutes - pages don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false, // Never refetch on focus for storefront
    refetchOnReconnect: false,
    refetchOnMount: false, // Use cache if available
  });
};

/**
 * Hook for fetching website data with aggressive caching
 */
export const useStorefrontWebsite = (websiteId: string | null) => {
  return useQuery({
    queryKey: ['storefront-website', websiteId],
    queryFn: async () => {
      if (!websiteId) return null;

      const { data, error } = await supabase
        .from('websites')
        .select(WEBSITE_SELECT)
        .eq('id', websiteId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!websiteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

/**
 * Hook for fetching funnel and step data with aggressive caching
 * Fetches both in parallel for better performance
 */
export const useStorefrontFunnelStep = (
  funnelId: string | null,
  stepSlug: string | null
) => {
  return useQuery({
    queryKey: ['storefront-funnel-step', funnelId, stepSlug],
    queryFn: async () => {
      if (!funnelId) return null;

      // Fetch funnel and step in parallel for better performance
      const [funnelResult, stepResult] = await Promise.all([
        supabase
          .from('funnels')
          .select(FUNNEL_SELECT)
          .eq('id', funnelId)
          .eq('is_published', true)
          .eq('is_active', true)
          .maybeSingle(),

        stepSlug
          ? supabase
              .from('funnel_steps')
              .select(FUNNEL_STEP_SELECT)
              .eq('funnel_id', funnelId)
              .eq('slug', stepSlug)
              .eq('is_published', true)
              .maybeSingle()
          : supabase
              .from('funnel_steps')
              .select(FUNNEL_STEP_SELECT)
              .eq('funnel_id', funnelId)
              .eq('is_published', true)
              .order('step_order', { ascending: true })
              .limit(1)
              .maybeSingle(),
      ]);

      if (funnelResult.error) throw funnelResult.error;
      if (stepResult.error) throw stepResult.error;

      if (!funnelResult.data) {
        throw new Error('Funnel not found or not available');
      }

      return {
        funnel: funnelResult.data,
        step: stepResult.data,
      };
    },
    enabled: !!funnelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false, // Never refetch on focus for storefront
    refetchOnReconnect: false,
    refetchOnMount: false, // Use cache if available
  });
};

/**
 * Hook for resolving website ID from slug
 */
export const useStorefrontWebsiteId = (websiteSlug: string | null) => {
  return useQuery({
    queryKey: ['storefront-website-id', websiteSlug],
    queryFn: async () => {
      if (!websiteSlug) return null;

      const { data, error } = await supabase
        .from('websites')
        .select('id')
        .eq('slug', websiteSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return (data as any)?.id || null;
    },
    enabled: !!websiteSlug,
    staleTime: 30 * 60 * 1000, // 30 minutes - slugs don't change
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

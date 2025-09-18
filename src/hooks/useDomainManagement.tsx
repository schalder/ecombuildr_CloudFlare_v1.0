import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserStore } from './useUserStore';
import { toast } from '@/components/ui/use-toast';

interface CustomDomain {
  id: string;
  domain: string;
  store_id: string;
  is_verified: boolean;
  dns_configured: boolean;
  ssl_status?: string;
  verification_token?: string;
  created_at: string;
  updated_at: string;
  last_checked_at?: string;
  dns_verified_at?: string;
  verification_attempts: number;
}

interface DomainConnection {
  id: string;
  domain_id: string;
  content_type: 'website' | 'funnel' | 'funnel_step' | 'website_page' | 'course_area' | 'course_library' | 'course_detail';
  content_id: string;
  path: string;
  is_homepage: boolean;
  created_at: string;
  updated_at: string;
}

interface Website {
  id: string;
  name: string;
  slug: string;
  store_id: string;
  is_active: boolean;
  is_published: boolean;
  domain?: string;
  settings: any;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  store_id: string;
  is_active: boolean;
  is_published: boolean;
  settings: any;
}

export const useDomainManagement = () => {
  const { user } = useAuth();
  const { store } = useUserStore();
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['domainData', store?.id],
    queryFn: async () => {
      if (!store?.id) throw new Error('No store selected');
      
      const [domainsResult, connectionsResult, websitesResult, funnelsResult] = await Promise.all([
        supabase
          .from('custom_domains')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('domain_connections')
          .select(`
            *,
            custom_domains!domain_connections_domain_id_fkey(domain)
          `)
          .eq('custom_domains.store_id', store.id),
        
        supabase
          .from('websites')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true),
        
        supabase
          .from('funnels')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true)
      ]);

      if (domainsResult.error) throw domainsResult.error;
      if (connectionsResult.error) throw connectionsResult.error;
      if (websitesResult.error) throw websitesResult.error;
      if (funnelsResult.error) throw funnelsResult.error;

      return {
        domains: domainsResult.data || [],
        connections: connectionsResult.data || [],
        websites: websitesResult.data || [],
        funnels: funnelsResult.data || []
      };
    },
    enabled: !!(user && store?.id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const domains = data?.domains || [];
  const connections = data?.connections || [];
  const websites = data?.websites || [];
  const funnels = data?.funnels || [];

  const refetch = () => {
    if (store?.id) {
      queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
    }
  };

  const verifyDomainDNS = async (domain: string): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'dns-domain-manager',
        {
          body: {
            action: 'pre_verification',
            domain: domain
          }
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('DNS verification failed:', error);
      throw error;
    }
  };

  const addDomain = async (domain: string, isDnsVerified?: boolean): Promise<any> => {
    if (!store?.id) throw new Error('No store found');

    try {
      const { data, error } = await supabase.functions.invoke(
        'dns-domain-manager',
        {
          body: {
            action: 'add_domain',
            domain: domain,
            storeId: store.id,
            isDnsVerified: isDnsVerified || false
          }
        }
      );

      if (error) throw error;

      refetch();
      return data;
    } catch (error) {
      console.error('Add domain failed:', error);
      throw error;
    }
  };

  const removeDomain = async (domainId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error('Error removing domain:', error);
      throw error;
    }
  };

  const connectContent = async (domainId: string, contentType: 'website' | 'funnel', contentId: string, path?: string, isHomepage?: boolean): Promise<any> => {
    if (!store?.id) throw new Error('No store found');
    
    try {
      const { data, error } = await supabase
        .from('domain_connections')
        .insert({
          domain_id: domainId,
          store_id: store.id,
          content_type: contentType,
          content_id: contentId,
          path: path || '',
          is_homepage: isHomepage || false
        })
        .select()
        .single();

      if (error) throw error;

      refetch();
      return data;
    } catch (error) {
      console.error('Error connecting content to domain:', error);
      throw error;
    }
  };

  const removeConnection = async (connectionId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('domain_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error('Error removing domain connection:', error);
      throw error;
    }
  };

  const setHomepage = async (connectionId: string, domainId: string): Promise<void> => {
    if (!store?.id) throw new Error('No store found');
    
    try {
      const { error: resetError } = await supabase
        .from('domain_connections')
        .update({ is_homepage: false })
        .eq('domain_id', domainId);

      if (resetError) throw resetError;

      const { error: setError } = await supabase
        .from('domain_connections')
        .update({ is_homepage: true })
        .eq('id', connectionId);

      if (setError) throw setError;
    } catch (error) {
      console.error('Error setting homepage:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
    
    toast({
      title: "Homepage set",
      description: "The homepage for this domain has been updated.",
    });
  };

  const verifyDomain = async (domainId: string): Promise<any> => {
    if (!store?.id) throw new Error('No store found');

    const domain = domains.find(d => d.id === domainId);
    if (!domain) throw new Error('Domain not found');

    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { 
          domainId,
          storeId: store.id 
        }
      });

      if (error) throw error;
      
      refetch();
      return data;
    } catch (error) {
      console.error('Error verifying domain:', error);
      throw error;
    }
  };

  const checkSSL = async (domainId: string): Promise<any> => {
    if (!store?.id) throw new Error('No store found');

    const domain = domains.find(d => d.id === domainId);
    if (!domain) throw new Error('Domain not found');

    try {
      const { data: result, error } = await supabase.functions.invoke(
        'dns-domain-manager',
        {
          body: {
            action: 'check_ssl',
            domain: domain.domain,
            storeId: store.id
          }
        }
      );

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });

      if (result?.isAccessible) {
        toast({
          title: "SSL active",
          description: `${domain.domain} is accessible with SSL certificate.`,
        });
      } else {
        toast({
          title: "SSL still provisioning",
          description: "SSL certificate is still being set up. This can take up to 24 hours.",
          variant: "default"
        });
      }

      return result;
    } catch (error) {
      console.error('SSL check failed:', error);
      toast({
        title: "SSL check failed",
        description: "Unable to check SSL status. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Course-specific functions
  const connectCourseContent = async (domainId: string, contentType: 'course_area' | 'course_library' | 'course_detail', contentId: string, path?: string, isHomepage?: boolean): Promise<any> => {
    if (!store?.id) throw new Error('No store found');
    
    try {
      const payload = {
        domain_id: domainId,
        store_id: store.id,
        content_type: contentType,
        content_id: contentId || store.id, // Use store.id for course_area
        path: path || '',
        is_homepage: isHomepage || false
      } as const;

      // Avoid relying on ON CONFLICT (requires DB constraint). Do a select-then-update/insert flow
      const { data: existing } = await supabase
        .from('domain_connections')
        .select('id')
        .eq('domain_id', payload.domain_id)
        .eq('path', payload.path)
        .eq('content_type', payload.content_type)
        .maybeSingle();

      let data;
      if (existing?.id) {
        const { data: updated, error: updateError } = await supabase
          .from('domain_connections')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (updateError) throw updateError;
        data = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('domain_connections')
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        data = inserted;
      }

      refetch();
      return data;
    } catch (error) {
      console.error('Error connecting course content to domain:', error);
      throw error;
    }
  };

  const checkCourseSlugAvailability = async (domainId: string, slug: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('check_course_slug_availability', {
          p_domain_id: domainId,
          p_slug: slug
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking course slug availability:', error);
      throw error;
    }
  };

  return {
    domains,
    connections,
    websites,
    funnels,
    loading,
    error: error?.message || '',
    verifyDomainDNS,
    addDomain,
    removeDomain,
    connectContent,
    removeConnection,
    setHomepage,
    verifyDomain,
    checkSSL,
    connectCourseContent,
    checkCourseSlugAvailability,
    refetch
  };
};
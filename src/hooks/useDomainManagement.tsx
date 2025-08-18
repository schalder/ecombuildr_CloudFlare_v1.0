import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/hooks/useUserStore';
import { toast } from '@/hooks/use-toast';

interface CustomDomain {
  id: string;
  domain: string;
  store_id: string;
  is_verified: boolean;
  ssl_status: string;
  dns_configured: boolean;
  created_at: string;
  updated_at: string;
}

interface DomainConnection {
  id: string;
  domain_id: string;
  content_type: 'website' | 'funnel';
  content_id: string;
  path: string;
  is_homepage: boolean;
  created_at: string;
}

interface Website {
  id: string;
  name: string;
  slug: string;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
}

export const useDomainManagement = () => {
  const { user } = useAuth();
  const { store } = useUserStore();
  const queryClient = useQueryClient();

  const {
    data: domainData,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['domainData', store?.id],
    queryFn: async () => {
      if (!store?.id) return {
        domains: [],
        connections: [],
        websites: [],
        funnels: []
      };

      // Fetch all domain-related data in parallel
      const [domainsRes, connectionsRes, websitesRes, funnelsRes] = await Promise.all([
        supabase
          .from('custom_domains')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('domain_connections')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('websites')
          .select('id, name, slug')
          .eq('store_id', store.id)
          .eq('is_active', true),
        
        supabase
          .from('funnels')
          .select('id, name, slug')
          .eq('store_id', store.id)
          .eq('is_active', true)
      ]);

      if (domainsRes.error) throw domainsRes.error;
      if (connectionsRes.error) throw connectionsRes.error;
      if (websitesRes.error) throw websitesRes.error;
      if (funnelsRes.error) throw funnelsRes.error;

      return {
        domains: (domainsRes.data || []) as CustomDomain[],
        connections: (connectionsRes.data || []) as DomainConnection[],
        websites: (websitesRes.data || []) as Website[],
        funnels: (funnelsRes.data || []) as Funnel[]
      };
    },
    enabled: !!store?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Extract data from the query result
  const domains = domainData?.domains || [];
  const connections = domainData?.connections || [];
  const websites = domainData?.websites || [];
  const funnels = domainData?.funnels || [];
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  const verifyDomainDNS = async (domain: string) => {
    if (!store?.id) throw new Error('No store found');

    try {
      const { data: result, error } = await supabase.functions.invoke(
        'dns-domain-manager',
        {
          body: {
            action: 'pre_verify',
            domain: domain.toLowerCase(),
            storeId: store.id
          }
        }
      );

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('DNS verification failed:', error);
      throw error;
    }
  };

  const addDomain = async (domain: string, isDnsVerified: boolean = false) => {
    if (!store?.id) throw new Error('No store found');
    if (!isDnsVerified) throw new Error('DNS must be verified before adding domain');

    const cleanDomain = domain.toLowerCase();

    try {
      // Try automatic Netlify integration first
      toast({
        title: "Setting up domain",
        description: `Adding ${cleanDomain} to Netlify automatically...`,
      });

      const { data: result, error: netlifyError } = await supabase.functions.invoke(
        'netlify-domain-manager',
        {
          body: {
            action: 'add',
            domain: cleanDomain,
            storeId: store.id
          }
        }
      );

      if (!netlifyError && result?.success) {
        toast({
          title: "Domain added successfully",
          description: `${cleanDomain} has been added to Netlify. DNS configuration will be set up automatically.`,
        });
        queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
        return result.domain;
      }

      // Fallback to manual setup if automatic fails
      console.log('Automatic Netlify setup failed, falling back to manual:', netlifyError);
      
      toast({
        title: "Auto setup failed",
        description: "Setting up domain manually. You'll need to configure DNS settings.",
        variant: "destructive",
      });

      const { data, error } = await supabase
        .from('custom_domains')
        .insert({
          domain: cleanDomain,
          store_id: store.id,
          verification_token: crypto.randomUUID()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Domain added (manual setup required)",
        description: `${cleanDomain} has been added. Please follow the setup instructions to complete configuration.`,
        variant: "default"
      });

      queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
      return data;

    } catch (error) {
      console.error('Domain addition failed:', error);
      throw error;
    }
  };

  const removeDomain = async (domainId: string) => {
    if (!store?.id) throw new Error('No store found');

    // Remove domain from database
    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId);

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
    
    toast({
      title: "Domain removed",
      description: "The domain and all its connections have been removed. Remember to also remove it from your hosting provider if needed.",
    });
  };

  const connectContent = async (
    domainId: string,
    contentType: 'website' | 'funnel',
    contentId: string,
    path: string = '/',
    isHomepage: boolean = false
  ) => {
    if (!store?.id) throw new Error('No store found');

    const { data, error } = await supabase
      .from('domain_connections')
      .insert({
        domain_id: domainId,
        store_id: store.id,
        content_type: contentType,
        content_id: contentId,
        path,
        is_homepage: isHomepage
      })
      .select()
      .single();

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
    
    toast({
      title: "Content connected",
      description: `${contentType} has been connected to the domain.`,
    });
    
    return data;
  };

  const removeConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from('domain_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
    
    toast({
      title: "Connection removed",
      description: "The content connection has been removed.",
    });
  };

  const setHomepage = async (connectionId: string, domainId: string) => {
    if (!store?.id) throw new Error('No store found');

    // First, unset any existing homepage for this domain
    await supabase
      .from('domain_connections')
      .update({ is_homepage: false })
      .eq('domain_id', domainId)
      .eq('store_id', store.id);

    // Then set the new homepage
    const { error } = await supabase
      .from('domain_connections')
      .update({ is_homepage: true })
      .eq('id', connectionId)
      .eq('store_id', store.id);

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });
    
    toast({
      title: "Homepage set",
      description: "The homepage for this domain has been updated.",
    });
  };


  return {
    domains,
    connections,
    websites,
    funnels,
    loading,
    error,
    addDomain,
    removeDomain,
    connectContent,
    removeConnection,
    setHomepage,
    refetch,
    verifyDomainDNS,
    verifyDomain: async (domainId: string) => {
      if (!store?.id) throw new Error('No store found');

      const domain = domains.find(d => d.id === domainId);
      if (!domain) throw new Error('Domain not found');

      try {
        const { data: result, error } = await supabase.functions.invoke(
          'dns-domain-manager',
          {
            body: {
              action: 'verify',
              domain: domain.domain,
              storeId: store.id
            }
          }
        );

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['domainData', store.id] });

        if (result?.status?.isVerified) {
          toast({
            title: "Domain verified",
            description: `${domain.domain} is now active and ready to use.`,
          });
        } else if (result?.status?.dnsConfigured && !result?.status?.isAccessible) {
          toast({
            title: "DNS configured, SSL in progress",
            description: "DNS is set up correctly. SSL certificate is being provisioned. Check again in a few minutes.",
            variant: "default"
          });
        } else if (!result?.status?.dnsConfigured) {
          toast({
            title: "DNS setup required",
            description: "Please configure your DNS settings following the instructions below.",
            variant: "default"
          });
        } else {
          toast({
            title: "Verification in progress",
            description: "Domain configuration is being processed. Please check again in a few minutes.",
            variant: "default"
          });
        }

        return result?.status;
      } catch (error) {
        console.error('Domain verification failed:', error);
        toast({
          title: "Verification failed",
          description: "Unable to verify domain status. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    },
    checkSSL: async (domainId: string) => {
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
    }
  };
};
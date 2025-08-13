import { useState, useEffect } from 'react';
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
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [connections, setConnections] = useState<DomainConnection[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { store } = useUserStore();

  const fetchDomains = async () => {
    if (!store?.id) return;

    try {
      setLoading(true);
      
      // Fetch domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (domainsError) throw domainsError;
      
      // Fetch domain connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('domain_connections')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (connectionsError) throw connectionsError;
      
      // Fetch websites
      const { data: websitesData, error: websitesError } = await supabase
        .from('websites')
        .select('id, name, slug')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (websitesError) throw websitesError;
      
      // Fetch funnels
      const { data: funnelsData, error: funnelsError } = await supabase
        .from('funnels')
        .select('id, name, slug')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (funnelsError) throw funnelsError;

      setDomains(domainsData || []);
      setConnections((connectionsData || []) as DomainConnection[]);
      setWebsites(websitesData || []);
      setFunnels(funnelsData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async (domain: string) => {
    if (!store?.id) throw new Error('No store found');

    const { data, error } = await supabase
      .from('custom_domains')
      .insert({
        domain: domain.toLowerCase(),
        store_id: store.id,
        verification_token: crypto.randomUUID()
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchDomains();
    
    toast({
      title: "Domain added",
      description: `${domain} has been added. Please configure your DNS settings.`,
    });
    
    return data;
  };

  const removeDomain = async (domainId: string) => {
    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId);

    if (error) throw error;
    
    await fetchDomains();
    
    toast({
      title: "Domain removed",
      description: "The domain and all its connections have been removed.",
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
    
    await fetchDomains();
    
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
    
    await fetchDomains();
    
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
    
    await fetchDomains();
    
    toast({
      title: "Homepage set",
      description: "The homepage for this domain has been updated.",
    });
  };

  useEffect(() => {
    if (user && store?.id) {
      fetchDomains();
    }
  }, [user, store?.id]);

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
    refetch: fetchDomains
  };
};